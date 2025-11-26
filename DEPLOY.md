# Инструкция по деплою UpMe на хостинг

## Варианты хостинга

### 1. VPS (Рекомендуется)
- **DigitalOcean** (от $6/мес)
- **Hetzner** (от €4/мес)
- **Timeweb** (от 200₽/мес)
- **Selectel** (от 200₽/мес)

### 2. Облачные платформы
- **Railway** (простой деплой, от $5/мес)
- **Render** (бесплатный тариф доступен)
- **Fly.io** (от $5/мес)
- **Vercel** (только frontend, backend отдельно)

### 3. Российские хостинги
- **Timeweb Cloud**
- **Selectel**
- **Яндекс.Облако**

---

## Подготовка к деплою

### 1. Переменные окружения

Создайте файл `.env` в папке `backend/`:

```env
# Порт сервера
PORT=3002

# JWT секрет (сгенерируйте случайную строку)
JWT_SECRET=ваш_секретный_ключ_минимум_32_символа

# HH.ru OAuth
HH_CLIENT_ID=ваш_client_id
HH_CLIENT_SECRET=ваш_client_secret
HH_REDIRECT_URI=https://ваш-домен.ru/api/auth/callback

# Frontend URL
FRONTEND_URL=https://ваш-домен.ru

# HuggingFace API
HF_API_KEY=ваш_api_key

# Node environment
NODE_ENV=production
```

### 2. Обновите FRONTEND_URL в коде

В `frontend/src/services/api.ts` проверьте, что базовый URL правильный:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ваш-домен.ru';
```

Создайте `.env.production` в `frontend/`:

```env
VITE_API_URL=https://ваш-домен.ru
```

### 3. Обновите HH.ru OAuth настройки

В настройках приложения HH.ru обновите:
- **Redirect URI**: `https://ваш-домен.ru/api/auth/callback`

---

## Вариант 1: Деплой на VPS (Ubuntu/Debian)

### Шаг 1: Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Установка PM2 для управления процессами
sudo npm install -g pm2

# Установка Nginx
sudo apt install -y nginx

# Установка SSL сертификата (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
```

### Шаг 2: Клонирование проекта

```bash
# Создайте директорию для проекта
mkdir -p /var/www/upme
cd /var/www/upme

# Клонируйте репозиторий (или загрузите файлы)
git clone https://github.com/ваш-username/upme.git .

# Или загрузите через SCP/SFTP
```

### Шаг 3: Установка зависимостей

```bash
# Установка зависимостей
npm run install:all

# Сборка проекта
npm run build
```

### Шаг 4: Настройка переменных окружения

```bash
cd backend
nano .env
# Заполните все переменные (см. выше)
```

### Шаг 5: Запуск миграций

```bash
cd backend
npm run migrate
```

### Шаг 6: Настройка PM2

Создайте файл `ecosystem.config.js` в корне проекта:

```javascript
module.exports = {
  apps: [{
    name: 'upme-backend',
    script: './backend/dist/index.js',
    cwd: '/var/www/upme',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    error_file: './logs/backend-error.log',
    out_file: './logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
```

Запустите backend:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Шаг 7: Настройка Nginx

Создайте файл `/etc/nginx/sites-available/upme`:

```nginx
# Backend API
server {
    listen 80;
    server_name ваш-домен.ru api.ваш-домен.ru;

    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend статические файлы
    location / {
        root /var/www/upme/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Логи
    access_log /var/log/nginx/upme-access.log;
    error_log /var/log/nginx/upme-error.log;
}
```

Активируйте конфигурацию:

```bash
sudo ln -s /etc/nginx/sites-available/upme /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Шаг 8: Настройка SSL

```bash
sudo certbot --nginx -d ваш-домен.ru -d api.ваш-домен.ru
```

### Шаг 9: Настройка автостарта

```bash
# PM2 уже настроен через pm2 startup
# Nginx запускается автоматически
```

---

## Вариант 2: Деплой на Railway

### Шаг 1: Подготовка

1. Зарегистрируйтесь на [Railway.app](https://railway.app)
2. Установите Railway CLI: `npm i -g @railway/cli`

### Шаг 2: Создание проекта

```bash
# В корне проекта
railway login
railway init
```

### Шаг 3: Настройка переменных окружения

В панели Railway добавьте все переменные из `.env`

### Шаг 4: Деплой

Railway автоматически определит структуру проекта. Убедитесь, что:

1. **Backend** деплоится из папки `backend/`
2. **Frontend** деплоится отдельным сервисом из папки `frontend/`

Создайте `railway.json` в корне:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd backend && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Вариант 3: Деплой на Render

### Backend

1. Создайте новый **Web Service**
2. Подключите репозиторий
3. Настройки:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

### Frontend

1. Создайте новый **Static Site**
2. Подключите репозиторий
3. Настройки:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

---

## Важные моменты

### 1. База данных SQLite

SQLite подходит для небольших проектов. Для продакшена рассмотрите:
- **PostgreSQL** (рекомендуется)
- **MySQL/MariaDB**

Миграция на PostgreSQL:
1. Установите PostgreSQL на сервере
2. Обновите `backend/src/config/database.ts`
3. Замените `better-sqlite3` на `pg` или `postgres`

### 2. Файлы логов

Убедитесь, что директория `backend/logs/` существует и доступна для записи:

```bash
mkdir -p backend/logs
chmod 755 backend/logs
```

### 3. Резервное копирование

Настройте автоматическое резервное копирование базы данных:

```bash
# Добавьте в crontab
0 2 * * * cp /var/www/upme/backend/data/upme.db /backup/upme-$(date +\%Y\%m\%d).db
```

### 4. Мониторинг

Используйте PM2 для мониторинга:

```bash
pm2 monit
pm2 logs
```

### 5. Обновление кода

```bash
cd /var/www/upme
git pull  # или загрузите новые файлы
npm run build
pm2 restart upme-backend
```

---

## Проверка работоспособности

После деплоя проверьте:

1. ✅ Backend API доступен: `https://ваш-домен.ru/api/health` (если есть)
2. ✅ Frontend загружается: `https://ваш-домен.ru`
3. ✅ OAuth работает: попробуйте авторизоваться
4. ✅ API запросы проходят: проверьте в DevTools

---

## Troubleshooting

### Ошибка: "Cannot find module"
```bash
# Переустановите зависимости
rm -rf node_modules
npm run install:all
npm run build
```

### Ошибка: "Port already in use"
```bash
# Проверьте, что порт свободен
sudo lsof -i :3002
# Остановите процесс или измените порт
```

### Ошибка: "Database locked"
```bash
# SQLite может блокироваться при множественных запросах
# Рассмотрите миграцию на PostgreSQL
```

### Логи не пишутся
```bash
# Проверьте права доступа
chmod -R 755 backend/logs
```

---

## Дополнительные рекомендации

1. **CDN для статики**: Используйте Cloudflare для ускорения загрузки
2. **Rate Limiting**: Убедитесь, что rate limiting настроен правильно
3. **CORS**: Проверьте настройки CORS в backend
4. **Безопасность**: Используйте HTTPS, обновляйте зависимости регулярно

---

## Полезные команды

```bash
# Просмотр логов PM2
pm2 logs upme-backend

# Перезапуск
pm2 restart upme-backend

# Статус
pm2 status

# Просмотр логов Nginx
sudo tail -f /var/log/nginx/upme-error.log

# Проверка конфигурации Nginx
sudo nginx -t
```

