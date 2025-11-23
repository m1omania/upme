import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { hhApiService } from '../services/hhApi';
import { VacancyModel } from '../models/Vacancy';
import { ResumeModel } from '../models/Resume';
import { RelevanceService } from '../services/relevanceService';
import { FilterModel } from '../models/Filter';
import { UserModel } from '../models/User';
import logger from '../config/logger';
import type { ApiResponse, VacancyRelevance } from '../../../shared/types';

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

// Получить релевантные вакансии
router.get('/relevant', authenticate, async (req: AuthRequest, res: Response<ApiResponse<Array<VacancyRelevance & { vacancy: any }>>>) => {
  try {
    const userId = req.userId!;
    const user = UserModel.findById(userId)!;
    const filters = FilterModel.getOrCreate(userId);

    // Получаем резюме пользователя
    const dbResumes = ResumeModel.findByUserId(userId);
    
    // Проверяем статус резюме через HH.ru API и фильтруем только опубликованные
    const publishedResumes = [];
    for (const dbResume of dbResumes) {
      if (!dbResume.hh_resume_id) continue;
      
      try {
        const hhResume = await hhApiService.getResume(user.access_token, dbResume.hh_resume_id);
        if (isResumePublished(hhResume.status)) {
          publishedResumes.push(dbResume);
        } else {
          logger.info(`Skipping unpublished resume ${dbResume.hh_resume_id} for vacancy search (status: ${hhResume.status?.name || 'N/A'})`);
        }
      } catch (err: any) {
        logger.warn(`Failed to check resume status ${dbResume.hh_resume_id}:`, err.message);
        // Если не удалось проверить статус, пропускаем резюме
      }
    }

    if (publishedResumes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'У вас нет активных (опубликованных) резюме. Опубликуйте резюме на HH.ru и возвращайтесь.',
      });
    }

    const resume = publishedResumes[0];

    // Параметры поиска
    const searchParams: any = {
      per_page: 20,
      page: parseInt(req.query.page as string) || 0,
    };

    if (filters.experience_level) {
      searchParams.experience = filters.experience_level;
    }
    if (filters.location) {
      searchParams.area = filters.location;
    }
    if (filters.salary_min) {
      searchParams.salary = filters.salary_min;
    }

    // Поиск вакансий через HH.ru API
    const hhResult = await hhApiService.searchVacancies(user.access_token, searchParams);

    // Кэшируем вакансии в БД
    // ВАЖНО: При поиске через /vacancies API hh.ru может не возвращать полное описание
    // Используем snippet как fallback, но полное описание загрузится при открытии деталей
    const vacanciesToCache = hhResult.items.map(v => ({
      hh_vacancy_id: v.id,
      title: v.name,
      company: v.employer.name,
      salary: v.salary
        ? `${v.salary.from || ''}${v.salary.to ? '-' + v.salary.to : ''} ${v.salary.currency || 'RUB'}`
        : null,
      // Используем description если есть, иначе snippet (будет загружено полное при открытии)
      description: v.description || `${v.snippet.requirement || ''} ${v.snippet.responsibility || ''}`.trim(),
      requirements: v.key_skills?.map(s => s.name) || [],
    }));
    
    logger.info(`Caching ${vacanciesToCache.length} vacancies (descriptions: ${vacanciesToCache.filter(v => v.description && v.description.length > 200).length} full, ${vacanciesToCache.filter(v => !v.description || v.description.length <= 200).length} short)`);

    VacancyModel.bulkCreate(vacanciesToCache);

    // Рассчитываем релевантность для каждой вакансии
    const relevantVacancies = hhResult.items.map(v => {
      const cachedVacancy = VacancyModel.findByHhVacancyId(v.id);
      if (!cachedVacancy) {
        logger.warn(`Vacancy ${v.id} not found in cache after bulkCreate`);
        return null;
      }

      const relevance = RelevanceService.calculateRelevance(cachedVacancy, resume);

      logger.info(`Vacancy ${v.id} -> DB ID: ${cachedVacancy.id}, relevance: ${relevance.relevance_score}`);

      return {
        ...relevance,
        vacancy: {
          id: cachedVacancy.id, // Используем ID из БД (автоинкремент), не hh_vacancy_id
          hh_vacancy_id: cachedVacancy.hh_vacancy_id,
          title: cachedVacancy.title,
          company: cachedVacancy.company,
          salary: cachedVacancy.salary,
          description: cachedVacancy.description,
          requirements: cachedVacancy.requirements,
        },
      };
    }).filter(v => v !== null) as Array<VacancyRelevance & { vacancy: any }>;

    // Сортируем по релевантности
    relevantVacancies.sort((a, b) => b.relevance_score - a.relevance_score);

    res.json({
      success: true,
      data: relevantVacancies,
    });
  } catch (error: any) {
    logger.error('Error getting relevant vacancies:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get relevant vacancies',
    });
  }
});

