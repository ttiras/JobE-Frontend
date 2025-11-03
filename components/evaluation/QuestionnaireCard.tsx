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

interface QuestionnaireCardProps {
  dimensionId: string;
  onComplete: (resultingLevel: number, answers: DimensionAnswers) => void;
  initialAnswers?: DimensionAnswers;
  isSaving: boolean;
}

interface GetDimensionQuestionsResponse {
  questions: Question[];
}

export function QuestionnaireCard({
  dimensionId,
  onComplete,
  initialAnswers = {},
  isSaving,
}: QuestionnaireCardProps) {
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
          { dimensionId, language: 'en' } // FIXME: Hardcoded language
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
  }, [dimensionId]);

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

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="overflow-hidden border-border/60 bg-card/80 shadow-lg backdrop-blur-sm">
        <CardHeader className="border-b border-border/60 bg-muted/30 p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              {currentQuestion.translations[0]?.text || 'Question'}
            </CardTitle>
            <Badge variant="secondary" className="font-mono text-xs">
              {currentQuestion.question_key.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionKey}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="space-y-4"
            >
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
            </motion.div>
          </AnimatePresence>
        </CardContent>
        <div className="flex items-center justify-end gap-3 border-t border-border/60 bg-muted/30 p-4">
          {!isFirstQuestion && (
            <Button variant="ghost" size="sm" onClick={handleBack} disabled={isSaving}>
              Back
            </Button>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <HelpCircle className="h-4 w-4" />
            <span>Your progress is saved automatically.</span>
          </div>
        </div>
      </Card>
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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(optionKey, option)}
      disabled={isSaving}
      className={cn(
        'w-full rounded-lg border p-5 text-left transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isSelected
          ? 'border-primary/80 bg-primary/10 ring-2 ring-primary/60'
          : 'border-border/70 bg-background/50 hover:border-primary/60 hover:bg-muted/50',
        isSaving && isSelected ? 'cursor-wait' : ''
      )}
    >
      <div className="flex items-start gap-4">
        <div className="mt-1">
          {isSelected ? (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground/60" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">{optionText}</p>
        </div>
        {isTerminal && (
          <div className="flex items-center gap-2">
            {isSaving && isSelected ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="h-5 w-5"
              >
                <Check className="h-5 w-5 animate-spin" />
              </motion.div>
            ) : (
              <Badge variant={isSelected ? 'default' : 'secondary'}>
                Level {option.resulting_level}
              </Badge>
            )}
          </div>
        )}
      </div>
    </motion.button>
  );
}
