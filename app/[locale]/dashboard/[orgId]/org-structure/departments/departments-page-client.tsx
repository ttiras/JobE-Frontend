/**
 * Departments Page Client Component
 * 
 * Fetches and displays departments as a list with search and filtering
 * Uses the same data source as hierarchy page but in list format
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  FolderKanban,
  Plus,
  Search,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  Building2,
  Network,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { HierarchyDepartment } from '@/lib/types/hierarchy';
import { executeQuery } from '@/lib/nhost/graphql/client';
import { enrichDepartmentData } from '@/lib/utils/hierarchy';
import { Badge } from '@/components/ui/badge';

interface DepartmentsPageClientProps {
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

export function DepartmentsPageClient({ locale, orgId }: DepartmentsPageClientProps) {
  const router = useRouter();
  const [departments, setDepartments] = useState<HierarchyDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'level'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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

        // Enrich data with hierarchy information
        const enrichedDepartments = enrichDepartmentData(data.departments || []);
        setDepartments(enrichedDepartments);
      } catch (err) {
        console.error('Error fetching departments:', err);
        setError(err instanceof Error ? err.message : 'Failed to load departments');
      } finally {
        setLoading(false);
      }
    }

    fetchDepartments();
  }, [orgId]);

  // Filter and search departments
  const filteredDepartments = useMemo(() => {
    let filtered = departments;

    // Filter by active status
    if (!showInactive) {
      filtered = filtered.filter(dept => dept.is_active);
    }

    // Search by code or name
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        dept =>
          dept.dept_code.toLowerCase().includes(query) ||
          dept.name.toLowerCase().includes(query)
      );
    }

    // Sort departments
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'level') {
        const levelA = a.level ?? 0;
        const levelB = b.level ?? 0;
        comparison = levelA - levelB;
        // Secondary sort by name if levels are equal
        if (comparison === 0) {
          comparison = a.name.localeCompare(b.name);
        }
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [departments, searchQuery, showInactive, sortBy, sortOrder]);

  // Get parent name for a department
  const getParentName = (parentId: string | null | undefined) => {
    if (!parentId) return null;
    const parent = departments.find(d => d.id === parentId);
    return parent ? `${parent.dept_code} - ${parent.name}` : null;
  };

  // Handle sort toggle
  const handleSort = (column: 'name' | 'level') => {
    if (sortBy === column) {
      // Toggle sort order if clicking same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column with default ascending order
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (column: 'name' | 'level') => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  // Handle edit click (prevent row click from triggering)
  const handleEditClick = (e: React.MouseEvent, deptId: string) => {
    e.stopPropagation();
    router.push(`/${locale}/dashboard/${orgId}/org-structure/departments/${deptId}/edit`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading departments...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Departments</AlertTitle>
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              className="ml-4"
              onClick={() => router.refresh()}
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <FolderKanban className="h-8 w-8 text-primary" />
            Departments
          </h1>
          <p className="text-muted-foreground">
            Manage your organization&apos;s department structure
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${locale}/dashboard/${orgId}/org-structure/hierarchy`}>
              <Network className="h-4 w-4 mr-2" />
              Organization Chart
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/${locale}/dashboard/${orgId}/org-structure/departments/import`}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Import from Excel
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/${locale}/dashboard/${orgId}/org-structure/departments/new`}>
              <Plus className="h-4 w-4 mr-2" />
              New Department
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showInactive ? "default" : "outline"}
          onClick={() => setShowInactive(!showInactive)}
        >
          {showInactive ? 'Hide' : 'Show'} Inactive
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground">Total Departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {departments.filter(d => d.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {departments.filter(d => !d.parent_id).length}
            </div>
            <p className="text-xs text-muted-foreground">Root Departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {Math.max(...departments.map(d => d.level || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Max Depth</p>
          </CardContent>
        </Card>
      </div>

      {/* Departments Table */}
      {filteredDepartments.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="pt-6">
            <div className="text-center space-y-4 py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <FolderKanban className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery || !showInactive ? 'No departments found' : 'No departments yet'}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {searchQuery
                    ? 'Try adjusting your search criteria'
                    : 'Get started by creating your first department or importing from Excel'}
                </p>
              </div>
              {!searchQuery && (
                <div className="pt-4 flex gap-3 justify-center">
                  <Button size="lg" variant="outline" asChild>
                    <Link href={`/${locale}/dashboard/${orgId}/org-structure/departments/import`}>
                      <FileSpreadsheet className="h-5 w-5 mr-2" />
                      Import from Excel
                    </Link>
                  </Button>
                  <Button size="lg" asChild>
                    <Link href={`/${locale}/dashboard/${orgId}/org-structure/departments/new`}>
                      <Plus className="h-5 w-5 mr-2" />
                      Create Department
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Code
                    </th>
                    <th 
                      className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Department Name
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Parent
                    </th>
                    <th 
                      className="h-12 px-4 text-center align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort('level')}
                    >
                      <div className="flex items-center justify-center">
                        Level
                        {getSortIcon('level')}
                      </div>
                    </th>
                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                      Children
                    </th>
                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                      Total Descendants
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepartments.map((dept, index) => (
                    <tr
                      key={dept.id}
                      className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                      onClick={() =>
                        router.push(`/${locale}/dashboard/${orgId}/org-structure/departments/${dept.id}`)
                      }
                    >
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-mono text-sm font-medium">
                            {dept.dept_code}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="font-medium">{dept.name}</div>
                      </td>
                      <td className="p-4 align-middle">
                        {dept.parent_id ? (
                          <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {getParentName(dept.parent_id)}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground italic">
                            Root
                          </div>
                        )}
                      </td>
                      <td className="p-4 align-middle text-center">
                        {dept.level !== undefined && (
                          <Badge variant="outline" className="font-mono">
                            {dept.level}
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 align-middle text-center">
                        {dept.childCount !== undefined && dept.childCount > 0 ? (
                          <span className="text-sm font-medium">
                            {dept.childCount}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4 align-middle text-center">
                        {dept.totalDescendants !== undefined && dept.totalDescendants > 0 ? (
                          <span className="text-sm font-medium">
                            {dept.totalDescendants}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4 align-middle text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleEditClick(e, dept.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Results count */}
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
            <div>
              Showing <span className="font-medium text-foreground">{filteredDepartments.length}</span> of{' '}
              <span className="font-medium text-foreground">{departments.length}</span> departments
            </div>
            <div className="text-xs">
              Sorted by <span className="font-medium text-foreground">{sortBy === 'name' ? 'Name' : 'Level'}</span>{' '}
              ({sortOrder === 'asc' ? 'ascending' : 'descending'})
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
