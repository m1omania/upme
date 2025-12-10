#!/usr/bin/expect -f

set timeout 180

spawn ssh -p 49376 root@53893873b619.vps.myjino.ru

expect {
    "password:" {
        send "jinopass777\r"
    }
}

expect -re "\[#$\] "

send "cd /var/www/upme/frontend\r"
expect -re "\[#$\] "

# Собираем без TypeScript проверки
send "echo '=== Building frontend (skip TypeScript check) ==='\r"
expect -re "\[#$\] "
send "rm -rf dist && npx vite build\r"
expect -re "\[#$\] "

# Проверяем что dist создан
send "echo '=== Checking dist ==='\r"
expect -re "\[#$\] "
send "ls -la dist/ | head -10\r"
expect -re "\[#$\] "

send "cd ..\r"
expect -re "\[#$\] "

send "exit\r"
expect eof

puts "\n=== Build completed ==="

