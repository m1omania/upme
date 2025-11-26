# Пошаговая инструкция по деплою UpMe на upme.pro

## Шаг 1: ✅ ГОТОВО
- Backend собран в `backend/dist/`
- Frontend собран в `frontend/dist/`

## Шаг 2: Подготовка .env файлов

### Backend .env файл

Создайте файл `backend/.env` на сервере со следующим содержимым:

```env
PORT=3002
JWT_SECRET=ВАШ_СЕКРЕТНЫЙ_КЛЮЧ_МИНИМУМ_32_СИМВОЛА
HH_CLIENT_ID=ваш_hh_client_id
HH_CLIENT_SECRET=ваш_hh_client_secret
HH_REDIRECT_URI=https://upme.pro/api/auth/callback
FRONTEND_URL=https://upme.pro
HF_API_KEY=ваш_huggingface_api_key
NODE_ENV=production
DATABASE_PATH=./data/upme.db
```

### Frontend .env.production

Создайте файл `frontend/.env.production` (перед сборкой) или обновите `VITE_API_URL` в коде:

```env
VITE_API_URL=https://upme.pro
```

## Шаг 3: Загрузка файлов на сервер

### Что загрузить:

1. **Backend:**
   - `backend/dist/` → `/var/www/upme/backend/dist/`
   - `backend/package.json` → `/var/www/upme/backend/package.json`
   - `backend/.env` → `/var/www/upme/backend/.env` (создать на сервере)

2. **Frontend:**
   - `frontend/dist/*` → `/var/www/upme/frontend/dist/`

## Шаг 4: Настройка на сервере

### Создание директорий:
```bash
mkdir -p /var/www/upme/backend/data
mkdir -p /var/www/upme/backend/logs
mkdir -p /var/www/upme/frontend/dist
```

### Установка зависимостей:
```bash
cd /var/www/upme/backend
npm install --production
```

### Запуск миграций:
```bash
cd /var/www/upme/backend
npm run migrate
```

## Шаг 5: Настройка PM2

Добавьте в ваш `ecosystem.config.js`:

```javascript
{
  name: 'upme-backend',
  script: './backend/dist/index.js',
  cwd: '/var/www/upme',
  env: {
    NODE_ENV: 'production',
    PORT: 3002
  }
}
```

## Шаг 6: Настройка Nginx

Создайте конфигурацию для `upme.pro`:

```nginx
server {
    listen 80;
    server_name upme.pro www.upme.pro;

    location /api {
        proxy_pass http://localhost:3002;
        # ... остальные настройки прокси
    }

    location / {
        root /var/www/upme/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

## Шаг 7: SSL сертификат

```bash
sudo certbot --nginx -d upme.pro -d www.upme.pro
```

