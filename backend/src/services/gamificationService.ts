import { UserStatsModel } from '../models/UserStats';
import { UserActionModel } from '../models/UserAction';
import { AchievementModel } from '../models/Achievement';
import { ApplicationModel } from '../models/Application';
import { XP_VALUES, XP_PER_LEVEL } from '../../../shared/types';
import type { AchievementType, ActionType } from '../../../shared/types';
import logger from '../config/logger';

export class GamificationService {
  /**
   * Начисляет XP за действие
   */
  static async awardXP(
    userId: number,
    actionType: ActionType,
    xpAmount: number
  ): Promise<{ totalXP: number; level: number; leveledUp: boolean }> {
    const statsBefore = UserStatsModel.getOrCreate(userId);
    const oldLevel = statsBefore.level;

    // Начисляем XP
    const statsAfter = UserStatsModel.addXP(userId, xpAmount);

    // Записываем действие
    UserActionModel.create({
      user_id: userId,
      action_type: actionType,
      xp_awarded: xpAmount,
    });

    const newLevel = statsAfter.level;
    const leveledUp = newLevel > oldLevel;

    if (leveledUp) {
      logger.info(`User ${userId} leveled up to level ${newLevel}`);
    }

    return {
      totalXP: statsAfter.total_xp,
      level: statsAfter.level,
      leveledUp,
    };
  }

  /**
   * Начисляет XP за отклик
   */
  static async awardApplicationXP(userId: number): Promise<void> {
    await this.awardXP(userId, 'swipe_right', XP_VALUES.APPLICATION);
    UserStatsModel.incrementApplications(userId);
    
    // Проверяем достижения
    await this.checkAchievements(userId);
  }

  /**
   * Начисляет XP за просмотр резюме
   */
  static async awardViewXP(userId: number): Promise<void> {
    await this.awardXP(userId, 'view', XP_VALUES.VIEW);
    UserStatsModel.incrementViews(userId);
  }

  /**
   * Начисляет XP за отказ
   */
  static async awardRejectionXP(userId: number): Promise<void> {
    await this.awardXP(userId, 'view', XP_VALUES.REJECTION);
  }

  /**
   * Начисляет XP за интервью
   */
  static async awardInterviewXP(userId: number): Promise<void> {
    await this.awardXP(userId, 'view', XP_VALUES.INTERVIEW);
    UserStatsModel.incrementInterviews(userId);
    
    // Проверяем достижение "Первое интервью"
    if (!AchievementModel.hasAchievement(userId, 'first_interview')) {
      AchievementModel.create(userId, 'first_interview');
    }
  }

  /**
   * Обновляет стрик пользователя
   */
  static async updateStreak(userId: number): Promise<number> {
    const lastActionDate = UserActionModel.getLastActionDate(userId);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const stats = UserStatsModel.getOrCreate(userId);
    let newStreak = stats.current_streak;

    if (lastActionDate === today) {
      // Уже была активность сегодня, стрик не меняется
      return stats.current_streak;
    } else if (lastActionDate === yesterday) {
      // Была активность вчера, увеличиваем стрик
      newStreak = stats.current_streak + 1;
    } else if (lastActionDate && lastActionDate < yesterday) {
      // Пропустили день, сбрасываем стрик
      newStreak = 1;
    } else {
      // Первая активность
      newStreak = 1;
    }

    UserStatsModel.updateStreak(userId, newStreak);

    // Проверяем достижения по стрикам
    if (newStreak === 7 && !AchievementModel.hasAchievement(userId, 'week_streak')) {
      AchievementModel.create(userId, 'week_streak');
    }
    if (newStreak === 30 && !AchievementModel.hasAchievement(userId, 'month_streak')) {
      AchievementModel.create(userId, 'month_streak');
    }

    return newStreak;
  }

  /**
   * Проверяет и разблокирует достижения
   */
  static async checkAchievements(userId: number): Promise<AchievementType[]> {
    const unlocked: AchievementType[] = [];
    const stats = UserStatsModel.getOrCreate(userId);
    const applications = ApplicationModel.getStatsByUserId(userId);

    // Первый отклик
    if (applications.total === 1 && !AchievementModel.hasAchievement(userId, 'first_application')) {
      AchievementModel.create(userId, 'first_application');
      unlocked.push('first_application');
    }

    // Активный пользователь (10 откликов)
    if (applications.total >= 10 && !AchievementModel.hasAchievement(userId, 'active_user')) {
      AchievementModel.create(userId, 'active_user');
      unlocked.push('active_user');
    }

    // Мастер откликов (100 откликов)
    if (applications.total >= 100 && !AchievementModel.hasAchievement(userId, 'master_applicant')) {
      AchievementModel.create(userId, 'master_applicant');
      unlocked.push('master_applicant');
    }

    return unlocked;
  }

  /**
   * Получает статистику геймификации для пользователя
   */
  static getStats(userId: number) {
    const stats = UserStatsModel.getOrCreate(userId);
    const achievements = AchievementModel.findByUserId(userId);
    const applications = ApplicationModel.getStatsByUserId(userId);

    const xpForNextLevel = stats.level * XP_PER_LEVEL;
    const xpProgress = stats.total_xp % XP_PER_LEVEL;
    const xpProgressPercent = (xpProgress / XP_PER_LEVEL) * 100;

    return {
      totalXP: stats.total_xp,
      level: stats.level,
      xpProgress,
      xpForNextLevel,
      xpProgressPercent,
      currentStreak: stats.current_streak,
      longestStreak: stats.longest_streak,
      totalApplications: stats.total_applications,
      totalViews: stats.total_views,
      totalInterviews: stats.total_interviews,
      achievements,
      applicationStats: applications,
    };
  }

  /**
   * Рассчитывает прогноз успеха на основе статистики
   */
  static calculateSuccessForecast(userId: number): {
    successRate: number;
    forecast: string;
  } {
    const stats = UserStatsModel.getOrCreate(userId);
    const applications = ApplicationModel.getStatsByUserId(userId);

    if (applications.total === 0) {
      return {
        successRate: 0,
        forecast: 'Начните отправлять отклики, чтобы увидеть прогноз',
      };
    }

    const viewRate = (applications.viewed / applications.total) * 100;
    const interviewRate = (applications.interviews / applications.total) * 100;
    const successRate = (viewRate + interviewRate * 2) / 3; // Взвешенная оценка

    let forecast = '';
    if (successRate >= 50) {
      forecast = 'Отличные показатели! Продолжайте в том же духе.';
    } else if (successRate >= 30) {
      forecast = 'Хорошие результаты. Попробуйте улучшить сопроводительные письма.';
    } else if (successRate >= 15) {
      forecast = 'Есть потенциал для роста. Работайте над резюме и письмами.';
    } else {
      forecast = 'Продолжайте работать над улучшением профиля и откликов.';
    }

    return {
      successRate: Math.round(successRate),
      forecast,
    };
  }
}

