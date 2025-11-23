import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimit';
import { aiService } from '../services/aiService';
import { VacancyModel } from '../models/Vacancy';
import { ResumeModel } from '../models/Resume';
import logger from '../config/logger';
import type { ApiResponse } from '../../../shared/types';

const router = Router();

// Генерация сопроводительного письма
router.post('/generate-letter', authenticate, aiLimiter, async (req: AuthRequest, res: Response<ApiResponse<{ letter: string }>>) => {
  try {
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

    const resumes = ResumeModel.findByUserId(userId);
    if (resumes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No resume found',
      });
    }

    const resume = resumes[0];

    // Генерируем письмо
    const letter = await aiService.generateCoverLetter(
      vacancy.title,
      vacancy.description,
      vacancy.requirements,
      resume.title,
      resume.experience,
      resume.skills
    );

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

export default router;

