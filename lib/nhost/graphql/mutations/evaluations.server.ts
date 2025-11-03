/**
 * Server-side GraphQL mutations for Position Evaluation operations
 * 
 * WARNING: This file imports 'next/headers' and can ONLY be used in Server Components,
 * Server Actions, or API routes. DO NOT import in Client Components.
 */

'use server';

import { serverExecuteMutation } from '@/lib/nhost/graphql/server';
import { CREATE_EVALUATION, UPDATE_EVALUATION } from './evaluations';

/**
 * Create a new position evaluation (server-side)
 * 
 * @param positionId - Position UUID to evaluate
 * @returns Created evaluation data
 * 
 * Note: evaluated_by is automatically set from Hasura session variables
 * created_at and updated_at are set by database triggers
 */
export async function createEvaluationServer(
  positionId: string
): Promise<{
  id: string;
  position_id: string;
  status: string;
}> {
  const result = await serverExecuteMutation<{
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
 * Update evaluation status and fields (server-side)
 * 
 * @param id - Evaluation UUID
 * @param changes - Fields to update
 * @returns Updated evaluation data
 */
export async function updateEvaluationServer(
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
  const result = await serverExecuteMutation<{
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
