/**
 * GraphQL mutations for Position Evaluation operations
 * Handles CREATE, UPDATE, and DELETE operations for position evaluations
 * 
 * This file is SAFE to import in Client Components.
 * For server-side functions, use evaluations.server.ts instead.
 */

import { executeQuery, executeMutation } from '../client';

// ============================================================================
// Position Evaluation CREATE Mutation
// ============================================================================

/**
 * Create a new position evaluation (draft)
 * 
 * @param position_id - Position UUID to evaluate
 * 
 * Note: evaluated_by is automatically set from Hasura session variables (x-hasura-user-id)
 * created_at and updated_at are automatically set by database triggers
 * 
 * @returns Created evaluation with id, position_id, and status
 */
export const CREATE_EVALUATION = `
  mutation CreateEvaluation($positionId: uuid!) {
    insert_position_evaluations_one(object: {
      position_id: $positionId
      status: "draft"
    }) {
      id
      position_id
      status
    }
  }
`;

// ============================================================================
// Position Evaluation UPDATE Mutation
// ============================================================================

/**
 * Update position evaluation status and completion
 * 
 * @param id - Evaluation UUID
 * @param changes - Fields to update
 * @returns Updated evaluation
 */
export const UPDATE_EVALUATION = `
  mutation UpdateEvaluation(
    $id: uuid!
    $changes: position_evaluations_set_input!
  ) {
    update_position_evaluations_by_pk(
      pk_columns: { id: $id }
      _set: $changes
    ) {
      id
      position_id
      status
      evaluated_by
      completed_at
      evaluated_at
      updated_at
    }
  }
`;

/**
 * Complete a position evaluation (change status to completed)
 * 
 * @param id - Evaluation UUID
 * @returns Updated evaluation
 */
export const COMPLETE_EVALUATION = `
  mutation CompleteEvaluation($id: uuid!) {
    update_position_evaluations_by_pk(
      pk_columns: { id: $id }
      _set: {
        status: "completed"
        completed_at: "now()"
      }
    ) {
      id
      position_id
      status
      completed_at
      updated_at
    }
  }
`;

// ============================================================================
// Position Evaluation DELETE Mutation
// ============================================================================

/**
 * Delete a position evaluation (draft only)
 * 
 * @param id - Evaluation UUID
 * @returns Deleted evaluation id
 */
export const DELETE_EVALUATION = `
  mutation DeleteEvaluation($id: uuid!) {
    delete_position_evaluations_by_pk(id: $id) {
      id
    }
  }
`;

// ============================================================================
// Client-side Helper Functions
// ============================================================================

/**
 * Create a new position evaluation (client-side)
 * 
 * @param positionId - Position UUID to evaluate
 * @returns Created evaluation data
 * 
 * Note: evaluated_by is automatically set from Hasura session variables
 */
export async function createEvaluation(
  positionId: string
): Promise<{
  id: string;
  position_id: string;
  status: string;
}> {
  const result = await executeMutation<{
    insert_position_evaluations_one: {
      id: string;
      position_id: string;
      status: string;
    };
  }>(CREATE_EVALUATION, {
    positionId,
  });

  return result.insert_position_evaluations_one;
}

/**
 * Update evaluation status and fields (client-side)
 * 
 * @param id - Evaluation UUID
 * @param changes - Fields to update
 * @returns Updated evaluation data
 */
export async function updateEvaluation(
  id: string,
  changes: {
    status?: 'draft' | 'completed';
    completed_at?: string;
    evaluated_at?: string;
    [key: string]: any;
  }
): Promise<{
  id: string;
  position_id: string;
  status: string;
  evaluated_by: string;
  completed_at: string | null;
  evaluated_at: string | null;
  updated_at: string;
}> {
  const result = await executeMutation<{
    update_position_evaluations_by_pk: {
      id: string;
      position_id: string;
      status: string;
      evaluated_by: string;
      completed_at: string | null;
      evaluated_at: string | null;
      updated_at: string;
    };
  }>(UPDATE_EVALUATION, {
    id,
    changes,
  });

  return result.update_position_evaluations_by_pk;
}

