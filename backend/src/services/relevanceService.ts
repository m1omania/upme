import type { Vacancy, Resume } from '../../../shared/types';
import type { VacancyRelevance } from '../../../shared/types';

export class RelevanceService {
  /**
   * Рассчитывает релевантность вакансии для резюме пользователя
   */
  static calculateRelevance(vacancy: Vacancy, resume: Resume): VacancyRelevance {
    let score = 0;
    const reasons: string[] = [];

    // Сравнение навыков (0-40 баллов)
    const vacancySkills = (vacancy.requirements || []).filter(r => r).map(r => r.toLowerCase());
    const resumeSkills = (resume.skills || []).filter(s => s).map(s => s.toLowerCase());
    
    const matchingSkills = vacancySkills.filter(vs => 
      resumeSkills.some(rs => rs.includes(vs) || vs.includes(rs))
    );
    
    const skillMatchRatio = matchingSkills.length / Math.max(vacancySkills.length, 1);
    const skillScore = Math.round(skillMatchRatio * 40);
    score += skillScore;
    
    if (skillScore > 20) {
      reasons.push(`Совпадение навыков: ${matchingSkills.length} из ${vacancySkills.length}`);
    }

    // Опыт работы (0-30 баллов)
    const experienceMatch = this.matchExperience(vacancy.description, resume.experience);
    score += experienceMatch.score;
    if (experienceMatch.reason) {
      reasons.push(experienceMatch.reason);
    }

    // Соответствие названия вакансии и резюме (0-20 баллов)
    const titleMatch = this.matchTitle(vacancy.title, resume.title);
    score += titleMatch.score;
    if (titleMatch.reason) {
      reasons.push(titleMatch.reason);
    }

    // Дополнительные факторы (0-10 баллов)
    const additionalScore = this.calculateAdditionalFactors(vacancy, resume);
    score += additionalScore.score;
    if (additionalScore.reason) {
      reasons.push(additionalScore.reason);
    }

    // Нормализуем до 0-100
    score = Math.min(100, Math.max(0, score));

    return {
      vacancy_id: vacancy.hh_vacancy_id,
      relevance_score: score,
      reasons: reasons.length > 0 ? reasons : ['Базовая релевантность'],
    };
  }

  private static matchExperience(vacancyDesc: string | null, resumeExp: string | null): { score: number; reason?: string } {
    // Проверяем на null/undefined
    if (!vacancyDesc || !resumeExp) {
      return { score: 15, reason: 'Недостаточно данных для сравнения опыта' };
    }
    
    const desc = vacancyDesc.toLowerCase();
    const exp = resumeExp.toLowerCase();

    // Ключевые слова опыта
    const experienceKeywords = ['опыт', 'работал', 'работала', 'разработка', 'проект'];
    const hasExperienceKeywords = experienceKeywords.some(kw => desc.includes(kw));

    if (!hasExperienceKeywords) {
      return { score: 15, reason: 'Требования к опыту не указаны' };
    }

    // Простое сравнение - если в резюме есть упоминания технологий из описания
    const techMatch = this.extractTechnologies(vacancyDesc).filter(tech => 
      exp.includes(tech.toLowerCase())
    );

    if (techMatch.length > 0) {
      return { 
        score: 30, 
        reason: `Опыт работы с технологиями: ${techMatch.join(', ')}` 
      };
    }

    return { score: 10, reason: 'Частичное соответствие опыту' };
  }

  private static matchTitle(vacancyTitle: string | null, resumeTitle: string | null): { score: number; reason?: string } {
    // Проверяем на null/undefined
    if (!vacancyTitle || !resumeTitle) {
      return { score: 0 };
    }
    
    const vTitle = vacancyTitle.toLowerCase();
    const rTitle = resumeTitle.toLowerCase();

    // Ключевые слова должностей
    const commonRoles = ['разработчик', 'developer', 'программист', 'инженер', 'engineer'];
    const vacancyRole = commonRoles.find(role => vTitle.includes(role));
    const resumeRole = commonRoles.find(role => rTitle.includes(role));

    if (vacancyRole && resumeRole && vacancyRole === resumeRole) {
      return { score: 20, reason: 'Совпадение роли' };
    }

    // Частичное совпадение
    const words = vTitle.split(/\s+/);
    const matchingWords = words.filter(w => rTitle.includes(w) && w.length > 3);
    
    if (matchingWords.length > 0) {
      return { score: 10, reason: 'Частичное совпадение специализации' };
    }

    return { score: 0 };
  }

  private static calculateAdditionalFactors(
    vacancy: Vacancy,
    resume: Resume
  ): { score: number; reason?: string } {
    let score = 0;
    const reasons: string[] = [];

    // Зарплата (если указана, это плюс)
    if (vacancy.salary) {
      score += 3;
      reasons.push('Указана зарплата');
    }

    // Детальное описание вакансии
    if (vacancy.description.length > 500) {
      score += 2;
      reasons.push('Детальное описание вакансии');
    }

    return {
      score: Math.min(10, score),
      reason: reasons.length > 0 ? reasons.join(', ') : undefined,
    };
  }

  private static extractTechnologies(text: string): string[] {
    const commonTechs = [
      'javascript', 'typescript', 'react', 'vue', 'angular',
      'node.js', 'python', 'java', 'c#', 'php', 'go', 'rust',
      'sql', 'mongodb', 'postgresql', 'redis',
      'docker', 'kubernetes', 'aws', 'git',
    ];

    const textLower = text.toLowerCase();
    return commonTechs.filter(tech => textLower.includes(tech));
  }
}

