import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }, // Отключаем валидацию trust proxy
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 auth requests per windowMs (увеличено для разработки)
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }, // Отключаем валидацию trust proxy
  skip: (req) => {
    // В режиме разработки полностью отключаем rate limiting
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    // Пропускаем localhost в любом режиме
    return !!(req.ip === '::1' || req.ip === '127.0.0.1' || req.ip?.startsWith('::ffff:127.0.0.1'));
  },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 AI requests per minute
  message: 'Too many AI requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }, // Отключаем валидацию trust proxy
  skip: (req) => {
    // В режиме разработки полностью отключаем rate limiting
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    // Пропускаем localhost в любом режиме
    return !!(req.ip === '::1' || req.ip === '127.0.0.1' || req.ip?.startsWith('::ffff:127.0.0.1'));
  },
});

