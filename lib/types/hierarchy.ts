/**
 * Department Hierarchy Visualization Types
 * 
 * Types for rendering department hierarchies with React Flow
 */

import { Node, Edge } from 'reactflow';

/**
 * Department data for hierarchy visualization
 */
export interface HierarchyDepartment {
  id: string;
  dept_code: string;
  name: string;
  parent_id?: string | null;
  is_active: boolean;
  metadata?: Record<string, unknown> | null;
  // Computed fields
  level?: number; // Hierarchy level (0 = root)
  childCount?: number; // Number of direct children
  totalDescendants?: number; // Total number of descendants
}

/**
 * Tree node structure for building hierarchies
 */
export interface DepartmentTreeNode {
  department: HierarchyDepartment;
  children: DepartmentTreeNode[];
  parent?: DepartmentTreeNode;
}

/**
 * Node data for React Flow custom nodes
 */
export interface DepartmentNodeData {
  id: string;
  dept_code: string;
  name: string;
  is_active: boolean;
  level: number;
  childCount: number;
  totalDescendants: number;
  isRoot: boolean;
  isLeaf: boolean;
  metadata?: Record<string, unknown> | null;
  // Interactive features
  onNodeClick?: (id: string) => void;
  onNodeHover?: (id: string) => void;
  // Pending changes
  isPending?: boolean;
  pendingNewParentId?: string | null;
}

/**
 * Layout options for hierarchy visualization
 */
export interface HierarchyLayoutOptions {
  direction: 'TB' | 'LR' | 'BT' | 'RL'; // Top-Bottom, Left-Right, etc.
  nodeWidth: number;
  nodeHeight: number;
  nodeSpacing: number; // Horizontal spacing between nodes
  rankSpacing: number; // Vertical spacing between levels
}

/**
 * Hierarchy statistics
 */
export interface HierarchyStats {
  totalDepartments: number;
  maxDepth: number;
  rootCount: number;
  leafCount: number;
  averageChildrenPerNode: number;
}

/**
 * Filter options for hierarchy visualization
 */
export interface HierarchyFilterOptions {
  showInactive?: boolean;
  searchQuery?: string;
  selectedDeptIds?: Set<string>;
  highlightPath?: string[]; // Array of dept IDs to highlight
}

/**
 * Export options for hierarchy
 */
export interface HierarchyExportOptions {
  format: 'png' | 'svg' | 'json';
  includeInactive: boolean;
  zoom: number;
}

/**
 * Pending department move (for drag & drop reorganization)
 */
export interface PendingDepartmentMove {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  oldParentId: string | null;
  newParentId: string | null;
  timestamp: number;
}

/**
 * Validation result for department move
 */
export interface MoveValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

