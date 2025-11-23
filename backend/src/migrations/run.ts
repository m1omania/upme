import { readFileSync } from 'fs';
import { join } from 'path';
import db from '../config/database';

const migrationFile = join(__dirname, '001_initial_schema.sql');
const sql = readFileSync(migrationFile, 'utf-8');

console.log('Running database migrations...');

try {
  db.exec(sql);
  console.log('✅ Database migrations completed successfully!');
} catch (error) {
  console.error('❌ Error running migrations:', error);
  process.exit(1);
} finally {
  db.close();
}

