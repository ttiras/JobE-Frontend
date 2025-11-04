/**
 * EvaluationNavigationLayout Component
 * 
 * Modern horizontal progress tracker layout
 * Shows factors and dimensions in a clean top bar
 */

'use client';

import { motion } from 'framer-motion';
import { HorizontalFactorStepper } from './HorizontalFactorStepper';
import { DimensionHeader } from './DimensionHeader';

interface FactorGroup {
  id: string;
  name: string;
  code: string;
  orderIndex: number;
  dimensions: {
    id: string;
    name: string;
    code: string;
    orderIndex: number;
    completed: boolean;
    selectedLevel: number | null;
  }[];
}

interface EvaluationNavigationLayoutProps {
  /** Array of factors with dimensions */
  factors: FactorGroup[];
  /** Currently selected dimension ID */
  currentDimensionId: string;
  /** Dimension name */
  currentDimensionName: string;
  /** Current step within the factor (1-based) */
  currentStep: number;
  /** Total steps in the current factor */
  totalSteps: number;
  /** Callback when dimension is clicked */
  onDimensionClick: (dimensionId: string) => void;
  /** Total completed dimensions count */
  totalCompleted: number;
  /** Total dimensions count */
  totalDimensions: number;
  /** Child content (questions, etc.) */
  children: React.ReactNode;
}

export function EvaluationNavigationLayout({
  factors,
  currentDimensionId,
  currentDimensionName,
  currentStep,
  totalSteps,
  onDimensionClick,
  totalCompleted,
  totalDimensions,
  children,
}: EvaluationNavigationLayoutProps) {
  // Get all dimensions from all factors for the dimension carousel
  const allDimensions = factors.flatMap(factor => factor.dimensions);

  // Find current factor and dimension indices
  const currentFactorIndex = factors.findIndex(factor =>
    factor.dimensions.some(d => d.id === currentDimensionId)
  );
  const currentDimensionIndex = allDimensions.findIndex(d => d.id === currentDimensionId);

  return (
    <div className="container mx-auto flex max-w-full flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
      {/* Ultra-Compact Horizontal Progress Tracker */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative px-3 py-2 overflow-hidden flex items-center"
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-background px-4 py-3 md:px-8 md:py-6">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Factors {currentFactorIndex >= 0 && `${currentFactorIndex + 1} of ${factors.length}`}
          </p>
        </div>
        <HorizontalFactorStepper
          factors={factors}
          currentDimensionId={currentDimensionId}
          onDimensionClick={onDimensionClick}
        />
      </motion.div>

      {/* Divider */}
      <div className="w-full border-b" />

      {/* Dimension Context Header - Carousel */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease: 'easeOut' }}
        className="relative px-3 py-2 overflow-hidden flex items-center"
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-background px-4 py-3 md:px-8 md:py-6">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Dimensions {currentDimensionIndex >= 0 && `${currentDimensionIndex + 1} of ${allDimensions.length}`}
          </p>
        </div>
        <DimensionHeader
          dimensions={allDimensions}
          currentDimensionId={currentDimensionId}
          onDimensionClick={onDimensionClick}
        />
      </motion.div>

      {/* Content Area */}
      <main className="mx-auto w-full max-w-4xl mt-12">
        <div className="space-y-4">
          {/* Content Area (Questions, etc.) */}
          {children}
        </div>
      </main>
    </div>
  );
}
