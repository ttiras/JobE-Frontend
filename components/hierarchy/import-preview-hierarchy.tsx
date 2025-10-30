/**
 * ImportPreviewHierarchy Component
 * 
 * Shows hierarchy visualization in the import preview step
 * Converts import preview data to hierarchy format
 */

'use client';

import { useMemo } from 'react';
import { DepartmentHierarchyVisualization } from './department-hierarchy-visualization';
import { HierarchyDepartment } from '@/lib/types/hierarchy';
import { DepartmentPreview } from '@/lib/types/import';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table2, Network } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface ImportPreviewHierarchyProps {
  departments: DepartmentPreview[];
  showTableView?: boolean;
}

export function ImportPreviewHierarchy({
  departments,
  showTableView = true,
}: ImportPreviewHierarchyProps) {
  // Convert DepartmentPreview to HierarchyDepartment
  const hierarchyDepartments: HierarchyDepartment[] = useMemo(() => {
    return departments.map((dept) => ({
      id: dept.dept_code, // Use dept_code as temporary ID for preview
      dept_code: dept.dept_code,
      name: dept.name,
      parent_id: dept.parent_dept_code || null,
      is_active: true, // Assume active for import preview
      metadata: dept.metadata,
    }));
  }, [departments]);

  if (departments.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>No departments to preview</AlertDescription>
      </Alert>
    );
  }

  if (!showTableView) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            Department Hierarchy Preview
          </CardTitle>
          <CardDescription>
            Visual representation of your department structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DepartmentHierarchyVisualization
            departments={hierarchyDepartments}
            height="500px"
            showControls={true}
            showMiniMap={true}
            showStats={true}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Preview</CardTitle>
        <CardDescription>
          Review your department structure before importing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="hierarchy" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hierarchy" className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              Hierarchy View
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Table2 className="w-4 h-4" />
              Table View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hierarchy" className="mt-4">
            <DepartmentHierarchyVisualization
              departments={hierarchyDepartments}
              height="500px"
              showControls={true}
              showMiniMap={true}
              showStats={true}
            />
          </TabsContent>

          <TabsContent value="table" className="mt-4">
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 dark:bg-slate-900">
                    <th className="px-4 py-3 text-left font-medium">Code</th>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Parent</th>
                    <th className="px-4 py-3 text-left font-medium">Operation</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept, index) => (
                    <tr
                      key={dept.dept_code}
                      className={index % 2 === 0 ? 'bg-white dark:bg-slate-950' : 'bg-slate-50 dark:bg-slate-900'}
                    >
                      <td className="px-4 py-3 font-mono text-xs">{dept.dept_code}</td>
                      <td className="px-4 py-3">{dept.name}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {dept.parent_dept_code || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            dept.operation === 'CREATE'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          }`}
                        >
                          {dept.operation}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
