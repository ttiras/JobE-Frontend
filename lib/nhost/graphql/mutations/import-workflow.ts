/**
 * Complete Import Workflow Orchestration
 * 
 * ⚠️ DEPRECATED: This file contains the old client-side import execution logic.
 * For new implementations, use the Server Action: lib/actions/import.ts
 * 
 * This file now only exports utility functions like getImportSummary that are
 * used by the client-side preview functionality.
 * 
 * T042: Handles the complete import process with:
 * - Department operations (CREATE/UPDATE)
 * - Position operations (CREATE/UPDATE)
 * - Transaction handling
 * - Error recovery
 * - Result aggregation
 * 
 * Execution order:
 * 1. Insert/Update departments first (positions depend on them)
 * 2. Insert/Update positions second
 * 3. Return aggregated results
 */

import { NhostClient } from '@nhost/nextjs';
import { DepartmentPreview, PositionPreview, ImportResult, OperationType } from '@/lib/types/import';
import { INSERT_DEPARTMENTS, UPDATE_DEPARTMENT } from './departments';
import { INSERT_POSITIONS, UPDATE_POSITION } from './positions';

/**
 * Helper function to make GraphQL requests with proper formatting
 */
async function graphqlRequest(
  nhostClient: NhostClient,
  query: string,
  variables: Record<string, any>
): Promise<{ data: any; error: any }> {
  try {
    // Construct GraphQL URL from subdomain and region
    const subdomain = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN;
    const region = process.env.NEXT_PUBLIC_NHOST_REGION;
    const graphqlUrl = region 
      ? `https://${subdomain}.graphql.${region}.nhost.run/v1`
      : `https://${subdomain}.graphql.nhost.run/v1`;
    
    const accessToken = nhostClient.auth.getAccessToken();
    
    console.log('GraphQL Request:', { url: graphqlUrl, query: query.substring(0, 100), variables });
    
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    const result = await response.json();
    
    console.log('GraphQL Response:', result);
    
    if (result.errors) {
      return { data: null, error: result.errors };
    }
    
    return { data: result.data, error: null };
  } catch (err) {
    console.error('GraphQL Request Error:', err);
    return { data: null, error: err };
  }
}

/**
 * Execute complete import workflow
 * 
 * @param nhostClient - Nhost client instance
 * @param organizationId - Target organization UUID
 * @param departments - Array of departments with operation types
 * @param positions - Array of positions with operation types
 * @returns Import result with counts
 */
