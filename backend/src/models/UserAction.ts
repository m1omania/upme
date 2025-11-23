import db from '../config/database';
import type { UserAction, ActionType } from '../../../shared/types';

export class UserActionModel {
  static create(data: {
    user_id: number;
    action_type: ActionType;
    xp_awarded: number;
  }): UserAction {
    const stmt = db.prepare(`
      INSERT INTO user_actions (user_id, action_type, xp_awarded)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(data.user_id, data.action_type, data.xp_awarded);
    return this.findById(result.lastInsertRowid as number)!;
  }

  static findById(id: number): UserAction | null {
    const stmt = db.prepare('SELECT * FROM user_actions WHERE id = ?');
    return stmt.get(id) as UserAction | null;
  }

  static findByUserId(user_id: number, limit: number = 100): UserAction[] {
    const stmt = db.prepare(`
      SELECT * FROM user_actions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(user_id, limit) as UserAction[];
  }

  static getLastActionDate(user_id: number): string | null {
    const stmt = db.prepare(`
      SELECT DATE(created_at) as date
      FROM user_actions
      WHERE user_id = ? AND action_type IN ('swipe_right', 'view')
      ORDER BY created_at DESC
      LIMIT 1
    `);
    const result = stmt.get(user_id) as { date: string } | null;
    return result?.date || null;
  }
}

