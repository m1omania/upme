import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RelevanceBadge from './RelevanceBadge';

interface SwipeCardProps {
  vacancy: {
    id: number;
    title: string;
    company: string;
    salary: string | null;
    description: string;
    requirements: string[];
  };
  relevance: number;
  reasons: string[];
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onCardClick?: () => void;
}

export default function SwipeCard({
  vacancy,
  relevance,
  reasons,
  onCardClick,
}: SwipeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md"
    >
      <Card 
        className="h-[600px] flex flex-col overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        onClick={onCardClick}
      >
        <CardContent className="flex-grow overflow-auto p-6">
          <div className="flex justify-between mb-4">
            <RelevanceBadge score={relevance} />
          </div>

          <h2 className="text-2xl font-bold mb-2">{vacancy.title}</h2>

          <h3 className="text-xl text-muted-foreground mb-4">{vacancy.company}</h3>

          {vacancy.salary && (
            <Badge className="mb-4" variant="secondary">
              {vacancy.salary}
            </Badge>
          )}

          <p className="text-sm text-muted-foreground mb-4">
            {vacancy.description.substring(0, 500)}
            {vacancy.description.length > 500 && '...'}
          </p>

          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Требования:</h4>
            <div className="flex flex-wrap gap-2">
              {vacancy.requirements.slice(0, 5).map((req, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {req}
                </Badge>
              ))}
            </div>
          </div>

          {reasons.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Почему подходит:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {reasons.map((reason, index) => (
                  <li key={index}>• {reason}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
