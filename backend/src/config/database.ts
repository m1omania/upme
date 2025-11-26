import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || './data/upme.db';
const dbDir = path.dirname(dbPath);

// Создаем директорию для БД, если её нет
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db: Database.Database = new Database(dbPath);

// Включаем foreign keys
db.pragma('foreign_keys = ON');

// Включаем журналирование для лучшей производительности
db.pragma('journal_mode = WAL');

export default db;

