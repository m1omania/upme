// Загружаем переменные окружения ПЕРВЫМ делом
import dotenv from 'dotenv';
import path from 'path';
// Для локальной разработки загружаем .env.local ПЕРВЫМ (переопределяет все остальные)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}
// .env находится в корне проекта
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
// Также пробуем загрузить из текущей директории (на случай если запускаем из корня)
dotenv.config();

import express from 'express';
import cors from 'cors';
import db from './config/database';
import logger from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';

// Routes
import authRoutes from './routes/auth';
import vacancyRoutes from './routes/vacancies';
import applicationRoutes from './routes/applications';
import aiRoutes from './routes/ai';
import gamificationRoutes from './routes/gamification';
import userRoutes from './routes/user';

const app = express();
const PORT = process.env.PORT || 3002;

// Trust proxy (для работы за Nginx)
app.set('trust proxy', true);

// Middleware
// Разрешаем запросы с localhost и network IP для локальной разработки
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://192.168.31.204:3000',
  /^http:\/\/192\.168\.\d+\.\d+:3000$/, // Любой локальный network IP
];

app.use(cors({
  origin: (origin, callback) => {
    // Разрешаем запросы без origin (например, мобильные приложения)
    if (!origin) return callback(null, true);
    
    // Проверяем точное совпадение
    if (allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      }
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    })) {
      return callback(null, true);
    }
    
    // В development режиме разрешаем все локальные адреса
    if (process.env.NODE_ENV === 'development') {
      if (origin.includes('localhost') || origin.includes('192.168.') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vacancies', vacancyRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/user', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Database: ${process.env.DATABASE_PATH || './data/upme.db'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down gracefully...');
  db.close();
  process.exit(0);
});

