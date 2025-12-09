import { readFileSync } from 'fs';
import { join } from 'path';
import db from '../config/database';

const migrations = [
  '001_initial_schema.sql',
  '002_add_logo_url.sql',
  '003_add_balance.sql',
];

console.log('Running database migrations...');

try {
  for (const migrationFile of migrations) {
    const migrationPath = join(__dirname, migrationFile);
    try {
      const sql = readFileSync(migrationPath, 'utf-8');
      db.exec(sql);
      console.log(`✅ Migration ${migrationFile} completed`);
    } catch (error: any) {
      // Игнорируем ошибки "duplicate column" для миграций, которые уже выполнены
      if (error.message && error.message.includes('duplicate column')) {
        console.log(`⚠️  Migration ${migrationFile} already applied, skipping`);
      } else {
        throw error;
      }
    }
  }
  console.log('✅ All database migrations completed successfully!');
} catch (error) {
  console.error('❌ Error running migrations:', error);
  process.exit(1);
} finally {
  db.close();
}

