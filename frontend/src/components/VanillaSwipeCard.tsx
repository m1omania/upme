import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RelevanceBadge from './RelevanceBadge';

interface VanillaSwipeCardProps {
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
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm md:text-base font-semibold border">
        {companyName.substring(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img 
      src={logoUrl} 
      alt={companyName}
      className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border"
      onError={() => setImageError(true)}
    />
  );
}

export default function VanillaSwipeCard({
  vacancy,
  relevance,
  reasons,
  onSwipeLeft,
  onSwipeRight,
  onCardClick,
  isDraggable = true,
  style = { zIndex: 1, scale: 1, y: 0 },
}: VanillaSwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const hasMovedRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [likeOpacity, setLikeOpacity] = useState(0);
  const [nopeOpacity, setNopeOpacity] = useState(0);

  useEffect(() => {
    if (!cardRef.current || !isDraggable) return;

    const card = cardRef.current;
    let isPointerDown = false;
    let initialX = 0;
    let initialY = 0;
    let currentXPos = 0;
    let currentYPos = 0;

    const getEventPos = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: e.clientX, y: e.clientY };
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
      isPointerDown = true;
      hasMovedRef.current = false;
      const pos = getEventPos(e);
      initialX = pos.x - currentXPos;
      initialY = pos.y - currentYPos;
      setStartX(pos.x);
      setStartY(pos.y);
      setIsDragging(true);
      card.style.transition = 'none';
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isPointerDown) return;
      e.preventDefault();

      const pos = getEventPos(e);
      currentXPos = pos.x - initialX;
      currentYPos = pos.y - initialY;

      // Отмечаем что было движение
      if (Math.abs(currentXPos) > 5 || Math.abs(currentYPos) > 5) {
        hasMovedRef.current = true;
      }

      // Ограничиваем движение, чтобы карточка не вызывала скролл страницы
      const maxMove = Math.min(400, window.innerWidth * 0.9);
      currentXPos = Math.max(-maxMove, Math.min(maxMove, currentXPos));
      currentYPos = Math.max(-maxMove, Math.min(maxMove, currentYPos));

      setCurrentX(currentXPos);
      setCurrentY(currentYPos);

      // Вычисляем поворот на основе X
      const rotate = (currentXPos / 20);
      card.style.transform = `translate(${currentXPos}px, ${currentYPos}px) rotate(${rotate}deg)`;

      // Вычисляем opacity для индикаторов
      if (currentXPos > 0) {
        setLikeOpacity(Math.min(1, currentXPos / 100));
        setNopeOpacity(0);
      } else if (currentXPos < 0) {
        setNopeOpacity(Math.min(1, Math.abs(currentXPos) / 100));
        setLikeOpacity(0);
      } else {
        setLikeOpacity(0);
        setNopeOpacity(0);
      }
    };

    const handleEnd = () => {
      if (!isPointerDown) return;
      isPointerDown = false;
      setIsDragging(false);
      card.style.transition = 'transform 0.3s ease-out';

      const threshold = 75;
      const shouldSwipe = Math.abs(currentXPos) > threshold;

      if (shouldSwipe) {
        // Анимация ухода карточки - ограничиваем чтобы не вызывать скролл
        const exitX = currentXPos > 0 ? Math.min(1200, window.innerWidth * 1.5) : Math.max(-1200, -window.innerWidth * 1.5);
        card.style.transform = `translate(${exitX}px, ${currentYPos}px) rotate(${currentXPos > 0 ? 30 : -30}deg)`;
        
        setTimeout(() => {
          if (currentXPos > 0) {
            onSwipeRight();
          } else {
            onSwipeLeft();
          }
        }, 300);
      } else {
        // Возврат карточки на место
        currentXPos = 0;
        currentYPos = 0;
        setCurrentX(0);
        setCurrentY(0);
        card.style.transform = 'translate(0px, 0px) rotate(0deg)';
        setLikeOpacity(0);
        setNopeOpacity(0);
      }
      
      // Сбрасываем флаг движения через небольшую задержку
      setTimeout(() => {
        hasMovedRef.current = false;
      }, 100);
    };

