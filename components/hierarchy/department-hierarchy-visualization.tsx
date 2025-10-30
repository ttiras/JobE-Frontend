/**
 * DepartmentHierarchyVisualization Component
 * 
 * Interactive hierarchy visualization using React Flow with:
 * - Beautiful custom nodes
 * - Zoom and pan controls
 * - Mini-map for navigation
 * - Search and filter capabilities
 * - Layout direction options
 * - Export functionality
 */

'use client';

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  NodeTypes,
  BackgroundVariant,
  Node,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Download,
  Search,
  Settings2,
  Maximize2,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DepartmentNode } from './department-node';
import { HierarchyDepartment, HierarchyLayoutOptions } from '@/lib/types/hierarchy';
import {
  generateHierarchyLayout,
  calculateHierarchyStats,
  searchDepartments,
  filterByActiveStatus,
  findPathToRoot,
} from '@/lib/utils/hierarchy';
import { cn } from '@/lib/utils';

// Register custom node types
const nodeTypes: NodeTypes = {
  departmentNode: DepartmentNode,
};

interface DepartmentHierarchyVisualizationProps {
  departments: HierarchyDepartment[];
  className?: string;
  height?: string | number;
  showControls?: boolean;
  showMiniMap?: boolean;
  showStats?: boolean;
  onNodeClick?: (departmentId: string) => void;
  // Drag & drop reorganization
  pendingMoves?: Map<string, string | null>;
  onDepartmentMove?: (departmentId: string, newParentId: string | null) => void;
  onInvalidMove?: () => void; // Called when an invalid move is detected
  resetTrigger?: number; // When this changes, forces re-layout to snap nodes back
}

