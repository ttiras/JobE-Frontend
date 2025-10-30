/**
 * Validation Utilities
 * 
 * Business logic validation for import data
 * Features:
 * - Circular reference detection (DFS algorithm)
 * - Reference integrity validation
 * - Required field validation
 * - Duplicate detection
 */

import {
  DepartmentRow,
  PositionRow,
  ValidationError,
  ErrorType,
  ErrorSeverity,
  SheetType,
  ValidationContext,
} from '@/lib/types/import';

// ============================================================================
// Required Field Validation
// ============================================================================

/**
 * Validate required fields in departments
 */
export function validateDepartmentRequiredFields(
  departments: DepartmentRow[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  departments.forEach(dept => {
    if (!dept.dept_code) {
      errors.push({
        type: ErrorType.MISSING_REQUIRED_FIELD,
        severity: ErrorSeverity.ERROR,
        message: 'Department code is required',
        row: dept.excelRow,
        column: 'dept_code',
        sheet: SheetType.DEPARTMENTS,
        suggestion: 'Provide a unique department code',
      });
    }

    if (!dept.name) {
      errors.push({
        type: ErrorType.MISSING_REQUIRED_FIELD,
        severity: ErrorSeverity.ERROR,
        message: 'Department name is required',
        row: dept.excelRow,
        column: 'name',
        sheet: SheetType.DEPARTMENTS,
        suggestion: 'Provide a department name',
      });
    }

    // Validate metadata JSON if provided
    if (dept.metadata !== null && dept.metadata !== undefined) {
      try {
        if (typeof dept.metadata === 'string') {
          JSON.parse(dept.metadata as unknown as string);
        }
      } catch {
        errors.push({
          type: ErrorType.INVALID_JSON,
          severity: ErrorSeverity.ERROR,
          message: 'Invalid JSON in metadata field',
          row: dept.excelRow,
          column: 'metadata',
          sheet: SheetType.DEPARTMENTS,
          suggestion: 'Ensure metadata is valid JSON format or leave empty',
        });
      }
    }
  });

  return errors;
}

/**
 * Validate required fields in positions
 */
export function validatePositionRequiredFields(
  positions: PositionRow[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  positions.forEach(pos => {
    if (!pos.pos_code) {
      errors.push({
        type: ErrorType.MISSING_REQUIRED_FIELD,
        severity: ErrorSeverity.ERROR,
        message: 'Position code is required',
        row: pos.excelRow,
        column: 'pos_code',
        sheet: SheetType.POSITIONS,
        suggestion: 'Provide a unique position code',
      });
    }

    if (!pos.title) {
      errors.push({
        type: ErrorType.MISSING_REQUIRED_FIELD,
        severity: ErrorSeverity.ERROR,
        message: 'Position title is required',
        row: pos.excelRow,
        column: 'title',
        sheet: SheetType.POSITIONS,
        suggestion: 'Provide a position title',
      });
    }

    if (!pos.dept_code) {
      errors.push({
        type: ErrorType.MISSING_REQUIRED_FIELD,
        severity: ErrorSeverity.ERROR,
        message: 'Department code is required',
        row: pos.excelRow,
        column: 'dept_code',
        sheet: SheetType.POSITIONS,
        suggestion: 'Provide a valid department code',
      });
    }
  });

  return errors;
}

// ============================================================================
// Duplicate Detection
// ============================================================================

/**
 * Detect duplicate codes within Excel file
 */
export function validateDuplicateDepartmentCodes(
  departments: DepartmentRow[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const seen = new Map<string, number[]>();

  departments.forEach(dept => {
    if (!dept.dept_code) return;

    const existing = seen.get(dept.dept_code) || [];
    existing.push(dept.excelRow);
    seen.set(dept.dept_code, existing);
  });

  seen.forEach((rows, code) => {
    if (rows.length > 1) {
      rows.forEach(row => {
        errors.push({
          type: ErrorType.DUPLICATE_CODE_IN_FILE,
          severity: ErrorSeverity.ERROR,
          message: `Duplicate department code '${code}' found in file`,
          row,
          column: 'dept_code',
          sheet: SheetType.DEPARTMENTS,
          suggestion: 'Each department code must be unique',
          affectedCodes: [code],
        });
      });
    }
  });

  return errors;
}

/**
 * Detect duplicate position codes within Excel file
 */
export function validateDuplicatePositionCodes(
  positions: PositionRow[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const seen = new Map<string, number[]>();

  positions.forEach(pos => {
    if (!pos.pos_code) return;

    const existing = seen.get(pos.pos_code) || [];
    existing.push(pos.excelRow);
    seen.set(pos.pos_code, existing);
  });

  seen.forEach((rows, code) => {
    if (rows.length > 1) {
      rows.forEach(row => {
        errors.push({
          type: ErrorType.DUPLICATE_CODE_IN_FILE,
          severity: ErrorSeverity.ERROR,
          message: `Duplicate position code '${code}' found in file`,
          row,
          column: 'pos_code',
          sheet: SheetType.POSITIONS,
          suggestion: 'Each position code must be unique',
          affectedCodes: [code],
        });
      });
    }
  });

  return errors;
}

// ============================================================================
// Reference Validation
// ============================================================================

/**
 * Check if a parent code value is considered empty/null
 */
function isEmptyParentCode(parentCode: string | null | undefined): boolean {
  if (!parentCode) return true;
  const trimmed = parentCode.trim();
  // Consider empty, "-", or whitespace as empty parent (root department)
  return trimmed === '' || trimmed === '-';
}

/**
 * Validate department parent references
 */
export function validateDepartmentReferences(
  departments: DepartmentRow[],
  validDeptCodes: Set<string>
): ValidationError[] {
  const errors: ValidationError[] = [];

  departments.forEach(dept => {
    // parent_dept_code is allowed to be null/empty for root departments
    // Skip validation if parent is empty or "-"
    if (!isEmptyParentCode(dept.parent_dept_code) && !validDeptCodes.has(dept.parent_dept_code!)) {
      errors.push({
        type: ErrorType.INVALID_REFERENCE,
        severity: ErrorSeverity.ERROR,
        message: `Parent department '${dept.parent_dept_code}' does not exist`,
        row: dept.excelRow,
        column: 'parent_dept_code',
        sheet: SheetType.DEPARTMENTS,
        suggestion: 'Ensure parent department exists in file or database',
        affectedCodes: [dept.dept_code, dept.parent_dept_code!],
      });
    }
  });

  return errors;
}

/**
 * Validate department hierarchy structure
 * Warns if there are multiple root departments (departments without parent)
 */
export function validateDepartmentHierarchy(
  departments: DepartmentRow[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Find all root departments (no parent or parent is "-")
  const rootDepartments = departments.filter(dept => isEmptyParentCode(dept.parent_dept_code));

  // Warn if more than one root department
  if (rootDepartments.length > 1) {
    const rootCodes = rootDepartments.map(d => d.dept_code).join(', ');
    const rootRows = rootDepartments.map(d => d.excelRow);

    errors.push({
      type: ErrorType.BUSINESS_RULE,
      severity: ErrorSeverity.WARNING,
      message: `Multiple root departments found (${rootDepartments.length}): ${rootCodes}`,
      row: rootRows[0], // Reference first root
      column: 'parent_dept_code',
      sheet: SheetType.DEPARTMENTS,
      suggestion: 'Typically, there should be one top-level department (e.g., "Genel Müdürlük"). You can proceed as is or connect departments to a single root.',
      affectedCodes: rootDepartments.map(d => d.dept_code),
    });
  }

  // Warn if NO root departments (all have parents - potential circular reference)
  if (rootDepartments.length === 0 && departments.length > 0) {
    errors.push({
      type: ErrorType.BUSINESS_RULE,
      severity: ErrorSeverity.ERROR,
      message: 'No root department found - all departments have a parent',
      row: departments[0]?.excelRow || 2,
      column: 'parent_dept_code',
      sheet: SheetType.DEPARTMENTS,
      suggestion: 'At least one department should have no parent (root department). Check for circular references.',
      affectedCodes: departments.map(d => d.dept_code),
    });
  }

  return errors;
}

/**
 * Validate position references (department and reporting_to)
 */
export function validatePositionReferences(
  positions: PositionRow[],
  validDeptCodes: Set<string>,
  validPosCodes: Set<string>
): ValidationError[] {
  const errors: ValidationError[] = [];

  positions.forEach(pos => {
    // Validate department reference
    if (pos.dept_code && !validDeptCodes.has(pos.dept_code)) {
      errors.push({
        type: ErrorType.INVALID_REFERENCE,
        severity: ErrorSeverity.ERROR,
        message: `Department '${pos.dept_code}' does not exist`,
        row: pos.excelRow,
        column: 'dept_code',
        sheet: SheetType.POSITIONS,
        suggestion: 'Ensure department exists in file or database',
        affectedCodes: [pos.pos_code, pos.dept_code],
      });
    }

    // Validate reporting_to reference
    if (pos.reports_to_pos_code && !validPosCodes.has(pos.reports_to_pos_code)) {
      errors.push({
        type: ErrorType.INVALID_REFERENCE,
        severity: ErrorSeverity.ERROR,
        message: `Reporting position '${pos.reports_to_pos_code}' does not exist`,
        row: pos.excelRow,
        column: 'reports_to_pos_code',
        sheet: SheetType.POSITIONS,
        suggestion: 'Ensure reporting position exists in file or database',
        affectedCodes: [pos.pos_code, pos.reports_to_pos_code],
      });
    }
  });

  return errors;
}

// ============================================================================
// Circular Reference Detection (DFS Algorithm)
// ============================================================================

/**
 * Detect circular references using Depth-First Search
 * 
 * Algorithm:
 * 1. Build adjacency list from parent relationships
 * 2. For each node, perform DFS
 * 3. Track visiting nodes in recursion stack
 * 4. If we visit a node already in stack, we found a cycle
 */
export function validateCircularReferences<T extends { excelRow: number }>(
  items: T[],
  getCode: (item: T) => string,
  getParentCode: (item: T) => string | null | undefined,
  sheetType: SheetType
): ValidationError[] {
  const errors: ValidationError[] = [];
  const adjacencyList = new Map<string, string>();
  const itemMap = new Map<string, T>();

  // Build adjacency list and item map
  items.forEach(item => {
    const code = getCode(item);
    const parentCode = getParentCode(item);
    itemMap.set(code, item);
    
    // Only add to adjacency list if parent is not empty/null
    // For departments, skip "-" and empty values
    if (parentCode && !isEmptyParentCode(parentCode)) {
      adjacencyList.set(code, parentCode);
    }
  });

  // DFS to detect cycles
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const reportedCycles = new Set<string>(); // Track reported cycles to avoid duplicates

  function dfs(code: string, path: string[]): string[] | null {
    visited.add(code);
    recursionStack.add(code);
    path.push(code);

    const parent = adjacencyList.get(code);
    if (parent) {
      if (recursionStack.has(parent)) {
        // Cycle detected - return the cycle path
        const cycleStart = path.indexOf(parent);
        return path.slice(cycleStart);
      }

      if (!visited.has(parent)) {
        const cycle = dfs(parent, path);
        if (cycle) return cycle;
      }
    }

    recursionStack.delete(code);
    path.pop();
    return null;
  }

  // Check each node
  items.forEach(item => {
    const code = getCode(item);
    if (!visited.has(code)) {
      const cycle = dfs(code, []);
      if (cycle) {
        // Create a unique key for this cycle (sorted codes)
        const cycleKey = [...cycle].sort().join(',');
        
        if (!reportedCycles.has(cycleKey)) {
          reportedCycles.add(cycleKey);
          
          // Report error for each node in the cycle
          cycle.forEach(nodeCode => {
            const nodeItem = itemMap.get(nodeCode);
            if (nodeItem) {
              errors.push({
                type: ErrorType.CIRCULAR_REFERENCE,
                severity: ErrorSeverity.ERROR,
                message: `Circular reference detected: ${cycle.join(' → ')}`,
                row: nodeItem.excelRow,
                column: sheetType === SheetType.DEPARTMENTS ? 'parent_dept_code' : 'reports_to_pos_code',
                sheet: sheetType,
                suggestion: 'Remove circular reference by changing parent/reporting relationships',
                affectedCodes: cycle,
              });
            }
          });
        }
      }
    }
  });

  return errors;
}

// ============================================================================
// Complete Validation Workflow
// ============================================================================

/**
 * Run all validations on departments
 */
export function validateDepartments(context: ValidationContext): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  errors.push(...validateDepartmentRequiredFields(context.departments));

  // Duplicates in file
  errors.push(...validateDuplicateDepartmentCodes(context.departments));

  // Reference validation
  errors.push(
    ...validateDepartmentReferences(context.departments, context.validDepartmentCodes)
  );

  // Hierarchy validation (check for multiple root departments)
  errors.push(...validateDepartmentHierarchy(context.departments));

  // Circular references
  errors.push(
    ...validateCircularReferences(
      context.departments,
      dept => dept.dept_code,
      dept => dept.parent_dept_code,
      SheetType.DEPARTMENTS
    )
  );

  return errors;
}

/**
 * Run all validations on positions
 */
export function validatePositions(context: ValidationContext): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  errors.push(...validatePositionRequiredFields(context.positions));

  // Duplicates in file
  errors.push(...validateDuplicatePositionCodes(context.positions));

  // Reference validation
  errors.push(
    ...validatePositionReferences(
      context.positions,
      context.validDepartmentCodes,
      context.validPositionCodes
    )
  );

  // Circular references
  errors.push(
    ...validateCircularReferences(
      context.positions,
      pos => pos.pos_code,
      pos => pos.reports_to_pos_code,
      SheetType.POSITIONS
    )
  );

  return errors;
}
