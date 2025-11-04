/**
 * HorizontalFactorStepper Component
 * 
 * Ultra-compact horizontal progress tracker
 * Minimal vertical space, maximum information density
 */

'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef, useEffect, useState } from 'react';

interface DimensionItem {
  id: string;
  name: string;
  code: string;
  orderIndex: number;
  completed: boolean;
  selectedLevel: number | null;
}

interface FactorGroup {
  id: string;
  name: string;
  code: string;
  orderIndex: number;
  dimensions: DimensionItem[];
}

interface HorizontalFactorStepperProps {
  /** Array of factors with dimensions */
  factors: FactorGroup[];
  /** Currently selected dimension ID */
  currentDimensionId: string;
  /** Callback when dimension is clicked */
  onDimensionClick: (dimensionId: string) => void;
}

export function HorizontalFactorStepper({
  factors,
  currentDimensionId,
  onDimensionClick,
}: HorizontalFactorStepperProps) {
  // Find current factor and dimension
  const getCurrentFactorIndex = () => {
    for (let i = 0; i < factors.length; i++) {
      if (factors[i].dimensions.some(d => d.id === currentDimensionId)) {
        return i;
      }
    }
    return 0;
  };

  const currentFactorIndex = getCurrentFactorIndex();
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [cardWidths, setCardWidths] = useState<number[]>([]);

  useEffect(() => {
    // Measure actual widths of all factor cards
    const widths = buttonRefs.current.map(ref => ref?.offsetWidth || 200);
    setCardWidths(widths);
  }, [factors]);

  // Calculate cumulative positions with minimum gap
  const MIN_GAP = 10; // Minimum gap between cards
  const positions: number[] = [];
  let currentPos = 0;

  for (let i = 0; i < factors.length; i++) {
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
  const centerOffset = positions[currentFactorIndex] || 0;
  const adjustedPositions = positions.map(pos => pos - centerOffset);

  return (
    <div className="relative w-full h-10 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        {factors.map((factor, factorIndex) => {
          const offset = factorIndex - currentFactorIndex;
          const isActive = factorIndex === currentFactorIndex;
          const isVisible = Math.abs(offset) <= 5;
          const xPosition = adjustedPositions[factorIndex] || (offset * 280);
          
          const completedCount = factor.dimensions.filter(d => d.completed).length;
          const totalCount = factor.dimensions.length;
          const isFactorComplete = completedCount === totalCount && totalCount > 0;
          
          return (
            <motion.div
              key={factor.id}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                zIndex: isActive ? 10 : Math.max(0, 5 - Math.abs(offset)),
              }}
              animate={{
                x: `calc(-50% + ${xPosition}px)`,
                y: '-50%',
                scale: isActive ? 1 : 0.85,
                opacity: isActive ? 1 : Math.max(0, 1 - Math.abs(offset) * 0.15),
                filter: isActive ? 'none' : 'grayscale(40%)',
              }}
              transition={{
                duration: 0.6,
                ease: [0.4, 0.0, 0.2, 1],
              }}
            >
              <button
                ref={el => { buttonRefs.current[factorIndex] = el; }}
                onClick={() => {
                  if (factor.dimensions.length > 0) {
                    onDimensionClick(factor.dimensions[0].id);
                  }
                }}
                disabled={!isVisible}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg border px-4 py-2 transition-all duration-200 bg-background',
                  isActive && 'border-primary shadow-[0_4px_12px_rgba(var(--primary),0.15)]',
                  isFactorComplete && !isActive && 'border-green-500/30',
                  !isActive && !isFactorComplete && 'border-border/40',
                  isVisible && 'cursor-pointer hover:scale-105',
                  !isVisible && 'pointer-events-none'
                )}
              >
                {/* Factor Name - Single Line */}
                <p className={cn(
                  'text-xs font-semibold leading-none',
                  isActive && 'text-foreground',
                  !isActive && 'text-muted-foreground'
                )}>
                  {factor.name}
                </p>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
