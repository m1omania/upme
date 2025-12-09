#!/usr/bin/expect -f

set timeout 120

spawn ssh -p 49376 root@53893873b619.vps.myjino.ru

expect {
    "Are you sure you want to continue connecting" {
        send "yes\r"
        exp_continue
    }
    "password:" {
        send "jinopass777\r"
    }
}

expect -re "\[#$\] "
puts "\n=== Connected successfully ==="

# Переход в директорию
send "cd /var/www/upme\r"
expect -re "\[#$\] "

# Установка зависимостей
send "echo '=== Installing dependencies ==='\r"
expect -re "\[#$\] "
send "npm install\r"
expect -re "\[#$\] "

send "cd backend && npm install && cd ..\r"
expect -re "\[#$\] "

# Применяем миграции напрямую через node
send "echo '=== Running migrations ==='\r"
expect -re "\[#$\] "
send "cd backend && npx tsx src/migrations/run.ts && cd ..\r"
expect -re "\[#$\] "

# Проверяем .env
send "echo '=== Checking .env ==='\r"
expect -re "\[#$\] "
send "ls -la .env backend/.env\r"
expect -re "\[#$\] "

# Запускаем PM2
send "echo '=== Starting PM2 ==='\r"
expect -re "\[#$\] "
send "pm2 start ecosystem.config.js --env production\r"
expect -re "\[#$\] "

# Сохраняем PM2
send "pm2 save\r"
expect -re "\[#$\] "

# Статус
send "echo '=== PM2 Status ==='\r"
expect -re "\[#$\] "
send "pm2 status\r"
expect -re "\[#$\] "

# Логи
send "echo '=== Recent Logs ==='\r"
expect -re "\[#$\] "
send "pm2 logs --lines 50 --nostream\r"
expect -re "\[#$\] "

send "exit\r"
expect eof

puts "\n=== Setup completed ==="

