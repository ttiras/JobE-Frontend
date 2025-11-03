/**
 * Evaluation Context
 * 
 * Provides state management for position evaluation workflow.
 * Handles navigation, answer persistence, and progress tracking.
 * 
 * Features:
 * - Multi-step wizard navigation
 * - Auto-save to localStorage
 * - Progress calculation
 * - Answer validation
 * - Database sync status
 */

'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { executeQuery } from '@/lib/nhost/graphql/client';
import type {
  EvaluationData,
  Dimension,
  EvaluationProgress,
  DimensionScore,
  DimensionAnswer,
} from '@/lib/types/evaluation';
import { DimensionAnswers } from '@/lib/types/questions';
import {
  getUnsavedAnswers,
  getUnsavedCount,
  saveAnswer as saveAnswerToLocal,
  markAnswerSaved,
  clearEvaluation,
} from '@/lib/localStorage/evaluationStorage';

// Define the shape of an answer
interface Answer {
  level: number;
  isSaved: boolean;
}

interface SaveDimensionScoreVariables {
  evaluationId: string;
  dimensionId: string;
  resultingLevel: number;
  answers: DimensionAnswers;
}

const saveDimensionScore = async (variables: SaveDimensionScoreVariables) => {
  const response = await executeQuery(
    /* GraphQL */ `
      mutation SaveDimensionScore(
        $evaluationId: uuid!
        $dimensionId: uuid!
        $resultingLevel: Int!
        $answers: jsonb!
      ) {
        insert_dimension_scores_one(
          object: {
            evaluation_id: $evaluationId
            dimension_id: $dimensionId
            resulting_level: $resultingLevel
            answers: $answers
          }
          on_conflict: {
            constraint: dimension_scores_pkey
            update_columns: [resulting_level, answers]
          }
        ) {
          id
        }
      }
    `,
    {
      variables,
    }
  );

  return response;
};

interface EvaluationContextType {
  /** The complete evaluation data including factors and dimensions */
  evaluationData: EvaluationData;
  /** Current factor index (0-based) */
  currentFactorIndex: number;
  /** Current dimension index within the current factor (0-based) */
  currentDimensionIndex: number;
  /** Map of dimension answers (dimensionId -> DimensionAnswer) */
  answers: Map<string, DimensionAnswer>;
  /** Evaluation progress tracking */
  progress: EvaluationProgress;
  /** Whether the current dimension is the first one */
  isFirstDimension: boolean;
  /** Whether the current dimension is the last one */
  isLastDimension: boolean;
  /** Navigate to a specific dimension */
  setCurrentDimension: (factorIndex: number, dimensionIndex: number) => void;
  /** Save answer for current dimension */
  saveCurrentAnswer: (resultingLevel: number, answers: DimensionAnswers) => Promise<void>;
  /** Navigate to next dimension */
  goToNextDimension: () => void;
  /** Navigate to previous dimension */
  goToPreviousDimension: () => void;
  /** Whether all dimensions have been answered */
  canFinalize: boolean;
  /** Get the current dimension being evaluated */
  getCurrentDimension: () => Dimension | null;
  /** Check if a specific dimension has been answered */
  isDimensionAnswered: (dimensionId: string) => boolean;
}

const EvaluationContext = createContext<EvaluationContextType | undefined>(undefined);

/**
 * Hook to access evaluation context
 * Must be used within EvaluationProvider
 */
export function useEvaluation() {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error('useEvaluation must be used within EvaluationProvider');
  }
  return context;
}

interface EvaluationProviderProps {
  children: ReactNode;
  initialData: EvaluationData;
}

/**
 * Evaluation Context Provider
 * Manages state for the evaluation workflow
 */
