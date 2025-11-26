export interface User {
    id: number;
    hh_user_id: string;
    email: string;
    access_token: string;
    refresh_token: string;
    created_at: string;
    updated_at: string;
}
export interface Resume {
    id: number;
    user_id: number;
    hh_resume_id: string;
    title: string;
    experience: string;
    skills: string[];
    created_at: string;
}
export interface Vacancy {
    id: number;
    hh_vacancy_id: string;
    title: string;
    company: string;
    salary: string | null;
    description: string;
    requirements: string[];
    cached_at: string;
}
export interface VacancyRelevance {
    vacancy_id: string;
    relevance_score: number;
    reasons: string[];
}
export type ApplicationStatus = 'pending' | 'viewed' | 'rejected' | 'interview';
export interface Application {
    id: number;
    user_id: number;
    vacancy_id: number;
    cover_letter: string;
    status: ApplicationStatus;
    xp_awarded: number;
    created_at: string;
    updated_at: string;
}
export interface UserStats {
    id: number;
    user_id: number;
    total_xp: number;
    current_streak: number;
    longest_streak: number;
    total_applications: number;
    total_views: number;
    total_interviews: number;
    level: number;
    updated_at: string;
}
export type AchievementType = 'first_application' | 'active_user' | 'week_streak' | 'month_streak' | 'first_interview' | 'master_applicant';
export interface Achievement {
    id: number;
    user_id: number;
    achievement_type: AchievementType;
    unlocked_at: string;
}
export type ActionType = 'swipe_left' | 'swipe_right' | 'view' | 'generate_letter';
export interface UserAction {
    id: number;
    user_id: number;
    action_type: ActionType;
    xp_awarded: number;
    created_at: string;
}
export interface Filters {
    id: number;
    user_id: number;
    salary_min: number | null;
    salary_max: number | null;
    experience_level: string | null;
    location: string | null;
    skills: string[];
    updated_at: string;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export declare const XP_VALUES: {
    readonly APPLICATION: 10;
    readonly VIEW: 50;
    readonly REJECTION: 5;
    readonly INTERVIEW: 100;
};
export declare const XP_PER_LEVEL = 500;
//# sourceMappingURL=index.d.ts.map