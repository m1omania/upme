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

// Получить релевантные вакансии
router.get('/relevant', authenticate, async (req: AuthRequest, res: Response<ApiResponse<Array<VacancyRelevance & { vacancy: any }>>>) => {
  try {
    const userId = req.userId!;
    const user = UserModel.findById(userId)!;
    const filters = FilterModel.getOrCreate(userId);

    // Получаем резюме пользователя
    const resumes = ResumeModel.findByUserId(userId);
    if (resumes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No resume found. Please add a resume to your HH.ru profile.',
      });
    }

    const resume = resumes[0];

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
    const vacanciesToCache = hhResult.items.map(v => ({
      hh_vacancy_id: v.id,
      title: v.name,
      company: v.employer.name,
      salary: v.salary
        ? `${v.salary.from || ''}${v.salary.to ? '-' + v.salary.to : ''} ${v.salary.currency || 'RUB'}`
        : null,
      description: v.description || `${v.snippet.requirement || ''} ${v.snippet.responsibility || ''}`,
      requirements: v.key_skills?.map(s => s.name) || [],
    }));

    VacancyModel.bulkCreate(vacanciesToCache);

    // Рассчитываем релевантность для каждой вакансии
    const relevantVacancies = hhResult.items.map(v => {
      const cachedVacancy = VacancyModel.findByHhVacancyId(v.id);
      if (!cachedVacancy) {
        return null;
      }

      const relevance = RelevanceService.calculateRelevance(cachedVacancy, resume);

      return {
        ...relevance,
        vacancy: {
          id: cachedVacancy.id,
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

// Получить детали вакансии
router.get('/:id', authenticate, async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  try {
    const vacancyId = parseInt(req.params.id);
    const vacancy = VacancyModel.findById(vacancyId);

    if (!vacancy) {
      return res.status(404).json({
        success: false,
        error: 'Vacancy not found',
      });
    }

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

// Рассчитать релевантность вакансии
router.post('/:id/relevance', authenticate, async (req: AuthRequest, res: Response<ApiResponse<VacancyRelevance>>) => {
  try {
    const vacancyId = parseInt(req.params.id);
    const userId = req.userId!;

    const vacancy = VacancyModel.findById(vacancyId);
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
    const relevance = RelevanceService.calculateRelevance(vacancy, resume);

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

