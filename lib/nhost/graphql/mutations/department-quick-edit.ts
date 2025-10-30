/**
 * GraphQL Mutations for Department Quick Edit
 * 
 * Updates department details from the details panel
 */

import { executeMutation } from '../client';

const UPDATE_DEPARTMENT = `
  mutation UpdateDepartment(
    $id: uuid!
    $dept_code: String
    $name: String
    $parent_id: uuid
    $is_active: Boolean
  ) {
    update_departments_by_pk(
      pk_columns: { id: $id }
      _set: {
        dept_code: $dept_code
        name: $name
        parent_id: $parent_id
        is_active: $is_active
      }
    ) {
      id
      dept_code
      name
      parent_id
      is_active
      metadata
    }
  }
`;

export interface UpdateDepartmentInput {
  id: string;
  dept_code?: string;
  name?: string;
  parent_id?: string | null;
  is_active?: boolean;
}

export async function updateDepartment(input: UpdateDepartmentInput) {
  const result = await executeMutation(UPDATE_DEPARTMENT, input);
  return result.update_departments_by_pk;
}
