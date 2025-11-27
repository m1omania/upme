# UpMe - Job Swiper для HH.ru

Веб-приложение для автоматической подачи откликов на вакансии с тиндероподобным интерфейсом, AI-генерацией писем и геймификацией.

## Технологический стек

- **Frontend**: React 18 + TypeScript + Vite + Material-UI
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite
- **AI**: HuggingFace Inference API
- **Auth**: HH.ru OAuth 2.0

## Установка

1. Установите зависимости:
```bash
npm run install:all
```

2. Скопируйте `.env.example` в `.env` и заполните переменные окружения

3. Запустите миграции базы данных:
```bash
cd backend && npm run migrate
```

4. Запустите проект:
```bash
npm run dev
```

Backend будет доступен на `http://localhost:3002`
Frontend будет доступен на `http://localhost:3000`

## Структура проекта

- `backend/` - Express сервер с API
- `frontend/` - React приложение
- `shared/` - Общие типы и утилиты

## API Endpoints

- `GET /api/auth/hh` - Инициация OAuth
- `GET /api/auth/callback` - OAuth callback
- `GET /api/vacancies/relevant` - Релевантные вакансии
- `POST /api/applications` - Создать отклик
- `POST /api/ai/generate-letter` - Генерация письма
- `GET /api/gamification/stats` - Статистика геймификации

## Деплой

Проект развернут на `https://upme.pro`

Для обновления на сервере выполните:
```bash
cd /var/www/upme && ./deploy.sh
```

