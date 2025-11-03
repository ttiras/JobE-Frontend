/**
 * Factor Progress Indicator Component
 * 
 * Visual timeline showing all evaluation factors with their completion status.
 * Provides clear indication of current factor and overall progress.
 * 
 * Features:
 * - Horizontal timeline layout
 * - Visual states: completed, in-progress, upcoming
 * - Smooth transitions and animations
 * - Responsive design with mobile optimization
 * - Click navigation between factors
 */

'use client';

import { Check, Circle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FactorStep {
  /** Factor unique identifier */
  id: string;
  /** Factor display name */
  name: string;
  /** Factor code */
  code: string;
  /** Factor order in sequence */
  orderIndex: number;
  /** Total dimensions in this factor */
  dimensionCount: number;
  /** Number of completed dimensions */
  completedDimensions: number;
}

interface FactorProgressIndicatorProps {
  /** Array of factors to display */
  factors: FactorStep[];
  /** Current active factor index (0-based) */
  currentFactorIndex: number;
  /** Callback when factor is clicked */
  onFactorClick?: (factorIndex: number) => void;
  /** Whether to allow clicking on factors */
  allowNavigation?: boolean;
}

/**
 * Determine the visual state of a factor
 */
function getFactorState(
  factorIndex: number,
  factor: FactorStep,
  currentFactorIndex: number
): 'completed' | 'current' | 'upcoming' {
  if (factor.completedDimensions === factor.dimensionCount && factor.dimensionCount > 0) {
    return 'completed';
  }
  
  if (factorIndex === currentFactorIndex) {
    return 'current';
  }
  
  return 'upcoming';
}

/**
 * Determine if a factor is clickable
 */
function isFactorClickable(
  factorIndex: number,
  factors: FactorStep[],
  currentFactorIndex: number
): boolean {
  // Current factor is always clickable
  if (factorIndex === currentFactorIndex) {
    return true;
  }

  // Can't skip ahead - all previous factors must be complete
  for (let i = 0; i < factorIndex; i++) {
    const factor = factors[i];
    if (factor.completedDimensions < factor.dimensionCount) {
      return false;
    }
  }

  return true;
}

export function FactorProgressIndicator({
  factors,
  currentFactorIndex,
  onFactorClick,
  allowNavigation = true,
}: FactorProgressIndicatorProps) {
  return (
    <div className="w-full py-6 bg-gradient-to-b from-muted/30 to-transparent">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Desktop Timeline */}
        <div className="hidden md:flex items-center justify-between gap-2">
          {factors.map((factor, index) => {
            const state = getFactorState(index, factor, currentFactorIndex);
            const isClickable = allowNavigation && isFactorClickable(index, factors, currentFactorIndex);
            const progressPercentage = factor.dimensionCount > 0
              ? Math.round((factor.completedDimensions / factor.dimensionCount) * 100)
              : 0;

            return (
              <div key={factor.id} className="flex items-center flex-1 min-w-0">
                {/* Factor Card */}
                <motion.button
                  onClick={() => isClickable && onFactorClick?.(index)}
                  disabled={!isClickable}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className={cn(
                    'relative flex flex-col items-start p-3 rounded-lg border-2 transition-all duration-300 w-full min-w-0',
                    state === 'completed' && 'bg-green-500/10 border-green-500/30 hover:border-green-500/50',
                    state === 'current' && 'bg-primary/10 border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/20',
                    state === 'upcoming' && 'bg-muted/30 border-border/50',
                    isClickable && state !== 'current' && 'cursor-pointer hover:shadow-md',
                    !isClickable && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {/* State Icon */}
                  <div className="flex items-center gap-2 mb-2 w-full">
                    <div
                      className={cn(
                        'flex items-center justify-center w-6 h-6 rounded-full shrink-0',
                        state === 'completed' && 'bg-green-500 text-white',
                        state === 'current' && 'bg-primary text-primary-foreground',
                        state === 'upcoming' && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {state === 'completed' ? (
                        <Check className="h-4 w-4" />
                      ) : state === 'current' ? (
                        <Circle className="h-3 w-3 fill-current" />
                      ) : (
                        <Lock className="h-3 w-3" />
                      )}
                    </div>
                    
                    <span
                      className={cn(
                        'text-xs font-medium truncate',
                        state === 'completed' && 'text-green-700 dark:text-green-400',
                        state === 'current' && 'text-primary',
                        state === 'upcoming' && 'text-muted-foreground'
                      )}
                    >
                      Factor {index + 1}
                    </span>
                  </div>

                  {/* Factor Name */}
                  <h3
                    className={cn(
                      'text-sm font-semibold mb-1 line-clamp-2 text-left w-full',
                      state === 'completed' && 'text-green-900 dark:text-green-200',
                      state === 'current' && 'text-foreground',
                      state === 'upcoming' && 'text-muted-foreground'
                    )}
                  >
                    {factor.name}
                  </h3>

                  {/* Progress */}
                  <div className="w-full space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={cn(
                          'font-medium',
                          state === 'completed' && 'text-green-700 dark:text-green-400',
                          state === 'current' && 'text-primary',
                          state === 'upcoming' && 'text-muted-foreground'
                        )}
                      >
                        {factor.completedDimensions}/{factor.dimensionCount}
                      </span>
                      <span
                        className={cn(
                          'text-xs',
                          state === 'completed' && 'text-green-700 dark:text-green-400',
                          state === 'current' && 'text-primary',
                          state === 'upcoming' && 'text-muted-foreground'
                        )}
                      >
                        {progressPercentage}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={cn(
                          'h-full rounded-full',
                          state === 'completed' && 'bg-green-500',
                          state === 'current' && 'bg-primary',
                          state === 'upcoming' && 'bg-muted-foreground/30'
                        )}
                      />
                    </div>
                  </div>

                  {/* Current Indicator */}
                  {state === 'current' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background"
                    />
                  )}
                </motion.button>

                {/* Connector Line */}
                {index < factors.length - 1 && (
                  <div className="flex items-center justify-center w-8 shrink-0">
                    <div
                      className={cn(
                        'h-0.5 w-full transition-colors duration-300',
                        state === 'completed' ? 'bg-green-500/30' : 'bg-border/30'
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Compact View */}
        <div className="md:hidden">
          <div className="space-y-3">
            {/* Current Factor Card */}
            {factors[currentFactorIndex] && (
              <motion.div
                key={factors[currentFactorIndex].id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-primary/10 border-2 border-primary rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                      <Circle className="h-4 w-4 fill-current" />
                    </div>
                    <span className="text-xs font-medium text-primary">
                      Factor {currentFactorIndex + 1} of {factors.length}
                    </span>
                  </div>
                </div>
                <h3 className="text-base font-bold mb-2">
                  {factors[currentFactorIndex].name}
                </h3>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-primary">
                      {factors[currentFactorIndex].completedDimensions}/
                      {factors[currentFactorIndex].dimensionCount} Dimensions
                    </span>
                    <span className="text-xs text-primary">
                      {Math.round(
                        (factors[currentFactorIndex].completedDimensions /
                          factors[currentFactorIndex].dimensionCount) *
                          100
                      )}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${
                          Math.round(
                            (factors[currentFactorIndex].completedDimensions /
                              factors[currentFactorIndex].dimensionCount) *
                              100
                          )
                        }%`,
                      }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Mini Progress Dots */}
            <div className="flex items-center justify-center gap-2">
              {factors.map((factor, index) => {
                const state = getFactorState(index, factor, currentFactorIndex);
                return (
                  <motion.button
                    key={factor.id}
                    onClick={() =>
                      isFactorClickable(index, factors, currentFactorIndex) &&
                      onFactorClick?.(index)
                    }
                    disabled={!isFactorClickable(index, factors, currentFactorIndex)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all duration-300',
                      state === 'completed' && 'bg-green-500',
                      state === 'current' && 'bg-primary w-8',
                      state === 'upcoming' && 'bg-muted-foreground/30'
                    )}
                    whileTap={{ scale: 0.9 }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
