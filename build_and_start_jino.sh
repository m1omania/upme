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

# Сборка backend
send "echo '=== Building backend ==='\r"
expect -re "\[#$\] "
send "cd backend && npm run build && cd ..\r"
expect -re "\[#$\] "

# Проверяем, что dist создан
send "echo '=== Checking dist ==='\r"
expect -re "\[#$\] "
send "ls -la backend/dist/\r"
expect -re "\[#$\] "

# Запускаем PM2
send "echo '=== Starting PM2 ==='\r"
expect -re "\[#$\] "
send "pm2 start ecosystem.config.js --env production\r"
expect -re "\[#$\] "

# Даем время на запуск
send "sleep 3\r"
expect -re "\[#$\] "

# Статус
send "echo '=== PM2 Status ==='\r"
expect -re "\[#$\] "
send "pm2 status\r"
expect -re "\[#$\] "

# Логи (последние 100 строк)
send "echo '=== Recent Logs ==='\r"
expect -re "\[#$\] "
send "pm2 logs --lines 100 --nostream\r"
expect -re "\[#$\] "

# Проверяем порт 3002
send "echo '=== Checking port 3002 ==='\r"
expect -re "\[#$\] "
send "netstat -tlnp | grep 3002 || ss -tlnp | grep 3002\r"
expect -re "\[#$\] "

send "exit\r"
expect eof

puts "\n=== Build and start completed ==="

