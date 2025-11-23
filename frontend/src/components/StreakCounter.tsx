import { Badge } from '@/components/ui/badge';
import { Flame } from 'lucide-react';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
}

export default function StreakCounter({ currentStreak, longestStreak }: StreakCounterProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Стрик активности</h3>
      <div className="flex items-center gap-4">
        <Badge variant="destructive" className="text-lg px-4 py-2">
          <Flame className="mr-2 h-4 w-4" />
          {currentStreak} дней
        </Badge>
        <p className="text-sm text-muted-foreground">
          Максимальный: {longestStreak} дней
        </p>
      </div>
    </div>
  );
}
