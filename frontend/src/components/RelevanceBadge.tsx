import { Badge } from '@/components/ui/badge';

interface RelevanceBadgeProps {
  score: number;
}

export default function RelevanceBadge({ score }: RelevanceBadgeProps) {
  const getVariant = () => {
    if (score >= 70) return 'default';
    if (score >= 40) return 'secondary';
    return 'destructive';
  };

  return (
    <Badge variant={getVariant()}>
      Релевантность: {score}%
    </Badge>
  );
}
