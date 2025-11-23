import db from '../config/database';
import type { UserStats } from '../../../shared/types';
import { XP_PER_LEVEL } from '../../../shared/types';

export class UserStatsModel {
  static create(user_id: number): UserStats {
    const stmt = db.prepare(`
      INSERT INTO user_stats (user_id)
      VALUES (?)
    `);
    
    const result = stmt.run(user_id);
    return this.findByUserId(user_id)!;
  }

  static findByUserId(user_id: number): UserStats | null {
    const stmt = db.prepare('SELECT * FROM user_stats WHERE user_id = ?');
    return stmt.get(user_id) as UserStats | null;
  }

  static getOrCreate(user_id: number): UserStats {
    let stats = this.findByUserId(user_id);
    if (!stats) {
      stats = this.create(user_id);
    }
    return stats;
  }

  static addXP(user_id: number, xp: number): UserStats {
    const stats = this.getOrCreate(user_id);
    const newTotalXP = stats.total_xp + xp;
    const newLevel = Math.floor(newTotalXP / XP_PER_LEVEL) + 1;

    const stmt = db.prepare(`
      UPDATE user_stats 
      SET total_xp = ?, level = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);
    stmt.run(newTotalXP, newLevel, user_id);

    return this.findByUserId(user_id)!;
  }

  static incrementApplications(user_id: number): void {
    const stats = this.getOrCreate(user_id);
    const stmt = db.prepare(`
      UPDATE user_stats 
      SET total_applications = total_applications + 1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);
    stmt.run(user_id);
  }

  static incrementViews(user_id: number): void {
    const stats = this.getOrCreate(user_id);
    const stmt = db.prepare(`
      UPDATE user_stats 
      SET total_views = total_views + 1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);
    stmt.run(user_id);
  }

  static incrementInterviews(user_id: number): void {
    const stats = this.getOrCreate(user_id);
    const stmt = db.prepare(`
      UPDATE user_stats 
      SET total_interviews = total_interviews + 1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);
    stmt.run(user_id);
  }

  static updateStreak(user_id: number, newStreak: number): void {
    const stats = this.getOrCreate(user_id);
    const longestStreak = Math.max(stats.longest_streak, newStreak);

    const stmt = db.prepare(`
      UPDATE user_stats 
      SET current_streak = ?, longest_streak = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);
    stmt.run(newStreak, longestStreak, user_id);
  }
}

