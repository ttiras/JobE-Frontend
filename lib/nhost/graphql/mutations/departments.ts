/**
 * GraphQL mutations for Department operations
 * Handles CREATE and UPDATE operations for departments
 * 
 * Note: id, created_at, updated_at are auto-inserted by Hasura
 */

// ============================================================================
// Department CREATE Mutation
// ============================================================================

/**
 * Insert multiple departments
 * 
 * @param departments - Array of departments to insert
 * @returns Affected rows count and inserted department IDs
 */
export const INSERT_DEPARTMENTS = `
  mutation InsertDepartments($departments: [departments_insert_input!]!) {
    insert_departments(objects: $departments) {
      affected_rows
      returning {
        id
        dept_code
        name
        parent_id
        organization_id
        created_at
        updated_at
      }
    }
  }
`;

/**
 * Insert single department
 * 
 * @param department - Department to insert
 * @returns Inserted department
 */
export const INSERT_DEPARTMENT = `
  mutation InsertDepartment($department: departments_insert_input!) {
    insert_departments_one(object: $department) {
      id
      dept_code
      name
      parent_id
      organization_id
      created_at
      updated_at
    }
  }
`;

// ============================================================================
// Department UPDATE Mutation
// ============================================================================

/**
 * Update multiple departments by dept_code
 * 
 * @param updates - Array of dept_code and update values
 * @returns Affected rows count
 */
export const UPDATE_DEPARTMENTS_BULK = `
  mutation UpdateDepartmentsBulk($organization_id: uuid!, $updates: [departments_updates!]!) {
    update_departments_many(updates: $updates) {
      affected_rows
      returning {
        id
        dept_code
        name
        parent_dept_code
        metadata
        updated_at
      }
    }
  }
`;

/**
 * Update single department by dept_code
 * 
 * @param organization_id - Organization UUID
 * @param dept_code - Department code to update
 * @param changes - Fields to update
 * @returns Updated department
 */
export const UPDATE_DEPARTMENT = `
  mutation UpdateDepartment(
    $organization_id: uuid!
    $dept_code: String!
    $changes: departments_set_input!
  ) {
    update_departments(
      where: {
        organization_id: { _eq: $organization_id }
        dept_code: { _eq: $dept_code }
      }
      _set: $changes
    ) {
      affected_rows
      returning {
        id
        dept_code
        name
        parent_id
        updated_at
      }
    }
  }
`;

// ============================================================================
// Department UPSERT (INSERT or UPDATE)
// ============================================================================

/**
 * Upsert departments (insert new or update existing)
 * 
 * @param departments - Array of departments to upsert
 * @param on_conflict - Conflict resolution strategy
 * @returns Affected rows and returning data
 */
export const UPSERT_DEPARTMENTS = `
  mutation UpsertDepartments(
    $departments: [departments_insert_input!]!
    $on_conflict: departments_on_conflict!
  ) {
    insert_departments(
      objects: $departments
      on_conflict: $on_conflict
    ) {
      affected_rows
      returning {
        id
        dept_code
        name
        parent_dept_code
        metadata
        organization_id
        created_at
        updated_at
      }
    }
  }
`;

// ============================================================================
// Department DELETE Mutation
// ============================================================================

/**
 * Delete department by dept_code
 * 
 * @param organization_id - Organization UUID
 * @param dept_code - Department code to delete
 * @returns Affected rows count
 */
export const DELETE_DEPARTMENT = `
  mutation DeleteDepartment($organization_id: uuid!, $dept_code: String!) {
    delete_departments(
      where: {
        organization_id: { _eq: $organization_id }
        dept_code: { _eq: $dept_code }
      }
    ) {
      affected_rows
      returning {
        id
        dept_code
        name
      }
    }
  }
`;

/**
 * Delete multiple departments by dept_codes
 * 
 * @param organization_id - Organization UUID
 * @param dept_codes - Array of department codes to delete
 * @returns Affected rows count
 */
export const DELETE_DEPARTMENTS_BULK = `
  mutation DeleteDepartmentsBulk($organization_id: uuid!, $dept_codes: [String!]!) {
    delete_departments(
      where: {
        organization_id: { _eq: $organization_id }
        dept_code: { _in: $dept_codes }
      }
    ) {
      affected_rows
    }
  }
`;
