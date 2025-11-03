/**
 * DimensionQuestionCard Component
 * 
 * Enterprise-focused evaluation card with clear context and hierarchy.
 * Features prominent dimension information and focused questionnaire layout.
 */

'use client';

import { QuestionnaireCard } from './QuestionnaireCard';
import { Badge } from '@/components/ui/badge';
import type { DimensionAnswers } from '@/lib/types/questions';
import type { Dimension } from '@/lib/types/evaluation';
import { motion } from 'framer-motion';

interface DimensionQuestionCardProps {
  dimension: Dimension;
  onComplete: (dimensionId: string, resultingLevel: number, answers: DimensionAnswers) => void;
  isSaving: boolean;
  initialAnswers?: DimensionAnswers;
  className?: string;
}

export function DimensionQuestionCard({
  dimension,
  onComplete,
  isSaving,
  initialAnswers,
  className,
}: DimensionQuestionCardProps) {
  const dimensionName = dimension.translations[0]?.name || dimension.code;
  const dimensionDescription = dimension.translations[0]?.description;

  const handleQuestionnaireComplete = (
    resultingLevel: number,
    answers: DimensionAnswers
  ) => {
    onComplete(dimension.id, resultingLevel, answers);
  };

  return (
    <div className={className}>
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mx-auto max-w-4xl space-y-6"
      >
        <section className="rounded-xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
              Evaluation dimension
            </p>
            <div>
              <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
                {dimensionName}
              </h2>
              <Badge variant="outline" className="mt-2 text-xs font-medium">
                {dimension.code}
              </Badge>
            </div>
            {dimensionDescription && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {dimensionDescription}
              </p>
            )}
          </div>
        </section>

        <QuestionnaireCard
          dimensionId={dimension.id}
          onComplete={handleQuestionnaireComplete}
          initialAnswers={initialAnswers}
          isSaving={isSaving}
        />
      </motion.section>
    </div>
  );
}