// Получить детали вакансии (из кэша БД, загружаем полное описание из hh.ru если нужно)
router.get('/:id', authenticate, async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  try {
    const vacancyId = parseInt(req.params.id);
    const userId = req.userId!;
    const user = UserModel.findById(userId)!;
    
    // Используем кэш из БД
    let vacancy = VacancyModel.findById(vacancyId);

    if (!vacancy) {
      logger.warn(`Vacancy ${vacancyId} not found in cache`);
      return res.status(404).json({
        success: false,
        error: 'Vacancy not found in cache',
      });
    }

    // Проверяем, есть ли полное описание
    // При поиске через /vacancies API hh.ru может не возвращать полное описание
    // Загружаем полное описание через /vacancies/{id} если описание короткое
    const currentDescriptionLength = vacancy.description?.length || 0;
    const isShortDescription = currentDescriptionLength < 500; // Если меньше 500 символов, считаем коротким

    if (isShortDescription) {
      logger.info(`Loading full description for vacancy ${vacancyId} (hh_id: ${vacancy.hh_vacancy_id}, current length: ${currentDescriptionLength})`);
      try {
        // Загружаем полное описание из hh.ru API (один запрос на открытие модального окна)
        const fullVacancy = await hhApiService.getVacancy(user.access_token, vacancy.hh_vacancy_id);
        
        // Обновляем описание в кэше, если получили более полное
        if (fullVacancy.description && fullVacancy.description.length > currentDescriptionLength) {
          const updatedVacancy = VacancyModel.update(vacancyId, {
            title: fullVacancy.name || vacancy.title,
            company: fullVacancy.employer?.name || vacancy.company,
            salary: vacancy.salary, // Сохраняем форматированную зарплату
            description: fullVacancy.description, // Полное описание
            requirements: fullVacancy.key_skills?.map(s => s.name) || vacancy.requirements,
          });
          
          if (updatedVacancy) {
            vacancy = updatedVacancy;
            logger.info(`Updated vacancy ${vacancyId} with full description (${fullVacancy.description.length} chars, was ${currentDescriptionLength})`);
          } else {
            logger.warn(`Failed to update vacancy ${vacancyId}`);
          }
        } else {
          logger.info(`Full description not longer than cached (${fullVacancy.description?.length || 0} vs ${currentDescriptionLength})`);
        }
      } catch (err: any) {
        logger.warn(`Failed to load full description for vacancy ${vacancyId}:`, err.message);
        // Продолжаем с кэшированным описанием
      }
    } else {
      logger.info(`Using cached description for vacancy ${vacancyId} (length: ${currentDescriptionLength})`);
    }

    logger.info(`Returning vacancy ${vacancyId} (hh_id: ${vacancy.hh_vacancy_id}, description length: ${vacancy.description?.length || 0})`);

    res.json({
      success: true,
      data: vacancy,
    });
  } catch (error: any) {
    logger.error('Error getting vacancy:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get vacancy',
    });
  }
});

// Рассчитать релевантность вакансии (использует кэш, без запросов к hh.ru API)
router.post('/:id/relevance', authenticate, async (req: AuthRequest, res: Response<ApiResponse<VacancyRelevance>>) => {
  try {
    const vacancyId = parseInt(req.params.id);
    const userId = req.userId!;
    const user = UserModel.findById(userId)!;

    // Используем кэш из БД - НЕ делаем запрос к hh.ru API
    const vacancy = VacancyModel.findById(vacancyId);
    if (!vacancy) {
      logger.warn(`Vacancy ${vacancyId} not found in cache for relevance calculation`);
      return res.status(404).json({
        success: false,
        error: 'Vacancy not found in cache',
      });
    }

    const dbResumes = ResumeModel.findByUserId(userId);
    
    // Проверяем статус резюме через HH.ru API и фильтруем только опубликованные
    const publishedResumes = [];
    for (const dbResume of dbResumes) {
      if (!dbResume.hh_resume_id) continue;
      
      try {
        const hhResume = await hhApiService.getResume(user.access_token, dbResume.hh_resume_id);
        if (isResumePublished(hhResume.status)) {
          publishedResumes.push(dbResume);
        } else {
          logger.info(`Skipping unpublished resume ${dbResume.hh_resume_id} for relevance calculation (status: ${hhResume.status?.name || 'N/A'})`);
        }
      } catch (err: any) {
        logger.warn(`Failed to check resume status ${dbResume.hh_resume_id}:`, err.message);
        // Если не удалось проверить статус, пропускаем резюме
      }
    }

    if (publishedResumes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'У вас нет активных (опубликованных) резюме. Опубликуйте резюме на HH.ru и возвращайтесь.',
      });
    }

    const resume = publishedResumes[0];
    // Рассчитываем релевантность на основе кэшированных данных
    const relevance = RelevanceService.calculateRelevance(vacancy, resume);

    logger.info(`Calculated relevance for vacancy ${vacancyId}: ${relevance.relevance_score}%`);

    res.json({
      success: true,
      data: relevance,
    });
  } catch (error: any) {
    logger.error('Error calculating relevance:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate relevance',
    });
  }
});

export default router;

