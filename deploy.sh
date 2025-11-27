#!/bin/bash
set -e

echo "🔄 Обновление проекта..."

cd /var/www/upme

echo "📦 Обновление зависимостей..."
cd backend && npm install --production && cd ..
cd frontend && npm install && cd ..

echo "🔨 Сборка backend (если нужно)..."
# Backend уже собран в GitHub Actions, но на всякий случай
cd backend
if [ -f "tsconfig.json" ]; then
  npm run build || echo "⚠️ Backend build skipped (already built)"
fi
cd ..

echo "🔨 Сборка frontend (если нужно)..."
# Frontend уже собран в GitHub Actions, но на всякий случай
cd frontend
if [ -f "vite.config.ts" ]; then
  npx vite build || echo "⚠️ Frontend build skipped (already built)"
fi
cd ..

echo "🔄 Перезапуск backend..."
pm2 restart upme-backend || pm2 start ecosystem.config.js

echo "✅ Деплой завершен!"
pm2 status

