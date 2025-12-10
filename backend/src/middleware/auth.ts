import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/User';
import { verifyToken } from '../utils/jwt';
import logger from '../config/logger';

export interface AuthRequest extends Request {
  userId?: number;
  user?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Обход авторизации в development режиме (ОТКЛЮЧЕН для работы с реальным HH.ru API)
    if (false && process.env.NODE_ENV === 'development' && process.env.ALLOW_DEV_AUTH_BYPASS === 'true') {
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
      
      // Убеждаемся, что у пользователя есть резюме
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
        logger.info('Auth middleware - Created test resume for dev user');
      }
      
      req.userId = user.id;
      req.user = user;
      logger.info('Auth middleware - Dev bypass enabled, using dev user:', { userId: user.id });
      return next();
    }

    const authHeader = req.headers.authorization;
    logger.info('Auth middleware - Authorization header:', { 
      hasHeader: !!authHeader,
      headerLength: authHeader?.length || 0,
      headerPrefix: authHeader?.substring(0, 20) || 'none'
    });

    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      logger.warn('Auth middleware - No token provided');
      res.status(401).json({ success: false, error: 'No token provided' });
      return;
    }

    logger.info('Auth middleware - Verifying token:', { 
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
      jwtSecret: process.env.JWT_SECRET ? 'present' : 'missing'
    });

    // Используем verifyToken из jwt.ts, чтобы гарантировать использование того же JWT_SECRET
    const decoded = verifyToken(token);
    
    logger.info('Auth middleware - Token decoded:', { userId: decoded.userId });

    const user = UserModel.findById(decoded.userId);

    if (!user) {
      logger.warn('Auth middleware - User not found:', { userId: decoded.userId });
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }

    logger.info('Auth middleware - Authentication successful:', { userId: user.id });
    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (error: any) {
    logger.error('Auth middleware - Token verification failed:', { 
      error: error.message,
      errorName: error.name
    });
    res.status(401).json({ success: false, error: 'Invalid token', details: error.message });
  }
};

