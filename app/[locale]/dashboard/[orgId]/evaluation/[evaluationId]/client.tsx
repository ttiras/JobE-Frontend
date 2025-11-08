/**
 * Evaluation Page Client Component
 * 
 * Fetches and displays evaluation details with position and department information
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { executeQuery } from '@/lib/nhost/graphql/client';
import { EvaluationHeader } from '@/components/evaluation/EvaluationHeader';
import { EvaluationNavigationLayout } from '@/components/evaluation/EvaluationNavigationLayout';
import { EvaluationSkeleton } from '@/components/evaluation/EvaluationSkeleton';
import { DimensionQuestionCard } from '@/components/evaluation/DimensionQuestionCard';
import { EvaluationProvider, useEvaluation } from '@/lib/contexts/EvaluationContext';
import { getUnsavedAnswers, clearEvaluation } from '@/lib/localStorage/evaluationStorage';
import { useAuth } from '@/lib/hooks/use-auth';
import type { DimensionAnswer } from '@/lib/types/evaluation';

interface EvaluationPageClientProps {
  locale: string;
  orgId: string;
  evaluationId: string;
}

interface Position {
  id: string;
  pos_code: string;
  title: string;
  department: {
    dept_code: string;
    name: string;
  } | null;
}

interface Evaluation {
  id: string;
  position_id: string;
  status: 'draft' | 'completed';
  evaluated_by: string | null;
  evaluated_at: string | null;
  completed_at: string | null;
  position: Position;
}

interface GetEvaluationResponse {
  position_evaluations_by_pk: Evaluation | null;
}

interface QuestionTranslation {
  text: string;
}

interface Question {
  id: string;
  question_key: string;
  order_index: number;
  question_translations: QuestionTranslation[];
}

interface DimensionTranslation {
  language: string;
  name: string;
  description: string;
}

interface Dimension {
  id: string;
  code: string;
  order_index: number;
  translations: DimensionTranslation[];
}

interface FactorTranslation {
  name: string;
  description: string;
}

interface Factor {
  id: string;
  code: string;
  order_index: number;
  factor_translations: FactorTranslation[];
  dimensions: Dimension[];
}

interface DimensionScore {
  dimension_id: string;
  evaluation_id: string;
  resulting_level: number;
  created_at: string;
}

interface GetEvaluationDimensionsResponse {
  factors: Factor[];
  dimension_scores: DimensionScore[];
}

const GET_EVALUATION_DETAILS = `
  query GetEvaluationDetails($evaluationId: uuid!) {
    position_evaluations_by_pk(id: $evaluationId) {
      id
      position_id
      status
      evaluated_by
      evaluated_at
      completed_at
      position {
        id
        pos_code
        title
        department {
          dept_code
          name
        }
      }
    }
  }
`;

const GET_EVALUATION_DIMENSIONS = `
  query GetEvaluationDimensions($evaluationId: uuid!, $locale: String!) {
    factors(order_by: { order_index: asc }) {
      id
      code
      order_index
      factor_translations(where: { language: { _eq: $locale } }) {
        name
        description
      }
      dimensions(order_by: { order_index: asc }) {
        id
        code
        order_index
        translations: dimension_translations(where: { language: { _eq: $locale } }) {
          language
          name
          description
        }
      }
    }
    dimension_scores(where: { evaluation_id: { _eq: $evaluationId } }) {
      dimension_id
      evaluation_id
      resulting_level
      answers
      created_at
    }
  }
`;

export function EvaluationPageClient({
  locale,
  orgId,
  evaluationId,
}: EvaluationPageClientProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [dimensionScores, setDimensionScores] = useState<DimensionScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const fetchEvaluationData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch evaluation details and dimensions in parallel
      const [evaluationData, dimensionsData] = await Promise.all([
        executeQuery<GetEvaluationResponse>(
          GET_EVALUATION_DETAILS,
          { evaluationId }
        ),
        executeQuery<GetEvaluationDimensionsResponse>(
          GET_EVALUATION_DIMENSIONS,
          { evaluationId, locale }
        ),
      ]);

      if (!evaluationData.position_evaluations_by_pk) {
        setError('Evaluation not found');
        return;
      }

      const evaluationRecord = evaluationData.position_evaluations_by_pk;

      // Check if evaluation is already completed
      if (evaluationRecord.status === 'completed') {
        router.push(`/${locale}/dashboard/${orgId}/evaluations?message=already-completed`);
        return;
      }

      // Check if user has permission to evaluate this position
      if (evaluationRecord.evaluated_by && evaluationRecord.evaluated_by !== user?.id) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      setEvaluation(evaluationRecord);
      setFactors(dimensionsData.factors || []);
      setDimensionScores(dimensionsData.dimension_scores || []);
    } catch (err) {
      console.error('Error fetching evaluation data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load evaluation');
    } finally {
      setLoading(false);
    }
  }, [evaluationId, locale, orgId, router, user?.id]);

  useEffect(() => {
    fetchEvaluationData();
  }, [fetchEvaluationData]);

  if (loading) {
    return <EvaluationSkeleton />;
  }

  if (accessDenied) {
    return (
      <div className="container max-w-2xl mx-auto p-4 md:p-6 lg:p-8">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to evaluate this position. This evaluation has been assigned to another user.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(`/${locale}/dashboard/${orgId}/evaluations`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Evaluations
        </Button>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="container max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Evaluation not found'}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  // Prepare evaluation data for context
  const evaluationData = {
    evaluation,
    factors,
    dimensionScores,
  };

  return (
    <EvaluationProvider initialData={evaluationData}>
      <EvaluationContent locale={locale} orgId={orgId} evaluationId={evaluationId} />
    </EvaluationProvider>
  );
}

/**
 * Inner component that uses the EvaluationContext
 */
