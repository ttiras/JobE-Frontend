/**
 * DimensionQuestionCard Component
 * 
 * Enterprise-focused evaluation card with clear context and hierarchy.
 * Features prominent dimension information and focused questionnaire layout.
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { QuestionnaireCard } from './QuestionnaireCard';
import { Badge } from '@/components/ui/badge';
import type { DimensionAnswers } from '@/lib/types/questions';
import type { Dimension } from '@/lib/types/evaluation';
import { motion } from 'framer-motion';
import { Target, Info, Sparkles } from 'lucide-react';

interface DimensionQuestionCardProps {
  dimension: Dimension;
  language: string;
  onComplete: (dimensionId: string, resultingLevel: number, answers: DimensionAnswers) => void;
  initialAnswers?: DimensionAnswers;
  className?: string;
  /** Current dimension number in the overall evaluation */
  dimensionNumber?: number;
  /** Total number of dimensions in the evaluation */
  totalDimensions?: number;
}

export function DimensionQuestionCard({
  dimension,
  language,
  onComplete,
  initialAnswers,
  className,
  dimensionNumber,
  totalDimensions,
}: DimensionQuestionCardProps) {
  const dimensionName = dimension.translations.find(
    (t) => t.language === language
  )?.name || dimension.code;

  const dimensionDescription = dimension.translations.find(
    (t) => t.language === language
  )?.description;

  const handleQuestionnaireComplete = (
    resultingLevel: number,
    answers: DimensionAnswers
  ) => {
    onComplete(dimension.id, resultingLevel, answers);
  };

  return (
    <div className={className}>
      {/* Enterprise Dimension Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mb-8"
      >
        <div className="max-w-4xl mx-auto">
          {/* Progress Badge */}
          {dimensionNumber && totalDimensions && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex items-center gap-2 mb-4"
            >
              <Badge variant="secondary" className="text-sm px-3 py-1">
                <Target className="h-3.5 w-3.5 mr-1.5" />
                Dimension {dimensionNumber} of {totalDimensions}
              </Badge>
              <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden max-w-xs">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(dimensionNumber / totalDimensions) * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
                  className="h-full bg-primary"
                />
              </div>
            </motion.div>
          )}
          
          {/* Dimension Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="space-y-3"
          >
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 shrink-0">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                  {dimensionName}
                </h2>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Evaluation Dimension • {dimension.code}
                </p>
              </div>
            </div>
            
            {/* Description */}
            {dimensionDescription && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.3 }}
                className="flex gap-3 p-4 bg-muted/30 border border-border/50 rounded-lg"
              >
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {dimensionDescription}
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Questionnaire Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="max-w-4xl mx-auto"
      >
        <QuestionnaireCard
          dimensionId={dimension.id}
          language={language}
          onComplete={handleQuestionnaireComplete}
          initialAnswers={initialAnswers}
        />
      </motion.div>
    </div>
  );
}

