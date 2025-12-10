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

# Пересобираем фронтенд
send "echo '=== Rebuilding frontend ==='\r"
expect -re "\[#$\] "
send "cd frontend && rm -rf dist && npm run build && cd ..\r"
expect -re "\[#$\] "

# Проверяем что dist создан
send "echo '=== Checking frontend dist ==='\r"
expect -re "\[#$\] "
send "ls -la frontend/dist/ | head -20\r"
expect -re "\[#$\] "

# Перезагружаем Nginx (если нужно)
send "echo '=== Reloading Nginx ==='\r"
expect -re "\[#$\] "
send "nginx -t && systemctl reload nginx || echo 'Nginx reload failed'\r"
expect -re "\[#$\] "

send "exit\r"
expect eof

puts "\n=== Frontend rebuild completed ==="

