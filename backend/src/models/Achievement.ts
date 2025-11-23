import db from '../config/database';
import type { Achievement, AchievementType } from '../../../shared/types';

export class AchievementModel {
  static create(user_id: number, achievement_type: AchievementType): Achievement {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO achievements (user_id, achievement_type)
      VALUES (?, ?)
    `);
    
    stmt.run(user_id, achievement_type);

    const result = db.prepare(`
      SELECT * FROM achievements 
      WHERE user_id = ? AND achievement_type = ?
    `).get(user_id, achievement_type) as Achievement;

    return result;
  }

  static findByUserId(user_id: number): Achievement[] {
    const stmt = db.prepare('SELECT * FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC');
    return stmt.all(user_id) as Achievement[];
  }

  static hasAchievement(user_id: number, achievement_type: AchievementType): boolean {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM achievements 
      WHERE user_id = ? AND achievement_type = ?
    `);
    const result = stmt.get(user_id, achievement_type) as { count: number };
    return result.count > 0;
  }
}

