import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimit';
import { aiService } from '../services/aiService';
import { VacancyModel } from '../models/Vacancy';
import { ResumeModel } from '../models/Resume';
import { UserModel } from '../models/User';
import { hhApiService } from '../services/hhApi';
import logger from '../config/logger';
import type { ApiResponse } from '../../../shared/types';

const router = Router();

// Генерация сопроводительного письма
router.post('/generate-letter', authenticate, aiLimiter, async (req: AuthRequest, res: Response<ApiResponse<{ letter: string }>>) => {
  try {
    logger.info('POST /api/ai/generate-letter - Request received', { body: req.body });
    const userId = req.userId!;
    const { vacancy_id } = req.body;

    if (!vacancy_id) {
      return res.status(400).json({
        success: false,
        error: 'vacancy_id is required',
      });
    }

    const vacancy = VacancyModel.findById(vacancy_id);
    if (!vacancy) {
      return res.status(404).json({
        success: false,
        error: 'Vacancy not found',
      });
    }

    const user = UserModel.findById(userId)!;

    // Получаем резюме из БД - они уже отфильтрованы при загрузке (только опубликованные)
    const resumes = ResumeModel.findByUserId(userId);
    
    if (resumes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'У вас нет активных (опубликованных) резюме. Опубликуйте резюме на HH.ru и возвращайтесь.',
      });
    }

    // Выбираем резюме, которое лучше всего соответствует вакансии
    // Сравниваем название вакансии с названием резюме
    const resume = selectBestResumeForVacancy(vacancy.title, resumes);
    
    logger.info(`Selected resume "${resume.title}" for vacancy "${vacancy.title}" (from ${resumes.length} available resumes)`);

    // Получаем полные данные резюме из hh.ru для получения имени
    const hhResume = await hhApiService.getResume(user.access_token, resume.hh_resume_id);
    
    // Формируем имя из резюме
    const firstName = hhResume.first_name || '';
    const lastName = hhResume.last_name || '';
    const middleName = hhResume.middle_name || '';
    const fullName = [lastName, firstName, middleName].filter(Boolean).join(' ') || 'Кандидат';

    // Получаем контактные данные пользователя из HH.ru
    const hhUserInfo = await hhApiService.getFullUserInfo(user.access_token);
    const userEmail = hhUserInfo.email || user.email || '';
    const userPhone = hhUserInfo.phone || '';

    // Формируем контактные данные
    const contactInfo: string[] = [];
    if (userEmail) contactInfo.push(`Email: ${userEmail}`);
    if (userPhone) contactInfo.push(`Телефон: ${userPhone}`);

    // Получаем полные данные резюме для генерации
    const resumeData = {
      title: resume.title,
      experience: resume.experience || '',
      skills: resume.skills || [],
      fullName: fullName,
    };

    logger.info(`Generating cover letter for vacancy ${vacancy_id}, resume: ${resume.title}, name: ${fullName}`);

    // Генерируем письмо с полным описанием вакансии
    let letter = await aiService.generateCoverLetter(
      vacancy.title,
      vacancy.description || '',
      vacancy.requirements || [],
      resumeData.title,
      resumeData.experience,
      resumeData.skills,
      resumeData.fullName
    );

    // Добавляем контактные данные в конец письма
    if (contactInfo.length > 0) {
      letter += '\n\n' + contactInfo.join('\n');
    }

    res.json({
      success: true,
      data: { letter },
    });
  } catch (error: any) {
    logger.error('Error generating cover letter:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate cover letter',
    });
  }
});

// Улучшение письма
router.post('/improve-letter', authenticate, aiLimiter, async (req: AuthRequest, res: Response<ApiResponse<{ letter: string }>>) => {
  try {
    const { letter, feedback } = req.body;

    if (!letter) {
      return res.status(400).json({
        success: false,
        error: 'letter is required',
      });
    }

    const improvedLetter = await aiService.improveCoverLetter(letter, feedback);

    res.json({
      success: true,
      data: { letter: improvedLetter },
    });
  } catch (error: any) {
    logger.error('Error improving cover letter:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to improve cover letter',
    });
  }
});

/**
 * Выбирает резюме, которое лучше всего соответствует вакансии
 * Сравнивает название вакансии с названием резюме
 */
function selectBestResumeForVacancy(vacancyTitle: string, resumes: any[]): any {
  if (resumes.length === 1) {
    return resumes[0];
  }

  const vacancyTitleLower = vacancyTitle.toLowerCase();
  
  // Ищем точное совпадение ключевых слов
  const keywords = vacancyTitleLower.split(/\s+/).filter(w => w.length > 2);
  
  let bestMatch = resumes[0];
  let bestScore = 0;

  const scores: Array<{ resume: any; score: number }> = [];

  for (const resume of resumes) {
    const resumeTitleLower = resume.title.toLowerCase();
    let score = 0;

    // Проверяем точное совпадение ключевых слов
    for (const keyword of keywords) {
      if (resumeTitleLower.includes(keyword)) {
        score += 10;
      }
    }

    // Проверяем частичное совпадение (для случаев типа "UX/UI дизайнер" и "UX дизайнер")
    const commonWords = ['дизайнер', 'designer', 'разработчик', 'developer', 'менеджер', 'manager', 'ux', 'ui', 'веб', 'web'];
    for (const word of commonWords) {
      if (vacancyTitleLower.includes(word) && resumeTitleLower.includes(word)) {
        score += 5;
      }
    }

    // Если название резюме содержит название вакансии или наоборот
    if (resumeTitleLower.includes(vacancyTitleLower) || vacancyTitleLower.includes(resumeTitleLower)) {
      score += 20;
    }

    scores.push({ resume, score });

    if (score > bestScore) {
      bestScore = score;
      bestMatch = resume;
    }
  }

  logger.info(`Resume selection for "${vacancyTitle}": ${scores.map(s => `"${s.resume.title}" (${s.score})`).join(', ')} -> Selected: "${bestMatch.title}"`);

  return bestMatch;
}

export default router;

