/**
 * NavigationButtons Component
 * 
 * Beautiful floating action bar with smooth animations and clear visual feedback.
 * Fixed at the bottom of the screen for easy access.
 */

'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface NavigationButtonsProps {
  onPrevious: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
  isSaving: boolean;
}

export function NavigationButtons({
  onPrevious,
  onNext,
  isFirst,
  isLast,
  isSaving,
}: NavigationButtonsProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
      className="sticky bottom-4 z-10 mt-6"
    >
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-background/80 p-4 backdrop-blur-lg">
        {/* Previous Button */}
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isFirst || isSaving}
          size="lg"
          className="h-12 px-6"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Previous
        </Button>

        {/* Save & Next / Finalize Button */}
        <Button
          onClick={onNext}
          disabled={isSaving}
          size="lg"
          className={cn(
            'h-12 px-6',
            isLast && 'bg-green-600 hover:bg-green-700'
          )}
        >
          {isSaving && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {isLast ? (
            <>
              <CheckCircle className="mr-2 h-5 w-5" />
              Finalize & Complete
            </>
          ) : (
            <>
              Save & Next
              <ChevronRight className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

