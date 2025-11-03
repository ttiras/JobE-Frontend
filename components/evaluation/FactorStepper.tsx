/**
 * Factor Stepper Component
 * 
 * Displays evaluation factors as a stepper/wizard navigation.
 * Shows progress for each factor and allows navigation between factors.
 * 
 * Features:
 * - Horizontal stepper for desktop
 * - Vertical stepper for mobile
 * - Visual states: completed, current, upcoming
 * - Progress tracking per factor
 * - Click navigation with completion validation
 * - Responsive design
 */

'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface FactorStepperProps {
  /** Array of factors to display */
  factors: FactorStep[];
  /** Current active factor index (0-based) */
  currentFactorIndex: number;
  /** Callback when factor is clicked */
  onFactorClick: (factorIndex: number) => void;
}

/**
 * Determine if a factor is clickable
 * A factor is clickable if all previous factors are completed
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
 * Factor Stepper Component
 */
export function FactorStepper({
  factors,
  currentFactorIndex,
  onFactorClick,
}: FactorStepperProps) {
  return (
    <>
      {/* Horizontal Stepper - Desktop */}
      <div className="hidden md:block">
        <HorizontalStepper
          factors={factors}
          currentFactorIndex={currentFactorIndex}
          onFactorClick={onFactorClick}
        />
      </div>

      {/* Vertical Stepper - Mobile */}
      <div className="block md:hidden">
        <VerticalStepper
          factors={factors}
          currentFactorIndex={currentFactorIndex}
          onFactorClick={onFactorClick}
        />
      </div>
    </>
  );
}

/**
 * Horizontal Stepper (Desktop)
 */
function HorizontalStepper({
  factors,
  currentFactorIndex,
  onFactorClick,
}: FactorStepperProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-start justify-between">
        {factors.map((factor, index) => {
          const state = getFactorState(index, factor, currentFactorIndex);
          const isClickable = isFactorClickable(index, factors, currentFactorIndex);
          const isLastFactor = index === factors.length - 1;

          return (
            <div key={factor.id} className="flex items-start flex-1">
              {/* Factor Step */}
              <div className="flex flex-col items-center flex-1">
                {/* Circle with Number or Check */}
                <button
                  onClick={() => isClickable && onFactorClick(index)}
                  disabled={!isClickable}
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2',
                    {
                      // Completed state
                      'bg-green-500 text-white': state === 'completed',
                      'hover:bg-green-600': state === 'completed' && isClickable,
                      'focus:ring-green-500': state === 'completed',
                      
                      // Current state
                      'bg-blue-500 text-white': state === 'current',
                      'hover:bg-blue-600': state === 'current' && isClickable,
                      'focus:ring-blue-500': state === 'current',
                      
                      // Upcoming state
                      'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400': state === 'upcoming',
                      'hover:bg-gray-300 dark:hover:bg-gray-600': state === 'upcoming' && isClickable,
                      'focus:ring-gray-400': state === 'upcoming',
                      
                      // Clickable
                      'cursor-pointer': isClickable,
                      'cursor-not-allowed opacity-50': !isClickable,
                    }
                  )}
                  aria-label={`Factor ${index + 1}: ${factor.name}`}
                  aria-current={state === 'current' ? 'step' : undefined}
                >
                  {state === 'completed' ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                {/* Factor Name */}
                <div className="mt-3 text-center">
                  <p
                    className={cn(
                      'text-sm font-medium transition-colors',
                      {
                        'text-green-600 dark:text-green-400': state === 'completed',
                        'text-blue-600 dark:text-blue-400': state === 'current',
                        'text-gray-600 dark:text-gray-400': state === 'upcoming',
                      }
                    )}
                  >
                    {factor.name}
                  </p>

                  {/* Progress Fraction */}
                  <p className="text-xs text-muted-foreground mt-1">
                    {factor.completedDimensions}/{factor.dimensionCount} dimensions
                  </p>
                </div>
              </div>

              {/* Connecting Line */}
              {!isLastFactor && (
                <div className="flex items-center px-4 pt-6">
                  <div
                    className={cn(
                      'h-0.5 w-full transition-all duration-200',
                      {
                        // Completed: solid green line
                        'bg-green-500': state === 'completed',
                        
                        // Current: dashed blue line
                        'border-t-2 border-dashed border-blue-500': state === 'current',
                        
                        // Upcoming: solid gray line
                        'bg-gray-300 dark:bg-gray-600': state === 'upcoming',
                      }
                    )}
                    style={
                      state === 'current'
                        ? { height: '0', borderTopWidth: '2px' }
                        : undefined
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Vertical Stepper (Mobile)
 */
function VerticalStepper({
  factors,
  currentFactorIndex,
  onFactorClick,
}: FactorStepperProps) {
  return (
    <div className="w-full py-4">
      <div className="space-y-4">
        {factors.map((factor, index) => {
          const state = getFactorState(index, factor, currentFactorIndex);
          const isClickable = isFactorClickable(index, factors, currentFactorIndex);
          const isLastFactor = index === factors.length - 1;

          return (
            <div key={factor.id} className="flex items-start gap-4">
              {/* Left side - Circle and connecting line */}
              <div className="flex flex-col items-center">
                {/* Circle with Number or Check */}
                <button
                  onClick={() => isClickable && onFactorClick(index)}
                  disabled={!isClickable}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2',
                    {
                      // Completed state
                      'bg-green-500 text-white': state === 'completed',
                      'active:bg-green-600': state === 'completed' && isClickable,
                      'focus:ring-green-500': state === 'completed',
                      
                      // Current state
                      'bg-blue-500 text-white': state === 'current',
                      'active:bg-blue-600': state === 'current' && isClickable,
                      'focus:ring-blue-500': state === 'current',
                      
                      // Upcoming state
                      'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400': state === 'upcoming',
                      'active:bg-gray-300 dark:active:bg-gray-600': state === 'upcoming' && isClickable,
                      'focus:ring-gray-400': state === 'upcoming',
                      
                      // Clickable
                      'cursor-pointer': isClickable,
                      'cursor-not-allowed opacity-50': !isClickable,
                    }
                  )}
                  aria-label={`Factor ${index + 1}: ${factor.name}`}
                  aria-current={state === 'current' ? 'step' : undefined}
                >
                  {state === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                {/* Vertical Connecting Line */}
                {!isLastFactor && (
                  <div
                    className={cn(
                      'w-0.5 flex-1 my-2 transition-all duration-200',
                      {
                        // Completed: solid green line
                        'bg-green-500': state === 'completed',
                        
                        // Current: dashed blue line
                        'border-l-2 border-dashed border-blue-500': state === 'current',
                        
                        // Upcoming: solid gray line
                        'bg-gray-300 dark:bg-gray-600': state === 'upcoming',
                      }
                    )}
                    style={
                      state === 'current'
                        ? { width: '0', minHeight: '32px', borderLeftWidth: '2px' }
                        : { minHeight: '32px' }
                    }
                  />
                )}
              </div>

              {/* Right side - Factor Info */}
              <div className="flex-1 pt-2 pb-4">
                <p
                  className={cn(
                    'text-base font-medium transition-colors',
                    {
                      'text-green-600 dark:text-green-400': state === 'completed',
                      'text-blue-600 dark:text-blue-400': state === 'current',
                      'text-gray-600 dark:text-gray-400': state === 'upcoming',
                    }
                  )}
                >
                  {factor.name}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {factor.completedDimensions}/{factor.dimensionCount} dimensions
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
