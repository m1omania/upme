import { Router, Request, Response } from 'express';
import { UserModel } from '../models/User';
import { ResumeModel } from '../models/Resume';
import { hhApiService } from '../services/hhApi';
import { generateToken } from '../utils/jwt';
import { authLimiter } from '../middleware/rateLimit';
import logger from '../config/logger';
import type { ApiResponse } from '../../../shared/types';

const router = Router();

// Инициация OAuth
// В режиме разработки отключаем rate limiting
const authMiddleware = process.env.NODE_ENV === 'development' ? [] : [authLimiter];

router.get('/hh', ...authMiddleware, (req: Request, res: Response) => {
  const clientId = process.env.HH_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.HH_REDIRECT_URI!);
  const authUrl = `https://hh.ru/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
  
  res.json({ success: true, data: { authUrl } });
});

// OAuth callback
router.get('/callback', ...authMiddleware, async (req: Request, res: Response) => {
  try {
    const { code, error } = req.query;

    if (error) {
      logger.error('OAuth error:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?error=${error}`);
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?error=no_code`);
    }

    // Получаем токены
    const { access_token, refresh_token } = await hhApiService.getAccessToken(code as string);

    // Получаем информацию о пользователе
    const hhUser = await hhApiService.getUserInfo(access_token);

    // Создаем или обновляем пользователя
    let user = UserModel.findByHhUserId(hhUser.id);
    if (user) {
      UserModel.updateTokens(user.id, access_token, refresh_token);
      user = UserModel.findById(user.id)!;
    } else {
      user = UserModel.create({
        hh_user_id: hhUser.id,
        email: hhUser.email,
        access_token,
        refresh_token,
      });
    }

    // Получаем резюме пользователя
    try {
      const resumes = await hhApiService.getResumes(access_token);
      if (resumes.length > 0) {
        const resume = resumes[0];
        const resumeData = await hhApiService.getResume(access_token, resume.id);
        
        ResumeModel.upsert({
          user_id: user.id,
          hh_resume_id: resumeData.id,
          title: resumeData.title,
          experience: resumeData.experience?.map(exp => 
            `${exp.position} в ${exp.company || 'компании'}`
          ).join(', ') || '',
          skills: resumeData.skills?.map(s => s.name) || [],
        });
      }
    } catch (error) {
      logger.warn('Failed to fetch resumes:', error);
    }

    // Генерируем JWT токен
    const token = generateToken({ userId: user.id, email: user.email });
    logger.info('Generated JWT token for user:', { userId: user.id, tokenLength: token.length });

    // Редирект на фронтенд с токеном
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${token}`;
    logger.info('Redirecting to frontend:', { redirectUrl: redirectUrl.substring(0, 100) + '...' });
    res.redirect(redirectUrl);
  } catch (error: any) {
    logger.error('Auth callback error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
    });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const errorMessage = error.response?.data?.error_description 
      || error.response?.data?.error 
      || error.message 
      || 'Unknown error';
    res.redirect(`${frontendUrl}/auth/error?error=${encodeURIComponent(errorMessage)}`);
  }
});

// Обновление токена
router.post('/refresh', ...authMiddleware, async (req: Request, res: Response<ApiResponse<{ token: string }>>) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Refresh token required' });
    }

    const user = UserModel.findById((req as any).userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.refresh_token !== refreshToken) {
      return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }

    // Обновляем токены через HH.ru
    const { access_token, refresh_token } = await hhApiService.refreshAccessToken(refreshToken);
    UserModel.updateTokens(user.id, access_token, refresh_token);

    // Генерируем новый JWT
    const token = generateToken({ userId: user.id, email: user.email });

    res.json({ success: true, data: { token } });
  } catch (error: any) {
    logger.error('Refresh token error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Выход
router.post('/logout', (req: Request, res: Response<ApiResponse<void>>) => {
  // В реальном приложении можно добавить blacklist токенов
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;

