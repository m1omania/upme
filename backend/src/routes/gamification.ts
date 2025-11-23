import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { GamificationService } from '../services/gamificationService';
import logger from '../config/logger';
import type { ApiResponse } from '../../../shared/types';

const router = Router();

// Получить статистику геймификации
router.get('/stats', authenticate, async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  try {
    const userId = req.userId!;
    const stats = GamificationService.getStats(userId);
    const forecast = GamificationService.calculateSuccessForecast(userId);

    res.json({
      success: true,
      data: {
        ...stats,
        forecast,
      },
    });
  } catch (error: any) {
    logger.error('Error getting gamification stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get gamification stats',
    });
  }
});

// Получить достижения
router.get('/achievements', authenticate, async (req: AuthRequest, res: Response<ApiResponse<any>>) => {
  try {
    const userId = req.userId!;
    const stats = GamificationService.getStats(userId);

    res.json({
      success: true,
      data: {
        achievements: stats.achievements,
      },
    });
  } catch (error: any) {
    logger.error('Error getting achievements:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get achievements',
    });
  }
});

export default router;

