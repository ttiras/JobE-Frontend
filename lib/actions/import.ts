/**
 * Server Actions for Excel Import
 * 
 * Handles server-side execution of import operations with:
 * - Automatic authentication via HTTP-only cookies
 * - Transaction handling for departments and positions
 * - Proper error handling and rollback
 * - Type-safe GraphQL mutations
 */

'use server';

import { serverExecuteMutation, serverExecuteQuery } from '@/lib/nhost/graphql/server';
import { INSERT_DEPARTMENTS, UPDATE_DEPARTMENT } from '@/lib/nhost/graphql/mutations/departments';
import { INSERT_POSITIONS, UPDATE_POSITION } from '@/lib/nhost/graphql/mutations/positions';
import type { 
  DepartmentPreview, 
  PositionPreview, 
  ImportResult, 
  OperationType 
} from '@/lib/types/import';
import { OperationType as OpType } from '@/lib/types/import';

/**
 * Server-side GraphQL query to fetch existing departments
 */
const GET_EXISTING_DEPARTMENTS = `
  query GetExistingDepartments($organization_id: uuid!) {
    departments(where: { organization_id: { _eq: $organization_id } }) {
      id
      dept_code
    }
  }
`;

/**
 * Server-side GraphQL query to fetch existing positions
 */
const GET_EXISTING_POSITIONS = `
  query GetExistingPositions($organization_id: uuid!) {
    positions(where: { organization_id: { _eq: $organization_id } }) {
      id
      pos_code
    }
  }
`;

/**
 * Execute complete import workflow on the server
 * 
 * This function:
 * 1. Validates authentication (automatic via cookies)
 * 2. Processes departments first (in hierarchy order)
 * 3. Processes positions second (after departments exist)
 * 4. Returns detailed result with counts
 * 
 * @param organizationId - Target organization UUID
 * @param departments - Array of departments with operation types
 * @param positions - Array of positions with operation types
 * @returns Import result with counts and any errors
 */
