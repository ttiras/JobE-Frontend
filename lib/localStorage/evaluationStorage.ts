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

    // Validate the stored data structure
    if (
      typeof data.resultingLevel !== 'number' ||
      typeof data.answers !== 'object' ||
      typeof data.savedAt !== 'string' ||
      typeof data.savedToDb !== 'boolean'
    ) {
      console.warn('Invalid stored answer data:', data);
      return null;
    }

    return {
      dimensionId,
      evaluationId,
      resultingLevel: data.resultingLevel,
      answers: data.answers,
      savedAt: data.savedAt,
      savedToDb: data.savedToDb,
    };
  } catch (e) {
    console.error('Error loading answer from localStorage:', e);
    return null;
  }
}

/**
 * Load all answers for an evaluation
 * 
 * @param evaluationId - The evaluation ID
 * @param dimensionIds - Array of dimension IDs to load
 * @returns Map of dimensionId to DimensionAnswer
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
    try {
      const answer = loadAnswer(evaluationId, dimensionId);
      if (answer) {
        answers.set(dimensionId, answer);
      }
    } catch (e) {
      console.error(`Error loading answer for dimension ${dimensionId}:`, e);
      // Continue loading other answers even if one fails
    }
  }

  return answers;
}

/**
 * Mark an answer as saved to database
 * Updates the savedToDb flag to true
 * 
 * @param evaluationId - The evaluation ID
 * @param dimensionId - The dimension ID
 */
export function markAnswerSaved(
  evaluationId: string,
  dimensionId: string
): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    const key = getStorageKey(evaluationId, dimensionId);
    const stored = localStorage.getItem(key);

    if (!stored) {
      return;
    }

    const data: StoredAnswerData = JSON.parse(stored);
    data.savedToDb = true;

    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error marking answer as saved:', e);
  }
}

/**
 * Clear all answers for an evaluation
 * Removes all localStorage entries for the specified evaluation
 * 
 * @param evaluationId - The evaluation ID
 */
export function clearEvaluation(evaluationId: string): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    const prefix = `${STORAGE_PREFIX}${evaluationId}_dim_`;
    const keysToRemove: string[] = [];

    // Find all keys for this evaluation
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    // Remove all found keys
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch (e) {
    console.error('Error clearing evaluation from localStorage:', e);
  }
}

/**
 * Get all unsaved answers for an evaluation
 * Returns answers that have not been persisted to the database
 * 
 * @param evaluationId - The evaluation ID
 * @param dimensionIds - Array of dimension IDs to check
 * @returns Array of unsaved DimensionAnswers
 */
export function getUnsavedAnswers(
  evaluationId: string,
  dimensionIds: string[]
): DimensionAnswer[] {
  const unsavedAnswers: DimensionAnswer[] = [];

  if (!isLocalStorageAvailable()) {
    return unsavedAnswers;
  }

  for (const dimensionId of dimensionIds) {
    try {
      const answer = loadAnswer(evaluationId, dimensionId);
      if (answer && !answer.savedToDb) {
        unsavedAnswers.push(answer);
      }
    } catch (e) {
      console.error(`Error checking unsaved answer for dimension ${dimensionId}:`, e);
      // Continue checking other answers
    }
  }

  return unsavedAnswers;
}

/**
 * Get count of unsaved answers for an evaluation
 * Useful for showing indicators in the UI
 * 
 * @param evaluationId - The evaluation ID
 * @param dimensionIds - Array of dimension IDs to check
 * @returns Count of unsaved answers
 */
export function getUnsavedCount(
  evaluationId: string,
  dimensionIds: string[]
): number {
  return getUnsavedAnswers(evaluationId, dimensionIds).length;
}

/**
 * Check if an evaluation has any unsaved changes
 * 
 * @param evaluationId - The evaluation ID
 * @param dimensionIds - Array of dimension IDs to check
 * @returns True if there are unsaved changes
 */
export function hasUnsavedChanges(
  evaluationId: string,
  dimensionIds: string[]
): boolean {
  return getUnsavedCount(evaluationId, dimensionIds) > 0;
}
