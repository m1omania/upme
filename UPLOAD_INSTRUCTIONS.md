# Инструкция по загрузке UpMe на сервер

## Ваши данные сервера:
- **SSH**: `ssh -p 49376 root@53893873b619.vps.myjino.ru`
- **Домен**: `upme.pro`
- **Порт для UpMe**: `3002` (предположительно)

---

## Шаг 1: Подключение к серверу

Откройте терминал на вашем компьютере и выполните:

```bash
ssh -p 49376 root@53893873b619.vps.myjino.ru
```

Введите пароль при запросе.

---

## Шаг 2: Изучение структуры сервера

После подключения выполните команды для изучения:

```bash
# Проверьте, где находится ваш существующий проект
ls -la /var/www
ls -la /home
ls -la ~

# Проверьте, какие порты используются
netstat -tlnp | grep LISTEN
# или
ss -tlnp | grep LISTEN

# Проверьте PM2 процессы (если используется)
pm2 list
```

**Сообщите мне результаты этих команд**, чтобы я мог правильно настроить UpMe.

---

## Шаг 3: Создание директорий для UpMe

```bash
# Создайте директорию для проекта
mkdir -p /var/www/upme/backend
mkdir -p /var/www/upme/frontend
mkdir -p /var/www/upme/backend/data
mkdir -p /var/www/upme/backend/logs

# Установите права доступа
chmod 755 /var/www/upme/backend/data
chmod 755 /var/www/upme/backend/logs
```

---

## Шаг 4: Загрузка файлов

### Вариант A: Через SCP (с вашего компьютера)

Откройте **новый терминал** на вашем компьютере (не закрывая SSH сессию):

```bash
# Загрузите backend
cd /Users/mio/Desktop/upme
scp -P 49376 -r backend/dist root@53893873b619.vps.myjino.ru:/var/www/upme/backend/
scp -P 49376 backend/package.json root@53893873b619.vps.myjino.ru:/var/www/upme/backend/

# Загрузите frontend
scp -P 49376 -r frontend/dist/* root@53893873b619.vps.myjino.ru:/var/www/upme/frontend/dist/
```

### Вариант B: Через SFTP клиент

Используйте FileZilla, Cyberduck или другой SFTP клиент:

**Настройки подключения:**
- **Хост**: `53893873b619.vps.myjino.ru`
- **Порт**: `49376`
- **Пользователь**: `root`
- **Протокол**: SFTP

**Загрузите:**
- `backend/dist/` → `/var/www/upme/backend/dist/`
- `backend/package.json` → `/var/www/upme/backend/package.json`
- `frontend/dist/*` → `/var/www/upme/frontend/dist/`

---

## Шаг 5: Создание .env файла на сервере

На сервере выполните:

```bash
cd /var/www/upme/backend
nano .env
```

Вставьте следующее содержимое (замените значения на ваши):

```env
PORT=3002
JWT_SECRET=ВАШ_СЕКРЕТНЫЙ_КЛЮЧ_СГЕНЕРИРУЙТЕ_ЧЕРЕЗ_openssl_rand_-base64_32
HH_CLIENT_ID=ваш_hh_client_id
HH_CLIENT_SECRET=ваш_hh_client_secret
HH_REDIRECT_URI=https://upme.pro/api/auth/callback
FRONTEND_URL=https://upme.pro
HF_API_KEY=ваш_huggingface_api_key
NODE_ENV=production
DATABASE_PATH=./data/upme.db
```

Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

**Важно:** Сгенерируйте JWT_SECRET:
```bash
openssl rand -base64 32
```

---

## Шаг 6: Установка зависимостей

```bash
cd /var/www/upme/backend
npm install --production
```

---

## Шаг 7: Запуск миграций

```bash
cd /var/www/upme/backend
npm run migrate
```

---

## Следующие шаги

После выполнения этих шагов сообщите мне, и я помогу с:
- Настройкой PM2
- Настройкой Nginx
- Настройкой SSL

---

## Полезные команды для проверки

```bash
# Проверка структуры
ls -la /var/www/upme/backend/
ls -la /var/www/upme/frontend/

# Проверка портов
netstat -tlnp | grep 3002

# Проверка Node.js
node --version
npm --version

# Проверка PM2
pm2 --version
```

