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
import {
  EvaluationData,
  DimensionAnswer,
  EvaluationProgress,
  Dimension,
} from '@/lib/types/evaluation';
import type { DimensionAnswers } from '@/lib/types/questions';
import {
  loadAllAnswers,
  saveAnswer,
  getUnsavedCount,
  markAnswerSaved,
} from '@/lib/localStorage/evaluationStorage';
import { saveDimensionScore } from '@/lib/nhost/graphql/mutations/evaluations';
import { toast } from 'sonner';

interface EvaluationContextType {
  /** The complete evaluation data including factors and dimensions */
  evaluationData: EvaluationData | null;
  /** Current factor index (0-based) */
  currentFactorIndex: number;
  /** Current dimension index within the current factor (0-based) */
  currentDimensionIndex: number;
  /** Map of dimension answers (dimensionId -> DimensionAnswer) */
  answers: Map<string, DimensionAnswer>;
  /** Evaluation progress tracking */
  progress: EvaluationProgress;
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
  const [answers, setAnswers] = useState<Map<string, DimensionAnswer>>(new Map());
  const [progress, setProgress] = useState<EvaluationProgress>({
    totalDimensions: 0,
    completedDimensions: 0,
    percentComplete: 0,
    unsavedCount: 0,
  });

  // Mutation for saving dimension scores to database
  const saveMutation = useMutation({
    mutationFn: async ({ 
      dimensionId, 
      resultingLevel,
      answers
    }: { 
      dimensionId: string; 
      resultingLevel: number;
      answers: DimensionAnswers;
    }) => {
      return await saveDimensionScore(
        evaluationData.evaluation.id,
        dimensionId,
        resultingLevel,
        answers
      );
    },
    // ✅ FIX: Add retry logic for transient failures
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors
      if (failureCount < 3) {
        const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
        // Retry on network errors, timeouts, or server errors
        return errorMessage.includes('network') || 
               errorMessage.includes('timeout') || 
               errorMessage.includes('fetch failed') ||
               errorMessage.includes('500') ||
               errorMessage.includes('502') ||
               errorMessage.includes('503');
      }
      return false;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s
      return Math.min(1000 * 2 ** attemptIndex, 10000);
    },
    onSuccess: (data, variables) => {
      // Mark as saved in localStorage
      markAnswerSaved(evaluationData.evaluation.id, variables.dimensionId);
      
      // Update the answer in state
      setAnswers(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(variables.dimensionId);
        if (existing) {
          newMap.set(variables.dimensionId, {
            ...existing,
            savedToDb: true
          });
        }
        return newMap;
      });
      
      // ✅ FIX: More informative success message
      console.log('✅ Dimension saved to database:', variables.dimensionId);
      toast.success('Progress saved to database');
    },
    onError: (error, variables) => {
      // ✅ FIX: Enhanced error logging with context
      const errorDetails = {
        evaluationId: evaluationData.evaluation.id,
        dimensionId: variables.dimensionId,
        resultingLevel: variables.resultingLevel,
        error: error instanceof Error ? {
          message: error.message,
          name: error.name
        } : String(error),
        timestamp: new Date().toISOString()
      };
      
      console.error('❌ Failed to save dimension score to database:', errorDetails);
      
      // ✅ FIX: Determine if error is permission-related
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      const isPermissionError = errorMessage.includes('permission') || 
                                errorMessage.includes('denied') ||
                                errorMessage.includes('forbidden') ||
                                errorMessage.includes('unauthorized');
      
      const isConstraintError = errorMessage.includes('constraint') ||
                               errorMessage.includes('foreign key') ||
                               errorMessage.includes('unique');
      
      // ✅ FIX: Provide specific error messages
      if (isPermissionError) {
        toast.error('Permission Error', {
          description: 'You do not have permission to save evaluation data. Please contact your administrator.',
          duration: 10000 // Show longer for critical errors
        });
      } else if (isConstraintError) {
        toast.error('Data Validation Error', {
          description: 'Invalid evaluation or dimension ID. Please refresh the page and try again.',
          duration: 10000
        });
      } else {
        toast.error('Failed to save to database', {
          description: 'Your answer is saved locally. Check your connection and refresh to retry.',
          duration: 7000
        });
      }
      
      // ✅ FIX: Track error for monitoring (integrate with your logging service)
      // Example: sendErrorToMonitoring(errorDetails);
    }
  });

  // Get all dimension IDs from the evaluation data
  const getAllDimensionIds = useCallback((): string[] => {
    const dimensionIds: string[] = [];
    for (const factor of evaluationData.factors) {
      for (const dimension of factor.dimensions) {
        dimensionIds.push(dimension.id);
      }
    }
    return dimensionIds;
  }, [evaluationData.factors]);

  // Calculate total dimensions
  const getTotalDimensions = useCallback((): number => {
    return evaluationData.factors.reduce(
      (sum, factor) => sum + factor.dimensions.length,
      0
    );
  }, [evaluationData.factors]);

  // Initialize answers from database scores and localStorage
  useEffect(() => {
    const dimensionIds = getAllDimensionIds();
    
    // Load from localStorage
    const localAnswers = loadAllAnswers(evaluationData.evaluation.id, dimensionIds);
    
    // Merge with database scores
    const mergedAnswers = new Map<string, DimensionAnswer>();
    
    // First, add answers from localStorage
    for (const [dimensionId, answer] of localAnswers) {
      mergedAnswers.set(dimensionId, answer);
    }
    
    // Then, add/update with database scores (they take precedence)
    for (const score of evaluationData.dimensionScores) {
      const existingAnswer = mergedAnswers.get(score.dimension_id);
      mergedAnswers.set(score.dimension_id, {
        dimensionId: score.dimension_id,
        evaluationId: evaluationData.evaluation.id,
        resultingLevel: score.resulting_level,
        answers: score.answers || {},
        savedAt: existingAnswer?.savedAt || score.created_at,
        savedToDb: true, // Database scores are always saved
      });
    }
    
    setAnswers(mergedAnswers);
  }, [evaluationData, getAllDimensionIds]);

  // Calculate progress whenever answers change
  useEffect(() => {
    const totalDimensions = getTotalDimensions();
    const completedDimensions = answers.size;
    const percentComplete = totalDimensions > 0 
      ? Math.round((completedDimensions / totalDimensions) * 100)
      : 0;
    
    const dimensionIds = getAllDimensionIds();
    const unsavedCount = getUnsavedCount(
      evaluationData.evaluation.id,
      dimensionIds
    );

    setProgress({
      totalDimensions,
      completedDimensions,
      percentComplete,
      unsavedCount,
    });
  }, [answers, evaluationData.evaluation.id, getAllDimensionIds, getTotalDimensions]);

  /**
   * Manually trigger progress recalculation
   * (Progress is also auto-updated via useEffect)
   */
  const updateProgress = useCallback(() => {
    const totalDimensions = getTotalDimensions();
    const completedDimensions = answers.size;
    const percentComplete = totalDimensions > 0 
      ? Math.round((completedDimensions / totalDimensions) * 100)
      : 0;
    
    const dimensionIds = getAllDimensionIds();
    const unsavedCount = getUnsavedCount(
      evaluationData.evaluation.id,
      dimensionIds
    );

    setProgress({
      totalDimensions,
      completedDimensions,
      percentComplete,
      unsavedCount,
    });
  }, [answers, evaluationData.evaluation.id, getAllDimensionIds, getTotalDimensions]);

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
    if (!currentDimension) {
      throw new Error('No current dimension selected');
    }

    // Validate level (1-7 typical range)
    if (resultingLevel < 1 || resultingLevel > 7) {
      throw new Error(`Level must be between 1 and 7`);
    }

    // Create answer object
    const answer: DimensionAnswer = {
      dimensionId: currentDimension.id,
      evaluationId: evaluationData.evaluation.id,
      resultingLevel,
      answers: dimensionAnswers,
      savedAt: new Date().toISOString(),
      savedToDb: false,
    };

    // Save to localStorage immediately (synchronous, instant feedback)
    saveAnswer(
      evaluationData.evaluation.id,
      currentDimension.id,
      resultingLevel,
      dimensionAnswers
    );

    // Update state immediately
    setAnswers(prev => new Map(prev).set(currentDimension.id, answer));

    // Recalculate progress
    updateProgress();

    // Save to DB asynchronously
    saveMutation.mutate({ 
      dimensionId: currentDimension.id, 
      resultingLevel,
      answers: dimensionAnswers
    });
  }, [evaluationData.evaluation.id, getCurrentDimension, updateProgress, saveMutation]);

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

  /**
   * Check if evaluation can be finalized
   * All dimensions must have answers
   */
  const canFinalize = getTotalDimensions() > 0 && answers.size === getTotalDimensions();

  const value: EvaluationContextType = {
    evaluationData,
    currentFactorIndex,
    currentDimensionIndex,
    answers,
    progress,
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
