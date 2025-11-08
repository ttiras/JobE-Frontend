/**
 * Hierarchy Page Client Component
 * 
 * Fetches and displays the department hierarchy with interactive visualization
 * Supports drag & drop reorg      // Check if trying to move to its own current parent
      if (dept.parent_id === newParentId) {
        // If this department has a pending move, remove it (user is dragging back to original)
        if (pendingMoves.has(departmentId)) {
          setPendingMoves((prev) => {
            const updated = new Map(prev);
            updated.delete(departmentId);
            return updated;
          });
          toast.success('Move Cancelled', {
            description: `"${dept.name}" returned to its original parent`,
            duration: 2000,
          });
        } else {
          // No pending move and trying to move to same parent - no-op
          toast.info('No Change', {
            description: 'Department is already under this parent',
            duration: 2000,
          });
        }
        return;
      }

      // Convert Map to array format for validationwith pending changes system
 */

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Network,
  ChevronRight,
  Building2,
  Download,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DepartmentHierarchyVisualization } from '@/components/hierarchy/department-hierarchy-visualization';
import { PendingChangesBar } from '@/components/hierarchy/pending-changes-bar';
import { DepartmentDetailsPanel } from '@/components/hierarchy/department-details-panel';
import { HierarchyDepartment, PendingDepartmentMove } from '@/lib/types/hierarchy';
import { executeQuery } from '@/lib/nhost/graphql/client';
import { enrichDepartmentData } from '@/lib/utils/hierarchy';
import { validateDepartmentMove, validateAllPendingMoves } from '@/lib/utils/hierarchy-validation';
import { batchUpdateDepartmentParents } from '@/lib/nhost/graphql/mutations/department-reorganization';
import { updateDepartment } from '@/lib/nhost/graphql/mutations/department-quick-edit';

interface HierarchyPageClientProps {
  locale: string;
  orgId: string;
}

const GET_DEPARTMENTS = `
  query GetDepartments($orgId: uuid!) {
    departments(
      where: { organization_id: { _eq: $orgId } }
      order_by: { dept_code: asc }
    ) {
      id
      dept_code
      name
      parent_id
      is_active
      metadata
    }
  }
`;

interface GetDepartmentsResponse {
  departments: HierarchyDepartment[];
}

