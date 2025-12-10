import { useQuery } from '@tanstack/react-query';
import { gamificationApi, applicationsApi } from '../services/api';
import { Container } from '@/components/ui/container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import XPBar from '../components/XPBar';
import StreakCounter from '../components/StreakCounter';
import AchievementBadge from '../components/AchievementBadge';
import StatsChart from '../components/StatsChart';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { data: gamificationStats, isLoading: statsLoading } = useQuery({
    queryKey: ['gamification-stats'],
    queryFn: async () => {
      const response = await gamificationApi.getStats();
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    },
  });

  const { data: applicationStats, isLoading: appsLoading } = useQuery({
    queryKey: ['application-stats'],
    queryFn: async () => {
      const response = await applicationsApi.getStats();
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    },
  });

  if (statsLoading || appsLoading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Container>
    );
  }

  if (!gamificationStats) {
    return (
      <Container>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Загрузка статистики...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <div className="py-8">
        <h1 className="text-4xl font-bold mb-8">Прогресс</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* XP и уровень */}
          <Card>
            <CardHeader>
              <CardTitle>Прогресс</CardTitle>
            </CardHeader>
            <CardContent>
              <XPBar
                currentXP={(gamificationStats as any).xpProgress || 0}
                totalXP={(gamificationStats as any).xpForNextLevel || 500}
                level={(gamificationStats as any).level || 1}
                progressPercent={(gamificationStats as any).xpProgressPercent || 0}
              />
            </CardContent>
          </Card>

          {/* Стрик */}
          <Card>
            <CardHeader>
              <CardTitle>Активность</CardTitle>
            </CardHeader>
            <CardContent>
              <StreakCounter
                currentStreak={(gamificationStats as any).currentStreak || 0}
                longestStreak={(gamificationStats as any).longestStreak || 0}
                dailyActivity={(gamificationStats as any).dailyActivity}
              />
            </CardContent>
          </Card>

          {/* Статистика */}
          <Card>
            <CardHeader>
              <CardTitle>Статистика откликов</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Всего откликов:</span>
                <span className="text-xl font-bold">{(applicationStats as any)?.total || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Просмотры резюме:</span>
                <span className="text-xl font-bold text-blue-600">
                  {(applicationStats as any)?.totalViews || 0}
                  {(applicationStats as any)?.newViews > 0 && (
                    <span className="text-sm text-green-600 ml-1">
                      (+{(applicationStats as any)?.newViews})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Сообщений:</span>
                <span className="text-xl font-bold text-purple-600">{(applicationStats as any)?.messages || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Отказов:</span>
                <span className="text-xl font-bold text-red-600">{(applicationStats as any)?.rejected || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Приглашений:</span>
                <span className="text-xl font-bold text-green-600">{(applicationStats as any)?.invitations || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Прогноз успеха */}
          <Card>
            <CardHeader>
              <CardTitle>Прогноз успеха</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary mb-2">
                {(gamificationStats as any).forecast?.successRate || 0}%
              </div>
              <p className="text-sm text-muted-foreground">
                {(gamificationStats as any).forecast?.forecast || ''}
              </p>
            </CardContent>
          </Card>

          {/* Достижения */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Достижения</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(gamificationStats as any).achievements?.map((achievement: any) => (
                  <AchievementBadge
                    key={achievement.id}
                    type={achievement.achievement_type}
                    unlockedAt={achievement.unlocked_at}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* График */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>График активности</CardTitle>
            </CardHeader>
            <CardContent>
              <StatsChart stats={applicationStats} />
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
