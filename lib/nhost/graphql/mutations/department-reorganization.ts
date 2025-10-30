/**
 * Department Reorganization Mutations
 * 
 * GraphQL mutations for updating department hierarchy
 */

import { executeMutation } from '@/lib/nhost/graphql/client';

/**
 * Update a single department's parent
 */
const UPDATE_DEPARTMENT_PARENT = `
  mutation UpdateDepartmentParent($id: uuid!, $parent_id: uuid) {
    update_departments_by_pk(
      pk_columns: { id: $id }
      _set: { parent_id: $parent_id, updated_at: "now()" }
    ) {
      id
      parent_id
      updated_at
    }
  }
`;

/**
 * Update multiple departments' parents in a single transaction
 */
const UPDATE_MULTIPLE_DEPARTMENT_PARENTS = `
  mutation UpdateMultipleDepartmentParents($updates: [departments_updates!]!) {
    update_departments_many(updates: $updates) {
      affected_rows
      returning {
        id
        parent_id
        updated_at
      }
    }
  }
`;

export interface UpdateDepartmentParentInput {
  id: string;
  parent_id: string | null;
}

export interface UpdateDepartmentParentResponse {
  update_departments_by_pk: {
    id: string;
    parent_id: string | null;
    updated_at: string;
  };
}

export interface BatchUpdateDepartmentParentsInput {
  updates: Array<{
    where: { id: { _eq: string } };
    _set: { parent_id: string | null };
  }>;
}

export interface BatchUpdateDepartmentParentsResponse {
  update_departments_many: Array<{
    affected_rows: number;
    returning: Array<{
      id: string;
      parent_id: string | null;
      updated_at: string;
    }>;
  }>;
}

/**
 * Update a single department's parent
 */
export async function updateDepartmentParent(
  id: string,
  parent_id: string | null
): Promise<UpdateDepartmentParentResponse> {
  return executeMutation<UpdateDepartmentParentResponse>(
    UPDATE_DEPARTMENT_PARENT,
    { id, parent_id }
  );
}

/**
 * Batch update multiple departments' parents
 */
export async function batchUpdateDepartmentParents(
  moves: Array<{ departmentId: string; newParentId: string | null }>
): Promise<number> {
  // Format updates for Hasura's update_many syntax
  const updates = moves.map(move => ({
    where: { id: { _eq: move.departmentId } },
    _set: { 
      parent_id: move.newParentId,
      updated_at: new Date().toISOString()
    }
  }));

  const response = await executeMutation<BatchUpdateDepartmentParentsResponse>(
    UPDATE_MULTIPLE_DEPARTMENT_PARENTS,
    { updates }
  );

  // Sum up affected rows from all updates
  return response.update_departments_many.reduce(
    (sum, result) => sum + result.affected_rows,
    0
  );
}
