/**
 * Evaluation Context Bar Component
 * 
 * Persistent context indicator showing the user's current location in the evaluation process.
 * Provides clear visibility of: Role, Factor, and Dimension
 * 
 * Features:
 * - Always visible below header
 * - Three-tier breadcrumb: Role → Factor → Dimension
 * - Visual progress indicators
 * - Smooth transitions between contexts
 * - Enterprise-grade design
 */

'use client';

import { Building2, Target, CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface EvaluationContextBarProps {
  /** Position title being evaluated */
  positionTitle: string;
  /** Position code */
  positionCode: string;
  /** Department name (optional) */
  departmentName?: string | null;
  /** Current factor name */
  currentFactorName: string;
  /** Current factor progress (e.g., "2/4 dimensions") */
  factorProgress: string;
  /** Current dimension name */
  currentDimensionName: string;
  /** Current dimension number */
  currentDimensionNumber: number;
  /** Total dimensions in evaluation */
  totalDimensions: number;
  /** Overall completion percentage */
  completionPercentage: number;
}

export function EvaluationContextBar({
  positionTitle,
  positionCode,
  departmentName,
  currentFactorName,
  factorProgress,
  currentDimensionName,
  currentDimensionNumber,
  totalDimensions,
  completionPercentage,
}: EvaluationContextBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-16 z-40 bg-gradient-to-br from-background via-background to-muted/20 border-b border-border/50 shadow-sm"
    >
      <div className="container mx-auto px-4 lg:px-8">
        {/* Main Context Bar */}
        <div className="py-4 space-y-3">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Role Context */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/10"
            >
              <Building2 className="h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  Evaluating Role
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {positionTitle}
                  <span className="text-muted-foreground ml-1.5">({positionCode})</span>
                </span>
              </div>
            </motion.div>

            {/* Separator */}
            <div className="h-8 w-px bg-border/50" />

            {/* Factor Context */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFactorName}
                initial={{ scale: 0.95, opacity: 0, x: -10 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ scale: 0.95, opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/5 rounded-lg border border-blue-500/10"
              >
                <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium">
                    Current Factor
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {currentFactorName}
                    </span>
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">
                      {factorProgress}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Separator */}
            <div className="h-8 w-px bg-border/50" />

            {/* Dimension Context */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentDimensionName}
                initial={{ scale: 0.95, opacity: 0, x: -10 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ scale: 0.95, opacity: 0, x: 10 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/5 rounded-lg border border-purple-500/10"
              >
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium">
                    Current Dimension
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {currentDimensionName}
                    </span>
                    <Badge variant="outline" className="text-xs h-5 px-1.5">
                      {currentDimensionNumber}/{totalDimensions}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
              />
            </div>
            <motion.span
              key={completionPercentage}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-sm font-semibold text-foreground min-w-[3rem] text-right"
            >
              {completionPercentage}%
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Mobile-optimized version of the Context Bar
 * Displays in a more compact format for smaller screens
 */
export function EvaluationContextBarMobile({
  positionTitle,
  positionCode,
  currentFactorName,
  currentDimensionName,
  currentDimensionNumber,
  totalDimensions,
  completionPercentage,
}: Omit<EvaluationContextBarProps, 'departmentName' | 'factorProgress'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-16 z-40 bg-gradient-to-br from-background via-background to-muted/20 border-b border-border/50 shadow-sm"
    >
      <div className="px-4 py-3 space-y-2">
        {/* Compact Role Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-sm font-semibold truncate">
              {positionTitle}
            </span>
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">
            {completionPercentage}%
          </Badge>
        </div>

        {/* Current Factor & Dimension */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentFactorName}-${currentDimensionName}`}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Target className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            <span className="truncate">{currentFactorName}</span>
            <span>→</span>
            <Sparkles className="h-3 w-3 text-purple-600 dark:text-purple-400" />
            <span className="truncate">{currentDimensionName}</span>
            <span className="text-xs shrink-0">
              ({currentDimensionNumber}/{totalDimensions})
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}
