/**
 * Upsert Detection Utility
 * 
 * Determines whether import operations should be CREATE or UPDATE
 * based on existing database records
 * 
 * Features:
 * - O(1) code lookup using Set
 * - Separate detection for departments and positions
 * - Type-safe operation assignment
 */

import {
  DepartmentRow,
  PositionRow,
  DepartmentPreview,
  PositionPreview,
  OperationType,
} from '@/lib/types/import';

/**
 * Detect department operations (CREATE vs UPDATE)
 * @param departments - Array of department rows from Excel
 * @param existingCodes - Set of department codes that already exist in database
 * @returns Array of departments with operation type assigned
 */
export function detectDepartmentOperations(
  departments: DepartmentRow[],
  existingCodes: Set<string>
): DepartmentPreview[] {
  return departments.map(dept => {
    // Ensure metadata is Record or null (not string)
    let metadata: Record<string, unknown> | null = null;
    if (dept.metadata && typeof dept.metadata === 'object') {
      metadata = dept.metadata;
    } else if (dept.metadata && typeof dept.metadata === 'string') {
      try {
        metadata = JSON.parse(dept.metadata);
      } catch {
        metadata = null;
      }
    }

    return {
      operation: existingCodes.has(dept.dept_code)
        ? OperationType.UPDATE
        : OperationType.CREATE,
      dept_code: dept.dept_code,
      name: dept.name,
      parent_dept_code: dept.parent_dept_code,
      metadata,
      excelRow: dept.excelRow,
    };
  });
}

/**
 * Detect position operations (CREATE vs UPDATE)
 * @param positions - Array of position rows from Excel
 * @param existingCodes - Set of position codes that already exist in database
 * @returns Array of positions with operation type assigned
 */
export function detectPositionOperations(
  positions: PositionRow[],
  existingCodes: Set<string>
): PositionPreview[] {
  return positions.map(pos => ({
    operation: existingCodes.has(pos.pos_code)
      ? OperationType.UPDATE
      : OperationType.CREATE,
    pos_code: pos.pos_code,
    title: pos.title,
    dept_code: pos.dept_code,
    reports_to_pos_code: pos.reports_to_pos_code,
    is_manager: pos.is_manager,
    is_active: pos.is_active,
    incumbents_count: pos.incumbents_count,
    excelRow: pos.excelRow,
  }));
}

/**
 * Fetch existing department codes from database
 * @returns Set of department codes that exist in database
 */
export async function fetchExistingDepartmentCodes(): Promise<Set<string>> {
  // TODO: Implement GraphQL query to fetch existing department codes
  // This will be implemented in the GraphQL integration phase
  return new Set<string>();
}

/**
 * Fetch existing position codes from database
 * @returns Set of position codes that exist in database
 */
export async function fetchExistingPositionCodes(): Promise<Set<string>> {
  // TODO: Implement GraphQL query to fetch existing position codes
  // This will be implemented in the GraphQL integration phase
  return new Set<string>();
}
