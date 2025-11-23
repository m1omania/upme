import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { UserModel } from '../models/User';
import { ResumeModel } from '../models/Resume';
import { FilterModel } from '../models/Filter';
import { hhApiService } from '../services/hhApi';
import logger from '../config/logger';
import type { ApiResponse, Filters } from '../../../shared/types';

const router = Router();

// Функция для проверки, опубликовано ли резюме
function isResumePublished(status: { id?: string; name?: string } | undefined): boolean {
  if (!status) return false;
  
  const statusName = (status.name || '').toLowerCase();
  const statusId = (status.id || '').toLowerCase();
  
  // Проверяем, что резюме НЕ неопубликовано
  const isNotPublished = 
    statusName === 'не опубликовано' ||
    statusName === 'not_published' ||
    statusName === 'draft' ||
    statusName === 'черновик' ||
    statusId === 'not_published' ||
    statusId === 'draft';
  
  // Проверяем, что резюме опубликовано
  const isPublished = !isNotPublished && (
    statusName === 'опубликовано' ||
    statusName === 'published' ||
    statusId === 'published' ||
    statusId === 'publish'
  );
  
  return isPublished;
}

// Получить профиль пользователя
router.get('/profile', authenticate, async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  try {
    const userId = req.userId!;
    const user = UserModel.findById(userId)!;
    const dbResumes = ResumeModel.findByUserId(userId);
    const filters = FilterModel.getOrCreate(userId);

    logger.info(`Profile request: found ${dbResumes.length} resumes in DB for user ${userId}`);
    
    // Загружаем актуальные данные из hh.ru для каждого резюме
    const resumesWithHhData = await Promise.all(
      dbResumes.map(async (dbResume) => {
        try {
          const hhResume = await hhApiService.getResume(user.access_token, dbResume.hh_resume_id);
          
          // Проверяем, опубликовано ли резюме - пропускаем неопубликованные
          if (!isResumePublished(hhResume.status)) {
            logger.info(`Skipping unpublished resume ${dbResume.hh_resume_id} in profile (status: ${hhResume.status?.name || 'N/A'})`);
            return null;
          }
          
          return {
            ...dbResume,
            hh_data: {
              status: hhResume.status,
              access: hhResume.access,
              first_name: hhResume.first_name,
              last_name: hhResume.last_name,
              middle_name: hhResume.middle_name,
              age: hhResume.age,
              photo: hhResume.photo,
              total_experience_months: hhResume.total_experience_months,
              experience: hhResume.experience,
              education: hhResume.education,
              language: hhResume.language,
              views_count: hhResume.views_count,
              created_at: hhResume.created_at,
              updated_at: hhResume.updated_at,
            },
          };
        } catch (err: any) {
          logger.warn(`Failed to load HH.ru data for resume ${dbResume.hh_resume_id}:`, err.message);
          // Не возвращаем резюме, если не удалось загрузить данные (не можем проверить статус)
          return null;
        }
      })
    );

    // Фильтруем null значения (неопубликованные или не загруженные резюме)
    const publishedResumes = resumesWithHhData.filter(r => r !== null);
    
    logger.info(`Profile: found ${publishedResumes.length} published resumes (from ${dbResumes.length} total)`);

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        hh_user_id: user.hh_user_id,
        created_at: user.created_at,
        resumes: publishedResumes,
        filters,
      },
    });
  } catch (error: any) {
    logger.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user profile',
    });
  }
});

// Обновить фильтры
router.put('/filters', authenticate, async (req: AuthRequest, res: Response<ApiResponse<Filters>>) => {
  try {
    const userId = req.userId!;
    const { salary_min, salary_max, experience_level, location, skills } = req.body;

    const filters = FilterModel.create({
      user_id: userId,
      salary_min,
      salary_max,
      experience_level,
      location,
      skills: skills || [],
    });

    res.json({
      success: true,
      data: filters,
      message: 'Filters updated successfully',
    });
  } catch (error: any) {
    logger.error('Error updating filters:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update filters',
    });
  }
});

