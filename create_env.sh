#!/bin/bash
# Команда для создания .env файла на сервере
# Выполните эту команду в веб-консоли сервера

cd /var/www/upme/backend
cat > .env << 'EOF'
PORT=3002
JWT_SECRET=your_jwt_secret_here
HH_CLIENT_ID=your_hh_client_id_here
HH_CLIENT_SECRET=your_hh_client_secret_here
HH_REDIRECT_URI=https://upme.pro/api/auth/callback
FRONTEND_URL=https://upme.pro
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
NODE_ENV=production
DATABASE_PATH=./data/upme.db
EOF

echo "✅ Файл .env создан!"
cat .env

