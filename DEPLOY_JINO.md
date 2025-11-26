# Инструкция по деплою UpMe на Jino

## О хостинге Jino

Jino предоставляет несколько типов хостинга:
- **Виртуальный хостинг** - не подходит для Node.js
- **VPS** - подходит для нашего проекта
- **Выделенный сервер** - для больших нагрузок

Для UpMe нужен **VPS** с поддержкой Node.js.

---

## Подготовка к деплою

### 1. Заказ VPS на Jino

1. Зайдите на [jino.ru](https://jino.ru)
2. Выберите тариф VPS (рекомендуется минимум 1GB RAM)
3. Выберите ОС: **Ubuntu 22.04 LTS** или **Debian 12**
4. После заказа вы получите:
   - IP-адрес сервера
   - Логин (обычно `root`)
   - Пароль для SSH

### 2. Подключение к серверу

```bash
ssh root@ваш-ip-адрес
# Введите пароль при запросе
```

---

## Установка и настройка

### Шаг 1: Обновление системы

```bash
apt update && apt upgrade -y
```

### Шаг 2: Установка Node.js 20.x

```bash
# Установка Node.js через NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Проверка установки
node --version  # Должно быть v20.x.x
npm --version
```

### Шаг 3: Установка PM2

```bash
npm install -g pm2
```

### Шаг 4: Установка Nginx

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

### Шаг 5: Установка SSL (Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
```

---

## Загрузка проекта

### Вариант 1: Через Git (рекомендуется)

```bash
# Установка Git
apt install -y git

# Создание директории
mkdir -p /var/www/upme
cd /var/www/upme

# Клонирование репозитория
git clone https://github.com/ваш-username/upme.git .

# Или если репозиторий приватный, используйте SSH ключ
```

### Вариант 2: Через SCP/SFTP

С вашего локального компьютера:

```bash
# Создайте архив проекта (исключая node_modules)
tar -czf upme.tar.gz --exclude='node_modules' --exclude='.git' upme/

# Загрузите на сервер
scp upme.tar.gz root@ваш-ip:/var/www/

# На сервере распакуйте
ssh root@ваш-ip
cd /var/www
mkdir -p upme
tar -xzf upme.tar.gz -C upme/
cd upme
```

---

## Настройка проекта

### Шаг 1: Установка зависимостей

```bash
cd /var/www/upme

# Установка всех зависимостей
npm run install:all
```

### Шаг 2: Создание файла .env

```bash
cd /var/www/upme/backend
nano .env
```

Вставьте следующее содержимое (замените на ваши значения):

```env
# Порт сервера
PORT=3002

# JWT секрет (сгенерируйте: openssl rand -base64 32)
JWT_SECRET=ваш_секретный_ключ_минимум_32_символа

# HH.ru OAuth
HH_CLIENT_ID=ваш_client_id
HH_CLIENT_SECRET=ваш_client_secret
HH_REDIRECT_URI=https://ваш-домен.ru/api/auth/callback

# Frontend URL
FRONTEND_URL=https://ваш-домен.ru

# HuggingFace API
HF_API_KEY=ваш_huggingface_api_key

# Node environment
NODE_ENV=production

# Путь к базе данных
DATABASE_PATH=/var/www/upme/backend/data/upme.db
```

Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

### Шаг 3: Создание .env.production для frontend

```bash
cd /var/www/upme/frontend
nano .env.production
```

Вставьте:

```env
VITE_API_URL=https://ваш-домен.ru
```

### Шаг 4: Сборка проекта

```bash
cd /var/www/upme

# Сборка backend
cd backend
npm run build

# Сборка frontend
cd ../frontend
npm run build
```

### Шаг 5: Запуск миграций

```bash
cd /var/www/upme/backend
npm run migrate
```

### Шаг 6: Создание директорий для логов и данных

```bash
mkdir -p /var/www/upme/backend/logs
mkdir -p /var/www/upme/backend/data
chmod 755 /var/www/upme/backend/logs
chmod 755 /var/www/upme/backend/data
```

---

## Настройка PM2

### Шаг 1: Создание конфигурации

Файл `ecosystem.config.js` уже создан в корне проекта. Проверьте путь:

```bash
cd /var/www/upme
cat ecosystem.config.js
```

Если нужно, обновите путь в конфиге:

```bash
nano ecosystem.config.js
```

Убедитесь, что `cwd` указывает на `/var/www/upme`

### Шаг 2: Запуск приложения

```bash
cd /var/www/upme
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Последняя команда покажет команду для автозапуска - выполните её.

### Шаг 3: Проверка статуса

```bash
pm2 status
pm2 logs upme-backend
```

---

## Настройка Nginx

### Шаг 1: Создание конфигурации

```bash
nano /etc/nginx/sites-available/upme
```

Вставьте следующее:

```nginx
server {
    listen 80;
    server_name ваш-домен.ru www.ваш-домен.ru;

    # Логи
    access_log /var/log/nginx/upme-access.log;
    error_log /var/log/nginx/upme-error.log;

    # Backend API
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
        
        # Таймауты для долгих запросов (AI генерация)
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Frontend статические файлы
    location / {
        root /var/www/upme/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Кеширование статики
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Запрет доступа к скрытым файлам
    location ~ /\. {
        deny all;
    }
}
```

### Шаг 2: Активация конфигурации

```bash
# Создание символической ссылки
ln -s /etc/nginx/sites-available/upme /etc/nginx/sites-enabled/

# Удаление дефолтной конфигурации (опционально)
rm /etc/nginx/sites-enabled/default

# Проверка конфигурации
nginx -t

# Перезагрузка Nginx
systemctl reload nginx
```

---

## Настройка домена и SSL

### Шаг 1: Настройка DNS в панели Jino

1. Зайдите в панель управления Jino
2. Перейдите в раздел "Домены" или "DNS"
3. Добавьте A-запись:
   - **Имя**: `@` (или ваш поддомен)
   - **Тип**: `A`
   - **Значение**: IP-адрес вашего VPS
   - **TTL**: `3600`

4. Если нужен www:
   - **Имя**: `www`
   - **Тип**: `A`
   - **Значение**: IP-адрес вашего VPS

### Шаг 2: Установка SSL сертификата

```bash
# Получение сертификата
certbot --nginx -d ваш-домен.ru -d www.ваш-домен.ru

# Следуйте инструкциям:
# - Введите email
# - Согласитесь с условиями
# - Выберите редирект с HTTP на HTTPS (рекомендуется 2)
```

Certbot автоматически обновит конфигурацию Nginx.

### Шаг 3: Автоматическое обновление сертификата

```bash
# Проверка автообновления
certbot renew --dry-run
```

---

## Настройка файрвола (опционально, но рекомендуется)

```bash
# Установка UFW
apt install -y ufw

# Разрешение SSH
ufw allow 22/tcp

# Разрешение HTTP и HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Включение файрвола
ufw enable

# Проверка статуса
ufw status
```

---

## Обновление HH.ru OAuth настроек

1. Зайдите на [dev.hh.ru](https://dev.hh.ru/)
2. Откройте ваше приложение
3. Обновите **Redirect URI**:
   ```
   https://ваш-домен.ru/api/auth/callback
   ```
4. Сохраните изменения

---

## Проверка работоспособности

### 1. Проверка backend

```bash
# Проверка через curl
curl http://localhost:3002/api/health

# Или проверка логов
pm2 logs upme-backend
```

### 2. Проверка frontend

Откройте в браузере: `https://ваш-домен.ru`

### 3. Проверка API

Откройте DevTools (F12) и проверьте, что запросы идут на правильный домен.

---

## Полезные команды

### Управление PM2

```bash
# Статус
pm2 status

# Логи
pm2 logs upme-backend

# Перезапуск
pm2 restart upme-backend

# Остановка
pm2 stop upme-backend

# Мониторинг
pm2 monit
```

### Управление Nginx

```bash
# Проверка конфигурации
nginx -t

# Перезагрузка
systemctl reload nginx

# Статус
systemctl status nginx

# Логи
tail -f /var/log/nginx/upme-error.log
```

### Обновление кода

```bash
cd /var/www/upme

# Если используете Git
git pull

# Пересборка
npm run build

# Перезапуск
pm2 restart upme-backend
```

---

## Резервное копирование

### Создание скрипта бэкапа

```bash
nano /root/backup-upme.sh
```

Вставьте:

```bash
#!/bin/bash
BACKUP_DIR="/backup/upme"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Бэкап базы данных
cp /var/www/upme/backend/data/upme.db $BACKUP_DIR/upme_$DATE.db

# Бэкап .env файла
cp /var/www/upme/backend/.env $BACKUP_DIR/env_$DATE

# Удаление старых бэкапов (старше 7 дней)
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "env_*" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Сделайте исполняемым:

```bash
chmod +x /root/backup-upme.sh
```

### Настройка cron для автоматического бэкапа

```bash
crontab -e
```

Добавьте строку (бэкап каждый день в 2:00):

```
0 2 * * * /root/backup-upme.sh >> /var/log/upme-backup.log 2>&1
```

---

## Troubleshooting

### Ошибка: "Cannot find module"

```bash
cd /var/www/upme
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all
npm run build
pm2 restart upme-backend
```

### Ошибка: "Port 3002 already in use"

```bash
# Найти процесс
lsof -i :3002

# Остановить PM2
pm2 stop all
pm2 delete all

# Запустить заново
pm2 start ecosystem.config.js
```

### Ошибка: "Database locked"

SQLite может блокироваться. Проверьте:
- Нет ли других процессов, использующих БД
- Правильные ли права доступа: `chmod 644 /var/www/upme/backend/data/upme.db`

### Ошибка 502 Bad Gateway

```bash
# Проверьте, запущен ли backend
pm2 status

# Проверьте логи
pm2 logs upme-backend
tail -f /var/log/nginx/upme-error.log

# Проверьте, слушает ли порт 3002
netstat -tlnp | grep 3002
```

### SSL сертификат не работает

```bash
# Проверьте конфигурацию Nginx
nginx -t

# Проверьте DNS
nslookup ваш-домен.ru

# Переустановите сертификат
certbot --nginx -d ваш-домен.ru --force-renewal
```

---

## Мониторинг и логи

### Просмотр логов приложения

```bash
# PM2 логи
pm2 logs upme-backend --lines 100

# Логи backend (Winston)
tail -f /var/www/upme/backend/logs/combined.log
tail -f /var/www/upme/backend/logs/error.log

# Nginx логи
tail -f /var/log/nginx/upme-access.log
tail -f /var/log/nginx/upme-error.log
```

### Мониторинг ресурсов

```bash
# Использование памяти и CPU
pm2 monit

# Или через htop
apt install -y htop
htop
```

---

## Безопасность

### 1. Обновление системы

```bash
apt update && apt upgrade -y
```

### 2. Настройка SSH ключей (вместо пароля)

```bash
# На вашем локальном компьютере
ssh-copy-id root@ваш-ip

# На сервере отключите вход по паролю (опционально)
nano /etc/ssh/sshd_config
# Установите: PasswordAuthentication no
systemctl restart sshd
```

### 3. Регулярные обновления зависимостей

```bash
# Проверка устаревших пакетов
npm outdated

# Обновление (осторожно, тестируйте сначала)
npm update
```

---

## Контакты поддержки Jino

Если возникнут проблемы с хостингом:
- **Техподдержка**: support@jino.ru
- **Телефон**: указан в панели управления
- **Документация**: https://jino.ru/help/

---

## Дополнительные рекомендации

1. **CDN**: Рассмотрите использование Cloudflare для ускорения загрузки статики
2. **Мониторинг**: Настройте мониторинг через UptimeRobot или аналогичные сервисы
3. **Логирование**: Настройте ротацию логов, чтобы они не занимали много места
4. **База данных**: Для продакшена рассмотрите миграцию на PostgreSQL

---

Готово! Ваш сайт должен быть доступен по адресу `https://ваш-домен.ru`

