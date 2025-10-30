/**
 * GraphQL mutations for Position operations
 * Handles CREATE and UPDATE operations for positions
 * 
 * Note: id, created_at, updated_at are auto-inserted by Hasura
 */

// ============================================================================
// Position CREATE Mutation
// ============================================================================

/**
 * Insert multiple positions
 * 
 * @param positions - Array of positions to insert
 * @returns Affected rows count and inserted position IDs
 */
export const INSERT_POSITIONS = `
  mutation InsertPositions($positions: [positions_insert_input!]!) {
    insert_positions(objects: $positions) {
      affected_rows
      returning {
        id
        pos_code
        title
        dept_code
        reports_to_pos_code
        is_manager
        is_active
        incumbents_count
        organization_id
        created_at
        updated_at
      }
    }
  }
`;

/**
 * Insert single position
 * 
 * @param position - Position to insert
 * @returns Inserted position
 */
export const INSERT_POSITION = `
  mutation InsertPosition($position: positions_insert_input!) {
    insert_positions_one(object: $position) {
      id
      pos_code
      title
      dept_code
      reports_to_pos_code
      is_manager
      is_active
      incumbents_count
      organization_id
      created_at
      updated_at
    }
  }
`;

// ============================================================================
// Position UPDATE Mutation
// ============================================================================

/**
 * Update multiple positions by pos_code
 * 
 * @param updates - Array of pos_code and update values
 * @returns Affected rows count
 */
export const UPDATE_POSITIONS_BULK = `
  mutation UpdatePositionsBulk($organization_id: uuid!, $updates: [positions_updates!]!) {
    update_positions_many(updates: $updates) {
      affected_rows
      returning {
        id
        pos_code
        title
        dept_code
        reports_to_pos_code
        is_manager
        is_active
        incumbents_count
        updated_at
      }
    }
  }
`;

/**
 * Update single position by pos_code
 * 
 * @param organization_id - Organization UUID
 * @param pos_code - Position code to update
 * @param changes - Fields to update
 * @returns Updated position
 */
export const UPDATE_POSITION = `
  mutation UpdatePosition(
    $organization_id: uuid!
    $pos_code: String!
    $changes: positions_set_input!
  ) {
    update_positions(
      where: {
        organization_id: { _eq: $organization_id }
        pos_code: { _eq: $pos_code }
      }
      _set: $changes
    ) {
      affected_rows
      returning {
        id
        pos_code
        title
        dept_code
        reports_to_pos_code
        is_manager
        is_active
        incumbents_count
        updated_at
      }
    }
  }
`;

// ============================================================================
// Position UPSERT (INSERT or UPDATE)
// ============================================================================

/**
 * Upsert positions (insert new or update existing)
 * 
 * @param positions - Array of positions to upsert
 * @param on_conflict - Conflict resolution strategy
 * @returns Affected rows and returning data
 */
export const UPSERT_POSITIONS = `
  mutation UpsertPositions(
    $positions: [positions_insert_input!]!
    $on_conflict: positions_on_conflict!
  ) {
    insert_positions(
      objects: $positions
      on_conflict: $on_conflict
    ) {
      affected_rows
      returning {
        id
        pos_code
        title
        dept_code
        reports_to_pos_code
        is_manager
        is_active
        incumbents_count
        organization_id
        created_at
        updated_at
      }
    }
  }
`;

// ============================================================================
// Position DELETE Mutation
// ============================================================================

/**
 * Delete position by pos_code
 * 
 * @param organization_id - Organization UUID
 * @param pos_code - Position code to delete
 * @returns Affected rows count
 */
export const DELETE_POSITION = `
  mutation DeletePosition($organization_id: uuid!, $pos_code: String!) {
    delete_positions(
      where: {
        organization_id: { _eq: $organization_id }
        pos_code: { _eq: $pos_code }
      }
    ) {
      affected_rows
      returning {
        id
        pos_code
        title
      }
    }
  }
`;

/**
 * Delete multiple positions by pos_codes
 * 
 * @param organization_id - Organization UUID
 * @param pos_codes - Array of position codes to delete
 * @returns Affected rows count
 */
export const DELETE_POSITIONS_BULK = `
  mutation DeletePositionsBulk($organization_id: uuid!, $pos_codes: [String!]!) {
    delete_positions(
      where: {
        organization_id: { _eq: $organization_id }
        pos_code: { _in: $pos_codes }
      }
    ) {
      affected_rows
    }
  }
`;
