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

# Проверяем статус PM2
send "echo '=== PM2 Status ==='\r"
expect -re "\[#$\] "
send "pm2 status\r"
expect -re "\[#$\] "

# Следим за логами в реальном времени на несколько секунд
send "echo '=== Real-time logs (waiting 3 seconds) ==='\r"
expect -re "\[#$\] "
send "timeout 3 pm2 logs upme-backend --lines 0 || true\r"
expect -re "\[#$\] "

# Проверяем последние логи Winston
send "echo '=== Backend logs directory ==='\r"
expect -re "\[#$\] "
send "ls -la backend/logs/ 2>&1 || mkdir -p backend/logs && echo 'Created logs directory'\r"
expect -re "\[#$\] "

send "echo '=== Testing vacancies endpoint directly ==='\r"
expect -re "\[#$\] "
send "curl -s -w '\\nHTTP_CODE: %{http_code}\\n' 'http://localhost:3002/api/vacancies/relevant?page=0' -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiNDBhbGxleUBnbWFpbC5jb20iLCJpYXQiOjE3NjUzMTM3OTgsImV4cCI6MTc2NTkxODU5OH0.D71qBH2Qc2bApvPlqqqpGbc0JLFhNrzhZn45HiuqG3U' 2>&1 | head -50\r"
expect -re "\[#$\] "

send "exit\r"
expect eof

puts "\n=== Check completed ==="

