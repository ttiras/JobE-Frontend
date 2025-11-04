/**
 * DimensionQuestionCard Component
 * 
 * Clean questionnaire card focused solely on the question content.
 * Header is managed separately in the parent component for better separation of concerns.
 */

'use client';

import { QuestionnaireCard } from './QuestionnaireCard';
import type { DimensionAnswers } from '@/lib/types/questions';
import type { Dimension } from '@/lib/types/evaluation';

interface DimensionQuestionCardProps {
  dimension: Dimension;
  onComplete: (dimensionId: string, resultingLevel: number, answers: DimensionAnswers) => void;
  isSaving: boolean;
  initialAnswers?: DimensionAnswers;
  className?: string;
  locale?: string;
  totalQuestionsAcrossAllDimensions?: number;
  currentQuestionIndexAcrossAllDimensions?: number;
}

export function DimensionQuestionCard({
  dimension,
  onComplete,
  isSaving,
  initialAnswers,
  className,
  locale = 'en',
  totalQuestionsAcrossAllDimensions,
  currentQuestionIndexAcrossAllDimensions,
}: DimensionQuestionCardProps) {
  const handleQuestionnaireComplete = (
    resultingLevel: number,
    answers: DimensionAnswers
  ) => {
    onComplete(dimension.id, resultingLevel, answers);
  };

  return (
    <section className={className}>
      <QuestionnaireCard
        dimensionId={dimension.id}
        onComplete={handleQuestionnaireComplete}
        initialAnswers={initialAnswers}
        isSaving={isSaving}
        locale={locale}
        totalQuestionsAcrossAllDimensions={totalQuestionsAcrossAllDimensions}
        currentQuestionIndexAcrossAllDimensions={currentQuestionIndexAcrossAllDimensions}
      />
    </section>
  );
}
