'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

export interface DimensionInfo {
  id: string;
  name: string;
  description?: string;
  completed: boolean;
}

interface DimensionHeaderProps {
  /** All dimensions in current factor */
  dimensions: {
    id: string;
    name: string;
    completed: boolean;
  }[];
  /** Currently active dimension ID */
  currentDimensionId: string;
  /** Callback when dimension is clicked */
  onDimensionClick: (dimensionId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

export function DimensionHeader({
  dimensions,
  currentDimensionId,
  onDimensionClick,
  className,
}: DimensionHeaderProps) {
  const currentIndex = dimensions.findIndex(d => d.id === currentDimensionId);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [cardWidths, setCardWidths] = useState<number[]>([]);

  useEffect(() => {
    // Measure actual widths of all dimension cards
    const widths = buttonRefs.current.map(ref => ref?.offsetWidth || 200);
    setCardWidths(widths);
  }, [dimensions]);

  if (currentIndex === -1 || dimensions.length === 0) return null;

  // Calculate cumulative positions with minimum gap
  const MIN_GAP = 10; // Minimum gap between cards
  const positions: number[] = [];
  let currentPos = 0;

  for (let i = 0; i < dimensions.length; i++) {
    if (i === 0) {
      positions.push(0);
    } else {
      const prevWidth = cardWidths[i - 1] || 200;
      const currentWidth = cardWidths[i] || 200;
      currentPos += (prevWidth / 2) + MIN_GAP + (currentWidth / 2);
      positions.push(currentPos);
    }
  }

  // Offset all positions so current is at center (0)
  const centerOffset = positions[currentIndex] || 0;
  const adjustedPositions = positions.map(pos => pos - centerOffset);

  return (
    <div className={cn('relative w-full h-10 overflow-hidden', className)}>
      <div className="absolute inset-0 flex items-center justify-center">
        {dimensions.map((dimension, dimensionIndex) => {
          const offset = dimensionIndex - currentIndex;
          const isActive = dimensionIndex === currentIndex;
          const isVisible = Math.abs(offset) <= 5;
          const xPosition = adjustedPositions[dimensionIndex] || (offset * 360);
          
          return (
            <motion.div
              key={dimension.id}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                zIndex: isActive ? 10 : Math.max(0, 5 - Math.abs(offset)),
              }}
              animate={{
                x: `calc(-50% + ${xPosition}px)`,
                y: '-50%',
                scale: isActive ? 1 : 0.92,
                opacity: isActive ? 1 : Math.max(0, 1 - Math.abs(offset) * 0.15),
                filter: isActive ? 'none' : 'grayscale(40%)',
              }}
              transition={{
                duration: 0.6,
                ease: [0.4, 0.0, 0.2, 1],
              }}
            >
              <button
                ref={el => { buttonRefs.current[dimensionIndex] = el; }}
                onClick={() => onDimensionClick(dimension.id)}
                disabled={!isVisible}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg border px-4 py-2 transition-all duration-200 bg-background',
                  isActive && 'border-primary shadow-[0_4px_12px_rgba(var(--primary),0.15)]',
                  dimension.completed && !isActive && 'border-green-500/30',
                  !isActive && !dimension.completed && 'border-border/40',
                  isVisible && 'cursor-pointer hover:scale-105',
                  !isVisible && 'pointer-events-none'
                )}
              >
                {/* Dimension Name - Single Line */}
                <p className={cn(
                  'text-xs font-semibold leading-none whitespace-nowrap',
                  isActive && 'text-foreground',
                  !isActive && 'text-muted-foreground'
                )}>
                  {dimension.name}
                </p>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
