# Деплой UpMe на обычный хостинг (без VPS)

## Можно ли использовать обычный хостинг?

**Короткий ответ:** Частично да, но с ограничениями.

### Проблема с обычным хостингом:

Обычный виртуальный хостинг (shared hosting) обычно **не поддерживает Node.js**. Он рассчитан на:
- PHP приложения
- Статические сайты (HTML/CSS/JS)
- MySQL/PostgreSQL через панель управления

### Решение: Гибридный подход

**Разделим проект на две части:**
1. **Frontend** → Обычный хостинг (статический сайт)
2. **Backend** → Облачный сервис (Railway, Render, Fly.io)

---

## Вариант 1: Frontend на обычном хостинге + Backend на облаке

### Преимущества:
- ✅ Дешевле (обычный хостинг ~100-300₽/мес)
- ✅ Проще управление frontend
- ✅ Backend на надежной платформе

### Недостатки:
- ⚠️ Два разных сервиса
- ⚠️ Нужно настроить CORS

---

## Пошаговая инструкция

### Шаг 1: Деплой Backend на облачный сервис

#### Вариант A: Railway (рекомендуется, самый простой)

1. Зарегистрируйтесь на [railway.app](https://railway.app)
2. Создайте новый проект
3. Подключите GitHub репозиторий
4. Настройки:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Добавьте переменные окружения в панели Railway:
   ```
   PORT=3002
   JWT_SECRET=ваш_секрет
   HH_CLIENT_ID=ваш_id
   HH_CLIENT_SECRET=ваш_secret
   HH_REDIRECT_URI=https://ваш-домен.ru/api/auth/callback
   FRONTEND_URL=https://ваш-домен.ru
   HF_API_KEY=ваш_key
   NODE_ENV=production
   ```
6. Railway автоматически даст вам URL типа: `https://ваш-проект.up.railway.app`

#### Вариант B: Render

1. Зарегистрируйтесь на [render.com](https://render.com)
2. Создайте новый **Web Service**
3. Подключите репозиторий
4. Настройки:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
5. Добавьте переменные окружения
6. Получите URL: `https://ваш-проект.onrender.com`

#### Вариант C: Fly.io

1. Установите Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Войдите: `fly auth login`
3. Создайте приложение: `fly launch` (в папке backend)
4. Настройте переменные: `fly secrets set KEY=value`
5. Деплой: `fly deploy`

### Шаг 2: Сборка Frontend

На вашем локальном компьютере:

```bash
cd frontend

# Создайте .env.production с URL вашего backend
echo "VITE_API_URL=https://ваш-проект.up.railway.app" > .env.production

# Соберите проект
npm install
npm run build
```

После сборки в папке `frontend/dist` будут готовые статические файлы.

### Шаг 3: Загрузка Frontend на обычный хостинг

#### Для Jino (обычный хостинг):

1. Зайдите в панель управления Jino
2. Откройте **Файловый менеджер** или используйте **FTP**
3. Зайдите в папку `public_html` (или `www`, или `htdocs` - зависит от хостинга)
4. Загрузите **все файлы** из папки `frontend/dist`:
   - `index.html`
   - Все файлы из папки `assets/`
   - Другие файлы

5. Создайте файл `.htaccess` в корне `public_html` (для Apache):

```apache
# Перенаправление всех запросов на index.html (для React Router)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Кеширование статических файлов
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
</IfModule>
```

### Шаг 4: Настройка CORS на Backend

Убедитесь, что в `backend/src/index.ts` правильно настроен CORS:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://ваш-домен.ru',
  credentials: true,
}));
```

### Шаг 5: Обновление переменных окружения

В панели Railway/Render/Fly.io обновите:
```
FRONTEND_URL=https://ваш-домен.ru
HH_REDIRECT_URI=https://ваш-домен.ru/api/auth/callback
```

**Важно:** Railway/Render автоматически проксируют `/api/auth/callback`, но вам нужно настроить домен.

---

## Вариант 2: Полностью на облачных платформах (бесплатно/дешево)

### Frontend на Vercel/Netlify (бесплатно)

1. **Vercel:**
   ```bash
   npm i -g vercel
   cd frontend
   vercel
   ```
   - Автоматически определит настройки
   - Создайте `.env.production` с `VITE_API_URL`
   - Деплой займет 2 минуты

2. **Netlify:**
   - Подключите GitHub репозиторий
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
   - Добавьте переменную окружения `VITE_API_URL`

### Backend на Railway/Render

Как описано выше.

**Итого:** Полностью бесплатно или очень дешево (~$5/мес только за backend)

---

## Вариант 3: Только статический хостинг (если backend уже есть)

Если у вас уже есть backend на другом сервере:

1. Соберите frontend: `npm run build`
2. Загрузите `frontend/dist` на любой статический хостинг:
   - GitHub Pages (бесплатно)
   - Vercel (бесплатно)
   - Netlify (бесплатно)
   - Обычный хостинг Jino (статический)

---

## Сравнение вариантов

| Вариант | Стоимость | Сложность | Рекомендация |
|---------|-----------|-----------|--------------|
| VPS (полный контроль) | 200-500₽/мес | Средняя | ✅ Для продакшена |
| Frontend на хостинге + Backend на облаке | 100-300₽ + $5/мес | Низкая | ✅ Для старта |
| Все на облаке (Vercel + Railway) | $0-5/мес | Очень низкая | ✅ Для MVP |
| Обычный хостинг (только frontend) | 100-300₽/мес | Низкая | ✅ Если backend отдельно |

---

## Рекомендация для Jino

Если у вас уже есть обычный хостинг на Jino:

1. **Используйте его для Frontend** (статический сайт)
2. **Backend разместите на Railway** (самый простой вариант)
   - Бесплатный тариф на 500 часов/мес
   - Потом $5/мес
   - Автоматический деплой из GitHub

### Преимущества этого подхода:
- ✅ Используете уже оплаченный хостинг
- ✅ Backend на надежной платформе
- ✅ Простое обновление (git push)
- ✅ Автоматические бэкапы
- ✅ SSL сертификаты автоматически

---

## Настройка поддомена для API (опционально)

Если хотите, чтобы API был на `api.ваш-домен.ru`:

1. В панели Jino создайте поддомен `api`
2. Настройте CNAME запись на Railway/Render URL
3. Или используйте проксирование через Nginx (если есть доступ)

---

## FAQ

### Можно ли полностью на обычном хостинге?

**Нет**, если хостинг не поддерживает Node.js. Но некоторые хостинги (например, Timeweb) предлагают поддержку Node.js на отдельных тарифах.

### Что дешевле?

Самый дешевый вариант:
- Frontend: Vercel/Netlify (бесплатно)
- Backend: Railway (500 часов бесплатно, потом $5/мес)

Или:
- Frontend: Обычный хостинг Jino (~200₽/мес)
- Backend: Railway ($5/мес)

### Нужен ли VPS?

**Не обязательно!** Можно использовать комбинацию обычного хостинга + облачного сервиса.

---

## Итоговая рекомендация

**Для старта:** Frontend на обычном хостинге Jino + Backend на Railway
- Используете уже оплаченный хостинг
- Backend на надежной платформе
- Минимальные затраты

**Для продакшена:** VPS (больше контроля, но сложнее настройка)