    // Mouse events
    card.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);

    // Touch events
    card.addEventListener('touchstart', handleStart, { passive: false });
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);

    return () => {
      card.removeEventListener('mousedown', handleStart);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      card.removeEventListener('touchstart', handleStart);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDraggable, onSwipeLeft, onSwipeRight]);

  // Применяем стили для стека карточек
  useEffect(() => {
    if (cardRef.current) {
      const card = cardRef.current;
      card.style.zIndex = String(style.zIndex);
      card.style.transform = `scale(${style.scale}) translateY(${style.y}px)`;
      card.style.transition = 'transform 0.3s ease-out';
    }
  }, [style]);

  const handleClick = (e: React.MouseEvent) => {
    // Клик только если карточка не двигалась
    if (!hasMovedRef.current && Math.abs(currentX) < 5 && Math.abs(currentY) < 5) {
      e.stopPropagation();
      onCardClick?.();
    }
  };

      return (
        <div
          ref={cardRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: isDraggable ? 'auto' : 'none',
            cursor: isDraggable ? 'grab' : 'default',
            touchAction: 'none',
            overflow: 'visible',
          }}
          onClick={handleClick}
        >
      {/* Индикатор НЕТ (влево) */}
      <div
        style={{
          opacity: nopeOpacity,
          position: 'absolute',
          top: '2rem',
          left: '1rem',
          zIndex: 10,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
        className="md:top-12 md:left-8"
      >
        <div className="border-2 md:border-4 border-red-500 text-red-500 font-bold text-3xl md:text-5xl px-3 py-2 md:px-6 md:py-3 rotate-[-20deg] rounded-lg bg-white/90">
          НЕТ
        </div>
      </div>

      {/* Индикатор ДА (вправо) */}
      <div
        style={{
          opacity: likeOpacity,
          position: 'absolute',
          top: '2rem',
          right: '1rem',
          zIndex: 10,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
        className="md:top-12 md:right-8"
      >
        <div className="border-2 md:border-4 border-green-500 text-green-500 font-bold text-3xl md:text-5xl px-3 py-2 md:px-6 md:py-3 rotate-[20deg] rounded-lg bg-white/90">
          ДА
        </div>
      </div>

      <Card 
        className="w-full h-full flex flex-col overflow-visible shadow-lg select-none"
        style={{
          boxShadow: isDraggable 
            ? '0 8px 24px rgba(0,0,0,0.15)' 
            : '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <CardContent className="flex-grow overflow-visible flex flex-col p-3 md:p-4">
          {/* Логотип и релевантность */}
          <div className="flex items-center justify-center gap-2 mb-2 flex-shrink-0">
            <LogoWithFallback 
              logoUrl={vacancy.logo_url} 
              companyName={vacancy.company}
            />
            <RelevanceBadge score={relevance} />
          </div>

          {/* Название компании */}
          <h2 className="text-lg md:text-xl font-bold mb-1 text-center px-2 flex-shrink-0 line-clamp-2">{vacancy.company}</h2>

          {/* Название вакансии */}
          <h3 className="text-sm md:text-base font-semibold mb-1 text-muted-foreground text-center px-2 flex-shrink-0 line-clamp-2">{vacancy.title}</h3>

          {vacancy.salary && (
            <div className="mb-2 text-sm md:text-base font-bold text-center text-primary px-2 flex-shrink-0">
              {vacancy.salary}
            </div>
          )}

          <div className="flex-grow overflow-visible flex flex-col min-h-0">
            <p className="text-xs md:text-sm text-muted-foreground mb-2 line-clamp-3 px-2">
              {vacancy.description}
            </p>

            <div className="mt-2 flex-shrink-0">
              <h4 className="text-xs font-semibold mb-1 px-2">Требования:</h4>
              <div className="flex flex-wrap gap-1 px-2">
                {vacancy.requirements.slice(0, 4).map((req, index) => (
                  <Badge key={index} variant="outline" className="text-[10px]">
                    {req}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Блок "Почему подходит" */}
            {reasons.length > 0 && (
              <div className="mt-2 flex-shrink-0">
                <h4 className="text-xs font-semibold mb-1 text-green-600 px-2">Почему подходит:</h4>
                <ul className="space-y-0.5 text-xs text-muted-foreground px-2">
                  {reasons.slice(0, 2).map((reason, index) => (
                    <li key={index} className="flex items-start gap-1.5 line-clamp-1">
                      <span className="text-green-600 mt-0.5 flex-shrink-0">✓</span>
                      <span className="line-clamp-1">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

