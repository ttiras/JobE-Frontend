/**
 * DepartmentNode Component
 * 
 * Beautiful custom node for React Flow showing department i              {isPending && (
                <Badge className="text-xs px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-amber-400 dark:border-amber-600 animate-pulse">
                  Pending
                </Badge>
              )}
              {!is_active && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 border-red-300 text-red-600 dark:border-red-700 dark:text-red-400">
                  Inactive
                </Badge>
              )}
 * with different styles for root, branch, and leaf nodes
 */

'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Building2, Users, ChevronDown } from 'lucide-react';
import { DepartmentNodeData } from '@/lib/types/hierarchy';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const DepartmentNode = memo(({ data, selected }: NodeProps<DepartmentNodeData>) => {
  const {
    dept_code,
    name,
    is_active,
    level,
    childCount,
    totalDescendants,
    isRoot,
    isLeaf,
    isPending = false,
  } = data;

  // Determine node styling based on hierarchy position
  const getNodeStyle = () => {
    if (isRoot) {
      return {
        bg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950',
        border: 'border-blue-400 dark:border-blue-600',
        icon: 'text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      };
    }
    if (isLeaf) {
      return {
        bg: 'bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900',
        border: 'border-slate-300 dark:border-slate-600',
        icon: 'text-slate-600 dark:text-slate-400',
        badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      };
    }
    return {
      bg: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950',
      border: 'border-emerald-400 dark:border-emerald-600',
      icon: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    };
  };

  const style = getNodeStyle();

  return (
    <div
      className={cn(
        'rounded-xl border-2 shadow-lg transition-all duration-200',
        'hover:shadow-xl hover:scale-[1.02] cursor-grab active:cursor-grabbing',
        style.bg,
        style.border,
        selected && 'ring-4 ring-blue-500/50 dark:ring-blue-400/50',
        !is_active && 'opacity-60',
        isPending && 'ring-2 ring-amber-400 dark:ring-amber-500 border-amber-400 dark:border-amber-500'
      )}
      style={{ width: 280, minHeight: 120 }}
    >
      {/* Input Handle (for parent connections) */}
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white dark:!border-gray-800"
        />
      )}

      {/* Node Content */}
      <div className="p-4 space-y-3">
        {/* Header with Icon and Code */}
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-lg bg-white/50 dark:bg-black/20', style.icon)}>
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
                {dept_code}
              </span>
              {isRoot && (
                <Badge variant="secondary" className={cn('text-xs px-1.5 py-0', style.badge)}>
                  Root
                </Badge>
              )}
              {isPending && (
                <Badge className="text-xs px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700">
                  Pending
                </Badge>
              )}
              {!is_active && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 border-red-300 text-red-600 dark:border-red-700 dark:text-red-400">
                  Inactive
                </Badge>
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">
              {name}
            </h3>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs">
          {childCount > 0 && (
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <ChevronDown className="w-3.5 h-3.5" />
              <span className="font-medium">{childCount}</span>
              <span className="text-slate-500 dark:text-slate-500">
                {childCount === 1 ? 'child' : 'children'}
              </span>
            </div>
          )}
          {totalDescendants > 0 && childCount !== totalDescendants && (
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Users className="w-3.5 h-3.5" />
              <span className="font-medium">{totalDescendants}</span>
              <span className="text-slate-500 dark:text-slate-500">total</span>
            </div>
          )}
        </div>

        {/* Level Indicator */}
        <div className="pt-2 border-t border-white/50 dark:border-black/20">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Level {level}</span>
            <div className="flex-1 h-1.5 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  isRoot && 'bg-blue-500',
                  !isRoot && !isLeaf && 'bg-emerald-500',
                  isLeaf && 'bg-slate-500'
                )}
                style={{ width: `${Math.min(100, (level + 1) * 20)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Pending Move Indicator */}
        {isPending && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium shadow-lg whitespace-nowrap z-10">
            Moved ⟳
          </div>
        )}
      </div>

      {/* Output Handle (for child connections) */}
      {!isLeaf && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white dark:!border-gray-800"
        />
      )}
    </div>
  );
});

DepartmentNode.displayName = 'DepartmentNode';
