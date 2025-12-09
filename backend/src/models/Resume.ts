import db from '../config/database';
import type { Resume } from '../../../shared/types';

export class ResumeModel {
  static create(data: {
    user_id: number;
    hh_resume_id: string;
    title: string;
    experience?: string;
    skills: string[];
  }): Resume {
    const stmt = db.prepare(`
      INSERT INTO resumes (user_id, hh_resume_id, title, experience, skills)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.user_id,
      data.hh_resume_id,
      data.title,
      data.experience || null,
      JSON.stringify(data.skills)
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  static findById(id: number): Resume | null {
    const stmt = db.prepare('SELECT * FROM resumes WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    
    return {
      ...row,
      skills: JSON.parse(row.skills),
    };
  }

  static findByUserId(user_id: number): Resume[] {
    const stmt = db.prepare('SELECT * FROM resumes WHERE user_id = ?');
    const rows = stmt.all(user_id) as any[];
    
    return rows.map(row => ({
      ...row,
      skills: JSON.parse(row.skills),
    }));
  }

  static upsert(data: {
    user_id: number;
    hh_resume_id: string;
    title: string;
    experience?: string;
    skills: string[];
  }): Resume {
    const existing = db.prepare('SELECT id FROM resumes WHERE user_id = ? AND hh_resume_id = ?')
      .get(data.user_id, data.hh_resume_id) as { id: number } | undefined;

    if (existing) {
      const stmt = db.prepare(`
        UPDATE resumes 
        SET title = ?, experience = ?, skills = ?
        WHERE id = ?
      `);
      stmt.run(
        data.title,
        data.experience || null,
        JSON.stringify(data.skills),
        existing.id
      );
      return this.findById(existing.id)!;
    }

    return this.create(data);
  }

  static delete(id: number): void {
    const stmt = db.prepare('DELETE FROM resumes WHERE id = ?');
    stmt.run(id);
  }
}

