/**
 * Department Hierarchy Visualization
 * 
 * Export all hierarchy-related components and utilities
 */

// Components
export { DepartmentHierarchyVisualization } from './department-hierarchy-visualization';
export { DepartmentNode } from './department-node';
export { ImportPreviewHierarchy } from './import-preview-hierarchy';

// Types
export type {
  HierarchyDepartment,
  DepartmentTreeNode,
  DepartmentNodeData,
  HierarchyLayoutOptions,
  HierarchyStats,
  HierarchyFilterOptions,
  HierarchyExportOptions,
} from '@/lib/types/hierarchy';

// Utilities
export {
  buildDepartmentTree,
  enrichDepartmentData,
  calculateHierarchyStats,
  generateHierarchyLayout,
  searchDepartments,
  filterByActiveStatus,
  findPathToRoot,
  DEFAULT_LAYOUT_OPTIONS,
} from '@/lib/utils/hierarchy';
