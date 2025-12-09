#!/usr/bin/expect -f

set timeout 180

spawn ssh -p 49376 root@53893873b619.vps.myjino.ru

expect {
    "password:" {
        send "jinopass777\r"
    }
}

expect -re "\[#$\] "

send "cd /var/www/upme\r"
expect -re "\[#$\] "

# Git pull
send "echo '=== Pulling latest code ==='\r"
expect -re "\[#$\] "
send "git pull origin main\r"
expect -re "\[#$\] "

# Пересборка backend
send "echo '=== Rebuilding backend ==='\r"
expect -re "\[#$\] "
send "cd backend && rm -rf dist && npm run build && cd ..\r"
expect -re "\[#$\] "

# Проверяем структуру dist
send "echo '=== Checking dist structure ==='\r"
expect -re "\[#$\] "
send "ls -la backend/dist/\r"
expect -re "\[#$\] "

send "ls -la backend/dist/index.js 2>&1\r"
expect -re "\[#$\] "

# Запуск PM2
send "echo '=== Starting with PM2 ==='\r"
expect -re "\[#$\] "
send "pm2 delete all 2>/dev/null || true\r"
expect -re "\[#$\] "

send "pm2 start ecosystem.config.js --env production\r"
expect -re "\[#$\] "

send "pm2 save\r"
expect -re "\[#$\] "

# Даем время на запуск
send "sleep 5\r"
expect -re "\[#$\] "

# Статус
send "echo '=== PM2 Status ==='\r"
expect -re "\[#$\] "
send "pm2 status\r"
expect -re "\[#$\] "

# Логи
send "echo '=== Application Logs ==='\r"
expect -re "\[#$\] "
send "pm2 logs upme-backend --lines 50 --nostream\r"
expect -re "\[#$\] "

# Проверка порта
send "echo '=== Port 3002 Status ==='\r"
expect -re "\[#$\] "
send "netstat -tlnp | grep 3002 || ss -tlnp | grep 3002 || echo 'Port not listening'\r"
expect -re "\[#$\] "

# Проверка через curl
send "echo '=== Testing API ==='\r"
expect -re "\[#$\] "
send "curl -s http://localhost:3002/api/auth/hh | head -c 200 || echo 'API not responding'\r"
expect -re "\[#$\] "

send "exit\r"
expect eof

puts "\n=== Deploy completed! ==="
puts "Check https://upme.pro"

