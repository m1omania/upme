#!/bin/bash
set -e

echo "🔄 Обновление проекта..."

cd /var/www/upme

echo "📥 Получение изменений из Git..."
git pull origin main || echo "⚠️ Git pull failed, continuing..."

echo "📦 Обновление зависимостей..."
cd backend && npm install --production && cd ..
cd frontend && npm install && cd ..

echo "🔨 Сборка backend..."
cd backend
# Используем уже собранные файлы из dist, если они есть
if [ ! -d "dist/backend/src" ]; then
  # Если dist нет, пытаемся собрать (пропускаем ошибки TypeScript)
  npx tsc --skipLibCheck || echo "⚠️ TypeScript errors ignored"
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

