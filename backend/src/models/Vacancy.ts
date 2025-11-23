import db from '../config/database';
import type { Vacancy } from '../../../shared/types';

export class VacancyModel {
  static create(data: {
    hh_vacancy_id: string;
    title: string;
    company: string;
    salary?: string | null;
    description: string;
    requirements: string[];
  }): Vacancy {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO vacancies (hh_vacancy_id, title, company, salary, description, requirements, cached_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(
      data.hh_vacancy_id,
      data.title,
      data.company,
      data.salary || null,
      data.description,
      JSON.stringify(data.requirements)
    );

    return this.findByHhVacancyId(data.hh_vacancy_id)!;
  }

  static findById(id: number): Vacancy | null {
    const stmt = db.prepare('SELECT * FROM vacancies WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    
    return {
      ...row,
      requirements: JSON.parse(row.requirements),
    };
  }

  static findByHhVacancyId(hh_vacancy_id: string): Vacancy | null {
    const stmt = db.prepare('SELECT * FROM vacancies WHERE hh_vacancy_id = ?');
    const row = stmt.get(hh_vacancy_id) as any;
    if (!row) return null;
    
    return {
      ...row,
      requirements: JSON.parse(row.requirements),
    };
  }

  static findMany(limit: number = 100, offset: number = 0): Vacancy[] {
    const stmt = db.prepare('SELECT * FROM vacancies ORDER BY cached_at DESC LIMIT ? OFFSET ?');
    const rows = stmt.all(limit, offset) as any[];
    
    return rows.map(row => ({
      ...row,
      requirements: JSON.parse(row.requirements),
    }));
  }

  static bulkCreate(vacancies: Array<{
    hh_vacancy_id: string;
    title: string;
    company: string;
    salary?: string | null;
    description: string;
    requirements: string[];
  }>): void {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO vacancies (hh_vacancy_id, title, company, salary, description, requirements, cached_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const insertMany = db.transaction((vacancies) => {
      for (const vacancy of vacancies) {
        stmt.run(
          vacancy.hh_vacancy_id,
          vacancy.title,
          vacancy.company,
          vacancy.salary || null,
          vacancy.description,
          JSON.stringify(vacancy.requirements)
        );
      }
    });

    insertMany(vacancies);
  }
}

