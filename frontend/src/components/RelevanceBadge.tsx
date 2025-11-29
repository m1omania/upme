import { motion, useSpring, useMotionValueEvent } from 'framer-motion';
import { useEffect, useState } from 'react';

interface RelevanceBadgeProps {
  score: number;
}

export default function RelevanceBadge({ score }: RelevanceBadgeProps) {
  const spring = useSpring(0, { stiffness: 50, damping: 30 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    spring.set(score);
  }, [score, spring]);

  useMotionValueEvent(spring, 'change', (latest) => {
    setDisplay(Math.round(latest));
  });

  const getColorClasses = () => {
    if (score >= 70) return 'bg-primary text-primary-foreground';
    if (score >= 40) return 'bg-secondary text-secondary-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <div className={`w-28 h-28 rounded-full flex items-center justify-center font-bold text-3xl ${getColorClasses()}`}>
      {display}%
    </div>
  );
}
