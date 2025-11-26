#!/bin/bash
# Скрипт для подключения к серверу и выполнения команд

SSH_HOST="53893873b619.vps.myjino.ru"
SSH_PORT="49376"
SSH_USER="root"
SSH_PASS="jinopass777"

# Команды для выполнения на сервере
COMMANDS="
echo '=== Структура /var/www ==='
ls -la /var/www 2>/dev/null || echo 'Directory /var/www does not exist'
echo ''
echo '=== Структура /home ==='
ls -la /home 2>/dev/null || echo 'Directory /home does not exist'
echo ''
echo '=== Используемые порты ==='
netstat -tlnp 2>/dev/null | grep LISTEN | head -10 || ss -tlnp 2>/dev/null | grep LISTEN | head -10
echo ''
echo '=== PM2 процессы ==='
pm2 list 2>/dev/null || echo 'PM2 not found or no processes'
echo ''
echo '=== Node.js версия ==='
node --version 2>/dev/null || echo 'Node.js not found'
echo ''
echo '=== Nginx статус ==='
systemctl status nginx 2>/dev/null | head -5 || echo 'Nginx not found'
"

# Попытка подключения через expect
expect << EOF
spawn ssh -p $SSH_PORT $SSH_USER@$SSH_HOST
expect {
    "password:" {
        send "$SSH_PASS\r"
        exp_continue
    }
    "yes/no" {
        send "yes\r"
        exp_continue
    }
    "$ " {
        send "$COMMANDS\r"
        expect "$ "
        send "exit\r"
    }
    "# " {
        send "$COMMANDS\r"
        expect "# "
        send "exit\r"
    }
    timeout {
        puts "Connection timeout"
        exit 1
    }
}
expect eof
EOF