function EvaluationContent({
  locale,
  orgId,
  evaluationId,
}: {
  locale: string;
  orgId: string;
  evaluationId: string;
}) {
  const router = useRouter();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const {
    evaluationData,
    currentFactorIndex,
    currentDimensionIndex,
    progress,
    setCurrentDimension,
    answers,
    getCurrentDimension,
    goToNextDimension,
    goToPreviousDimension,
    saveCurrentAnswer,
    isFirstDimension,
    isLastDimension,
  } = useEvaluation();

  // Get current dimension for auto-scroll dependency
  const currentDimension = getCurrentDimension();

  // Auto-scroll to top when dimension changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentDimension]);

  // Warn user about unsaved changes before leaving page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (progress.unsaved > 0) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [progress.unsaved]);

  // Handler: Exit with unsaved changes check
  const handleExit = useCallback(() => {
    if (progress.unsaved > 0) {
      if (
        confirm(
          `You have ${progress.unsaved} unsaved change${progress.unsaved > 1 ? 's' : ''}. Are you sure you want to exit?`
        )
      ) {
        router.push(`/${locale}/dashboard/${orgId}/org-structure/positions`);
      }
    } else {
      router.push(`/${locale}/dashboard/${orgId}/org-structure/positions`);
    }
  }, [progress.unsaved, router, locale, orgId]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Arrow Left: Previous dimension
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPreviousDimension();
      }

      // Ctrl/Cmd + Arrow Right: Next dimension (if current is answered)
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentDimension && answers.has(currentDimension.id)) {
          goToNextDimension();
        }
      }

      // Escape: Show exit confirmation
      if (e.key === 'Escape') {
        e.preventDefault();
        handleExit();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [answers, currentDimension, goToNextDimension, goToPreviousDimension, handleExit]);

  if (!evaluationData) {
    return null;
  }

  // Helper: Transform factors for DimensionSidebar
  const getFactorGroups = () => {
    return evaluationData.factors.map((factor) => ({
      id: factor.id,
      name: factor.factor_translations[0]?.name || factor.code,
      code: factor.code,
      orderIndex: factor.order_index,
      dimensions: factor.dimensions.map((dim) => {
        const answer = answers.get(dim.id);
        return {
          id: dim.id,
          name: dim.translations[0]?.name || dim.code,
          code: dim.code,
          orderIndex: dim.order_index,
          completed: !!answer,
          selectedLevel: answer?.resultingLevel || null,
        };
      }),
    }));
  };

  // Handler: Click on a dimension in sidebar
  const handleDimensionClick = (dimensionId: string) => {
    // Find the factor and dimension indices
    for (let factorIndex = 0; factorIndex < evaluationData.factors.length; factorIndex++) {
      const factor = evaluationData.factors[factorIndex];
      const dimensionIndex = factor.dimensions.findIndex((d) => d.id === dimensionId);

      if (dimensionIndex !== -1) {
        setCurrentDimension(factorIndex, dimensionIndex);
        break;
      }
    }
  };

  // Handler: Complete dimension with resulting level and answers
  const handleDimensionComplete = async (
    dimensionId: string,
    resultingLevel: number,
    dimensionAnswers: Record<string, string>
  ) => {
    try {
      setValidationError(null);
      setIsSaving(true);

      // Save the dimension answer with questionnaire results
      await saveCurrentAnswer(resultingLevel, dimensionAnswers);

      if (isLastDimension) {
        // This was the last dimension - database will auto-complete evaluation and calculate score
        const loadingToastId = toast.loading('Completing evaluation and calculating score...', {
          duration: Infinity,
        });

        try {
          // Wait for database SQL function to complete status change and calculation
          // The database automatically changes status to 'completed' when all dimension_scores are saved
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Verify calculation completed by checking if evaluation_scores exists
          const verifyQuery = `
            query VerifyCalculation($evaluationId: uuid!) {
              evaluation_scores(where: { evaluation_id: { _eq: $evaluationId } }) {
                id
                final_score
                assigned_grade
              }
            }
          `;

          const verification = await executeQuery(verifyQuery, { evaluationId });

          if (!verification.evaluation_scores || verification.evaluation_scores.length === 0) {
            throw new Error('Score calculation did not complete. Please contact support.');
          }

          // Clear localStorage
          clearEvaluation(evaluationId);

          toast.dismiss(loadingToastId);
          toast.success('Evaluation completed successfully!', {
            description: 'Your results have been calculated',
          });

          // Redirect to results page
          router.push(`/${locale}/dashboard/${orgId}/evaluation/${evaluationId}/results`);
        } catch (finalizeError) {
          toast.dismiss(loadingToastId);
          toast.error('Failed to complete evaluation', {
            description: 'Please refresh the page and try again, or contact support.',
            duration: 5000,
          });
          console.error('Finalization error:', finalizeError);
          setIsSaving(false);
          return;
        }
      } else {
        // Not the last dimension - move to next
        toast.success('Answer saved', {
          description: 'Your progress has been saved',
        });
        goToNextDimension();
      }
    } catch (error) {
      setValidationError('Failed to save answer. Please try again.');
      toast.error('Failed to save', {
        description: 'Please check your connection and try again',
      });
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler: Navigate to previous dimension
  const handlePrevious = () => {
    setValidationError(null);
    goToPreviousDimension();
  };

  // Handler: Navigate to next dimension (with validation and save)
  const handleNext = async () => {
    const currentDim = getCurrentDimension();
    if (!currentDim) return;

    const currentAnswer = answers.get(currentDim.id);
    if (!currentAnswer) {
      setValidationError('Please complete the questionnaire before continuing');
      toast.error('Questionnaire incomplete', {
        description: 'Please answer all questions before continuing',
      });
      return;
    }

    // The answer has already been saved by handleDimensionComplete
    // Just navigate to the next dimension
    goToNextDimension();
  };

  return (
    <>
      <EvaluationHeader
        positionTitle={evaluationData.evaluation.position.title}
        positionCode={evaluationData.evaluation.position.pos_code}
        departmentName={evaluationData.evaluation.position.department?.name || null}
        completedDimensions={progress.completed}
        totalDimensions={progress.total}
        onExit={handleExit}
      />
      
      {/* Unified Navigation Layout */}
      {currentDimension && (
        <EvaluationNavigationLayout
          factors={getFactorGroups()}
          currentDimensionId={currentDimension.id}
          currentDimensionName={currentDimension.translations[0]?.name || currentDimension.code}
          currentStep={currentDimensionIndex + 1}
          totalSteps={evaluationData.factors[currentFactorIndex]?.dimensions.length || 0}
          onDimensionClick={handleDimensionClick}
          totalCompleted={progress.completed}
          totalDimensions={progress.total}
        >
          {/* Question Card - Animates independently */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentDimension.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DimensionQuestionCard
                dimension={currentDimension}
                onComplete={handleDimensionComplete}
                isSaving={isSaving}
                initialAnswers={answers.get(currentDimension.id)?.answers}
                locale={locale}
                totalQuestionsAcrossAllDimensions={progress.total * 6}
                currentQuestionIndexAcrossAllDimensions={currentDimensionIndex * 6}
              />
            </motion.div>
          </AnimatePresence>
        </EvaluationNavigationLayout>
      )}
    </>
  );
}