/**
 * Complete a position evaluation (client-side)
 * 
 * @param id - Evaluation UUID
 * @returns Updated evaluation data
 */
export async function completeEvaluation(id: string): Promise<{
  id: string;
  position_id: string;
  status: string;
  completed_at: string;
  updated_at: string;
}> {
  const result = await executeMutation<{
    update_position_evaluations_by_pk: {
      id: string;
      position_id: string;
      status: string;
      completed_at: string;
      updated_at: string;
    };
  }>(COMPLETE_EVALUATION, {
    id,
  });

  return result.update_position_evaluations_by_pk;
}

/**
 * Delete a position evaluation (client-side)
 * 
 * @param id - Evaluation UUID
 * @returns Deleted evaluation id
 */
export async function deleteEvaluation(id: string): Promise<{ id: string }> {
  const result = await executeMutation<{
    delete_position_evaluations_by_pk: {
      id: string;
    };
  }>(DELETE_EVALUATION, {
    id,
  });

  return result.delete_position_evaluations_by_pk;
}

// ============================================================================
// Dimension Score CREATE/UPDATE Mutation (Upsert)
// ============================================================================

/**
 * Save dimension score (upsert: insert or update if exists)
 * 
 * @param evaluationId - Evaluation UUID
 * @param dimensionId - Dimension UUID
 * @param resultingLevel - Resulting level determined by questionnaire (1-7)
 * @param answers - JSONB object storing the decision tree path (e.g., {"q1": "yes", "q2": "no"})
 * 
 * Note: raw_points and weighted_points are automatically calculated by database triggers
 * but are NOT returned to protect evaluation logic. They can be viewed in the results page.
 * 
 * @returns Saved dimension score (without sensitive point values)
 */
export const SAVE_DIMENSION_SCORE = `
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
        constraint: dimension_scores_evaluation_id_dimension_id_key
        update_columns: [resulting_level, answers, updated_at]
      }
    ) {
      id
      dimension_id
      resulting_level
      answers
      created_at
      updated_at
    }
  }
`;

export async function saveDimensionScore(
  evaluationId: string,
  dimensionId: string,
  resultingLevel: number,
  answers: Record<string, string>
) {
  try {
    // ✅ FIX: Use executeMutation instead of executeQuery for mutations
    const data = await executeMutation<{
      insert_dimension_scores_one: {
        id: string;
        dimension_id: string;
        resulting_level: number;
        answers: Record<string, string>;
        created_at: string;
        updated_at: string;
      };
    }>(SAVE_DIMENSION_SCORE, {
      evaluationId,
      dimensionId,
      resultingLevel,
      answers
    });

    // ✅ FIX: Add detailed success logging for debugging
    console.log('✅ Dimension score saved successfully:', {
      evaluationId,
      dimensionId,
      resultingLevel,
      timestamp: new Date().toISOString()
    });

    return data.insert_dimension_scores_one;
  } catch (error) {
    // ✅ FIX: Enhanced error logging with full context
    const errorDetails = {
      evaluationId,
      dimensionId,
      resultingLevel,
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : String(error),
      timestamp: new Date().toISOString()
    };
    
    console.error('❌ Failed to save dimension score:', errorDetails);
    
    // ✅ FIX: Preserve original error message for debugging
    throw new Error(
      `Failed to save dimension score for dimension ${dimensionId}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// ============================================================================
// NOTE: Evaluation status changes are now handled automatically by the database
// ============================================================================
// When all dimension_scores are saved for an evaluation, a database SQL function
// automatically updates the position_evaluations.status to 'completed' and triggers
// the overall score calculation. This prevents race conditions and ensures data
// consistency at the database level.
// 
// Frontend is only responsible for saving dimension_scores.
// ============================================================================
