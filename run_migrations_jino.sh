#!/usr/bin/expect -f

set timeout 60

spawn ssh -p 49376 root@53893873b619.vps.myjino.ru

expect {
    "password:" {
        send "jinopass777\r"
    }
}

expect -re "\[#$\] "

send "cd /var/www/upme\r"
expect -re "\[#$\] "

# Показываем миграции
send "echo '=== Available migrations ==='\r"
expect -re "\[#$\] "
send "ls -la backend/src/migrations/*.sql\r"
expect -re "\[#$\] "

# Запускаем миграции
send "echo '=== Running migrations ==='\r"
expect -re "\[#$\] "
send "cd backend && npx tsx src/migrations/run.ts && cd ..\r"
expect -re "\[#$\] "

# Проверяем структуру таблицы vacancies
send "echo '=== Checking vacancies table structure ==='\r"
expect -re "\[#$\] "
send "sqlite3 backend/data/upme.db \"PRAGMA table_info(vacancies);\" 2>&1\r"
expect -re "\[#$\] "

# Перезапускаем PM2
send "echo '=== Restarting PM2 ==='\r"
expect -re "\[#$\] "
send "pm2 restart upme-backend\r"
expect -re "\[#$\] "

send "sleep 3\r"
expect -re "\[#$\] "

# Тестируем API снова
send "echo '=== Testing vacancies API again ==='\r"
expect -re "\[#$\] "
send "curl -s -w '\\nHTTP_CODE: %{http_code}\\n' 'http://localhost:3002/api/vacancies/relevant?page=0' -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiNDBhbGxleUBnbWFpbC5jb20iLCJpYXQiOjE3NjUzMTM3OTgsImV4cCI6MTc2NTkxODU5OH0.D71qBH2Qc2bApvPlqqqpGbc0JLFhNrzhZn45HiuqG3U' 2>&1 | head -30\r"
expect -re "\[#$\] "

send "exit\r"
expect eof

puts "\n=== Migrations completed ==="

