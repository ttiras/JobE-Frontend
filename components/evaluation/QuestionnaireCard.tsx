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
  language: string;
  onComplete: (resultingLevel: number, answers: DimensionAnswers) => void;
  initialAnswers?: DimensionAnswers;
}

interface GetDimensionQuestionsResponse {
  questions: Question[];
}

export function QuestionnaireCard({
  dimensionId,
  language,
  onComplete,
  initialAnswers = {},
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
          { dimensionId, language }
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
  }, [dimensionId, language]);

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

  const questionText = currentQuestion.translations[0]?.text || 'Question text missing';
  const helpText = currentQuestion.translations[0]?.help_text;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionKey}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Card className="border border-border/50 shadow-lg bg-card/50 backdrop-blur-sm">
            {/* Question Header */}
            <CardHeader className="space-y-4 pb-6 bg-gradient-to-b from-muted/30 to-transparent">
              {/* Progress Badge */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="flex items-center justify-between"
              >
                <Badge variant="outline" className="text-sm gap-2 px-3 py-1">
                  <Circle className="h-3.5 w-3.5 fill-current text-primary" />
                  Question {currentQuestion.order_index}
                </Badge>
                
                {answeredCount > 0 && (
                  <Badge variant="secondary" className="text-xs gap-1.5 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    {answeredCount} answered
                  </Badge>
                )}
              </motion.div>

              {/* Question Text */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="space-y-3"
              >
                <h3 className="text-2xl md:text-3xl font-bold leading-tight text-foreground">
                  {questionText}
                </h3>
                
                {/* Help Text */}
                {helpText && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.3 }}
                    className="flex gap-2.5 p-3 bg-muted/50 border border-border/30 rounded-lg"
                  >
                    <HelpCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {helpText}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </CardHeader>

            {/* Answer Options */}
            <CardContent className="space-y-3 pb-6">
              {currentQuestion.options.map((option, index) => {
                const optionText = option.translations[0]?.label || option.option_key;
                const isSelected = answers[currentQuestionKey] === option.option_key;

                return (
                  <motion.div
                    key={option.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
                  >
                    <Button
                      variant={isSelected ? 'default' : 'outline'}
                      className={cn(
                        'group w-full h-auto min-h-[72px] flex items-center justify-between gap-4 p-5 text-left',
                        'relative overflow-hidden transition-all duration-200',
                        'hover:scale-[1.01] hover:shadow-md active:scale-[0.99]',
                        isSelected && 'ring-2 ring-primary/50 shadow-md bg-primary hover:bg-primary'
                      )}
                      onClick={() => handleAnswer(option.option_key, option)}
                    >
                      {/* Subtle background effect */}
                      {!isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      )}

                      {/* Option Text */}
                      <span className={cn(
                        'text-base font-medium relative z-10 flex-1',
                        isSelected ? 'text-primary-foreground' : 'text-foreground'
                      )}>
                        {optionText}
                      </span>

                      {/* Selection Indicator */}
                      <motion.div
                        initial={false}
                        animate={{ 
                          scale: isSelected ? [1, 1.2, 1] : 1,
                          rotate: isSelected ? [0, 10, 0] : 0
                        }}
                        transition={{ duration: 0.3 }}
                        className="relative z-10 shrink-0"
                      >
                        {isSelected ? (
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-foreground/20">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary/50 transition-colors">
                            <Circle className="h-3 w-3 text-transparent" />
                          </div>
                        )}
                      </motion.div>
                    </Button>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
