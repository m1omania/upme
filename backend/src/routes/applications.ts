import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ApplicationModel } from '../models/Application';
import { VacancyModel } from '../models/Vacancy';
import { ResumeModel } from '../models/Resume';
import { UserModel } from '../models/User';
import { hhApiService } from '../services/hhApi';
import { GamificationService } from '../services/gamificationService';
import logger from '../config/logger';
import type { ApiResponse, Application } from '../../../shared/types';

const router = Router();

// Создать отклик
router.post('/', authenticate, async (req: AuthRequest, res: Response<ApiResponse<Application>>) => {
  try {
    const userId = req.userId!;
    const { vacancy_id, cover_letter } = req.body;

    if (!vacancy_id || !cover_letter) {
      return res.status(400).json({
        success: false,
        error: 'vacancy_id and cover_letter are required',
      });
    }

    const user = UserModel.findById(userId)!;
    const vacancy = VacancyModel.findById(vacancy_id);
    if (!vacancy) {
      return res.status(404).json({
        success: false,
        error: 'Vacancy not found',
      });
    }

    // Получаем резюме из БД - они уже отфильтрованы при загрузке (только опубликованные)
    const resumes = ResumeModel.findByUserId(userId);
    if (resumes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'У вас нет активных (опубликованных) резюме. Опубликуйте резюме на HH.ru и возвращайтесь.',
      });
    }

    // Выбираем резюме (лучше всего подходящее для вакансии, или первое опубликованное)
    const resume = resumes.find(r => r.hh_resume_id) || resumes[0];

    if (!resume.hh_resume_id) {
      logger.error('Resume hh_resume_id is missing', { resumeId: resume.id, resumeTitle: resume.title });
      return res.status(400).json({
        success: false,
        error: 'Resume hh_resume_id is missing. Please reload your resume from HH.ru.',
      });
    }

    if (!vacancy.hh_vacancy_id) {
      logger.error('Vacancy hh_vacancy_id is missing', { vacancyId: vacancy.id, vacancyTitle: vacancy.title });
      return res.status(400).json({
        success: false,
        error: 'Vacancy hh_vacancy_id is missing.',
      });
    }

    logger.info('Creating application via HH.ru', {
      vacancyId: vacancy.id,
      hhVacancyId: vacancy.hh_vacancy_id,
      resumeId: resume.id,
      hhResumeId: resume.hh_resume_id,
      coverLetterLength: cover_letter.length,
    });

    // Создаем отклик через HH.ru API
    let hhApplicationSuccess = false;
    try {
      await hhApiService.createApplication(
        user.access_token,
        vacancy.hh_vacancy_id,
        resume.hh_resume_id,
        cover_letter
      );
      hhApplicationSuccess = true;
      logger.info('Application successfully created via HH.ru API');
    } catch (error: any) {
      logger.error('Error creating application via HH.ru:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        vacancyId: vacancy.hh_vacancy_id,
        resumeId: resume.hh_resume_id,
      });
      
      // Проверяем тип ошибки
      const errorType = error.response?.data?.errors?.[0]?.type;
      const errorDescription = error.response?.data?.description || error.message;
      
      // Если это дубликат, продолжаем (отклик уже был отправлен ранее)
      if (error.response?.status === 400 && errorType === 'already_exists') {
        logger.warn('Application already exists in HH.ru (duplicate), continuing...');
        hhApplicationSuccess = true;
      } 
      // Если резюме не найдено или недоступно
      else if (error.response?.status === 400 && (errorType === 'resume_not_found' || errorDescription?.includes('Resume not found'))) {
        logger.error('Resume not found or not available in HH.ru', {
          resumeId: resume.hh_resume_id,
          errorDescription,
        });
        return res.status(400).json({
          success: false,
          error: 'Резюме не найдено или недоступно в HH.ru. Пожалуйста, обновите список резюме в профиле.',
        });
      }
      // Для других ошибок возвращаем ошибку
      else {
        return res.status(500).json({
          success: false,
          error: `Не удалось отправить отклик в HH.ru: ${errorDescription}`,
        });
      }
    }

    // Сохраняем в БД
    const application = ApplicationModel.create({
      user_id: userId,
      vacancy_id,
      cover_letter,
      status: 'pending',
      xp_awarded: 0,
    });

    // Начисляем XP и обновляем стрик
    await GamificationService.awardApplicationXP(userId);
    await GamificationService.updateStreak(userId);

    // Обновляем XP в заявке
    ApplicationModel.updateStatus(application.id, 'pending');

    res.json({
      success: true,
      data: application,
      message: 'Application created successfully',
    });
  } catch (error: any) {
    logger.error('Error creating application:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create application',
    });
  }
});

// Получить список откликов
router.get('/', authenticate, async (req: AuthRequest, res: Response<ApiResponse<Application[]>>) => {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const applications = ApplicationModel.findByUserId(userId, limit, offset);

    res.json({
      success: true,
      data: applications,
    });
  } catch (error: any) {
    logger.error('Error getting applications:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get applications',
    });
  }
});

// Получить статистику откликов
router.get('/stats', authenticate, async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  try {
    const userId = req.userId!;
    const stats = ApplicationModel.getStatsByUserId(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('Error getting application stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get application stats',
    });
  }
});

export default router;

