/**
 * Evaluation Header Component
 * 
 * Enterprise-grade header with clear role information and progress tracking.
 * 
 * Features:
 * - Prominent display of role being evaluated
 * - Clear visual hierarchy with icons
 * - Smooth animations and transitions
 * - Responsive design with mobile optimization
 * - Professional backdrop blur effect
 */

'use client';

import { X, ChevronRight, Building2, Briefcase, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EvaluationHeaderProps {
  /** Position title to display */
  positionTitle: string;
  /** Position code identifier */
  positionCode: string;
  /** Department name (optional) */
  departmentName: string | null;
  /** Number of dimensions completed */
  completedDimensions: number;
  /** Total number of dimensions */
  totalDimensions: number;
  /** Callback when exit button is clicked */
  onExit: () => void;
}

/**
 * EvaluationHeader Component
 * 
 * Professional sticky header with enterprise-grade design
 */
export function EvaluationHeader({
  positionTitle,
  positionCode,
  departmentName,
  completedDimensions,
  totalDimensions,
  onExit,
}: EvaluationHeaderProps) {
  // Calculate progress percentage
  const progressPercentage = totalDimensions > 0
    ? Math.round((completedDimensions / totalDimensions) * 100)
    : 0;

  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-50 bg-gradient-to-b from-background via-background to-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Left side - Role Information */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {/* Icon with gradient background */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shrink-0"
            >
              <Briefcase className="h-5 w-5 text-primary" />
            </motion.div>

            {/* Role Details */}
            <div className="flex flex-col min-w-0 flex-1">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="flex items-center gap-2 mb-1"
              >
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Position Evaluation
                </span>
                <Badge variant="outline" className="text-xs h-5">
                  {completedDimensions}/{totalDimensions} Complete
                </Badge>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
                className="text-lg font-bold tracking-tight truncate bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
              >
                {positionTitle}
              </motion.h1>
              
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5"
              >
                <span className="font-medium">{positionCode}</span>
                {departmentName && (
                  <>
                    <ChevronRight className="h-3 w-3" />
                    <Building2 className="h-3 w-3" />
                    <span className="truncate">{departmentName}</span>
                  </>
                )}
              </motion.div>
            </div>
          </div>

          {/* Center - Progress */}
          <div className="hidden md:flex items-center gap-3 px-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-muted-foreground">
                {completedDimensions}/{totalDimensions}
              </span>
            </div>
            <motion.div 
              className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </motion.div>
          </div>

          {/* Right side - Actions */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.3 }}
            className="flex items-center gap-2 shrink-0"
          >
            <KeyboardShortcutsHelp />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onExit}
              className="gap-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Save & Exit</span>
            </Button>
          </motion.div>
        </div>

        {/* Mobile Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="md:hidden pb-3"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Progress
            </span>
            <span className="text-xs font-semibold text-foreground">
              {progressPercentage}%
            </span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-primary to-primary/80 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

