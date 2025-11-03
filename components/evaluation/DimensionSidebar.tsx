/**
 * Dimension Sidebar Navigator
 * 
 * Elegant, minimalist sidebar that's collapsed by default.
 * Features smooth animations and a floating button for quick access.
 * 
 * Features:
 * - Hidden by default for distraction-free experience
 * - Floating button with progress indicator
 * - Smooth slide-in animations
 * - Responsive design
 */

'use client';

import { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Check,
  Circle,
  ArrowRight,
  Menu,
  List,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

interface DimensionItem {
  /** Dimension unique identifier */
  id: string;
  /** Dimension display name */
  name: string;
  /** Dimension code */
  code: string;
  /** Dimension order in sequence */
  orderIndex: number;
  /** Whether dimension has been completed */
  completed: boolean;
  /** Selected level (null if not answered) */
  selectedLevel: number | null;
}

interface FactorGroup {
  /** Factor unique identifier */
  id: string;
  /** Factor display name */
  name: string;
  /** Factor code */
  code: string;
  /** Factor order in sequence */
  orderIndex: number;
  /** Dimensions in this factor */
  dimensions: DimensionItem[];
}

interface DimensionSidebarProps {
  /** Array of factors with dimensions */
  factors: FactorGroup[];
  /** Currently selected dimension ID */
  currentDimensionId: string;
  /** Callback when dimension is clicked */
  onDimensionClick: (dimensionId: string) => void;
  /** Total completed dimensions count (for mobile button) */
  totalCompleted?: number;
  /** Total dimensions count (for mobile button) */
  totalDimensions?: number;
}

/**
 * Get the factor ID containing a specific dimension
 */
function getFactorIdForDimension(
  factors: FactorGroup[],
  dimensionId: string
): string | null {
  for (const factor of factors) {
    if (factor.dimensions.some((d) => d.id === dimensionId)) {
      return factor.id;
    }
  }
  return null;
}

/**
 * Dimension Sidebar Navigator
 */
export function DimensionSidebar({
  factors,
  currentDimensionId,
  onDimensionClick,
  totalCompleted = 0,
  totalDimensions = 0,
}: DimensionSidebarProps) {
  // Track which factors are expanded
  const [expandedFactors, setExpandedFactors] = useState<Set<string>>(new Set());
  
  // Mobile sheet open state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-expand factor containing current dimension
  useEffect(() => {
    const currentFactorId = getFactorIdForDimension(factors, currentDimensionId);
    if (currentFactorId) {
      setExpandedFactors((prev) => new Set(prev).add(currentFactorId));
    }
  }, [currentDimensionId, factors]);

  // Toggle factor expansion
  const toggleFactor = (factorId: string) => {
    setExpandedFactors((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(factorId)) {
        newExpanded.delete(factorId);
      } else {
        newExpanded.add(factorId);
      }
      return newExpanded;
    });
  };

  // Handle dimension click (close mobile sheet)
  const handleDimensionClick = (dimensionId: string) => {
    onDimensionClick(dimensionId);
    setMobileOpen(false);
  };

  // Sidebar content (shared between desktop and mobile)
  const sidebarContent = (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-4">
        {factors.map((factor) => {
          const isExpanded = expandedFactors.has(factor.id);
          const completedCount = factor.dimensions.filter((d) => d.completed).length;
          const totalCount = factor.dimensions.length;

          return (
            <div key={factor.id} className="space-y-1">
              {/* Factor Header */}
              <button
                onClick={() => toggleFactor(factor.id)}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-3 py-2',
                  'rounded-md hover:bg-accent transition-colors',
                  'text-sm font-medium'
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate">{factor.name}</span>
                </div>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {completedCount}/{totalCount}
                </Badge>
              </button>

              {/* Dimensions List */}
              {isExpanded && (
                <div className="ml-6 space-y-1 animate-in slide-in-from-top-2 duration-200">
                  {factor.dimensions.map((dimension) => {
                    const isCurrent = dimension.id === currentDimensionId;

                    return (
                      <button
                        key={dimension.id}
                        onClick={() => handleDimensionClick(dimension.id)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2',
                          'rounded-md transition-all duration-150',
                          'text-sm group',
                          {
                            // Current dimension
                            'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800':
                              isCurrent,
                            'font-semibold text-blue-700 dark:text-blue-300': isCurrent,

                            // Completed dimension
                            'hover:bg-green-50 dark:hover:bg-green-950/50':
                              dimension.completed && !isCurrent,
                            'text-green-700 dark:text-green-400':
                              dimension.completed && !isCurrent,

                            // Not started dimension
                            'hover:bg-accent': !dimension.completed && !isCurrent,
                            'text-muted-foreground': !dimension.completed && !isCurrent,
                          }
                        )}
                      >
                        {/* Status Icon */}
                        <div className="shrink-0">
                          {isCurrent ? (
                            <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          ) : dimension.completed ? (
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </div>

                        {/* Dimension Name */}
                        <span className="flex-1 truncate text-left">{dimension.name}</span>

                        {/* Level Badge */}
                        {dimension.selectedLevel !== null && (
                          <Badge
                            variant={isCurrent ? 'default' : 'secondary'}
                            className="shrink-0 text-xs font-mono"
                          >
                            L{dimension.selectedLevel}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );

  return (
    <>
      {/* Desktop - Floating Button (Bottom Left) */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        className="hidden lg:block fixed bottom-8 left-8 z-50"
      >
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button 
              size="lg" 
              className="shadow-2xl hover:shadow-3xl transition-all duration-300 h-14 px-6 group hover:scale-105"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <List className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                  {totalCompleted < totalDimensions && (
                    <motion.div
                      className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-medium opacity-90">Progress</span>
                  <span className="text-sm font-bold">
                    {totalCompleted}/{totalDimensions}
                  </span>
                </div>
              </div>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] p-0">
            <SheetHeader className="px-6 py-4 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <SheetTitle className="text-lg">All Dimensions</SheetTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {totalCompleted} of {totalDimensions} completed
                  </p>
                </div>
              </div>
            </SheetHeader>
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </motion.div>

      {/* Mobile - Floating Button (Bottom Right) */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        className="lg:hidden fixed bottom-6 right-6 z-50"
      >
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button 
              size="lg" 
              className="shadow-2xl hover:shadow-3xl transition-all duration-300 h-14 w-14 rounded-full p-0 group hover:scale-105"
            >
              <div className="relative">
                <List className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                {totalCompleted < totalDimensions && (
                  <motion.div
                    className="absolute -top-1 -right-1 h-3 w-3 bg-background rounded-full border-2 border-primary"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
              </div>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[360px] p-0">
            <SheetHeader className="px-6 py-4 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <SheetTitle className="text-lg">All Dimensions</SheetTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {totalCompleted} of {totalDimensions} completed
                  </p>
                </div>
              </div>
            </SheetHeader>
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </motion.div>
    </>
  );
}
