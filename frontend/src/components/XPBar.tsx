import { Progress } from '@/components/ui/progress';

interface XPBarProps {
  currentXP: number;
  totalXP: number;
  level: number;
  progressPercent: number;
}

export default function XPBar({ currentXP, totalXP, level, progressPercent }: XPBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Уровень {level}</h3>
        <span className="text-sm text-muted-foreground">
          {currentXP} / {totalXP} XP
        </span>
      </div>
      <Progress value={progressPercent} className="h-2" />
    </div>
  );
}
