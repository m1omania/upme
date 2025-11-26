module.exports = {
  apps: [{
    name: 'upme-backend',
    script: './backend/dist/index.js',
    cwd: process.cwd(),
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    error_file: './logs/backend-error.log',
    out_file: './logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    // Автоматический перезапуск при сбоях
    min_uptime: '10s',
    max_restarts: 10
  }]
};

