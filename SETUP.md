# Инструкция по запуску проекта UpMe

## Предварительные требования

- Node.js 18+ и npm
- Аккаунт на HH.ru с настроенным OAuth приложением
- API ключ HuggingFace

## Установка

1. Установите зависимости для всех частей проекта:

```bash
npm run install:all
```

Или вручную:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ../shared && npm install
```

2. Настройте переменные окружения:

Скопируйте `.env.example` в `.env` в корне проекта и заполните:

```env
PORT=3002
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development

HH_CLIENT_ID=your-hh-client-id
HH_CLIENT_SECRET=your-hh-client-secret
HH_REDIRECT_URI=http://localhost:3002/api/auth/callback

HUGGINGFACE_API_KEY=your-huggingface-api-key

DATABASE_PATH=./data/upme.db

VITE_API_URL=http://localhost:3002
```

3. Запустите миграции базы данных:

```bash
cd backend
npm run migrate
```

4. Запустите проект:

В корне проекта:
```bash
npm run dev
```

Или отдельно:

Backend (терминал 1):
```bash
cd backend
npm run dev
```

Frontend (терминал 2):
```bash
cd frontend
npm run dev
```

## Доступ к приложению

- Frontend: http://localhost:3000
- Backend API: http://localhost:3002
- Health check: http://localhost:3002/health

## Структура проекта

```
upme/
├── backend/          # Express API сервер
├── frontend/         # React приложение
├── shared/           # Общие типы
└── docs/            # Документация
```

## Основные API endpoints

- `GET /api/auth/hh` - Получить URL для OAuth авторизации
- `GET /api/auth/callback` - OAuth callback
- `GET /api/vacancies/relevant` - Получить релевантные вакансии
- `POST /api/applications` - Создать отклик
- `POST /api/ai/generate-letter` - Сгенерировать сопроводительное письмо
- `GET /api/gamification/stats` - Статистика геймификации

## Примечания

- База данных SQLite создается автоматически при первом запуске
- Логи сохраняются в папке `logs/`
- Кэш AI-генераций хранится в памяти (перезапускается при рестарте сервера)

