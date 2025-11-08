'use client';

/**
 * DataPreviewTable Component
 * 
 * Displays parsed data with operation indicators
 * Features:
 * - Department and position preview
 * - CREATE/UPDATE operation badges
 * - Responsive table layout
 * - Keyboard navigation
 * - Empty state handling
 */

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Building2, Briefcase, Plus, Pencil } from 'lucide-react';
import { DepartmentPreview, PositionPreview, OperationType } from '@/lib/types/import';

export interface DataPreviewTableProps {
  departments: DepartmentPreview[];
  positions: PositionPreview[];
  showOperations?: boolean;
  maxRows?: number;
  className?: string;
}

export function DataPreviewTable({ 
  departments, 
  positions, 
  showOperations = true,
  maxRows = 100,
  className = '' 
}: DataPreviewTableProps) {
  const t = useTranslations('import.preview');

  // Calculate summary statistics
  const stats = useMemo(() => {
    return {
      departments: {
        total: departments.length,
        creates: departments.filter(d => d.operation === OperationType.CREATE).length,
        updates: departments.filter(d => d.operation === OperationType.UPDATE).length,
      },
      positions: {
        total: positions.length,
        creates: positions.filter(p => p.operation === OperationType.CREATE).length,
        updates: positions.filter(p => p.operation === OperationType.UPDATE).length,
      }
    };
  }, [departments, positions]);

  // Truncate data for display
  const displayDepartments = departments.slice(0, maxRows);
  const displayPositions = positions.slice(0, maxRows);
  const hasMoreDepartments = departments.length > maxRows;
  const hasMorePositions = positions.length > maxRows;

  const OperationBadge = ({ operation }: { operation: OperationType }) => {
    const isCreate = operation === OperationType.CREATE;
    return (
      <span 
        className={`
          inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full
          ${isCreate ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}
        `}
      >
        {isCreate ? <Plus className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
        {isCreate ? t('create') : t('update')}
      </span>
    );
  };

  if (departments.length === 0 && positions.length === 0) {
    return (
      <div className={`border rounded-lg p-8 text-center ${className}`}>
        <p className="text-muted-foreground">{t('noData')}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Statistics */}
      {showOperations && (departments.length > 0 || positions.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {departments.length > 0 && (
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg shrink-0">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-2">{t('departments')}</h4>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold">{stats.departments.total} total</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.departments.creates} new
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {stats.departments.updates} updates
                  </span>
                </div>
              </div>
            </div>
          )}
          {positions.length > 0 && (
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="p-2 bg-green-100 dark:bg-green-950 rounded-lg shrink-0">
                <Briefcase className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-2">{t('positions')}</h4>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold">{stats.positions.total} total</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.positions.creates} new
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {stats.positions.updates} updates
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Departments table */}
      {departments.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/30 border-y sticky top-0 z-10">
                <tr>
                  {showOperations && (
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-secondary/30">
                      {t('operation')}
                    </th>
                  )}
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-secondary/30">
                    {t('code')}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-secondary/30">
                    {t('nameEn')}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-secondary/30">
                    {t('nameTr')}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-secondary/30">
                    {t('parentCode')}
                  </th>
                </tr>
              </thead>
            </table>
          </div>
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full">
              <tbody className="divide-y">
                {displayDepartments.map((dept, index) => (
                  <tr 
                    key={`dept-${dept.dept_code}-${dept.excelRow}-${index}`}
                    className="hover:bg-secondary/50 transition-colors"
                    tabIndex={0}
                  >
                    {showOperations && (
                      <td className="px-4 py-3">
                        <OperationBadge operation={dept.operation} />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <code className="text-sm font-mono bg-secondary px-2 py-0.5 rounded">
                        {dept.dept_code}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-sm">{dept.name}</td>
                    <td className="px-4 py-3 text-sm">{dept.name}</td>
                    <td className="px-4 py-3">
                      {dept.parent_dept_code ? (
                        <code className="text-sm font-mono bg-secondary px-2 py-0.5 rounded">
                          {dept.parent_dept_code}
                        </code>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasMoreDepartments && (
            <div className="bg-secondary/30 px-4 py-2 text-sm text-center text-muted-foreground border-t">
              {t('showingRows', { shown: maxRows, total: departments.length })}
            </div>
          )}
        </div>
      )}

      {/* Positions table */}
      {positions.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/30 border-y sticky top-0 z-10">
                <tr>
                  {showOperations && (
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-secondary/30">
                      {t('operation')}
                    </th>
                  )}
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-secondary/30">
                    {t('code')}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-secondary/30">
                    {t('nameEn')}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-secondary/30">
                    {t('nameTr')}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-secondary/30">
                    {t('departmentCode')}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider bg-secondary/30">
                    {t('reportingToCode')}
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider bg-secondary/30">
                    {t('isManager')}
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider bg-secondary/30">
                    {t('incumbents')}
                  </th>
                </tr>
              </thead>
            </table>
          </div>
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full">
              <tbody className="divide-y">
                {displayPositions.map((pos, index) => (
                  <tr 
                    key={`pos-${pos.pos_code}-${pos.excelRow}-${index}`}
                    className="hover:bg-secondary/50 transition-colors"
                    tabIndex={0}
                  >
                    {showOperations && (
                      <td className="px-4 py-3">
                        <OperationBadge operation={pos.operation} />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <code className="text-sm font-mono bg-secondary px-2 py-0.5 rounded">
                        {pos.pos_code}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-sm">{pos.title}</td>
                    <td className="px-4 py-3 text-sm">{pos.title}</td>
                    <td className="px-4 py-3">
                      <code className="text-sm font-mono bg-secondary px-2 py-0.5 rounded">
                        {pos.dept_code}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      {pos.reports_to_pos_code ? (
                        <code className="text-sm font-mono bg-secondary px-2 py-0.5 rounded">
                          {pos.reports_to_pos_code}
                        </code>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        pos.is_manager 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {pos.is_manager ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium">
                      {pos.incumbents_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasMorePositions && (
            <div className="bg-secondary/30 px-4 py-2 text-sm text-center text-muted-foreground border-t">
              {t('showingRows', { shown: maxRows, total: positions.length })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
