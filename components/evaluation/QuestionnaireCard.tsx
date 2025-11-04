/**
 * QuestionnaireCard Component
 * 
 * Clean, focused questionnaire with enterprise design.
 * Emphasizes clarity and reduces cognitive load.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, AlertCircle, HelpCircle, Check } from 'lucide-react';
import { executeQuery } from '@/lib/nhost/graphql/client';
import { GET_DIMENSION_QUESTIONS } from '@/lib/nhost/graphql/queries/questions';
import type { Question, QuestionOption, DimensionAnswers } from '@/lib/types/questions';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface QuestionnaireCardProps {
  dimensionId: string;
  onComplete: (resultingLevel: number, answers: DimensionAnswers) => void;
  initialAnswers?: DimensionAnswers;
  isSaving: boolean;
  locale?: string;
  totalQuestionsAcrossAllDimensions?: number;
  currentQuestionIndexAcrossAllDimensions?: number;
}

interface GetDimensionQuestionsResponse {
  questions: Question[];
}

export function QuestionnaireCard({
  dimensionId,
  onComplete,
  initialAnswers = {},
  isSaving,
  locale = 'en',
  totalQuestionsAcrossAllDimensions,
  currentQuestionIndexAcrossAllDimensions,
}: QuestionnaireCardProps) {
  const t = useTranslations('Questionnaire');
  const [currentQuestionKey, setCurrentQuestionKey] = useState('q1');
  const [answers, setAnswers] = useState<DimensionAnswers>(initialAnswers);
  const [questionsMap, setQuestionsMap] = useState<Map<string, Question>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all questions for this dimension
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await executeQuery<GetDimensionQuestionsResponse>(
          GET_DIMENSION_QUESTIONS,
          { dimensionId, language: locale }
        );

        if (!data.questions || data.questions.length === 0) {
          setError('No questions found for this dimension');
          return;
        }

        // Build questions map
        const map = new Map<string, Question>();
        data.questions.forEach((q: Question) => {
          map.set(q.question_key, q);
        });
        setQuestionsMap(map);
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [dimensionId, locale]);

  // Restore state from initialAnswers
  useEffect(() => {
    if (Object.keys(initialAnswers).length > 0) {
      setAnswers(initialAnswers);
      // Calculate which question to show based on answers
      // This allows resuming from where user left off
      const lastQuestionKey = Object.keys(initialAnswers).sort().pop();
      if (lastQuestionKey) {
        setCurrentQuestionKey(lastQuestionKey);
      }
    }
  }, [initialAnswers]);

  const handleAnswer = (optionKey: string, option: QuestionOption) => {
    // Store the answer
    const newAnswers = {
      ...answers,
      [currentQuestionKey]: optionKey,
    };
    setAnswers(newAnswers);

    // Check if this is a terminal node (resulting_level is set)
    if (option.resulting_level !== null) {
      // Complete! Call onComplete with resulting level and answers
      onComplete(option.resulting_level, newAnswers);
    } else if (option.next_question_key) {
      // Navigate to next question
      setCurrentQuestionKey(option.next_question_key);
    }
  };

  const handleBack = () => {
    const questionKeys = Object.keys(answers).sort();
    if (questionKeys.length > 0) {
      const lastQuestionKey = questionKeys.pop() as string;
      const newAnswers = { ...answers };
      delete newAnswers[lastQuestionKey];
      setAnswers(newAnswers);
      setCurrentQuestionKey(lastQuestionKey);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="border-none shadow-none">
          <CardHeader className="space-y-4">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentQuestion = questionsMap.get(currentQuestionKey);

  if (!currentQuestion) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Question not found: {currentQuestionKey}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isFirstQuestion = currentQuestionKey === 'q1';

  // Calculate current question number
  const questionNumber = currentQuestion.order_index + 1;
  const totalQuestions = questionsMap.size;

  // Use global question numbers if provided, otherwise fall back to dimension-specific
  const displayQuestionNumber = currentQuestionIndexAcrossAllDimensions !== undefined
    ? currentQuestionIndexAcrossAllDimensions + questionNumber
    : questionNumber;
  const displayTotalQuestions = totalQuestionsAcrossAllDimensions || totalQuestions;

  // Get next question for preview
  const getNextQuestionKey = (currentKey: string): string | null => {
    const currentQ = questionsMap.get(currentKey);
    if (!currentQ) return null;
    
    // Get the first option's next question key (for preview purposes)
    const firstOption = Object.values(currentQ.options)[0];
    return firstOption?.next_question_key || null;
  };

  const nextQuestionKey = getNextQuestionKey(currentQuestionKey);
  const nextQuestion = nextQuestionKey ? questionsMap.get(nextQuestionKey) : null;

  // Calculate next question display numbers
  const nextQuestionNumber = nextQuestion ? nextQuestion.order_index + 1 : 0;
  const displayNextQuestionNumber = currentQuestionIndexAcrossAllDimensions !== undefined
    ? currentQuestionIndexAcrossAllDimensions + nextQuestionNumber
    : nextQuestionNumber;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Current Question Card with Carousel Effect */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionKey}
          initial={{ opacity: 0, x: 620 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -620 }}
          transition={{ duration: 0.6, ease: [0.4, 0.0, 0.2, 1] }}
        >
          <div className="rounded-2xl border-2 border-border bg-card p-8 shadow-lg">
            <div className="space-y-8">
              {/* Question Header */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                    {t('questionCounter', { current: displayQuestionNumber, total: displayTotalQuestions })}
                  </p>
                </div>
                <h3 className="text-2xl font-semibold leading-relaxed text-foreground sm:text-3xl">
                  {currentQuestion.translations[0]?.text || 'Question'}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('helperText')}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {Object.entries(currentQuestion.options).map(([optionKey, option]) => (
                  <OptionButton
                    key={optionKey}
                    optionKey={optionKey}
                    option={option}
                    onSelect={handleAnswer}
                    isSelected={answers[currentQuestionKey] === optionKey}
                    isSaving={isSaving && option.resulting_level !== null}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

interface OptionButtonProps {
  optionKey: string;
  option: QuestionOption;
  onSelect: (optionKey: string, option: QuestionOption) => void;
  isSelected: boolean;
  isSaving: boolean;
}

function OptionButton({ optionKey, option, onSelect, isSelected, isSaving }: OptionButtonProps) {
  const isTerminal = option.resulting_level !== null;
  const optionText = option.translations[0]?.label || option.option_key;

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(optionKey, option)}
      disabled={isSaving}
      className={cn(
        'group relative w-full rounded-xl border-2 px-6 py-4 text-left transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isSelected
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-border bg-background hover:border-primary/50 hover:shadow-sm',
        isSaving && isSelected ? 'cursor-wait opacity-70' : 'cursor-pointer'
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {isSelected ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            </motion.div>
          ) : (
            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/40 transition-colors group-hover:border-primary/60" />
          )}
        </div>
        <div className="flex-1">
          <p className={cn(
            "text-[15px] font-medium leading-relaxed transition-colors",
            isSelected ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"
          )}>
            {optionText}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
