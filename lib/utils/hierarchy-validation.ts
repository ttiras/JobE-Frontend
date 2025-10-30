/**
 * Department Move Validation Utilities
 * 
 * Functions to validate department reorganization operations
 */

import { HierarchyDepartment, MoveValidationResult, PendingDepartmentMove } from '@/lib/types/hierarchy';

const MAX_HIERARCHY_DEPTH = 10;

/**
 * Check if moving a department would create a circular reference
 */
export function wouldCreateCircularReference(
  departmentId: string,
  newParentId: string | null,
  departments: HierarchyDepartment[]
): boolean {
  if (!newParentId) return false; // Moving to root is always safe

  // Check if the new parent is a descendant of the department being moved
  const isDescendant = (targetId: string, ancestorId: string): boolean => {
    if (targetId === ancestorId) return true;

    const target = departments.find(d => d.id === targetId);
    if (!target || !target.parent_id) return false;

    return isDescendant(target.parent_id, ancestorId);
  };

  return isDescendant(newParentId, departmentId);
}

/**
 * Calculate the depth of a department in the hierarchy
 */
export function calculateDepartmentDepth(
  departmentId: string,
  departments: HierarchyDepartment[],
  pendingMoves: Map<string, string | null> = new Map()
): number {
  const dept = departments.find(d => d.id === departmentId);
  if (!dept) return 0;

  let depth = 0;
  let currentId: string | null = departmentId;

  // Prevent infinite loops
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) {
      // Circular reference detected
      return Infinity;
    }
    visited.add(currentId);

    const current = departments.find(d => d.id === currentId);
    if (!current) break;

    // Check if there's a pending move for this department
    const pendingParentId = pendingMoves.get(currentId);
    const parentId = pendingParentId !== undefined ? pendingParentId : current.parent_id;

    if (!parentId) break;

    currentId = parentId;
    depth++;
  }

  return depth;
}

/**
 * Check if a move would exceed maximum hierarchy depth
 */
export function wouldExceedMaxDepth(
  departmentId: string,
  newParentId: string | null,
  departments: HierarchyDepartment[],
  pendingMoves: Map<string, string | null> = new Map()
): { exceeds: boolean; depth: number } {
  // Create a temporary map with the new move
  const tempMoves = new Map(pendingMoves);
  tempMoves.set(departmentId, newParentId);

  // Find all descendants of the department being moved
  const getDescendants = (id: string): string[] => {
    const descendants: string[] = [];
    const children = departments.filter(d => d.parent_id === id);
    
    children.forEach(child => {
      descendants.push(child.id);
      descendants.push(...getDescendants(child.id));
    });

    return descendants;
  };

  const descendants = getDescendants(departmentId);

  // Calculate new depth for the moved department and all its descendants
  const movedDeptDepth = newParentId 
    ? calculateDepartmentDepth(newParentId, departments, tempMoves) + 1
    : 0;

  // Find the maximum depth among descendants
  let maxDescendantRelativeDepth = 0;
  descendants.forEach(descId => {
    const relativeDepth = calculateDescendantDepth(descId, departmentId, departments);
    maxDescendantRelativeDepth = Math.max(maxDescendantRelativeDepth, relativeDepth);
  });

  const totalDepth = movedDeptDepth + maxDescendantRelativeDepth;

  return {
    exceeds: totalDepth > MAX_HIERARCHY_DEPTH,
    depth: totalDepth,
  };
}

/**
 * Calculate depth of a descendant relative to an ancestor
 */
function calculateDescendantDepth(
  descendantId: string,
  ancestorId: string,
  departments: HierarchyDepartment[]
): number {
  let depth = 0;
  let currentId = descendantId;

  while (currentId && currentId !== ancestorId) {
    const current = departments.find(d => d.id === currentId);
    if (!current || !current.parent_id) break;
    currentId = current.parent_id;
    depth++;
  }

  return depth;
}

/**
 * Validate a department move
 */
export function validateDepartmentMove(
  departmentId: string,
  newParentId: string | null,
  departments: HierarchyDepartment[],
  pendingMoves: PendingDepartmentMove[] = []
): MoveValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const department = departments.find(d => d.id === departmentId);
  if (!department) {
    errors.push('Department not found');
    return { isValid: false, errors, warnings };
  }

  // Check if moving to itself
  if (departmentId === newParentId) {
    errors.push('Cannot move a department under itself');
    return { isValid: false, errors, warnings };
  }

  // Check if new parent exists and is active
  if (newParentId) {
    const newParent = departments.find(d => d.id === newParentId);
    if (!newParent) {
      errors.push('Target parent department not found');
      return { isValid: false, errors, warnings };
    }
    if (!newParent.is_active) {
      warnings.push('Moving to an inactive department');
    }
  }

  // Check for circular reference
  if (wouldCreateCircularReference(departmentId, newParentId, departments)) {
    errors.push('This move would create a circular reference');
    return { isValid: false, errors, warnings };
  }

  // Check depth limit
  const pendingMovesMap = new Map(
    pendingMoves.map(m => [m.departmentId, m.newParentId])
  );
  const { exceeds, depth } = wouldExceedMaxDepth(
    departmentId,
    newParentId,
    departments,
    pendingMovesMap
  );

  if (exceeds) {
    errors.push(
      `This move would create a hierarchy depth of ${depth}, exceeding the maximum of ${MAX_HIERARCHY_DEPTH}`
    );
    return { isValid: false, errors, warnings };
  }

  if (depth >= MAX_HIERARCHY_DEPTH - 2) {
    warnings.push(
      `This move will create a deep hierarchy (depth: ${depth}). Consider restructuring.`
    );
  }

  // Check if department has many descendants
  const countDescendants = (id: string): number => {
    const children = departments.filter(d => d.parent_id === id);
    return children.length + children.reduce((sum, child) => sum + countDescendants(child.id), 0);
  };

  const descendantCount = countDescendants(departmentId);
  if (descendantCount > 20) {
    warnings.push(
      `This department has ${descendantCount} descendants. Moving it will affect the entire subtree.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate all pending moves as a batch
 */
export function validateAllPendingMoves(
  pendingMoves: PendingDepartmentMove[],
  departments: HierarchyDepartment[]
): { isValid: boolean; invalidMoves: Array<{ move: PendingDepartmentMove; result: MoveValidationResult }> } {
  const invalidMoves: Array<{ move: PendingDepartmentMove; result: MoveValidationResult }> = [];

  pendingMoves.forEach(move => {
    const result = validateDepartmentMove(
      move.departmentId,
      move.newParentId,
      departments,
      pendingMoves
    );

    if (!result.isValid) {
      invalidMoves.push({ move, result });
    }
  });

  return {
    isValid: invalidMoves.length === 0,
    invalidMoves,
  };
}
