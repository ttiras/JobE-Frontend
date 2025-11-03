/**
 * NavigationButtons Component
 * 
 * Beautiful floating action bar with smooth animations and clear visual feedback.
 * Fixed at the bottom of the screen for easy access.
 */

'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface NavigationButtonsProps {
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isNextLoading: boolean;
  showSaveAndExit?: boolean;
  onSaveAndExit?: () => void;
  isLastDimension?: boolean;
}

export function NavigationButtons({
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  isNextLoading,
  showSaveAndExit = false,
  onSaveAndExit,
  isLastDimension = false,
}: NavigationButtonsProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/80 backdrop-blur-lg"
    >
      <div className="container mx-auto px-4 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4 max-w-3xl mx-auto">
          {/* Previous Button */}
          <motion.div
            whileHover={{ scale: canGoPrevious ? 1.05 : 1 }}
            whileTap={{ scale: canGoPrevious ? 0.95 : 1 }}
          >
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              size="lg"
              className={cn(
                'h-12 px-6 transition-all duration-300',
                canGoPrevious && 'hover:shadow-lg',
                !canGoPrevious && 'opacity-40'
              )}
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
          </motion.div>
          
          {/* Right Side Buttons */}
          <div className="flex items-center gap-3">
            {/* Optional Save Draft Button */}
            {showSaveAndExit && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="ghost" 
                  onClick={onSaveAndExit}
                  size="lg"
                  className="h-12 px-4 hover:bg-muted transition-all duration-300"
                >
                  <Save className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Save Draft</span>
                </Button>
              </motion.div>
            )}
            
            {/* Save & Next / Finalize Button */}
            <motion.div
              whileHover={{ scale: canGoNext && !isNextLoading ? 1.05 : 1 }}
              whileTap={{ scale: canGoNext && !isNextLoading ? 0.95 : 1 }}
            >
              <Button
                onClick={onNext}
                disabled={!canGoNext || isNextLoading}
                size="lg"
                className={cn(
                  'h-12 px-6 relative overflow-hidden transition-all duration-300',
                  canGoNext && !isNextLoading && 'shadow-lg hover:shadow-xl',
                  isLastDimension && 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400',
                  (!canGoNext || isNextLoading) && 'opacity-50'
                )}
              >
                {/* Background shimmer effect for last dimension */}
                {isLastDimension && canGoNext && !isNextLoading && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: [-200, 200] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  />
                )}
                
                <div className="relative flex items-center gap-2">
                  {isNextLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="hidden sm:inline">
                        {isLastDimension ? 'Completing...' : 'Saving...'}
                      </span>
                    </>
                  ) : (
                    <>
                      {isLastDimension && <Sparkles className="h-4 w-4" />}
                      <span className="font-medium">
                        {isLastDimension ? 'Complete Evaluation' : 'Save & Next'}
                      </span>
                      {isLastDimension ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </>
                  )}
                </div>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

