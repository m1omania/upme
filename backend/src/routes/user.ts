import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { UserModel } from '../models/User';
import { ResumeModel } from '../models/Resume';
import { FilterModel } from '../models/Filter';
import { hhApiService } from '../services/hhApi';
import logger from '../config/logger';
import type { ApiResponse, Filters } from '../../../shared/types';

const router = Router();

// Получить профиль пользователя
router.get('/profile', authenticate, async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  try {
    const userId = req.userId!;
    const user = UserModel.findById(userId)!;
    const resumes = ResumeModel.findByUserId(userId);
    const filters = FilterModel.getOrCreate(userId);

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        resumes,
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

// Получить резюме из HH.ru
router.get('/resume', authenticate, async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  try {
    const userId = req.userId!;
    const user = UserModel.findById(userId)!;

    // Обновляем резюме из HH.ru
    const hhResumes = await hhApiService.getResumes(user.access_token);
    
    if (hhResumes.length > 0) {
      const hhResume = await hhApiService.getResume(user.access_token, hhResumes[0].id);
      
      const resume = ResumeModel.upsert({
        user_id: userId,
        hh_resume_id: hhResume.id,
        title: hhResume.title,
        experience: hhResume.experience?.map(exp => 
          `${exp.position} в ${exp.company || 'компании'}`
        ).join(', ') || '',
        skills: hhResume.skills?.map(s => s.name) || [],
      });

      res.json({
        success: true,
        data: resume,
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'No resume found in HH.ru profile',
      });
    }
  } catch (error: any) {
    logger.error('Error getting resume:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get resume',
    });
  }
});

export default router;