// Получить все резюме из HH.ru
router.get('/resume', authenticate, async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  try {
    const userId = req.userId!;
    const user = UserModel.findById(userId)!;

    // Получаем все резюме из HH.ru
    const hhResumes = await hhApiService.getResumes(user.access_token);
    
    logger.info(`Found ${hhResumes.length} resumes in HH.ru for user ${userId}`);
    
    if (hhResumes.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No resume found in HH.ru profile',
      });
    }

    // Загружаем полную информацию о каждом резюме
    const fullResumes = await Promise.all(
      hhResumes.map(async (hhResume) => {
        try {
          logger.info(`Loading resume ${hhResume.id} (title: ${hhResume.title || 'N/A'})`);
          const fullResume = await hhApiService.getResume(user.access_token, hhResume.id);
          
          logger.info(`Resume ${hhResume.id} loaded successfully. Status: ${fullResume.status?.name || 'N/A'}, Title: ${fullResume.title}`);
          
          // Сохраняем в БД
          // Обрабатываем skills - может быть массивом объектов или массивом строк
          let skillsArray: string[] = [];
          if (Array.isArray(fullResume.skills)) {
            skillsArray = fullResume.skills.map((s: any) => {
              if (typeof s === 'string') {
                return s;
              }
              return s.name || s;
            });
          }

          const savedResume = ResumeModel.upsert({
            user_id: userId,
            hh_resume_id: fullResume.id,
            title: fullResume.title,
            experience: fullResume.experience?.map((exp: any) => 
              `${exp.position} в ${exp.company || 'компании'}${exp.start ? ` (${exp.start} - ${exp.end || 'по настоящее время'})` : ''}`
            ).join('; ') || '',
            skills: skillsArray,
          });

          logger.info(`Resume ${hhResume.id} saved to DB with local ID: ${savedResume.id}`);

          return {
            ...savedResume,
            // Добавляем полную информацию из HH.ru
            hh_data: {
              status: fullResume.status,
              access: fullResume.access,
              first_name: fullResume.first_name,
              last_name: fullResume.last_name,
              middle_name: fullResume.middle_name,
              age: fullResume.age,
              photo: fullResume.photo,
              total_experience_months: fullResume.total_experience_months,
              experience: fullResume.experience,
              education: fullResume.education,
              language: fullResume.language,
              views_count: fullResume.views_count,
              created_at: fullResume.created_at,
              updated_at: fullResume.updated_at,
            },
          };
        } catch (err: any) {
          logger.error(`Error loading resume ${hhResume.id}:`, err);
          return null;
        }
      })
    );

    // Фильтруем null значения
    let validResumes = fullResumes.filter(r => r !== null);

    // Фильтруем только опубликованные резюме
    const publishedResumes = validResumes.filter((r: any) => {
      const isPublished = isResumePublished(r.hh_data?.status);
      if (!isPublished) {
        logger.info(`  ✗ Skipping unpublished resume: ${r.hh_resume_id} - ${r.title} (status: ${r.hh_data?.status?.name || 'N/A'})`);
      }
      return isPublished;
    });

    logger.info(`Loaded ${publishedResumes.length} published resumes for user ${userId} (from ${validResumes.length} total, ${validResumes.length - publishedResumes.length} unpublished)`);
    
    // Логируем все опубликованные резюме
    publishedResumes.forEach((r: any) => {
      logger.info(`  ✓ Published resume: ${r.hh_resume_id} - ${r.title}`);
    });

    // Если нет опубликованных резюме, возвращаем ошибку
    if (publishedResumes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'У вас нет активных (опубликованных) резюме. Опубликуйте резюме на HH.ru и возвращайтесь.',
      });
    }

    validResumes = publishedResumes;

    // Удаляем старую логику загрузки конкретного резюме - теперь загружаем только опубликованные

    // Всегда возвращаем массив
    logger.info(`Returning ${validResumes.length} resumes to client`);
    res.json({
      success: true,
      data: validResumes,
    });
  } catch (error: any) {
    logger.error('Error getting resumes:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get resumes',
    });
  }
});

// Получить полную информацию о пользователе из HH.ru
router.get('/hh-info', authenticate, async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  try {
    const userId = req.userId!;
    const user = UserModel.findById(userId)!;

    // Получаем полную информацию о пользователе из HH.ru
    const hhUserInfo = await hhApiService.getFullUserInfo(user.access_token);
    
    // Получаем отклики пользователя
    let negotiations = null;
    try {
      negotiations = await hhApiService.getNegotiations(user.access_token, { per_page: 5 });
    } catch (err) {
      logger.warn('Failed to get negotiations:', err);
    }

    // Получаем сохраненные вакансии
    let savedVacancies = null;
    try {
      savedVacancies = await hhApiService.getSavedVacancies(user.access_token);
    } catch (err) {
      logger.warn('Failed to get saved vacancies:', err);
    }

    res.json({
      success: true,
      data: {
        userInfo: hhUserInfo,
        negotiations: negotiations,
        savedVacancies: savedVacancies,
      },
    });
  } catch (error: any) {
    logger.error('Error getting HH.ru user info:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get HH.ru user info',
    });
  }
});

export default router;

