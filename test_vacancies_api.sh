#!/usr/bin/expect -f

set timeout 30

spawn ssh -p 49376 root@53893873b619.vps.myjino.ru

expect {
    "password:" {
        send "jinopass777\r"
    }
}

expect -re "\[#$\] "

send "cd /var/www/upme\r"
expect -re "\[#$\] "

# Тест API vacancies с JWT токеном
send "echo '=== Testing vacancies API with auth ==='\r"
expect -re "\[#$\] "

# Получаем токен из БД (user_id=1)
send "sqlite3 backend/data/upme.db \"SELECT access_token FROM users WHERE id=1 LIMIT 1;\"\r"
expect -re "\[#$\] "

send "exit\r"
expect eof

puts "\n=== Test completed ==="

