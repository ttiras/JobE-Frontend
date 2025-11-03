/**
 * Evaluation Type Definitions
 * 
 * Types for position evaluation, dimension scoring, and answer storage
 */

import type { DimensionAnswers } from './questions';

/**
 * Dimension Answer
 * Represents a user's answer for a specific dimension in an evaluation
 */
export interface DimensionAnswer {
  /** The dimension ID this answer is for */
  dimensionId: string;
  /** The evaluation ID this answer belongs to */
  evaluationId: string;
  /** The resulting level determined by the questionnaire (1-7) */
  resultingLevel: number;
  /** The answers to questions in the decision tree (e.g., {"q1": "yes", "q2": "no"}) */
  answers: DimensionAnswers;
  /** ISO timestamp when the answer was saved locally */
  savedAt: string;
  /** Whether this answer has been persisted to the database */
  savedToDb: boolean;
}

/**
 * Stored Answer Data
 * Internal structure for localStorage storage
 */
export interface StoredAnswerData {
  resultingLevel: number;
  answers: DimensionAnswers;
  savedAt: string;
  savedToDb: boolean;
}

/**
 * Evaluation Status
 */
export type EvaluationStatus = 'draft' | 'completed';

/**
 * Dimension Score
 * Database representation of a completed dimension evaluation
 * Note: raw_points and weighted_points are not exposed to frontend to protect evaluation logic
 */
export interface DimensionScore {
  dimension_id: string;
  evaluation_id: string;
  resulting_level: number;
  answers?: DimensionAnswers; // JSONB field storing the decision tree path
  created_at: string;
  updated_at?: string;
}

/**
 * Dimension Translation
 */
export interface DimensionTranslation {
  language: string;
  name: string;
  description: string;
}

/**
 * Dimension
 */
export interface Dimension {
  id: string;
  code: string;
  order_index: number;
  translations: DimensionTranslation[];
}

/**
 * Factor Translation
 */
export interface FactorTranslation {
  name: string;
  description: string;
}

/**
 * Factor
 */
export interface Factor {
  id: string;
  code: string;
  order_index: number;
  factor_translations: FactorTranslation[];
  dimensions: Dimension[];
}

/**
 * Position
 */
export interface Position {
  id: string;
  pos_code: string;
  title: string;
  department: {
    dept_code: string;
    name: string;
  } | null;
}

/**
 * Evaluation
 */
export interface Evaluation {
  id: string;
  position_id: string;
  status: EvaluationStatus;
  evaluated_by: string | null;
  evaluated_at: string | null;
  completed_at: string | null;
  position: Position;
}

/**
 * Evaluation Data
 * Complete evaluation data including factors, dimensions, and existing scores
 */
export interface EvaluationData {
  evaluation: Evaluation;
  factors: Factor[];
  dimensionScores: DimensionScore[];
}

/**
 * Evaluation Progress
 * Tracks completion progress of an evaluation
 */
export interface EvaluationProgress {
  /** Total number of dimensions to evaluate */
  total: number;
  /** Number of dimensions with answers */
  completed: number;
  /** Percentage completed (0-100) */
  percent: number;
  /** Number of unsaved answers */
  unsaved: number;
  /** Total number of dimensions in the current factor */
  factorTotal: number;
  /** Number of completed dimensions in the current factor */
  factorCompleted: number;
  /** The 1-based index of the current dimension being evaluated */
  current: number;
}
