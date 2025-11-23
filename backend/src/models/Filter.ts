import db from '../config/database';
import type { Filters } from '../../../shared/types';

export class FilterModel {
  static create(data: {
    user_id: number;
    salary_min?: number | null;
    salary_max?: number | null;
    experience_level?: string | null;
    location?: string | null;
    skills?: string[];
  }): Filters {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO filters (user_id, salary_min, salary_max, experience_level, location, skills, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(
      data.user_id,
      data.salary_min || null,
      data.salary_max || null,
      data.experience_level || null,
      data.location || null,
      JSON.stringify(data.skills || [])
    );

    return this.findByUserId(data.user_id)!;
  }

  static findByUserId(user_id: number): Filters | null {
    const stmt = db.prepare('SELECT * FROM filters WHERE user_id = ?');
    const row = stmt.get(user_id) as any;
    if (!row) return null;
    
    return {
      ...row,
      skills: JSON.parse(row.skills),
    };
  }

  static getOrCreate(user_id: number): Filters {
    let filters = this.findByUserId(user_id);
    if (!filters) {
      filters = this.create({ user_id });
    }
    return filters;
  }
}

