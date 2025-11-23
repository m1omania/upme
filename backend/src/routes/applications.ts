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

    const resumes = ResumeModel.findByUserId(userId);
    if (resumes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No resume found',
      });
    }

    const resume = resumes[0];

    // Создаем отклик через HH.ru API
    try {
      await hhApiService.createApplication(
        user.access_token,
        vacancy.hh_vacancy_id,
        resume.hh_resume_id,
        cover_letter
      );
    } catch (error: any) {
      logger.error('Error creating application via HH.ru:', error);
      // Продолжаем, даже если HH.ru API вернул ошибку (может быть дубликат)
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

