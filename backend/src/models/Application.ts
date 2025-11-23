import db from '../config/database';
import type { Application, ApplicationStatus } from '../../../shared/types';

export class ApplicationModel {
  static create(data: {
    user_id: number;
    vacancy_id: number;
    cover_letter: string;
    status?: ApplicationStatus;
    xp_awarded?: number;
  }): Application {
    const stmt = db.prepare(`
      INSERT INTO applications (user_id, vacancy_id, cover_letter, status, xp_awarded)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.user_id,
      data.vacancy_id,
      data.cover_letter,
      data.status || 'pending',
      data.xp_awarded || 0
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  static findById(id: number): Application | null {
    const stmt = db.prepare('SELECT * FROM applications WHERE id = ?');
    return stmt.get(id) as Application | null;
  }

  static findByUserId(user_id: number, limit: number = 50, offset: number = 0): Application[] {
    const stmt = db.prepare(`
      SELECT * FROM applications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    return stmt.all(user_id, limit, offset) as Application[];
  }

  static updateStatus(id: number, status: ApplicationStatus): void {
    const stmt = db.prepare(`
      UPDATE applications 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(status, id);
  }

  static getStatsByUserId(user_id: number): {
    total: number;
    pending: number;
    viewed: number;
    rejected: number;
    interviews: number;
  } {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'viewed' THEN 1 ELSE 0 END) as viewed,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'interview' THEN 1 ELSE 0 END) as interviews
      FROM applications
      WHERE user_id = ?
    `);
    return stmt.get(user_id) as any;
  }
}

