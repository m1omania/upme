# Локальная разработка без HH.ru API

Для локальной разработки можно использовать мок-данные и обход авторизации, чтобы не зависеть от HH.ru API.

## Настройка

### 1. Создайте `backend/.env.local`:

```env
# Обход авторизации (автоматически создаст тестового пользователя)
ALLOW_DEV_AUTH_BYPASS=true

# Использование мок-данных для вакансий
USE_MOCK_DATA=true
```

### 2. Перезапустите backend:

```bash
cd backend
npm run dev
```

## Режимы работы

### Режим 1: Полный обход (рекомендуется для UI разработки)

**Настройки:**
```env
ALLOW_DEV_AUTH_BYPASS=true
USE_MOCK_DATA=true
```

**Что работает:**
- ✅ Автоматический вход без токена (создается тестовый пользователь)
- ✅ Мок-вакансии (3 тестовые вакансии)
- ✅ Тестовое резюме создается автоматически
- ✅ Все страницы доступны без авторизации через HH.ru

**Ограничения:**
- ❌ Реальные данные из HH.ru недоступны
- ❌ Отправка откликов не работает (нет реального API)

### Режим 2: Только мок-вакансии

**Настройки:**
```env
ALLOW_DEV_AUTH_BYPASS=false
USE_MOCK_DATA=true
```

**Что работает:**
- ✅ Нужна авторизация (через `/api/auth/dev-login`)
- ✅ Мок-вакансии вместо реальных
- ✅ Можно тестировать UI вакансий

### Режим 3: Быстрый вход (dev-login)

**Настройки:**
```env
ALLOW_DEV_AUTH_BYPASS=false
USE_MOCK_DATA=false
```

**Использование:**
1. Сделайте запрос:
```bash
curl -X POST http://localhost:3002/api/auth/dev-login
```

2. Получите токен из ответа

3. Используйте токен в заголовке:
```
Authorization: Bearer <token>
```

## API Endpoints для разработки

### POST `/api/auth/dev-login`
Создает тестового пользователя и возвращает JWT токен.

**Ответ:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

## Мок-данные

### Тестовый пользователь
- **ID**: `dev-user-123`
- **Email**: `dev@test.local`
- **Резюме**: Frontend Developer с навыками React, TypeScript, JavaScript

### Мок-вакансии
1. **Frontend Developer (React)** - 95% релевантность
2. **Senior Frontend Developer** - 85% релевантность  
3. **Full Stack Developer** - 75% релевантность

## Отключение мок-режима

Для работы с реальным HH.ru API просто удалите или закомментируйте переменные в `.env.local`:

```env
# ALLOW_DEV_AUTH_BYPASS=true
# USE_MOCK_DATA=true
```

Или установите их в `false`:

```env
ALLOW_DEV_AUTH_BYPASS=false
USE_MOCK_DATA=false
```

## Примечания

- Мок-режим работает **только** в `NODE_ENV=development`
- В production эти настройки игнорируются
- `.env.local` уже в `.gitignore`, не попадет в репозиторий

