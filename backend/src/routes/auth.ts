import { Router, Request, Response } from 'express';
import { UserModel } from '../models/User';
import { ResumeModel } from '../models/Resume';
import { hhApiService } from '../services/hhApi';
import { generateToken } from '../utils/jwt';
import { authLimiter } from '../middleware/rateLimit';
import logger from '../config/logger';
import type { ApiResponse } from '../../../shared/types';

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

// Инициация OAuth
// В режиме разработки отключаем rate limiting
const authMiddleware = process.env.NODE_ENV === 'development' ? [] : [authLimiter];

router.get('/hh', ...authMiddleware, (req: Request, res: Response) => {
  const clientId = process.env.HH_CLIENT_ID;
  const redirectUri = process.env.HH_REDIRECT_URI;
  
  if (!clientId) {
    logger.error('HH_CLIENT_ID is not set in environment variables');
    return res.status(500).json({ 
      success: false, 
      error: 'HH_CLIENT_ID is not configured' 
    });
  }
  
  if (!redirectUri) {
    logger.error('HH_REDIRECT_URI is not set in environment variables');
    return res.status(500).json({ 
      success: false, 
      error: 'HH_REDIRECT_URI is not configured' 
    });
  }
  
  const encodedRedirectUri = encodeURIComponent(redirectUri);
  const authUrl = `https://hh.ru/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodedRedirectUri}`;
  
  logger.info('Generated auth URL:', { 
    clientId: clientId.substring(0, 10) + '...', 
    redirectUri,
    authUrl: authUrl.substring(0, 100) + '...' 
  });
  
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

    // Получаем резюме пользователя - только опубликованные
    try {
      const allResumes = await hhApiService.getResumes(access_token);
      
      // Фильтруем только опубликованные резюме
      const publishedResumes = [];
      for (const resume of allResumes) {
        try {
          const resumeData = await hhApiService.getResume(access_token, resume.id);
          if (isResumePublished(resumeData.status)) {
            publishedResumes.push(resumeData);
          } else {
            logger.info(`Skipping unpublished resume ${resume.id} during auth (status: ${resumeData.status?.name || 'N/A'})`);
          }
        } catch (err: any) {
          logger.warn(`Failed to check resume status ${resume.id} during auth:`, err.message);
        }
      }
      
      // Удаляем все старые резюме пользователя (включая моковые)
      const existingResumes = ResumeModel.findByUserId(user.id);
      for (const existingResume of existingResumes) {
        ResumeModel.delete(existingResume.id);
        logger.info(`Deleted old resume ${existingResume.id} (${existingResume.hh_resume_id})`);
      }

      // Сохраняем все опубликованные резюме из HH.ru
      for (const resumeData of publishedResumes) {
        // Обрабатываем skills - может быть массивом объектов или массивом строк
        let skillsArray: string[] = [];
        
        // Проверяем skill_set в первую очередь
        if (Array.isArray(resumeData.skill_set)) {
          skillsArray = resumeData.skill_set.map((s: any) => {
            if (typeof s === 'string') {
              return s;
            }
            return s.name || s;
          });
        } else if (Array.isArray(resumeData.key_skills)) {
          skillsArray = resumeData.key_skills.map((s: any) => {
            if (typeof s === 'string') {
              return s;
            }
            return s.name || s;
          });
        } else if (Array.isArray(resumeData.skills)) {
          skillsArray = resumeData.skills.map((s: any) => {
            if (typeof s === 'string') {
              return s;
            }
            return s.name || s;
          });
        }

        ResumeModel.upsert({
          user_id: user.id,
          hh_resume_id: resumeData.id,
          title: resumeData.title,
          experience: resumeData.experience?.map((exp: any) => 
            `${exp.position} в ${exp.company || 'компании'}`
          ).join(', ') || '',
          skills: skillsArray,
        });
        
        logger.info(`Saved resume ${resumeData.id} (${resumeData.title}) to DB`);
      }
      
      if (publishedResumes.length === 0) {
        logger.warn(`No published resumes found for user ${user.id} after OAuth`);
      } else {
        logger.info(`Saved ${publishedResumes.length} published resumes for user ${user.id}`);
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

// Тестовый вход для локальной разработки
// НЕ требует авторизации - это публичный endpoint для входа
// Доступен только если NODE_ENV !== 'production' или есть ALLOW_DEV_AUTH_BYPASS
router.post('/dev-login', async (req: Request, res: Response<ApiResponse<{ token: string }>>) => {
  // Проверяем, что это development режим
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_AUTH_BYPASS !== 'true') {
    return res.status(403).json({ 
      success: false, 
      error: 'Dev login is only available in development mode' 
    });
  }
  
  try {
    // Создаем или находим тестового пользователя
    let user = UserModel.findByHhUserId('dev-user-123');
    
    if (!user) {
      user = UserModel.create({
        hh_user_id: 'dev-user-123',
        email: 'dev@test.local',
        access_token: 'dev-access-token',
        refresh_token: 'dev-refresh-token',
      });
    }
    
    // Убеждаемся, что у пользователя есть резюме (создаем даже если пользователь уже существует)
    const { ResumeModel } = await import('../models/Resume');
    const existingResumes = ResumeModel.findByUserId(user.id);
    if (existingResumes.length === 0) {
      ResumeModel.upsert({
        user_id: user.id,
        hh_resume_id: 'dev-resume-123',
        title: 'Тестовое резюме (Frontend Developer)',
        experience: 'Опыт работы: Frontend Developer в компании X (2 года)',
        skills: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS'],
      });
      logger.info('Dev login - Created test resume for dev user');
    }
    
    // Генерируем JWT токен
    const token = generateToken({ userId: user.id, email: user.email });
    
    res.json({ 
      success: true, 
      data: { token },
      message: 'Dev login successful. Use this token in Authorization header: Bearer <token>'
    });
  } catch (error: any) {
    logger.error('Dev login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

