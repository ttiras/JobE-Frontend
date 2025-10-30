/**
 * Department Hierarchy Utilities
 * 
 * Functions to build tree structures and calculate layouts for department hierarchies
 */

import dagre from '@dagrejs/dagre';
import { Node, Edge, Position } from 'reactflow';
import {
  HierarchyDepartment,
  DepartmentTreeNode,
  HierarchyLayoutOptions,
  HierarchyStats,
  DepartmentNodeData,
} from '@/lib/types/hierarchy';

/**
 * Default layout options
 */
export const DEFAULT_LAYOUT_OPTIONS: HierarchyLayoutOptions = {
  direction: 'TB', // Top to Bottom
  nodeWidth: 280,
  nodeHeight: 120,
  nodeSpacing: 80,
  rankSpacing: 120,
};

/**
 * Build tree structure from flat department list
 */
export function buildDepartmentTree(
  departments: HierarchyDepartment[]
): DepartmentTreeNode[] {
  // Create a map for quick lookup
  const departmentMap = new Map<string, DepartmentTreeNode>();
  const roots: DepartmentTreeNode[] = [];

  // Initialize all nodes - reference the original department objects, don't copy
  departments.forEach((dept) => {
    departmentMap.set(dept.id, {
      department: dept, // Reference original, not a copy
      children: [],
    });
  });

  // Build parent-child relationships
  departments.forEach((dept) => {
    const node = departmentMap.get(dept.id)!;

    if (dept.parent_id) {
      const parent = departmentMap.get(dept.parent_id);
      if (parent) {
        parent.children.push(node);
        node.parent = parent;
      } else {
        // Orphaned node (parent doesn't exist) - treat as root
        roots.push(node);
      }
    } else {
      // No parent - this is a root node
      roots.push(node);
    }
  });

  return roots;
}

/**
 * Calculate hierarchy level for each department
 */
function calculateLevels(
  node: DepartmentTreeNode,
  level: number = 0
): void {
  node.department.level = level;
  node.children.forEach((child) => calculateLevels(child, level + 1));
}

/**
 * Calculate child counts for each department
 */
function calculateCounts(node: DepartmentTreeNode): number {
  const directChildren = node.children.length;
  const totalDescendants = node.children.reduce(
    (sum, child) => sum + calculateCounts(child),
    0
  );

  node.department.childCount = directChildren;
  node.department.totalDescendants = directChildren + totalDescendants;

  return directChildren + totalDescendants;
}

/**
 * Enrich department data with hierarchy information
 */
export function enrichDepartmentData(
  departments: HierarchyDepartment[]
): HierarchyDepartment[] {
  const roots = buildDepartmentTree(departments);

  // Calculate levels and counts
  roots.forEach((root) => {
    calculateLevels(root);
    calculateCounts(root);
  });

  return departments;
}

/**
 * Calculate hierarchy statistics
 */
export function calculateHierarchyStats(
  departments: HierarchyDepartment[]
): HierarchyStats {
  const enriched = enrichDepartmentData(departments);

  const maxDepth = Math.max(...enriched.map((d) => d.level || 0)) + 1;
  const rootCount = enriched.filter((d) => !d.parent_id).length;
  const leafCount = enriched.filter((d) => d.childCount === 0).length;
  const totalChildren = enriched.reduce((sum, d) => sum + (d.childCount || 0), 0);
  const averageChildrenPerNode =
    enriched.length > 0 ? totalChildren / enriched.length : 0;

  return {
    totalDepartments: enriched.length,
    maxDepth,
    rootCount,
    leafCount,
    averageChildrenPerNode,
  };
}

/**
 * Convert department tree to React Flow nodes and edges
 */