export function HierarchyPageClient({ locale, orgId }: HierarchyPageClientProps) {
  const router = useRouter();
  const [departments, setDepartments] = useState<HierarchyDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingMoves, setPendingMoves] = useState<Map<string, string | null>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [visualResetKey, setVisualResetKey] = useState(0); // Force visual reset on invalid moves

  // Create a "preview" version of departments that includes pending changes
  const previewDepartments = useMemo(() => {
    if (pendingMoves.size === 0) return departments;

    console.log('🔄 Creating preview with', pendingMoves.size, 'pending moves');

    // Apply pending moves to create preview
    const preview = departments.map(dept => {
      const pendingNewParentId = pendingMoves.get(dept.id);
      if (pendingNewParentId !== undefined) {
        console.log('  📝 Moving', dept.dept_code, 'to new parent');
        return {
          ...dept,
          parent_id: pendingNewParentId,
          // Clear old calculated values
          level: undefined,
          childCount: undefined,
          totalDescendants: undefined,
        };
      }
      return {
        ...dept,
        // Clear old calculated values for all departments
        level: undefined,
        childCount: undefined,
        totalDescendants: undefined,
      };
    });

    // Re-calculate levels, childCount, and totalDescendants for the preview
    const enriched = enrichDepartmentData(preview);
    
    console.log('✅ Preview enriched. Sample levels:', 
      enriched.slice(0, 3).map(d => `${d.dept_code}: L${d.level}`)
    );

    return enriched;
  }, [departments, pendingMoves]);

  // Fetch departments from database
  useEffect(() => {
    async function fetchDepartments() {
      try {
        setLoading(true);
        setError(null);

        const data = await executeQuery<GetDepartmentsResponse>(
          GET_DEPARTMENTS,
          { orgId }
        );

        setDepartments(data.departments || []);
      } catch (err) {
        console.error('Error fetching departments:', err);
        setError(err instanceof Error ? err.message : 'Failed to load departments');
      } finally {
        setLoading(false);
      }
    }

    fetchDepartments();
  }, [orgId]);

  // Browser leave warning for unsaved changes
  useEffect(() => {
    if (pendingMoves.size === 0) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pendingMoves.size]);

    // Handle department move
  const handleDepartmentMove = useCallback(
    (departmentId: string, newParentId: string | null) => {
      // Find department to get additional info
      const dept = departments.find(d => d.id === departmentId);
      if (!dept) return;

      // Check if trying to move to its own current parent
      if (dept.parent_id === newParentId) {
        // If this department has a pending move, remove it (user is dragging back to original)
        if (pendingMoves.has(departmentId)) {
          setPendingMoves((prev) => {
            const updated = new Map(prev);
            updated.delete(departmentId);
            return updated;
          });
          toast.success('Move Cancelled', {
            description: `"${dept.name}" returned to its original parent`,
            duration: 2000,
          });
        } else {
          // No pending move and trying to move to same parent - no-op
          toast.warning('No Change', {
            description: 'Department is already under this parent',
            duration: 2000,
          });
          // Trigger visual reset to snap node back
          setVisualResetKey(prev => prev + 1);
        }
        return;
      }

      // Convert current pending moves to array format for validation
      const existingMoves: PendingDepartmentMove[] = Array.from(pendingMoves.entries()).map(
        ([id, newParentId]) => {
          const d = departments.find(dep => dep.id === id);
          return {
            departmentId: id,
            departmentCode: d?.dept_code || '',
            departmentName: d?.name || '',
            oldParentId: d?.parent_id || null,
            newParentId,
            timestamp: Date.now(),
          };
        }
      );

      // Validate the move
      const validation = validateDepartmentMove(
        departmentId,
        newParentId,
        departments,
        existingMoves
      );

      if (!validation.isValid) {
        toast.error('Invalid Move', {
          description: validation.errors.join(', ') || 'This move is not allowed',
          duration: 3000,
        });
        // Trigger visual reset to snap node back
        setVisualResetKey(prev => prev + 1);
        return;
      }

      // Add to pending moves
      setPendingMoves((prev) => {
        const updated = new Map(prev);
        updated.set(departmentId, newParentId);
        return updated;
      });

      // Get parent names for better feedback
      const oldParent = departments.find(d => d.id === dept.parent_id);
      const newParent = departments.find(d => d.id === newParentId);
      
      const oldParentName = oldParent ? oldParent.name : 'Root';
      const newParentName = newParent ? newParent.name : 'Root';

      toast.success('Move Queued', {
        description: `"${dept.name}" moved from "${oldParentName}" to "${newParentName}"`,
        duration: 3000,
      });
    },
    [departments, pendingMoves]
  );

  // Handle save changes
  const handleSaveChanges = useCallback(async () => {
    if (pendingMoves.size === 0) return;

    // Convert Map to array format for validation
    const pendingMovesArray: PendingDepartmentMove[] = Array.from(pendingMoves.entries()).map(
      ([id, newParentId]) => {
        const dept = departments.find(d => d.id === id);
        return {
          departmentId: id,
          departmentCode: dept?.dept_code || '',
          departmentName: dept?.name || '',
          oldParentId: dept?.parent_id || null,
          newParentId,
          timestamp: Date.now(),
        };
      }
    );

    // Validate all pending moves
    const validation = validateAllPendingMoves(pendingMovesArray, departments);
    if (!validation.isValid) {
      const errorMessages = validation.invalidMoves
        .map(({ move, result }) => {
          const dept = departments.find(d => d.id === move.departmentId);
          return `${dept?.name || move.departmentId}: ${result.errors.join(', ')}`;
        })
        .join('; ');
      
      toast.error('Validation Failed', {
        description: errorMessages,
      });
      return;
    }

    setIsSaving(true);
    try {
      // Execute batch update
      await batchUpdateDepartmentParents(pendingMovesArray);

      // Refresh departments
      const data = await executeQuery<GetDepartmentsResponse>(
        GET_DEPARTMENTS,
        { orgId }
      );
      setDepartments(data.departments || []);

      // Clear pending moves
      setPendingMoves(new Map());

      toast.success('Changes Saved', {
        description: `Successfully updated ${pendingMovesArray.length} department(s)`,
      });
    } catch (err) {
      console.error('Error saving changes:', err);
      toast.error('Save Failed', {
        description: err instanceof Error ? err.message : 'Failed to save changes',
      });
    } finally {
      setIsSaving(false);
    }
  }, [pendingMoves, departments, orgId]);

  // Handle undo changes
  const handleUndoChanges = useCallback(() => {
    setPendingMoves(new Map());
    toast.info('Changes Undone', {
      description: 'All pending moves have been cleared',
    });
  }, []);

  // Handle department select (from panel or elsewhere)
  const handleDepartmentSelect = useCallback((departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    setIsPanelOpen(true);
  }, []);

  // Handle department update from panel
  const handleDepartmentUpdate = useCallback(async (
    departmentId: string,
    updates: Partial<HierarchyDepartment>
  ) => {
    try {
      await updateDepartment({
        id: departmentId,
        ...updates,
      });

      // Refresh departments
      const data = await executeQuery<GetDepartmentsResponse>(
        GET_DEPARTMENTS,
        { orgId }
      );
      setDepartments(data.departments || []);

      toast.success('Department Updated', {
        description: 'Changes have been saved successfully',
      });
    } catch (err) {
      console.error('Error updating department:', err);
      toast.error('Update Failed', {
        description: err instanceof Error ? err.message : 'Failed to update department',
      });
      throw err;
    }
  }, [orgId]);

  if (loading) {
    return (
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link
            href={`/${locale}/dashboard/${orgId}`}
            className="hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link
            href={`/${locale}/dashboard/${orgId}/org-structure/departments`}
            className="hover:text-foreground transition-colors"
          >
            Org Structure
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Hierarchy</span>
        </div>

        {/* Loading State */}
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading hierarchy...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link
            href={`/${locale}/dashboard/${orgId}`}
            className="hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link
            href={`/${locale}/dashboard/${orgId}/org-structure/departments`}
            className="hover:text-foreground transition-colors"
          >
            Org Structure
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Organization Chart</span>
        </div>

        {/* Error State */}
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="mt-4">
          <Button onClick={() => router.refresh()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link
            href={`/${locale}/dashboard/${orgId}`}
            className="hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link
            href={`/${locale}/dashboard/${orgId}/org-structure/departments`}
            className="hover:text-foreground transition-colors"
          >
            Org Structure
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Organization Chart</span>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center h-96 space-y-6">
          <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Building2 className="w-10 h-10 text-slate-400" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">No Departments Yet</h3>
            <p className="text-muted-foreground max-w-md">
              Get started by importing your department structure from an Excel file or creating
              departments manually.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() =>
                router.push(`/${locale}/dashboard/${orgId}/org-structure/departments/import`)
              }
            >
              <Download className="w-4 h-4 mr-2" />
              Import from Excel
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/${locale}/dashboard/${orgId}/org-structure/departments`)
              }
            >
              <Building2 className="w-4 h-4 mr-2" />
              Add Department
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/${locale}/dashboard/${orgId}`}
          className="hover:text-foreground transition-colors"
        >
          Dashboard
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link
          href={`/${locale}/dashboard/${orgId}/org-structure/departments`}
          className="hover:text-foreground transition-colors"
        >
          Org Structure
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">Organization Chart</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <Network className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            Organization Chart
          </h1>
          <p className="text-muted-foreground">
            Interactive visualization of your department structure
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/${locale}/dashboard/${orgId}/org-structure/departments`)
            }
          >
            <FileText className="w-4 h-4 mr-2" />
            List View
          </Button>
        </div>
      </div>

      {/* Hierarchy Visualization */}
      <DepartmentHierarchyVisualization
        departments={previewDepartments}
        height="calc(100vh - 280px)"
        showControls={true}
        showMiniMap={true}
        showStats={true}
        pendingMoves={pendingMoves}
        onDepartmentMove={handleDepartmentMove}
        onNodeClick={handleDepartmentSelect}
        resetTrigger={visualResetKey}
      />

      {/* Pending Changes Bar */}
      {pendingMoves.size > 0 && (
        <PendingChangesBar
          pendingMoves={Array.from(pendingMoves.entries()).map(([id, newParentId]) => {
            const dept = departments.find(d => d.id === id);
            const oldParent = departments.find(d => d.id === dept?.parent_id);
            const newParent = departments.find(d => d.id === newParentId);
            
            return {
              departmentId: id,
              departmentCode: dept?.dept_code || '',
              departmentName: dept?.name || '',
              oldParentId: dept?.parent_id || null,
              newParentId,
              timestamp: Date.now(),
            };
          })}
          onSave={handleSaveChanges}
          onUndoAll={handleUndoChanges}
          isSaving={isSaving}
        />
      )}

      {/* Info Banner */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Use the controls in the bottom-left to zoom and pan. <strong>Click any department to view details</strong>. Use the search box to find specific departments. <strong>Drag departments onto other departments to reorganize the hierarchy</strong> - changes will be pending until you click Save.
        </AlertDescription>
      </Alert>

      {/* Department Details Panel */}
      <DepartmentDetailsPanel
        department={departments.find(d => d.id === selectedDepartmentId) || null}
        departments={departments}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onDepartmentSelect={handleDepartmentSelect}
        onUpdate={handleDepartmentUpdate}
      />
    </div>
  );
}
