import { Badge } from '@/components/ui/badge';
import { Flame } from 'lucide-react';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  dailyActivity?: Record<string, boolean>;
}

export default function StreakCounter({ currentStreak, longestStreak, dailyActivity }: StreakCounterProps) {
  // Генерируем массив из 7 дней (от сегодня к прошлому)
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        isActive: dailyActivity?.[dateStr] || false,
        dayName: i === 0 ? 'Сегодня' : i === 1 ? 'Вчера' : date.toLocaleDateString('ru-RU', { weekday: 'short' }),
      });
    }
    return days.reverse(); // От старого к новому
  };

  const days = getLast7Days();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Badge variant="destructive" className="text-lg px-4 py-2">
          <Flame className="mr-2 h-4 w-4" />
          {currentStreak} дней
        </Badge>
        <p className="text-sm text-muted-foreground">
          Максимальный: {longestStreak} дней
        </p>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Активность за 7 дней</p>
        <div className="flex items-center gap-2">
          {days.map((day, index) => (
            <div key={day.date} className="flex flex-col items-center gap-1">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${
                  day.isActive
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                }`}
                title={day.dayName}
              >
                {day.isActive ? '✓' : ''}
              </div>
              <span className="text-xs text-muted-foreground hidden sm:block">
                {day.dayName}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
