/**
 * Evaluation Storage Utility
 * 
 * Provides localStorage-based persistence for evaluation answers.
 * Handles auto-save functionality with error handling for private browsing mode.
 * 
 * Features:
 * - Save/load dimension answers locally
 * - Track database sync status
 * - Bulk operations for efficiency
 * - Error handling for storage quota and private browsing
 * 
 * Storage Key Format: eval_{evaluationId}_dim_{dimensionId}
 */

import { DimensionAnswer, StoredAnswerData } from '@/lib/types/evaluation';
import type { DimensionAnswers } from '@/lib/types/questions';

const STORAGE_PREFIX = 'eval_';

/**
 * Check if localStorage is available
 * Returns false in private browsing mode or when quota exceeded
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn('localStorage is not available:', e);
    return false;
  }
}

/**
 * Generate storage key for a dimension answer
 */
export function getStorageKey(evaluationId: string, dimensionId: string): string {
  return `${STORAGE_PREFIX}${evaluationId}_dim_${dimensionId}`;
}

/**
 * Save a dimension answer to localStorage
 * 
 * @param evaluationId - The evaluation ID
 * @param dimensionId - The dimension ID
 * @param resultingLevel - The resulting level determined by questionnaire
 * @param answers - The decision tree answers JSONB
 */
export function saveAnswer(
  evaluationId: string,
  dimensionId: string,
  resultingLevel: number,
  answers: DimensionAnswers
): void {
  if (!isLocalStorageAvailable()) {
    console.warn('Cannot save answer: localStorage not available');
    return;
  }

  try {
    const key = getStorageKey(evaluationId, dimensionId);
    const data: StoredAnswerData = {
      resultingLevel,
      answers,
      savedAt: new Date().toISOString(),
      savedToDb: false,
    };

    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving answer to localStorage:', e);
    // In case of quota exceeded or other errors, fail silently
    // The application should still work without localStorage
  }
}

/**
 * Load a dimension answer from localStorage
 * 
 * @param evaluationId - The evaluation ID
 * @param dimensionId - The dimension ID
 * @returns The dimension answer or null if not found
 */
export function loadAnswer(
  evaluationId: string,
  dimensionId: string
): DimensionAnswer | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const key = getStorageKey(evaluationId, dimensionId);
    const stored = localStorage.getItem(key);

    if (!stored) {
      return null;
    }

    const data: StoredAnswerData = JSON.parse(stored);

    return {
      dimensionId,
      evaluationId,
      ...data,
    };
  } catch (e) {
    console.error('Error loading answer from localStorage:', e);
    return null;
  }
}

/**
 * Load all answers for an evaluation from localStorage
 */
export function loadAllAnswers(
  evaluationId: string,
  dimensionIds: string[]
): Map<string, DimensionAnswer> {
  const answers = new Map<string, DimensionAnswer>();
  if (!isLocalStorageAvailable()) {
    return answers;
  }

  for (const dimensionId of dimensionIds) {
    const answer = loadAnswer(evaluationId, dimensionId);
    if (answer) {
      answers.set(dimensionId, answer);
    }
  }
  return answers;
}

/**
 * Mark an answer as saved to the database
 */
export function markAnswerSaved(evaluationId: string, dimensionId: string): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    const key = getStorageKey(evaluationId, dimensionId);
    const stored = localStorage.getItem(key);
    if (stored) {
      const data: StoredAnswerData = JSON.parse(stored);
      data.savedToDb = true;
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (e) {
    console.error('Error marking answer as saved:', e);
  }
}

/**
 * Get count of unsaved answers for an evaluation
 */
export function getUnsavedCount(evaluationId: string, dimensionIds: string[]): number {
  let count = 0;
  if (!isLocalStorageAvailable()) {
    return 0;
  }

  for (const dimensionId of dimensionIds) {
    const answer = loadAnswer(evaluationId, dimensionId);
    if (answer && !answer.savedToDb) {
      count++;
    }
  }
  return count;
}

/**
 * Get all unsaved answers for an evaluation
 */
export function getUnsavedAnswers(
  evaluationId: string,
  dimensionIds: string[]
): DimensionAnswer[] {
  const unsaved: DimensionAnswer[] = [];
  if (!isLocalStorageAvailable()) {
    return unsaved;
  }

  for (const dimensionId of dimensionIds) {
    const answer = loadAnswer(evaluationId, dimensionId);
    if (answer && !answer.savedToDb) {
      unsaved.push(answer);
    }
  }
  return unsaved;
}

/**
 * Clear all evaluation data from localStorage for a specific evaluation
 */
export function clearEvaluation(evaluationId: string): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${STORAGE_PREFIX}${evaluationId}_`)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch (e) {
    console.error('Error clearing evaluation data from localStorage:', e);
  }
}
