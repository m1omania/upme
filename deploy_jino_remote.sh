#!/usr/bin/expect -f

set timeout 60

# Подключение к серверу
spawn ssh -p 49376 root@53893873b619.vps.myjino.ru

# Обработка первого подключения (добавление в known_hosts)
expect {
    "Are you sure you want to continue connecting" {
        send "yes\r"
        exp_continue
    }
    "password:" {
        send "jinopass777\r"
    }
    timeout {
        puts "\nTimeout waiting for password prompt"
        exit 1
    }
}

# Ожидаем приглашение командной строки
expect {
    "# " {
        puts "\n=== Successfully connected ==="
    }
    "$ " {
        puts "\n=== Successfully connected ==="
    }
    timeout {
        puts "\nTimeout waiting for shell prompt"
        exit 1
    }
}

# Переход в директорию проекта
send "cd /var/www/upme\r"
expect -re "\[#$\] "

# Показываем текущую директорию
send "pwd\r"
expect -re "\[#$\] "

# Git pull
send "echo '=== Git pull ==='\r"
expect -re "\[#$\] "
send "git pull origin main 2>&1 || echo 'Git pull failed'\r"
expect -re "\[#$\] "

# Применяем миграции
send "echo '=== Running migrations ==='\r"
expect -re "\[#$\] "
send "cd backend && npm run migrate && cd ..\r"
expect -re "\[#$\] "

# Проверяем PM2 статус
send "echo '=== PM2 status before restart ==='\r"
expect -re "\[#$\] "
send "pm2 status\r"
expect -re "\[#$\] "

# Перезапускаем PM2
send "echo '=== Restarting PM2 ==='\r"
expect -re "\[#$\] "
send "pm2 restart all\r"
expect -re "\[#$\] "

# Проверяем статус после перезапуска
send "echo '=== PM2 status after restart ==='\r"
expect -re "\[#$\] "
send "pm2 status\r"
expect -re "\[#$\] "

# Показываем логи
send "echo '=== Recent logs ==='\r"
expect -re "\[#$\] "
send "pm2 logs --lines 30 --nostream\r"
expect -re "\[#$\] "

# Выход
send "exit\r"
expect eof

puts "\n=== Deployment completed ==="

