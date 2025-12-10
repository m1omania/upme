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

# PM2 логи
send "echo '=== PM2 Logs (last 100 lines) ==='\r"
expect -re "\[#$\] "
send "pm2 logs upme-backend --lines 100 --nostream 2>&1 | tail -50\r"
expect -re "\[#$\] "

# Backend error logs
send "echo '=== Backend Error Logs ==='\r"
expect -re "\[#$\] "
send "tail -50 backend/logs/error.log 2>&1\r"
expect -re "\[#$\] "

# Backend combined logs
send "echo '=== Backend Combined Logs (last 30 lines) ==='\r"
expect -re "\[#$\] "
send "tail -30 backend/logs/combined.log 2>&1\r"
expect -re "\[#$\] "

send "exit\r"
expect eof

puts "\n=== Logs check completed ==="

