/**
 * DepartmentDetailsPanel Component
 * 
 * Sliding side panel that shows detailed information about a selected department.
 * Features:
 * - Department info (code, name, status)
 * - Breadcrumb path from root
 * - Parent department
 * - Children list (clickable)
 * - Quick edit form
 * - Metadata display
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Building2, ChevronRight, Users, Edit2, Check, Ban, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HierarchyDepartment } from '@/lib/types/hierarchy';
import { cn } from '@/lib/utils';

interface DepartmentDetailsPanelProps {
  department: HierarchyDepartment | null;
  departments: HierarchyDepartment[];
  isOpen: boolean;
  onClose: () => void;
  onDepartmentSelect: (departmentId: string) => void;
  onUpdate?: (departmentId: string, updates: Partial<HierarchyDepartment>) => Promise<void>;
}

export function DepartmentDetailsPanel({
  department,
  departments,
  isOpen,
  onClose,
  onDepartmentSelect,
  onUpdate,
}: DepartmentDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedCode, setEditedCode] = useState('');
  const [editedParentId, setEditedParentId] = useState<string | null>(null);
  const [editedIsActive, setEditedIsActive] = useState(true);

  // Reset form when department changes
  useEffect(() => {
    if (department) {
      setEditedName(department.name);
      setEditedCode(department.dept_code);
      setEditedParentId(department.parent_id || null);
      setEditedIsActive(department.is_active);
      setIsEditing(false);
    }
  }, [department?.id]);

  if (!department) return null;

  // Get parent department
  const parent = departments.find(d => d.id === department.parent_id);

  // Get children
  const children = departments.filter(d => d.parent_id === department.id);

  // Get all descendants count
  const getAllDescendants = (deptId: string): string[] => {
    const directChildren = departments.filter(d => d.parent_id === deptId);
    const descendants = directChildren.map(c => c.id);
    directChildren.forEach(child => {
      descendants.push(...getAllDescendants(child.id));
    });
    return descendants;
  };
  const descendantIds = getAllDescendants(department.id);

  // Build breadcrumb path
  const buildPath = (dept: HierarchyDepartment): HierarchyDepartment[] => {
    const path: HierarchyDepartment[] = [dept];
    let current = dept;
    
    while (current.parent_id) {
      const parentDept = departments.find(d => d.id === current.parent_id);
      if (!parentDept) break;
      path.unshift(parentDept);
      current = parentDept;
    }
    
    return path;
  };
  const breadcrumbPath = buildPath(department);

  // Handle save
  const handleSave = async () => {
    if (!onUpdate) return;

    setIsSaving(true);
    try {
      await onUpdate(department.id, {
        name: editedName,
        dept_code: editedCode,
        parent_id: editedParentId,
        is_active: editedIsActive,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update department:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setEditedName(department.name);
    setEditedCode(department.dept_code);
    setEditedParentId(department.parent_id || null);
    setEditedIsActive(department.is_active);
    setIsEditing(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white dark:bg-slate-900 shadow-2xl z-50',
          'transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {department.dept_code}
                    </Badge>
                    {!department.is_active && (
                      <Badge variant="destructive" className="text-xs">
                        <Ban className="w-3 h-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {department.name}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <Separator />

            {/* Breadcrumb Path */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Location
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {breadcrumbPath.map((dept, index) => (
                  <div key={dept.id} className="flex items-center gap-2">
                    <button
                      onClick={() => onDepartmentSelect(dept.id)}
                      className={cn(
                        'hover:text-blue-600 dark:hover:text-blue-400 transition-colors',
                        dept.id === department.id
                          ? 'text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-gray-600 dark:text-gray-400'
                      )}
                    >
                      {dept.dept_code}
                    </button>
                    {index < breadcrumbPath.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {children.length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Direct Children
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {descendantIds.length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Total Descendants
                </div>
              </div>
            </div>

            <Separator />

            {/* Edit Form */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Department Details
                </h3>
                {!isEditing && onUpdate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {/* Department Code */}
                <div>
                  <Label htmlFor="dept-code">Department Code</Label>
                  {isEditing ? (
                    <Input
                      id="dept-code"
                      value={editedCode}
                      onChange={(e) => setEditedCode(e.target.value)}
                      className="mt-1.5"
                    />
                  ) : (
                    <div className="mt-1.5 p-2 rounded-md bg-slate-50 dark:bg-slate-800 font-mono text-sm">
                      {department.dept_code}
                    </div>
                  )}
                </div>

                {/* Department Name */}
                <div>
                  <Label htmlFor="dept-name">Department Name</Label>
                  {isEditing ? (
                    <Input
                      id="dept-name"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="mt-1.5"
                    />
                  ) : (
                    <div className="mt-1.5 p-2 rounded-md bg-slate-50 dark:bg-slate-800 text-sm">
                      {department.name}
                    </div>
                  )}
                </div>

                {/* Parent Department */}
                <div>
                  <Label htmlFor="parent">Parent Department</Label>
                  {isEditing ? (
                    <select
                      id="parent"
                      value={editedParentId || 'root'}
                      onChange={(e) =>
                        setEditedParentId(e.target.value === 'root' ? null : e.target.value)
                      }
                      className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="root">Root (No Parent)</option>
                      {departments
                        .filter(d => d.id !== department.id)
                        .map(d => (
                          <option key={d.id} value={d.id}>
                            {d.dept_code} - {d.name}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <div className="mt-1.5 p-2 rounded-md bg-slate-50 dark:bg-slate-800 text-sm">
                      {parent ? (
                        <button
                          onClick={() => onDepartmentSelect(parent.id)}
                          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {parent.dept_code} - {parent.name}
                        </button>
                      ) : (
                        <span className="text-slate-500">Root (No Parent)</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Active Status */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="is-active">Active Status</Label>
                  {isEditing ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        id="is-active"
                        checked={editedIsActive}
                        onChange={(e) => setEditedIsActive(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm">{editedIsActive ? 'Active' : 'Inactive'}</span>
                    </label>
                  ) : (
                    <Badge variant={department.is_active ? 'default' : 'destructive'}>
                      {department.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  )}
                </div>

                {/* Save/Cancel Buttons */}
                {isEditing && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1"
                    >
                      {isSaving ? (
                        <>Saving...</>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Children List */}
            {children.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Child Departments ({children.length})
                  </h3>
                  <div className="space-y-2">
                    {children.map(child => (
                      <button
                        key={child.id}
                        onClick={() => onDepartmentSelect(child.id)}
                        className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-mono text-xs text-slate-600 dark:text-slate-400">
                              {child.dept_code}
                            </div>
                            <div className="font-medium text-sm text-slate-900 dark:text-slate-100">
                              {child.name}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Metadata */}
            {department.metadata && Object.keys(department.metadata).length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Additional Information
                  </h3>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 font-mono text-xs overflow-auto">
                    <pre>{JSON.stringify(department.metadata, null, 2)}</pre>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
