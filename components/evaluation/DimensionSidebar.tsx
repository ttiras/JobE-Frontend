'use client';

import { useState } from 'react';
import { List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { FactorComponent } from '@/components/evaluation/Factor';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('pages.evaluation');
  // Mobile sheet open state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Handle dimension click (close mobile sheet)
  const handleDimensionClick = (dimensionId: string) => {
    onDimensionClick(dimensionId);
    setMobileOpen(false);
  };

  const currentFactorId = getFactorIdForDimension(factors, currentDimensionId);

  const sidebarContent = (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        {factors.map((factor) => {
          const completedCount = factor.dimensions.filter(d => d.completed).length;
          const totalCount = factor.dimensions.length;
          const isCurrentFactor = factor.id === currentFactorId;

          return (
            <FactorComponent
              key={factor.id}
              factor={factor}
              isCurrent={isCurrentFactor}
              onClick={() => {
                if (factor.dimensions.length > 0) {
                  handleDimensionClick(factor.dimensions[0].id);
                }
              }}
              completedCount={completedCount}
              totalCount={totalCount}
              currentDimensionId={currentDimensionId}
              onDimensionClick={handleDimensionClick}
            />
          );
        })}
      </div>
    </ScrollArea>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block">
        <motion.div 
          className="sticky top-24 space-y-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {/* Sidebar Header Label - Matches DimensionHeader "Dimensions" Label */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
            <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest">
              {t('sidebarTitle', { defaultValue: 'Factors' })}
            </h3>
          </div>
          
          {/* Factor List */}
          <div>{sidebarContent}</div>
        </motion.div>
      </aside>

      {/* Mobile - Floating Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        className="lg:hidden fixed bottom-6 right-6 z-50"
      >
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className="h-14 w-14 rounded-full border-primary/30 bg-primary/10 p-0 shadow-lg shadow-primary/20 transition hover:shadow-xl hover:shadow-primary/30 hover:bg-primary/15"
            >
              <span className="sr-only">Open navigator</span>
              <List className="h-6 w-6 text-primary" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[360px] p-0">
            <SheetHeader className="px-6 py-4 border-b">
              <SheetTitle className="text-lg text-foreground">{t('navigation', { defaultValue: 'Navigation' })}</SheetTitle>
            </SheetHeader>
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </motion.div>
    </>
  );
}