export async function executeImportWorkflow(
  nhostClient: NhostClient,
  organizationId: string,
  departments: DepartmentPreview[],
  positions: PositionPreview[]
): Promise<ImportResult> {
  console.log('=== executeImportWorkflow called ===');
  console.log('nhostClient:', nhostClient);
  console.log('organizationId:', organizationId);
  console.log('departments count:', departments.length);
  console.log('positions count:', positions.length);

  // Validate inputs
  if (!nhostClient) {
    throw new Error('Nhost client is required');
  }
  if (!nhostClient.graphql) {
    throw new Error('Nhost client graphql is not initialized');
  }
  if (!organizationId) {
    throw new Error('Organization ID is required');
  }

  const result: ImportResult = {
    departmentsCreated: 0,
    departmentsUpdated: 0,
    positionsCreated: 0,
    positionsUpdated: 0,
    totalDepartments: departments.length,
    totalPositions: positions.length,
  };

  try {
    // ========================================================================
    // Step 1: Process Departments (must be done first)
    // ========================================================================

    // Separate CREATE and UPDATE operations
    const depsToCreate = departments.filter(d => d.operation === OperationType.CREATE);
    const depsToUpdate = departments.filter(d => d.operation === OperationType.UPDATE);

    // Execute department CREATES in batch
    if (depsToCreate.length > 0) {
      // Query existing departments to get their IDs (for parent references)
      const existingDepts = await graphqlRequest(
        nhostClient,
        `
          query GetExistingDepartments($organization_id: uuid!) {
            departments(where: { organization_id: { _eq: $organization_id } }) {
              id
              dept_code
            }
          }
        `,
        { organization_id: organizationId }
      );

      // Build dept_code -> id map for existing departments
      const deptCodeToId = new Map<string, string>();
      if (existingDepts.data?.departments) {
        existingDepts.data.departments.forEach((dept: { id: string; dept_code: string }) => {
          deptCodeToId.set(dept.dept_code, dept.id);
        });
      }

      // Sort departments by hierarchy level (roots first, then children)
      // We'll process them in multiple passes if needed
      const toCreate = [...depsToCreate];
      const created: string[] = []; // Track dept_codes we've created
      let maxPasses = 10; // Prevent infinite loop
      let currentPass = 0;

      while (toCreate.length > 0 && currentPass < maxPasses) {
        currentPass++;
        console.log(`Department creation pass ${currentPass}, remaining: ${toCreate.length}`);

        // In this pass, create departments whose parent either:
        // 1. Doesn't exist (root department)
        // 2. Already exists in database
        // 3. Was created in previous pass
        const canCreateNow = toCreate.filter(dept => {
          if (!dept.parent_dept_code) return true; // Root department
          if (deptCodeToId.has(dept.parent_dept_code)) return true; // Parent exists in DB
          if (created.includes(dept.parent_dept_code)) return true; // Parent created in earlier pass
          return false;
        });

        if (canCreateNow.length === 0) {
          // No progress can be made - there's a circular reference or missing parent
          const remaining = toCreate.map(d => ({
            code: d.dept_code,
            parent: d.parent_dept_code
          }));
          console.error('Cannot create remaining departments due to missing parents:', remaining);
          throw new Error(`Cannot create ${toCreate.length} departments - missing parent references`);
        }

        // Create this batch
        const departmentInsertData = canCreateNow.map(dept => ({
          organization_id: organizationId,
          dept_code: dept.dept_code,
          name: dept.name,
          parent_id: dept.parent_dept_code ? deptCodeToId.get(dept.parent_dept_code) || null : null,
        }));

        console.log(`Creating ${canCreateNow.length} departments:`, departmentInsertData);

        const { data: createData, error: createError } = await graphqlRequest(
          nhostClient,
          INSERT_DEPARTMENTS,
          { departments: departmentInsertData }
        );

        console.log('GraphQL Response:', { data: createData, error: createError });

        if (createError) {
          const errorMsg = Array.isArray(createError)
            ? createError[0]?.message || 'Failed to create departments'
            : 'message' in createError
            ? createError.message
            : 'Failed to create departments';
          throw new Error(errorMsg);
        }

        const affectedRows = createData?.insert_departments?.affected_rows || 0;
        result.departmentsCreated += affectedRows;
        
        // Update our map with newly created departments
        if (createData?.insert_departments?.returning) {
          createData.insert_departments.returning.forEach((dept: { id: string; dept_code: string }) => {
            deptCodeToId.set(dept.dept_code, dept.id);
            created.push(dept.dept_code);
          });
        }

        // Remove created departments from toCreate list
        canCreateNow.forEach(dept => {
          const index = toCreate.findIndex(d => d.dept_code === dept.dept_code);
          if (index !== -1) toCreate.splice(index, 1);
        });
      }

      if (toCreate.length > 0) {
        throw new Error(`Failed to create ${toCreate.length} departments after ${maxPasses} passes`);
      }
    }

    // Execute department UPDATES individually
    // Note: Hasura doesn't support batch updates with different values easily
    if (depsToUpdate.length > 0) {
      // Get latest dept_code to id mapping (includes newly created departments)
      const allDepts = await graphqlRequest(
        nhostClient,
        `query GetAllDepartments($organization_id: uuid!) {
          departments(where: { organization_id: { _eq: $organization_id } }) {
            id
            dept_code
          }
        }`,
        { organization_id: organizationId }
      );

      const deptCodeToId = new Map<string, string>();
      if (allDepts.data?.departments) {
        allDepts.data.departments.forEach((dept: { id: string; dept_code: string }) => {
          deptCodeToId.set(dept.dept_code, dept.id);
        });
      }

      for (const dept of depsToUpdate) {
        const { data: updateData, error: updateError } = await graphqlRequest(
          nhostClient,
          UPDATE_DEPARTMENT,
          {
            organization_id: organizationId,
            dept_code: dept.dept_code,
            changes: {
              name: dept.name,
              parent_id: dept.parent_dept_code ? deptCodeToId.get(dept.parent_dept_code) || null : null,
            },
          }
        );

        if (updateError) {
          console.error(`Failed to update department ${dept.dept_code}:`, updateError);
          // Continue with other updates even if one fails
        } else {
          result.departmentsUpdated += updateData?.update_departments?.affected_rows || 0;
        }
      }
    }

    // ========================================================================
    // Step 2: Process Positions (after departments are created)
    // ========================================================================

    // Separate CREATE and UPDATE operations
    const posToCreate = positions.filter(p => p.operation === OperationType.CREATE);
    const posToUpdate = positions.filter(p => p.operation === OperationType.UPDATE);

    // Execute position CREATES in batch
    if (posToCreate.length > 0) {
      const positionInsertData = posToCreate.map(pos => ({
        organization_id: organizationId,
        pos_code: pos.pos_code,
        title: pos.title,
        dept_code: pos.dept_code,
        reports_to_pos_code: pos.reports_to_pos_code || null,
        is_manager: pos.is_manager,
        incumbents_count: pos.incumbents_count,
      }));

      const { data: createData, error: createError } = await graphqlRequest(
        nhostClient,
        INSERT_POSITIONS,
        { positions: positionInsertData }
      );

      if (createError) {
        const errorMsg = Array.isArray(createError)
          ? createError[0]?.message || 'Failed to create positions'
          : 'message' in createError
          ? createError.message
          : 'Failed to create positions';
        throw new Error(errorMsg);
      }

      result.positionsCreated = createData?.insert_positions?.affected_rows || 0;
    }

    // Execute position UPDATES individually
    for (const pos of posToUpdate) {
      const { data: updateData, error: updateError } = await graphqlRequest(
        nhostClient,
        UPDATE_POSITION,
        {
          organization_id: organizationId,
          pos_code: pos.pos_code,
          changes: {
            title: pos.title,
            dept_code: pos.dept_code,
            reports_to_pos_code: pos.reports_to_pos_code || null,
            is_manager: pos.is_manager,
            incumbents_count: pos.incumbents_count,
          },
        }
      );

      if (updateError) {
        console.error(`Failed to update position ${pos.pos_code}:`, updateError);
        // Continue with other updates even if one fails
      } else {
        result.positionsUpdated += updateData?.update_positions?.affected_rows || 0;
      }
    }

    return result;
  } catch (error) {
    console.error('Import workflow error:', error);
    throw error;
  }
}

