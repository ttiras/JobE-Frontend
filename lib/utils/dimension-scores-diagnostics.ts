/**
 * Dimension Scores Diagnostic Utility
 * 
 * Helps diagnose why dimension_scores mutations are failing.
 * Run this in browser console or as a server action.
 */

import { executeQuery, executeMutation } from '@/lib/nhost/graphql/client';

export interface DiagnosticResult {
  step: string;
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Run comprehensive diagnostics on dimension_scores functionality
 */
export async function runDimensionScoresDiagnostics(
  evaluationId: string,
  dimensionId: string
): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  // Test 1: Check if user is authenticated
  try {
    const userCheck = await executeQuery(`
      query {
        auth {
          user {
            id
            email
          }
        }
      }
    `);
    
    results.push({
      step: 'Authentication Check',
      success: true,
      data: userCheck
    });
  } catch (error) {
    results.push({
      step: 'Authentication Check',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
    return results; // Stop if not authenticated
  }

  // Test 2: Check if evaluation exists and is accessible
  try {
    const evalCheck = await executeQuery(`
      query CheckEvaluation($evaluationId: uuid!) {
        position_evaluations_by_pk(id: $evaluationId) {
          id
          position_id
          status
          evaluated_by
        }
      }
    `, { evaluationId });
    
    results.push({
      step: 'Evaluation Accessibility',
      success: !!evalCheck?.position_evaluations_by_pk,
      data: evalCheck?.position_evaluations_by_pk
    });
    
    if (!evalCheck?.position_evaluations_by_pk) {
      results.push({
        step: 'Evaluation Accessibility',
        success: false,
        error: 'Evaluation not found or not accessible'
      });
    }
  } catch (error) {
    results.push({
      step: 'Evaluation Accessibility',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }

  // Test 3: Check if dimension exists
  try {
    const dimCheck = await executeQuery(`
      query CheckDimension($dimensionId: uuid!) {
        dimensions_by_pk(id: $dimensionId) {
          id
          name
          weight
        }
      }
    `, { dimensionId });
    
    results.push({
      step: 'Dimension Existence',
      success: !!dimCheck?.dimensions_by_pk,
      data: dimCheck?.dimensions_by_pk
    });
  } catch (error) {
    results.push({
      step: 'Dimension Existence',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }

  // Test 4: Check if dimension_scores table is accessible (read permission)
  try {
    const readCheck = await executeQuery(`
      query CheckDimensionScoresRead($evaluationId: uuid!) {
        dimension_scores(
          where: { evaluation_id: { _eq: $evaluationId } }
          limit: 1
        ) {
          dimension_id
          resulting_level
        }
      }
    `, { evaluationId });
    
    results.push({
      step: 'Dimension Scores Read Permission',
      success: true,
      data: readCheck
    });
  } catch (error) {
    results.push({
      step: 'Dimension Scores Read Permission',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }

  // Test 5: Try to insert a test dimension score
  try {
    const insertTest = await executeMutation(`
      mutation TestDimensionScoreInsert(
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
          id: evaluation_id
          dimension_id
          resulting_level
        }
      }
    `, {
      evaluationId,
      dimensionId,
      resultingLevel: 3, // Test value
      answers: { test: 'diagnostic_test' }
    });
    
    results.push({
      step: 'Dimension Score Insert Permission',
      success: true,
      data: insertTest
    });
  } catch (error) {
    results.push({
      step: 'Dimension Score Insert Permission',
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }

  return results;
}

/**
 * Format diagnostic results for console output
 */
export function formatDiagnosticResults(results: DiagnosticResult[]): string {
  let output = '\n🔍 DIMENSION SCORES DIAGNOSTICS\n';
  output += '='.repeat(50) + '\n\n';
  
  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    output += `${icon} ${index + 1}. ${result.step}\n`;
    
    if (result.success && result.data) {
      output += `   Data: ${JSON.stringify(result.data, null, 2)}\n`;
    }
    
    if (!result.success && result.error) {
      output += `   ❌ Error: ${result.error}\n`;
    }
    
    output += '\n';
  });
  
  // Summary
  const successCount = results.filter(r => r.success).length;
  output += '='.repeat(50) + '\n';
  output += `Summary: ${successCount}/${results.length} checks passed\n`;
  
  if (successCount < results.length) {
    output += '\n⚠️  ACTION REQUIRED:\n';
    const failedSteps = results.filter(r => !r.success);
    failedSteps.forEach(step => {
      output += `   • Fix: ${step.step}\n`;
      if (step.error) {
        output += `     Error: ${step.error}\n`;
      }
    });
  }
  
  return output;
}

/**
 * Check for common permission issues
 */
export async function checkHasuraPermissions(): Promise<string[]> {
  const issues: string[] = [];
  
  try {
    // Try a simple query first
    await executeQuery('query { __typename }');
  } catch (error) {
    issues.push('❌ Cannot connect to GraphQL endpoint');
    issues.push(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    return issues;
  }
  
  // Check specific table permissions
  const tablesToCheck = [
    { name: 'position_evaluations', operation: 'select' },
    { name: 'dimensions', operation: 'select' },
    { name: 'dimension_scores', operation: 'select' },
    { name: 'dimension_scores', operation: 'insert' },
  ];
  
  for (const table of tablesToCheck) {
    try {
      if (table.operation === 'select') {
        await executeQuery(`query { ${table.name}(limit: 1) { __typename } }`);
      }
      issues.push(`✅ ${table.name} ${table.operation} permission OK`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      issues.push(`❌ ${table.name} ${table.operation} permission DENIED`);
      issues.push(`   ${errorMsg}`);
    }
  }
  
  return issues;
}
