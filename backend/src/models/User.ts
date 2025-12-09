import db from '../config/database';
import type { User } from '../../../shared/types';

export class UserModel {
  static create(data: {
    hh_user_id: string;
    email: string;
    access_token: string;
    refresh_token: string;
  }): User {
    const stmt = db.prepare(`
      INSERT INTO users (hh_user_id, email, access_token, refresh_token, balance)
      VALUES (?, ?, ?, ?, 10)
    `);
    
    const result = stmt.run(
      data.hh_user_id,
      data.email,
      data.access_token,
      data.refresh_token
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  static findById(id: number): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | null;
  }

  static findByHhUserId(hh_user_id: string): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE hh_user_id = ?');
    return stmt.get(hh_user_id) as User | null;
  }

  static updateTokens(id: number, access_token: string, refresh_token: string): void {
    const stmt = db.prepare(`
      UPDATE users 
      SET access_token = ?, refresh_token = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(access_token, refresh_token, id);
  }

  static updateAccessToken(id: number, access_token: string): void {
    const stmt = db.prepare(`
      UPDATE users 
      SET access_token = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(access_token, id);
  }

  static getBalance(id: number): number {
    const user = this.findById(id);
    return user?.balance ?? 10;
  }

  static deductBalance(id: number, amount: number): boolean {
    const user = this.findById(id);
    if (!user) return false;
    
    if (user.balance < amount) {
      return false;
    }
    
    const stmt = db.prepare(`
      UPDATE users 
      SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(amount, id);
    return true;
  }

  static addBalance(id: number, amount: number): void {
    const stmt = db.prepare(`
      UPDATE users 
      SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(amount, id);
  }
}

