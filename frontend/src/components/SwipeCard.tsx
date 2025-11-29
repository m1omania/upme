import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RelevanceBadge from './RelevanceBadge';
import { useState } from 'react';

interface SwipeCardProps {
  vacancy: {
    id: number;
    title: string;
    company: string;
    salary: string | null;
    description: string;
    requirements: string[];
    logo_url?: string | null;
  };
  relevance: number;
  reasons: string[];
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onCardClick?: () => void;
}

// Компонент для логотипа с fallback на placeholder
function LogoWithFallback({ logoUrl, companyName }: { logoUrl?: string | null; companyName: string }) {
  const [imageError, setImageError] = useState(false);

  if (!logoUrl || imageError) {
    return (
      <div className="w-28 h-28 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-lg font-semibold border relative z-10">
        {companyName.substring(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img 
      src={logoUrl} 
      alt={companyName}
      className="w-28 h-28 rounded-full object-cover border relative z-10"
      onError={() => setImageError(true)}
    />
  );
}

export default function SwipeCard({
  vacancy,
  relevance,
  reasons,
  onCardClick,
}: SwipeCardProps) {
  // Вычисляем финальный отступ на основе релевантности (в пикселях)
  // При 100% релевантности элементы перекрываются на четверть (28px из 112px)
  const getFinalGap = (score: number) => {
    if (score >= 100) return -28;  // 100% - перекрытие на четверть (w-28 = 112px, четверть = 28px)
    if (score >= 80) {
      // Линейная интерполяция от 80% до 100%: от 0 до -28px
      const ratio = (score - 80) / 20; // 0 при 80%, 1 при 100%
      return Math.round(-28 * ratio);
    }
    if (score >= 70) return 8;     // Высокая релевантность - маленький отступ (gap-2 = 8px)
    if (score >= 40) return 24;    // Средняя релевантность - средний отступ (gap-6 = 24px)
    return 40;                     // Низкая релевантность - большой отступ (gap-10 = 40px)
  };

  const finalGap = getFinalGap(relevance);
  const maxGap = 160; // Максимальное начальное расстояние (160px)
  
  // Вычисляем смещение для перекрытия (отрицательное значение означает перекрытие)
  const overlap = finalGap < 0 ? Math.abs(finalGap) : 0;
  const actualGap = finalGap < 0 ? 0 : finalGap;

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
          {/* Логотип и круг с процентом по центру с анимацией */}
          <motion.div 
            className="flex items-center justify-center mb-3 relative"
            initial={{ gap: `${maxGap}px` }}
            animate={{ gap: `${actualGap}px` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <LogoWithFallback 
              logoUrl={vacancy.logo_url} 
              companyName={vacancy.company}
            />
            <motion.div 
              className="relative z-20"
              initial={{ x: 0 }}
              animate={{ x: overlap > 0 ? `-${overlap}px` : 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <RelevanceBadge score={relevance} />
            </motion.div>
          </motion.div>

          {/* Название компании */}
          <h3 className="text-xl font-semibold mb-2">{vacancy.company}</h3>

          {/* Название вакансии */}
          <h2 className="text-2xl font-bold mb-4">{vacancy.title}</h2>

          {vacancy.salary && (
            <div className="mb-4 text-xl font-bold">
              {vacancy.salary}
            </div>
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

          {/* Блок "Почему подходит" */}
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
