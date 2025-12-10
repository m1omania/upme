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

# Проверяем баланс в БД
send "echo '=== Checking user balance in DB ==='\r"
expect -re "\[#$\] "
send "sqlite3 backend/data/upme.db \"SELECT id, email, balance FROM users;\" 2>&1\r"
expect -re "\[#$\] "

# Проверяем структуру таблицы users
send "echo '=== Users table structure ==='\r"
expect -re "\[#$\] "
send "sqlite3 backend/data/upme.db \"PRAGMA table_info(users);\" 2>&1\r"
expect -re "\[#$\] "

# Тестируем API баланса
send "echo '=== Testing balance API ==='\r"
expect -re "\[#$\] "
send "curl -s 'http://localhost:3002/api/user/balance' -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiNDBhbGxleUBnbWFpbC5jb20iLCJpYXQiOjE3NjUzMTM3OTgsImV4cCI6MTc2NTkxODU5OH0.D71qBH2Qc2bApvPlqqqpGbc0JLFhNrzhZn45HiuqG3U' 2>&1\r"
expect -re "\[#$\] "

# Проверяем PM2 логи для ошибок баланса
send "echo '=== Recent PM2 logs ==='\r"
expect -re "\[#$\] "
send "pm2 logs upme-backend --lines 20 --nostream 2>&1 | grep -i balance || echo 'No balance-related logs'\r"
expect -re "\[#$\] "

send "exit\r"
expect eof

puts "\n=== Balance check completed ==="