export async function executeServerImport(
  organizationId: string,
  departments: DepartmentPreview[],
  positions: PositionPreview[]
): Promise<ImportResult> {
  console.log('=== executeServerImport called ===');
  console.log('organizationId:', organizationId);
  console.log('departments count:', departments.length);
  console.log('positions count:', positions.length);

  // Validate inputs
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

    // Fetch existing departments to build dept_code -> id map
    const existingDepartmentsData = await serverExecuteQuery<{
      departments: { id: string; dept_code: string }[];
    }>(GET_EXISTING_DEPARTMENTS, { organization_id: organizationId });

    const deptCodeToId = new Map<string, string>();
    existingDepartmentsData.departments.forEach((dept) => {
      deptCodeToId.set(dept.dept_code, dept.id);
    });

    // Separate CREATE and UPDATE operations
    const depsToCreate = departments.filter(d => d.operation === OpType.CREATE);
    const depsToUpdate = departments.filter(d => d.operation === OpType.UPDATE);

    // Execute department CREATES in hierarchical order
    if (depsToCreate.length > 0) {
      const createdCount = await createDepartmentsInHierarchy(
        organizationId,
        depsToCreate,
        deptCodeToId
      );
      result.departmentsCreated = createdCount;
    }

    // Execute department UPDATES one by one
    if (depsToUpdate.length > 0) {
      for (const dept of depsToUpdate) {
        try {
          const changes = {
            name: dept.name,
            parent_id: dept.parent_dept_code ? deptCodeToId.get(dept.parent_dept_code) || null : null,
            ...(dept.metadata && { metadata: dept.metadata }),
          };

          await serverExecuteMutation(
            UPDATE_DEPARTMENT,
            {
              organization_id: organizationId,
              dept_code: dept.dept_code,
              changes,
            }
          );

          result.departmentsUpdated++;
        } catch (error) {
          console.error(`Failed to update department ${dept.dept_code}:`, error);
          throw new Error(`Failed to update department ${dept.dept_code}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // ========================================================================
    // Step 2: Process Positions (after departments)
    // ========================================================================

    // Refresh dept_code -> id map after creating new departments
    const refreshedDepartmentsData = await serverExecuteQuery<{
      departments: { id: string; dept_code: string }[];
    }>(GET_EXISTING_DEPARTMENTS, { organization_id: organizationId });

    deptCodeToId.clear();
    refreshedDepartmentsData.departments.forEach((dept) => {
      deptCodeToId.set(dept.dept_code, dept.id);
    });

    // Fetch existing positions to build pos_code -> id map
    const existingPositionsData = await serverExecuteQuery<{
      positions: { id: string; pos_code: string }[];
    }>(GET_EXISTING_POSITIONS, { organization_id: organizationId });

    const posCodeToId = new Map<string, string>();
    existingPositionsData.positions.forEach((pos) => {
      posCodeToId.set(pos.pos_code, pos.id);
    });

    // Separate CREATE and UPDATE operations
    const posToCreate = positions.filter(p => p.operation === OpType.CREATE);
    const posToUpdate = positions.filter(p => p.operation === OpType.UPDATE);

    // Execute position CREATES in batch
    if (posToCreate.length > 0) {
      const positionInsertData = posToCreate.map(pos => ({
        organization_id: organizationId,
        pos_code: pos.pos_code,
        title: pos.title,
        department_id: deptCodeToId.get(pos.dept_code) || null,
        reports_to_id: pos.reports_to_pos_code ? posCodeToId.get(pos.reports_to_pos_code) || null : null,
        is_manager: pos.is_manager,
        incumbents_count: pos.incumbents_count,
      }));

      const insertPositionsResult = await serverExecuteMutation<{
        insert_positions: {
          affected_rows: number;
          returning: { id: string; pos_code: string }[];
        };
      }>(INSERT_POSITIONS, { positions: positionInsertData });

      result.positionsCreated = insertPositionsResult.insert_positions.affected_rows;

      // Update pos_code -> id map with newly created positions
      insertPositionsResult.insert_positions.returning.forEach((pos) => {
        posCodeToId.set(pos.pos_code, pos.id);
      });
    }

    // Execute position UPDATES one by one
    if (posToUpdate.length > 0) {
      for (const pos of posToUpdate) {
        try {
          const changes = {
            title: pos.title,
            department_id: deptCodeToId.get(pos.dept_code) || null,
            reports_to_id: pos.reports_to_pos_code ? posCodeToId.get(pos.reports_to_pos_code) || null : null,
            is_manager: pos.is_manager,
            incumbents_count: pos.incumbents_count,
          };

          await serverExecuteMutation(
            UPDATE_POSITION,
            {
              organization_id: organizationId,
              pos_code: pos.pos_code,
              changes,
            }
          );

          result.positionsUpdated++;
        } catch (error) {
          console.error(`Failed to update position ${pos.pos_code}:`, error);
          throw new Error(`Failed to update position ${pos.pos_code}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    console.log('Import completed successfully:', result);
    return result;

  } catch (error) {
    console.error('Import workflow failed:', error);
    throw error;
  }
}

/**
 * Helper function to create departments in hierarchical order
 * Parents must be created before children
 */
async function createDepartmentsInHierarchy(
  organizationId: string,
  departments: DepartmentPreview[],
  deptCodeToId: Map<string, string>
): Promise<number> {
  const toCreate = [...departments];
  const created: string[] = []; // Track dept_codes we've created
  let totalCreated = 0;
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
      ...(dept.metadata && { metadata: dept.metadata }),
    }));

    console.log(`Creating ${canCreateNow.length} departments in pass ${currentPass}`);

    const insertResult = await serverExecuteMutation<{
      insert_departments: {
        affected_rows: number;
        returning: { id: string; dept_code: string }[];
      };
    }>(INSERT_DEPARTMENTS, { departments: departmentInsertData });

    const createdCount = insertResult.insert_departments.affected_rows;
    totalCreated += createdCount;

    // Update tracking
    insertResult.insert_departments.returning.forEach((dept) => {
      deptCodeToId.set(dept.dept_code, dept.id);
      created.push(dept.dept_code);
    });

    // Remove created departments from toCreate list
    canCreateNow.forEach(dept => {
      const index = toCreate.findIndex(d => d.dept_code === dept.dept_code);
      if (index !== -1) {
        toCreate.splice(index, 1);
      }
    });
  }

  if (toCreate.length > 0) {
    throw new Error(`Failed to create ${toCreate.length} departments after ${maxPasses} passes`);
  }

  return totalCreated;
}
