/**
 * Hierarchy Sorting Utilities
 * 
 * Provides functions to sort positions in hierarchical order:
 * - Top-level positions (no manager/reports_to_id) first
 * - Then their direct reports (level 2)
 * - Continue recursively for deeper levels
 * - Within same level, sort alphabetically by pos_code
 */

interface HierarchicalItem {
  id: string;
  pos_code: string;
  reports_to_id: string | null;
  [key: string]: any;
}

type HierarchicalItemWithDepth<T extends HierarchicalItem> = T & {
  _hierarchyDepth: number;
  _hierarchyPath: string[];
};

/**
 * Sort positions by hierarchy
 * 
 * @param positions - Array of positions with reports_to_id field
 * @returns Sorted array with hierarchy depth information
 */
export function sortPositionsByHierarchy<T extends HierarchicalItem>(
  positions: T[]
): HierarchicalItemWithDepth<T>[] {
  // Create a map for quick lookup by id
  const positionMap = new Map<string, T>();
  positions.forEach(pos => positionMap.set(pos.id, pos));

  // Build hierarchy: map parent_id -> array of children
  const childrenMap = new Map<string | null, T[]>();
  
  positions.forEach(pos => {
    const parentId = pos.reports_to_id;
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId)!.push(pos);
  });

  // Sort children arrays alphabetically by pos_code
  childrenMap.forEach((children) => {
    children.sort((a, b) => a.pos_code.localeCompare(b.pos_code));
  });

  // Recursively build sorted list starting from top-level positions
  const result: HierarchicalItemWithDepth<T>[] = [];

  function traverse(parentId: string | null, depth: number, path: string[]) {
    const children = childrenMap.get(parentId) || [];
    
    children.forEach(child => {
      const childWithDepth: HierarchicalItemWithDepth<T> = {
        ...child,
        _hierarchyDepth: depth,
        _hierarchyPath: [...path, child.pos_code],
      };
      
      result.push(childWithDepth);
      
      // Recursively process this child's reports
      traverse(child.id, depth + 1, childWithDepth._hierarchyPath);
    });
  }

  // Start from top level (positions with no manager)
  traverse(null, 0, []);

  return result;
}

/**
 * Get hierarchy depth for a specific position
 * 
 * @param positionId - ID of the position
 * @param positions - Array of all positions
 * @returns Depth in hierarchy (0 = top level, 1 = reports to top level, etc.)
 */
export function getPositionDepth(
  positionId: string,
  positions: HierarchicalItem[]
): number {
  const positionMap = new Map<string, HierarchicalItem>();
  positions.forEach(pos => positionMap.set(pos.id, pos));

  let depth = 0;
  let currentPosition = positionMap.get(positionId);

  while (currentPosition && currentPosition.reports_to_id) {
    depth++;
    currentPosition = positionMap.get(currentPosition.reports_to_id);
    
    // Prevent infinite loops in case of circular references
    if (depth > 20) {
      console.error('Circular reference detected in position hierarchy');
      break;
    }
  }

  return depth;
}

/**
 * Get all subordinates of a position (direct and indirect)
 * 
 * @param positionId - ID of the manager position
 * @param positions - Array of all positions
 * @returns Array of all subordinate positions
 */
export function getSubordinates<T extends HierarchicalItem>(
  positionId: string,
  positions: T[]
): T[] {
  const result: T[] = [];
  const directReports = positions.filter(pos => pos.reports_to_id === positionId);

  directReports.forEach(report => {
    result.push(report);
    // Recursively get subordinates of this report
    result.push(...getSubordinates(report.id, positions));
  });

  return result;
}

/**
 * Get the hierarchy path for a position (from top to this position)
 * 
 * @param positionId - ID of the position
 * @param positions - Array of all positions
 * @returns Array of position codes representing the path from top to this position
 */
export function getHierarchyPath(
  positionId: string,
  positions: HierarchicalItem[]
): string[] {
  const positionMap = new Map<string, HierarchicalItem>();
  positions.forEach(pos => positionMap.set(pos.id, pos));

  const path: string[] = [];
  let currentPosition = positionMap.get(positionId);

  while (currentPosition) {
    path.unshift(currentPosition.pos_code);
    
    if (!currentPosition.reports_to_id) {
      break;
    }
    
    currentPosition = positionMap.get(currentPosition.reports_to_id);
    
    // Prevent infinite loops
    if (path.length > 20) {
      console.error('Circular reference detected in position hierarchy');
      break;
    }
  }

  return path;
}

/**
 * Check if a position is a top-level position (no manager)
 * 
 * @param position - Position to check
 * @returns true if position has no reports_to_id
 */
export function isTopLevelPosition(position: HierarchicalItem): boolean {
  return position.reports_to_id === null || position.reports_to_id === undefined;
}

/**
 * Get direct reports count for a position
 * 
 * @param positionId - ID of the manager position
 * @param positions - Array of all positions
 * @returns Count of direct reports
 */
export function getDirectReportsCount(
  positionId: string,
  positions: HierarchicalItem[]
): number {
  return positions.filter(pos => pos.reports_to_id === positionId).length;
}
