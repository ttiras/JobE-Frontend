/**
 * Manual Sync Utility for Dimension Scores
 * 
 * Syncs unsaved dimension scores from localStorage to database.
 * Use this to recover from failed mutations.
 */

import { loadAllAnswers, markAnswerSaved } from '@/lib/localStorage/evaluationStorage';
import { saveDimensionScore } from '@/lib/nhost/graphql/mutations/evaluations';
import { executeQuery } from '@/lib/nhost/graphql/client';

export interface SyncResult {
  dimensionId: string;
  success: boolean;
  error?: string;
}

export interface SyncSummary {
  total: number;
  successful: number;
  failed: number;
  results: SyncResult[];
}

/**
 * Get all dimension IDs for an evaluation
 */
async function getAllDimensionIds(evaluationId: string): Promise<string[]> {
  const result = await executeQuery<{
    position_evaluations_by_pk: {
      position: {
        organization_id: string;
      };
    };
    dimensions: Array<{ id: string }>;
  }>(`
    query GetDimensionsForEvaluation($evaluationId: uuid!) {
      position_evaluations_by_pk(id: $evaluationId) {
        position {
          organization_id
        }
      }
      dimensions {
        id
      }
    }
  `, { evaluationId });
  
  return result.dimensions.map(d => d.id);
}

/**
 * Sync all unsaved dimension scores from localStorage to database
 */
export async function syncUnsavedDimensionScores(
  evaluationId: string,
  onProgress?: (current: number, total: number) => void
): Promise<SyncSummary> {
  // Get all dimension IDs
  const dimensionIds = await getAllDimensionIds(evaluationId);
  
  // Load all answers from localStorage
  const answers = loadAllAnswers(evaluationId, dimensionIds);
  
  // Filter to only unsaved answers
  const unsavedAnswers = Array.from(answers.entries()).filter(
    ([_, answer]) => !answer.savedToDb
  );
  
  const results: SyncResult[] = [];
  
  console.log(`📤 Starting sync of ${unsavedAnswers.length} unsaved dimension scores...`);
  
  // Sync each unsaved answer
  for (let i = 0; i < unsavedAnswers.length; i++) {
    const [dimensionId, answer] = unsavedAnswers[i];
    
    onProgress?.(i + 1, unsavedAnswers.length);
    
    try {
      await saveDimensionScore(
        evaluationId,
        dimensionId,
        answer.resultingLevel,
        answer.answers
      );
      
      // Mark as saved in localStorage
      markAnswerSaved(evaluationId, dimensionId);
      
      results.push({
        dimensionId,
        success: true
      });
      
      console.log(`✅ Synced dimension ${dimensionId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        dimensionId,
        success: false,
        error: errorMessage
      });
      
      console.error(`❌ Failed to sync dimension ${dimensionId}:`, errorMessage);
    }
    
    // Add small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  const summary: SyncSummary = {
    total: unsavedAnswers.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  };
  
  console.log(`\n📊 Sync Summary:`);
  console.log(`   Total: ${summary.total}`);
  console.log(`   Successful: ${summary.successful}`);
  console.log(`   Failed: ${summary.failed}`);
  
  return summary;
}

/**
 * Retry failed syncs with exponential backoff
 */
export async function retryFailedSyncs(
  evaluationId: string,
  failedResults: SyncResult[],
  maxRetries: number = 3
): Promise<SyncSummary> {
  console.log(`\n🔄 Retrying ${failedResults.length} failed syncs...`);
  
  const results: SyncResult[] = [];
  
  for (const failedResult of failedResults) {
    let success = false;
    let lastError: string | undefined;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Exponential backoff: 1s, 2s, 4s
        const delay = 1000 * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Load answer from localStorage
        const answers = loadAllAnswers(evaluationId, [failedResult.dimensionId]);
        const answer = answers.get(failedResult.dimensionId);
        
        if (!answer) {
          throw new Error('Answer not found in localStorage');
        }
        
        await saveDimensionScore(
          evaluationId,
          failedResult.dimensionId,
          answer.resultingLevel,
          answer.answers
        );
        
        markAnswerSaved(evaluationId, failedResult.dimensionId);
        success = true;
        console.log(`✅ Retry successful for dimension ${failedResult.dimensionId}`);
        break;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        console.log(`❌ Retry attempt ${attempt + 1} failed for dimension ${failedResult.dimensionId}`);
      }
    }
    
    results.push({
      dimensionId: failedResult.dimensionId,
      success,
      error: success ? undefined : lastError
    });
  }
  
  return {
    total: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  };
}

/**
 * Get sync status for an evaluation
 */
export function getSyncStatus(evaluationId: string, dimensionIds: string[]) {
  const answers = loadAllAnswers(evaluationId, dimensionIds);
  
  const saved = Array.from(answers.values()).filter(a => a.savedToDb).length;
  const unsaved = answers.size - saved;
  const total = dimensionIds.length;
  const completed = answers.size;
  const pending = total - completed;
  
  return {
    total,
    completed,
    pending,
    saved,
    unsaved,
    percentSaved: total > 0 ? Math.round((saved / total) * 100) : 0
  };
}
