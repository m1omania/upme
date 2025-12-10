#!/bin/bash

set -e

echo "=== Деплой Tinder Swipe на Jino VPS ==="

cd /var/www/upme

echo "1. Git pull..."
git pull origin main

echo "2. Установка новых зависимостей..."
npm install

echo "3. Пересборка frontend..."
cd frontend
npm install
npx vite build

echo "4. Проверка dist..."
ls -lh dist/

echo "=== Деплой завершен! ==="
echo "Frontend обновлен на https://upme.pro"

