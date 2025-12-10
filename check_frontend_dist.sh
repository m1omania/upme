#!/usr/bin/expect -f

set timeout 20

spawn ssh -p 49376 root@53893873b619.vps.myjino.ru

expect {
    "password:" {
        send "jinopass777\r"
    }
}

expect -re "\[#$\] "

send "cd /var/www/upme\r"
expect -re "\[#$\] "

# Проверяем dist фронтенда
send "echo '=== Frontend dist ==='\r"
expect -re "\[#$\] "
send "ls -lh frontend/dist/assets/ 2>&1\r"
expect -re "\[#$\] "

# Проверяем дату последней сборки
send "echo '=== Last build time ==='\r"
expect -re "\[#$\] "
send "stat -c '%y' frontend/dist/index.html 2>&1 || stat -f '%Sm' frontend/dist/index.html 2>&1\r"
expect -re "\[#$\] "

# Проверяем, что Navigation с балансом включен
send "echo '=== Checking Navigation in bundle ==='\r"
expect -re "\[#$\] "
send "grep -o 'user-balance' frontend/dist/assets/*.js 2>&1 | head -5\r"
expect -re "\[#$\] "

send "exit\r"
expect eof

puts "\n=== Check completed ==="