/**
 * Validate import workflow prerequisites
 * 
 * @param departments - Departments to import
 * @param positions - Positions to import
 * @throws Error if validation fails
 */
export function validateImportWorkflow(
  departments: DepartmentPreview[],
  positions: PositionPreview[]
): void {
  // Validate department codes exist for all positions
  const deptCodes = new Set(departments.map(d => d.dept_code));
  
  for (const pos of positions) {
    if (!deptCodes.has(pos.dept_code)) {
      throw new Error(
        `Position ${pos.pos_code} references non-existent department ${pos.dept_code}`
      );
    }
  }

  // Validate reporting structure (reports_to_pos_code must exist in file or DB)
  const posCodes = new Set(positions.map(p => p.pos_code));
  
  for (const pos of positions) {
    if (pos.reports_to_pos_code && !posCodes.has(pos.reports_to_pos_code)) {
      // This is a warning - the position might exist in the database already
      console.warn(
        `Position ${pos.pos_code} reports to ${pos.reports_to_pos_code} which is not in this import file`
      );
    }
  }
}

/**
 * Get import summary statistics
 * 
 * @param departments - Departments to import
 * @param positions - Positions to import
 * @returns Summary object with counts
 */
export function getImportSummary(
  departments: DepartmentPreview[],
  positions: PositionPreview[]
) {
  return {
    totalRows: departments.length + positions.length,
    departments: {
      total: departments.length,
      creates: departments.filter(d => d.operation === OperationType.CREATE).length,
      updates: departments.filter(d => d.operation === OperationType.UPDATE).length,
    },
    positions: {
      total: positions.length,
      creates: positions.filter(p => p.operation === OperationType.CREATE).length,
      updates: positions.filter(p => p.operation === OperationType.UPDATE).length,
    },
  };
}
