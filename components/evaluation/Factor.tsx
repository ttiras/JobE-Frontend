'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface FactorProps {
  factor: FactorGroup;
  isCurrent: boolean;
  onClick: () => void;
  completedCount: number;
  totalCount: number;
  currentDimensionId?: string;
  onDimensionClick?: (dimensionId: string) => void;
}

export const FactorComponent = ({
  factor,
  isCurrent,
  onClick,
  completedCount,
  totalCount,
  currentDimensionId,
  onDimensionClick,
}: FactorProps) => {
  // Expansion state - defaults to current factor being expanded
  const [isExpanded, setIsExpanded] = useState(isCurrent);
  const factorRef = useRef<HTMLDivElement>(null);
  const isCompleted = completedCount === totalCount && totalCount > 0;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Smooth scroll into view when becoming current
  useEffect(() => {
    if (isCurrent) {
      // Auto-expand when this factor becomes current
      //eslint-disable-next-line
      setIsExpanded(true);
      
      // Scroll into view
      if (factorRef.current) {
        setTimeout(() => {
          factorRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
        }, 100);
      }
    }
  }, [isCurrent]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      onClick();
    }
  };

  return (
    <motion.div 
      ref={factorRef}
      layout 
      className="relative"
      initial={false}
    >
      {/* Factor Button */}
      <motion.button
        layout="position"
        onClick={handleToggle}
        className={cn(
          'w-full flex flex-col gap-2 px-4 py-3.5 rounded-xl transition-all duration-200 text-left',
          'hover:bg-accent/60',
          isCurrent && 'bg-accent/50 shadow-sm'
        )}
      >
        {/* Factor Name & Progress */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform flex-shrink-0',
                isExpanded && 'rotate-180'
              )}
            />
            <span className={cn(
              'truncate text-sm font-medium transition-colors',
              isCurrent ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {factor.name}
            </span>
          </div>
          
          {/* Completion Badge */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isCompleted && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            <span className={cn(
              'text-xs font-semibold tabular-nums',
              isCompleted ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
            )}>
              {completedCount}/{totalCount}
            </span>
          </div>
        </div>

        {/* Mini Progress Bar */}
        <div className="w-full h-1 bg-muted/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full transition-colors',
              isCompleted ? 'bg-green-500' : 'bg-primary'
            )}
          />
        </div>
      </motion.button>
      
      {/* Active border indicator */}
      {isCurrent && (
        <motion.div
          layoutId="activeFactorBorder"
          className="absolute inset-0 border-2 border-primary/50 rounded-xl pointer-events-none shadow-[0_0_16px_rgba(var(--primary),0.25)]"
          initial={false}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}

      {/* Expandable Dimensions List */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-1 pb-2 px-2 space-y-1">
              {factor.dimensions.map((dimension) => {
                const isCurrentDimension = dimension.id === currentDimensionId;
                
                return (
                  <motion.button
                    key={dimension.id}
                    layout
                    onClick={(e) => {
                      e.stopPropagation();
                      onDimensionClick?.(dimension.id);
                    }}
                    className={cn(
                      'w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-150',
                      'hover:bg-accent/40',
                      isCurrentDimension && 'bg-primary/10 ring-1 ring-primary/30'
                    )}
                    whileHover={{ x: 4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    {/* Completion Icon */}
                    <div className="mt-0.5">
                      {dimension.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                      )}
                    </div>
                    
                    {/* Dimension Name - Allow wrapping for long names */}
                    <span className={cn(
                      'text-xs leading-relaxed flex-1 break-words',
                      isCurrentDimension ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground',
                      dimension.completed && !isCurrentDimension && 'text-muted-foreground/70'
                    )}>
                      {dimension.name}
                    </span>
                    
                    {/* Current Indicator */}
                    {isCurrentDimension && (
                      <motion.div
                        layoutId="currentDimension"
                        className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0 mt-1"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};






