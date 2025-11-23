import { Badge } from '@/components/ui/badge';
import type { AchievementType } from '../../../shared/types';

interface AchievementBadgeProps {
  type: AchievementType;
  unlockedAt?: string;
}

const achievementLabels: Record<AchievementType, string> = {
  first_application: 'Первый отклик',
  active_user: 'Активный пользователь',
  week_streak: 'Неделя силы',
  month_streak: 'Месяц силы',
  first_interview: 'Первое интервью',
  master_applicant: 'Мастер откликов',
};

export default function AchievementBadge({ type, unlockedAt }: AchievementBadgeProps) {
  return (
    <Badge variant="outline" className="text-sm">
      {achievementLabels[type] || type}
    </Badge>
  );
}