export function convertTreeToFlow(
  roots: DepartmentTreeNode[],
  options: Partial<HierarchyLayoutOptions> = {}
): { nodes: Node<DepartmentNodeData>[]; edges: Edge[] } {
  const nodes: Node<DepartmentNodeData>[] = [];
  const edges: Edge[] = [];

  function traverse(node: DepartmentTreeNode, parentId?: string) {
    const dept = node.department;
    const isRoot = !dept.parent_id;
    const isLeaf = node.children.length === 0;

    // Create node
    nodes.push({
      id: dept.id,
      type: 'departmentNode',
      data: {
        id: dept.id,
        dept_code: dept.dept_code,
        name: dept.name,
        is_active: dept.is_active,
        level: dept.level || 0,
        childCount: dept.childCount || 0,
        totalDescendants: dept.totalDescendants || 0,
        isRoot,
        isLeaf,
        metadata: dept.metadata,
      },
      position: { x: 0, y: 0 }, // Will be calculated by Dagre
    });

    // Create edge to parent
    if (parentId) {
      edges.push({
        id: `${parentId}-${dept.id}`,
        source: parentId,
        target: dept.id,
        type: 'smoothstep',
        animated: false,
        style: {
          stroke: '#94a3b8',
          strokeWidth: 2,
        },
      });
    }

    // Traverse children
    node.children.forEach((child) => traverse(child, dept.id));
  }

  roots.forEach((root) => traverse(root));

  return { nodes, edges };
}

/**
 * Apply Dagre layout to nodes
 */
export function applyDagreLayout(
  nodes: Node<DepartmentNodeData>[],
  edges: Edge[],
  options: Partial<HierarchyLayoutOptions> = {}
): Node<DepartmentNodeData>[] {
  const layoutOptions = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
  const dagreGraph = new dagre.graphlib.Graph();

  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: layoutOptions.direction,
    nodesep: layoutOptions.nodeSpacing,
    ranksep: layoutOptions.rankSpacing,
  });

  // Add nodes to Dagre
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: layoutOptions.nodeWidth,
      height: layoutOptions.nodeHeight,
    });
  });

  // Add edges to Dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply positions to nodes
  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const isHorizontal = layoutOptions.direction === 'LR' || layoutOptions.direction === 'RL';

    return {
      ...node,
      targetPosition: (isHorizontal ? 'left' : 'top') as Position,
      sourcePosition: (isHorizontal ? 'right' : 'bottom') as Position,
      position: {
        x: nodeWithPosition.x - layoutOptions.nodeWidth / 2,
        y: nodeWithPosition.y - layoutOptions.nodeHeight / 2,
      },
    };
  });
}

/**
 * Generate complete React Flow layout from departments
 */
export function generateHierarchyLayout(
  departments: HierarchyDepartment[],
  options: Partial<HierarchyLayoutOptions> = {}
): { nodes: Node<DepartmentNodeData>[]; edges: Edge[] } {
  // Enrich data with hierarchy information
  const enriched = enrichDepartmentData(departments);

  // Build tree structure
  const roots = buildDepartmentTree(enriched);

  // Convert to React Flow format
  const { nodes, edges } = convertTreeToFlow(roots, options);

  // Apply Dagre layout
  const layoutedNodes = applyDagreLayout(nodes, edges, options);

  return { nodes: layoutedNodes, edges };
}

/**
 * Find path from root to specific department
 */
export function findPathToRoot(
  departmentId: string,
  departments: HierarchyDepartment[]
): string[] {
  const path: string[] = [];
  const deptMap = new Map(departments.map((d) => [d.id, d]));

  let current = deptMap.get(departmentId);
  while (current) {
    path.unshift(current.id);
    current = current.parent_id ? deptMap.get(current.parent_id) : undefined;
  }

  return path;
}

/**
 * Search departments by name or code
 */
export function searchDepartments(
  departments: HierarchyDepartment[],
  query: string
): HierarchyDepartment[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return departments;

  return departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(lowerQuery) ||
      dept.dept_code.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Filter departments by active status
 */
export function filterByActiveStatus(
  departments: HierarchyDepartment[],
  showInactive: boolean
): HierarchyDepartment[] {
  return showInactive ? departments : departments.filter((d) => d.is_active);
}
