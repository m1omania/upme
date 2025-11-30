import { motion, useSpring, useMotionValueEvent } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RelevanceBadge from './RelevanceBadge';
import { useState, useEffect } from 'react';

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
  animateLeft?: boolean;
  animateRight?: boolean;
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
  onSwipeLeft,
  onSwipeRight,
  onCardClick,
  animateLeft,
  animateRight,
}: SwipeCardProps) {
  const [dragDirection, setDragDirection] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [programmaticSwipe, setProgrammaticSwipe] = useState<'left' | 'right' | null>(null);

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
  
  // Spring для синхронизации анимации счетчика и движения элементов
  const scoreSpring = useSpring(0, { stiffness: 50, damping: 30 });
  const [currentScore, setCurrentScore] = useState(0);
  
  useEffect(() => {
    scoreSpring.set(relevance);
  }, [relevance, scoreSpring]);
  
  useMotionValueEvent(scoreSpring, 'change', (latest) => {
    setCurrentScore(latest);
  });
  
  // Вычисляем текущий gap на основе текущего процента (1px = 1%)
  // При 0%: gap = maxGap (160px), при 100%: gap = finalGap
  const currentGap = maxGap + (finalGap - maxGap) * (currentScore / 100);
  const actualGap = currentGap < 0 ? 0 : currentGap;
  
  // Вычисляем смещение для перекрытия на основе текущего процента
  const currentOverlap = currentGap < 0 ? Math.abs(currentGap) : 0;

  // Обработка программной анимации при клике на кнопки
  useEffect(() => {
    if (animateLeft) {
      setProgrammaticSwipe('left');
      setDragDirection(-300);
      setIsDragging(true);
      setTimeout(() => {
        onSwipeLeft();
        setProgrammaticSwipe(null);
        setIsDragging(false);
        setDragDirection(0);
      }, 300);
    } else if (animateRight) {
      setProgrammaticSwipe('right');
      setDragDirection(300);
      setIsDragging(true);
      setTimeout(() => {
        onSwipeRight();
        setProgrammaticSwipe(null);
        setIsDragging(false);
        setDragDirection(0);
      }, 300);
    }
  }, [animateLeft, animateRight, onSwipeLeft, onSwipeRight]);

  const handleDragEnd = (_event: any, info: any) => {
    const threshold = 100; // Минимальное расстояние для свайпа
    const velocity = info.velocity.x;

    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 500) {
      if (info.offset.x > 0 || velocity > 0) {
        // Свайп вправо
        onSwipeRight();
      } else {
        // Свайп влево
        onSwipeLeft();
      }
      // Сбрасываем состояние после свайпа
      setTimeout(() => {
        setIsDragging(false);
        setDragDirection(0);
      }, 100);
    } else {
      // Возвращаем карточку на место
      setIsDragging(false);
      setDragDirection(0);
    }
  };

  // Вычисляем прозрачность и цвет в зависимости от направления свайпа
  const getSwipeStyle = () => {
    const currentDirection = programmaticSwipe === 'left' ? -300 : programmaticSwipe === 'right' ? 300 : dragDirection;
    
    if (!isDragging && !programmaticSwipe || Math.abs(currentDirection) < 50) {
      return { opacity: 1, backgroundColor: 'transparent' };
    }
    
    if (currentDirection > 0) {
      // Свайп вправо (отклик) - зеленый оттенок
      return { 
        opacity: 1 - Math.abs(currentDirection) / 600,
        backgroundColor: 'rgba(34, 197, 94, 0.1)'
      };
    } else {
      // Свайп влево (пропуск) - красный оттенок
      return { 
        opacity: 1 - Math.abs(currentDirection) / 600,
        backgroundColor: 'rgba(239, 68, 68, 0.1)'
      };
    }
  };

  const swipeStyle = getSwipeStyle();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: swipeStyle.opacity, 
        scale: 1,
        x: (isDragging || programmaticSwipe) ? dragDirection : 0,
        rotate: (isDragging || programmaticSwipe) ? dragDirection * 0.1 : 0,
      }}
      exit={{ opacity: 0, scale: 0.9, x: dragDirection }}
      transition={{ duration: programmaticSwipe ? 0.3 : 0.3 }}
      className="w-full max-w-md"
      drag="x"
      dragConstraints={{ left: -300, right: 300 }}
      dragElastic={0.2}
      onDrag={(_event, info) => {
        setIsDragging(true);
        setDragDirection(info.offset.x);
      }}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: 'grabbing' }}
    >
      <Card 
        className="h-[600px] flex flex-col overflow-hidden cursor-grab hover:shadow-lg transition-shadow touch-none"
        style={{ backgroundColor: swipeStyle.backgroundColor }}
        onClick={() => {
          // Предотвращаем клик при свайпе
          if (!isDragging && !programmaticSwipe && Math.abs(dragDirection) < 10) {
            onCardClick?.();
          }
        }}
      >
        <CardContent className="flex-grow overflow-auto p-6">
          {/* Логотип и круг с процентом по центру с анимацией, синхронизированной со счетчиком */}
          <motion.div 
            className="flex items-center justify-center mb-3 relative"
            style={{ gap: `${actualGap}px` }}
          >
            <LogoWithFallback 
              logoUrl={vacancy.logo_url} 
              companyName={vacancy.company}
            />
            <motion.div 
              className="relative z-20"
              style={{ x: currentOverlap > 0 ? `-${currentOverlap}px` : 0 }}
            >
              <RelevanceBadge score={relevance} />
            </motion.div>
          </motion.div>

          {/* Название вакансии */}
          <h2 className="text-2xl font-bold mb-2 text-center">{vacancy.title}</h2>

          {/* Название компании */}
          <h3 className="text-xl font-semibold mb-2 text-muted-foreground text-center">{vacancy.company}</h3>

          {vacancy.salary && (
            <div className="mb-4 text-xl font-bold text-center">
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