export function DepartmentHierarchyVisualization({
  departments,
  className,
  height = '600px',
  showControls = true,
  showMiniMap = true,
  showStats = true,
  onNodeClick,
  pendingMoves,
  onDepartmentMove,
  onInvalidMove,
  resetTrigger,
}: DepartmentHierarchyVisualizationProps) {
  // State
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(true);
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [resetCounter, setResetCounter] = useState(0); // Force re-layout on invalid moves

  // Calculate statistics
  const stats = useMemo(() => calculateHierarchyStats(departments), [departments]);

  // Filter departments
  const filteredDepartments = useMemo(() => {
    let filtered = departments;

    // Apply active filter
    filtered = filterByActiveStatus(filtered, showInactive);

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = searchDepartments(filtered, searchQuery);
    }

    return filtered;
  }, [departments, searchQuery, showInactive]);

  // Generate layout
  const layoutOptions: Partial<HierarchyLayoutOptions> = useMemo(
    () => ({
      direction: layoutDirection,
      nodeWidth: 280,
      nodeHeight: 120,
      nodeSpacing: 80,
      rankSpacing: 120,
    }),
    [layoutDirection]
  );

  // Update nodes and edges when departments or filters change
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = generateHierarchyLayout(
      filteredDepartments,
      layoutOptions
    );
    
    // Enrich nodes with pending state information
    const enrichedNodes = newNodes.map(node => {
      const isPending = pendingMoves?.has(node.id);
      const pendingNewParentId = pendingMoves?.get(node.id);
      
      return {
        ...node,
        data: {
          ...node.data,
          isPending,
          pendingNewParentId,
        },
      };
    });

    // Enrich edges with pending state styling
    const enrichedEdges = newEdges.map(edge => {
      // Check if this edge connects to a pending move
      const targetIsPending = pendingMoves?.has(edge.target);
      const sourceIsPending = pendingMoves?.has(edge.source);
      
      if (targetIsPending || sourceIsPending) {
        return {
          ...edge,
          animated: true,
          style: {
            stroke: '#f59e0b', // amber-500
            strokeWidth: 3,
          },
        };
      }
      
      return edge;
    });
    
    setNodes(enrichedNodes);
    setEdges(enrichedEdges);
  }, [filteredDepartments, layoutOptions, pendingMoves, setNodes, setEdges, resetCounter, resetTrigger]);

  // Handle node click
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
      if (onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [onNodeClick]
  );

  // Handle node drag start
  const handleNodeDragStart = useCallback(
    (event: React.MouseEvent, node: Node) => {
      console.log('🎯 Drag started:', node.id, node.data.dept_code);
      setDraggedNodeId(node.id);
    },
    []
  );

  // Handle node drag stop
  const handleNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      console.log('🛑 Drag stopped:', node.id, 'at position', node.position);
      
      if (!onDepartmentMove || !draggedNodeId) {
        console.log('  ❌ No move handler or dragged node');
        setDraggedNodeId(null);
        return;
      }

      const draggedNode = nodes.find(n => n.id === draggedNodeId);
      if (!draggedNode) {
        console.log('  ❌ Dragged node not found');
        setDraggedNodeId(null);
        return;
      }

      // Find overlapping node by checking positions
      let targetNode: Node | null = null;
      let maxOverlap = 0;

      console.log('  🔍 Checking', nodes.length, 'nodes for overlap...');

      for (const n of nodes) {
        if (n.id === draggedNode.id) continue;

        // Calculate overlap area
        const dx = Math.abs(draggedNode.position.x - n.position.x);
        const dy = Math.abs(draggedNode.position.y - n.position.y);
        
        // Check if nodes are close enough (within node dimensions)
        const nodeWidth = 280;
        const nodeHeight = 120;
        
        if (dx < nodeWidth && dy < nodeHeight) {
          // Calculate overlap score (lower is better)
          const overlap = Math.sqrt(dx * dx + dy * dy);
          
          console.log(`  📏 Distance to ${n.data.dept_code}: ${overlap.toFixed(0)}px (dx=${dx.toFixed(0)}, dy=${dy.toFixed(0)})`);
          
          if (maxOverlap === 0 || overlap < maxOverlap) {
            maxOverlap = overlap;
            targetNode = n;
          }
        }
      }

      if (targetNode) {
        console.log('  ✅ Dropping onto', targetNode.data.dept_code, '(id:', targetNode.id, ')');
        onDepartmentMove(draggedNode.id, targetNode.id);
      } else {
        console.log('  ⚪ Dropped on empty space');
        // Optionally: onDepartmentMove(draggedNode.id, null);
      }

      setDraggedNodeId(null);
    },
    [onDepartmentMove, draggedNodeId, nodes]
  );

  // Reset view
  const handleReset = useCallback(() => {
    setSearchQuery('');
    setShowInactive(true);
    setSelectedNodeId(null);
  }, []);

  // Toggle layout direction
  const handleToggleLayout = useCallback(() => {
    setLayoutDirection((prev) => (prev === 'TB' ? 'LR' : 'TB'));
  }, []);

  // Highlight path to selected node
  const highlightedPath = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    return new Set(findPathToRoot(selectedNodeId, departments));
  }, [selectedNodeId, departments]);

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div style={{ width: '100%', height }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onNodeDragStart={handleNodeDragStart}
          onNodeDragStop={handleNodeDragStop}
          nodeTypes={nodeTypes}
          nodesDraggable={!!onDepartmentMove}
          fitView
          fitViewOptions={{
            padding: 0.2,
            duration: 800,
          }}
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: false,
          }}
          proOptions={{ hideAttribution: true }}
        >
          {/* Background */}
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            className="bg-slate-50 dark:bg-slate-950"
          />

          {/* Controls */}
          {showControls && (
            <Controls
              className="!bg-white dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 !shadow-lg"
              showInteractive={false}
            />
          )}

          {/* Mini Map */}
          {showMiniMap && (
            <MiniMap
              className="!bg-white dark:!bg-slate-800 !border-2 !border-slate-200 dark:!border-slate-700 !shadow-lg"
              nodeStrokeWidth={3}
              zoomable
              pannable
            />
          )}

          {/* Top Panel - Search and Filters */}
          <Panel position="top-left" className="flex flex-col gap-2 m-4">
            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search departments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg"
                />
              </div>

              {/* Layout Toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-white dark:bg-slate-800 shadow-lg"
                  >
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Layout Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleToggleLayout}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {layoutDirection === 'TB' ? 'Horizontal Layout' : 'Vertical Layout'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowInactive(!showInactive)}>
                    {showInactive ? (
                      <EyeOff className="w-4 h-4 mr-2" />
                    ) : (
                      <Eye className="w-4 h-4 mr-2" />
                    )}
                    {showInactive ? 'Hide Inactive' : 'Show Inactive'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleReset}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Filters
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Active Filters */}
            {(searchQuery || !showInactive) && (
              <div className="flex gap-2">
                {searchQuery && (
                  <Badge variant="secondary" className="bg-white dark:bg-slate-800 shadow">
                    Search: {searchQuery}
                  </Badge>
                )}
                {!showInactive && (
                  <Badge variant="secondary" className="bg-white dark:bg-slate-800 shadow">
                    Active Only
                  </Badge>
                )}
              </div>
            )}
          </Panel>

          {/* Stats Panel */}
          {showStats && (
            <Panel position="top-right" className="m-4">
              <Card className="p-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur shadow-lg border-slate-200 dark:border-slate-700">
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Hierarchy Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-slate-500 dark:text-slate-400">Total</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {stats.totalDepartments}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 dark:text-slate-400">Depth</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {stats.maxDepth}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 dark:text-slate-400">Roots</div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {stats.rootCount}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 dark:text-slate-400">Leaves</div>
                      <div className="text-lg font-bold text-slate-600 dark:text-slate-400">
                        {stats.leafCount}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </Card>
  );
}