export function EvaluationProvider({ children, initialData }: EvaluationProviderProps) {
  const [evaluationData] = useState<EvaluationData>(initialData);
  const [currentFactorIndex, setCurrentFactorIndex] = useState(0);
  const [currentDimensionIndex, setCurrentDimensionIndex] = useState(0);
  const [answers, setAnswers] = useState(new Map<string, DimensionAnswer>());
  const [isFinalizing, setIsFinalizing] = useState(false);

  const saveMutation = useMutation({
    mutationFn: saveDimensionScore,
    onSuccess: (data, variables) => {
      // Mark the answer as saved in localStorage
      markAnswerSaved(variables.evaluationId, variables.dimensionId);
      
      // Update the answer in the state to reflect it's saved
      setAnswers(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(variables.dimensionId);
        if (existing) {
          newMap.set(variables.dimensionId, {
            ...existing,
            savedToDb: true,
          });
        }
        return newMap;
      });
      console.log('✅ Dimension saved to database:', variables.dimensionId);
    },
    onError: (error: Error, variables) => {
      console.error('❌ Error saving dimension to database:', error);
      toast.error('Error Saving Progress', {
        description: `Could not save answer for dimension ${variables.dimensionId}. Your work is saved locally.`,
      });
    },
  });

  const [progress, setProgress] = useState<EvaluationProgress>({
    total: 0,
    completed: 0,
    percent: 0,
    unsaved: 0,
    factorTotal: 0,
    factorCompleted: 0,
    current: 0,
  });

  const getAllDimensionIds = useCallback((): string[] => {
    return evaluationData.factors.flatMap(factor => factor.dimensions.map(d => d.id));
  }, [evaluationData.factors]);

  // Initialize answers from database scores and localStorage
  useEffect(() => {
    const dbAnswers = new Map<string, DimensionAnswer>();
    for (const score of evaluationData.dimensionScores) {
      dbAnswers.set(score.dimension_id, {
        dimensionId: score.dimension_id,
        evaluationId: evaluationData.evaluation.id,
        resultingLevel: score.resulting_level,
        answers: score.answers || {},
        savedAt: score.created_at,
        savedToDb: true,
      });
    }

    const allDimensionIds = getAllDimensionIds();
    const unsavedAnswers = getUnsavedAnswers(evaluationData.evaluation.id, allDimensionIds);
    const localAnswers = new Map<string, DimensionAnswer>();
    for (const ans of unsavedAnswers) {
      localAnswers.set(ans.dimensionId, ans);
    }

    const mergedAnswers = new Map([...dbAnswers, ...localAnswers]);
    setAnswers(mergedAnswers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluationData.evaluation.id, evaluationData.dimensionScores, getAllDimensionIds]);

  // Calculate progress whenever answers or navigation changes
  useEffect(() => {
    const total = evaluationData.factors.reduce(
      (acc, factor) => acc + factor.dimensions.length,
      0
    );
    const completed = answers.size;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const unsaved = getUnsavedCount(evaluationData.evaluation.id, getAllDimensionIds());

    const factor = evaluationData.factors[currentFactorIndex];
    const factorTotal = factor?.dimensions.length || 0;
    const factorCompleted =
      factor?.dimensions.filter((d) => answers.has(d.id)).length || 0;
    
    const currentDimensionNumber = evaluationData.factors
      .slice(0, currentFactorIndex)
      .reduce((acc, f) => acc + f.dimensions.length, 0) + currentDimensionIndex + 1;

    setProgress({
      total,
      completed,
      percent,
      unsaved,
      factorTotal,
      factorCompleted,
      current: currentDimensionNumber,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, currentFactorIndex, currentDimensionIndex, evaluationData.factors, getAllDimensionIds, evaluationData.evaluation.id]);

  /**
   * Get the current dimension being evaluated
   */
  const getCurrentDimension = useCallback((): Dimension | null => {
    if (!evaluationData.factors[currentFactorIndex]) {
      return null;
    }
    
    const currentFactor = evaluationData.factors[currentFactorIndex];
    return currentFactor.dimensions[currentDimensionIndex] || null;
  }, [evaluationData.factors, currentFactorIndex, currentDimensionIndex]);

  /**
   * Check if a dimension has been answered
   */
  const isDimensionAnswered = useCallback((dimensionId: string): boolean => {
    return answers.has(dimensionId);
  }, [answers]);

  /**
   * Navigate to a specific dimension
   */
  const setCurrentDimension = useCallback((factorIndex: number, dimensionIndex: number) => {
    if (
      factorIndex >= 0 &&
      factorIndex < evaluationData.factors.length &&
      dimensionIndex >= 0 &&
      dimensionIndex < evaluationData.factors[factorIndex].dimensions.length
    ) {
      setCurrentFactorIndex(factorIndex);
      setCurrentDimensionIndex(dimensionIndex);
    }
  }, [evaluationData.factors]);

  /**
   * Save answer for current dimension
   */
  const saveCurrentAnswer = useCallback(async (resultingLevel: number, dimensionAnswers: DimensionAnswers): Promise<void> => {
    const currentDimension = getCurrentDimension();
    if (!currentDimension) return;

    const answer: DimensionAnswer = {
      dimensionId: currentDimension.id,
      evaluationId: evaluationData.evaluation.id,
      resultingLevel,
      answers: dimensionAnswers,
      savedAt: new Date().toISOString(),
      savedToDb: false,
    };

    // Save to localStorage
    saveAnswerToLocal(
      evaluationData.evaluation.id,
      currentDimension.id,
      resultingLevel,
      dimensionAnswers
    );

    // Update state immediately
    setAnswers(prev => new Map(prev).set(currentDimension.id, answer));

    // Save to DB asynchronously
    saveMutation.mutate({
      evaluationId: evaluationData.evaluation.id,
      dimensionId: currentDimension.id,
      resultingLevel,
      answers: dimensionAnswers,
    });
  }, [evaluationData.evaluation.id, getCurrentDimension, saveMutation]);

  /**
   * Finalize the evaluation by marking it as complete
   */
  const finalizeEvaluation = useCallback(async () => {
    setIsFinalizing(true);
    try {
      // TODO: Implement finalization logic, e.g., marking the evaluation as complete in the database
      toast.success('Evaluation finalized successfully');
    } catch (error) {
      console.error('Error finalizing evaluation:', error);
      toast.error('Failed to finalize evaluation');
    } finally {
      setIsFinalizing(false);
    }
  }, []);

  /**
   * Navigate to next dimension
   * Handles moving to next factor if needed
   */
  const goToNextDimension = useCallback(() => {
    const currentFactor = evaluationData.factors[currentFactorIndex];
    if (!currentFactor) return;

    // Check if there's a next dimension in current factor
    if (currentDimensionIndex < currentFactor.dimensions.length - 1) {
      setCurrentDimensionIndex(prev => prev + 1);
    } else {
      // Move to next factor's first dimension
      if (currentFactorIndex < evaluationData.factors.length - 1) {
        setCurrentFactorIndex(prev => prev + 1);
        setCurrentDimensionIndex(0);
      }
      // If we're at the last dimension of the last factor, stay there
    }
  }, [evaluationData.factors, currentFactorIndex, currentDimensionIndex]);

  /**
   * Navigate to previous dimension
   * Handles moving to previous factor if needed
   */
  const goToPreviousDimension = useCallback(() => {
    // Check if there's a previous dimension in current factor
    if (currentDimensionIndex > 0) {
      setCurrentDimensionIndex(prev => prev - 1);
    } else {
      // Move to previous factor's last dimension
      if (currentFactorIndex > 0) {
        const previousFactor = evaluationData.factors[currentFactorIndex - 1];
        setCurrentFactorIndex(prev => prev - 1);
        setCurrentDimensionIndex(previousFactor.dimensions.length - 1);
      }
      // If we're at the first dimension of the first factor, stay there
    }
  }, [evaluationData.factors, currentFactorIndex, currentDimensionIndex]);

  const isFirstDimension = currentFactorIndex === 0 && currentDimensionIndex === 0;
  const isLastDimension =
    currentFactorIndex === evaluationData.factors.length - 1 &&
    currentDimensionIndex ===
      evaluationData.factors[evaluationData.factors.length - 1].dimensions.length - 1;

  /**
   * Check if evaluation can be finalized
   * All dimensions must have been answered
   */
  const canFinalize = getAllDimensionIds().length > 0 && answers.size === getAllDimensionIds().length;

  const value: EvaluationContextType = {
    evaluationData,
    currentFactorIndex,
    currentDimensionIndex,
    progress,
    answers,
    isFirstDimension,
    isLastDimension,
    setCurrentDimension,
    saveCurrentAnswer,
    goToNextDimension,
    goToPreviousDimension,
    canFinalize,
    getCurrentDimension,
    isDimensionAnswered,
  };

  return (
    <EvaluationContext.Provider value={value}>
      {children}
    </EvaluationContext.Provider>
  );
}
