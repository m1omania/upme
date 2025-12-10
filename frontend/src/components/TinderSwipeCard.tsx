import { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RelevanceBadge from './RelevanceBadge';

interface TinderSwipeCardProps {
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
  isDraggable?: boolean;
  isUndoing?: boolean;
  style?: {
    zIndex: number;
    scale: number;
    y: number;
  };
}

// Компонент для логотипа с fallback на placeholder
function LogoWithFallback({ logoUrl, companyName }: { logoUrl?: string | null; companyName: string }) {
  const [imageError, setImageError] = useState(false);

  if (!logoUrl || imageError) {
    return (
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-base font-semibold border">
        {companyName.substring(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img 
      src={logoUrl} 
      alt={companyName}
      className="w-20 h-20 rounded-full object-cover border"
      onError={() => setImageError(true)}
    />
  );
}

export default function TinderSwipeCard({
  vacancy,
  relevance,
  reasons,
  onSwipeLeft,
  onSwipeRight,
  onCardClick,
  isDraggable = true,
  isUndoing = false,
  style = { zIndex: 1, scale: 1, y: 0 },
}: TinderSwipeCardProps) {
  const [exitX, setExitX] = useState(0);
  const [exitY, setExitY] = useState(0);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Вращение карточки на основе позиции X (как в Tinder)
  const rotate = useTransform(x, [-200, 0, 200], [-30, 0, 30]);
  
  // Opacity для индикаторов Like/Nope
  const opacityLike = useTransform(x, [0, 100], [0, 1]);
  const opacityNope = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isDraggable) return;
    
    const threshold = 100;
    
    if (Math.abs(info.offset.x) > threshold) {
      // Свайп произошел
      setExitX(info.offset.x > 0 ? 400 : -400);
      setExitY(info.offset.y);
      
      // Вызываем callback
      setTimeout(() => {
        if (info.offset.x > 0) {
          onSwipeRight();
        } else {
          onSwipeLeft();
        }
      }, 150);
    }
  };

  return (
    <motion.div
      style={{
        x: isDraggable ? x : 0,
        rotate: isDraggable ? rotate : 0,
        zIndex: style.zIndex,
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: isDraggable ? 'auto' : 'none',
      }}
      initial={
        isUndoing
          ? {
              x: -400,
              opacity: 0,
              scale: 0.8,
              rotate: -30,
            }
          : {
              scale: style.scale,
              y: style.y,
            }
      }
      animate={{
        x: 0,
        opacity: 1,
        scale: style.scale,
        y: style.y,
        rotate: 0,
      }}
      transition={
        isUndoing
          ? {
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }
          : undefined
      }
      exit={{
        x: exitX,
        y: exitY,
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.2 },
      }}
      drag={isDraggable ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={1}
      onDragEnd={handleDragEnd}
      whileTap={isDraggable ? { cursor: 'grabbing' } : undefined}
      className={isDraggable ? "cursor-grab" : ""}
    >
      {/* Индикатор НЕТ (влево) */}
      <motion.div
        style={{ opacity: opacityNope }}
        className="absolute top-12 left-8 z-10 pointer-events-none select-none"
      >
        <div className="border-4 border-red-500 text-red-500 font-bold text-5xl px-6 py-3 rotate-[-20deg] rounded-lg bg-white/90">
          НЕТ
        </div>
      </motion.div>

      {/* Индикатор ДА (вправо) */}
      <motion.div
        style={{ opacity: opacityLike }}
        className="absolute top-12 right-8 z-10 pointer-events-none select-none"
      >
        <div className="border-4 border-green-500 text-green-500 font-bold text-5xl px-6 py-3 rotate-[20deg] rounded-lg bg-white/90">
          ДА
        </div>
      </motion.div>

      <Card 
        className="w-full h-full flex flex-col overflow-hidden shadow-2xl select-none"
        style={{
          boxShadow: isDraggable 
            ? '0 10px 40px rgba(0,0,0,0.3)' 
            : '0 5px 20px rgba(0,0,0,0.15)',
        }}
        onClick={() => {
          // Клик только если карточка не двигалась
          if (isDraggable && x.get() === 0 && y.get() === 0) {
            onCardClick?.();
          }
        }}
      >
        <CardContent className="flex-grow overflow-auto p-6">
          {/* Логотип и релевантность */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <LogoWithFallback 
              logoUrl={vacancy.logo_url} 
              companyName={vacancy.company}
            />
            <RelevanceBadge score={relevance} />
          </div>

          {/* Название компании */}
          <h2 className="text-2xl font-bold mb-2 text-center">{vacancy.company}</h2>

          {/* Название вакансии */}
          <h3 className="text-lg font-semibold mb-2 text-muted-foreground text-center">{vacancy.title}</h3>

          {vacancy.salary && (
            <div className="mb-4 text-lg font-bold text-center text-primary">
              {vacancy.salary}
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-4 line-clamp-6">
            {vacancy.description}
          </p>

          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Требования:</h4>
            <div className="flex flex-wrap gap-2">
              {vacancy.requirements.slice(0, 6).map((req, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {req}
                </Badge>
              ))}
            </div>
          </div>

          {/* Блок "Почему подходит" */}
          {reasons.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2 text-green-600">Почему подходит:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {reasons.slice(0, 3).map((reason, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
