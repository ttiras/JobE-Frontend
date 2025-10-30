/**
 * Positions Page Client Component
 * 
 * Fetches and displays positions as a list with search and filtering
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Briefcase,
  Plus,
  Search,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { executeQuery } from '@/lib/nhost/graphql/client';
import { Badge } from '@/components/ui/badge';

interface PositionsPageClientProps {
  locale: string;
  orgId: string;
}

interface Position {
  id: string;
  pos_code: string;
  title: string;
  department_id: string | null;
  reports_to_id: string | null;
  is_manager: boolean;
  incumbents_count: number;
  department?: {
    dept_code: string;
    name: string;
  };
  manager?: {
    pos_code: string;
    title: string;
  };
}

const GET_POSITIONS = `
  query GetPositions($orgId: uuid!) {
    positions(
      where: { organization_id: { _eq: $orgId } }
      order_by: { pos_code: asc }
    ) {
      id
      pos_code
      title
      department_id
      reports_to_id
      is_manager
      incumbents_count
      department {
        dept_code
        name
      }
      manager {
        pos_code
        title
      }
    }
  }
`;

interface GetPositionsResponse {
  positions: Position[];
}

export function PositionsPageClient({ locale, orgId }: PositionsPageClientProps) {
  const router = useRouter();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'code' | 'title' | 'department'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Fetch positions from database
  useEffect(() => {
    async function fetchPositions() {
      try {
        setLoading(true);
        setError(null);

        const data = await executeQuery<GetPositionsResponse>(
          GET_POSITIONS,
          { orgId }
        );

        setPositions(data.positions || []);
      } catch (err) {
        console.error('Error fetching positions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load positions');
      } finally {
        setLoading(false);
      }
    }

    fetchPositions();
  }, [orgId]);

  // Filter and search positions
  const filteredPositions = useMemo(() => {
    let filtered = positions;

    // Search by code, title, or department
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        pos =>
          pos.pos_code.toLowerCase().includes(query) ||
          pos.title.toLowerCase().includes(query) ||
          pos.department?.name.toLowerCase().includes(query) ||
          pos.department?.dept_code.toLowerCase().includes(query)
      );
    }

    // Sort positions
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'code') {
        comparison = a.pos_code.localeCompare(b.pos_code);
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'department') {
        const deptA = a.department?.name || '';
        const deptB = b.department?.name || '';
        comparison = deptA.localeCompare(deptB);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [positions, searchQuery, sortBy, sortOrder]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalPositions = positions.length;
    const managerPositions = positions.filter(p => p.is_manager).length;
    const filledPositions = positions.filter(p => p.incumbents_count > 0).length;
    const totalIncumbents = positions.reduce((sum, p) => sum + p.incumbents_count, 0);

    return {
      total: totalPositions,
      managers: managerPositions,
      filled: filledPositions,
      incumbents: totalIncumbents,
    };
  }, [positions]);

  // Handle sort toggle
  const handleSort = (column: 'code' | 'title' | 'department') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (column: 'code' | 'title' | 'department') => {
    if (sortBy !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-8 w-8" />
            Positions
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and view all positions in your organization
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/${locale}/dashboard/${orgId}/org-structure/positions/import`}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Import
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/${locale}/dashboard/${orgId}/org-structure/positions/new`}>
              <Plus className="mr-2 h-4 w-4" />
              New Position
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Positions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Manager Positions</p>
                <p className="text-2xl font-bold">{stats.managers}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Filled Positions</p>
                <p className="text-2xl font-bold">{stats.filled}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? Math.round((stats.filled / stats.total) * 100) : 0}% filled
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Incumbents</p>
                <p className="text-2xl font-bold">{stats.incumbents}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by code, title, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Positions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort('code')}
                      className="flex items-center font-semibold hover:text-primary transition-colors"
                    >
                      Code
                      {getSortIcon('code')}
                    </button>
                  </th>
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort('title')}
                      className="flex items-center font-semibold hover:text-primary transition-colors"
                    >
                      Title
                      {getSortIcon('title')}
                    </button>
                  </th>
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort('department')}
                      className="flex items-center font-semibold hover:text-primary transition-colors"
                    >
                      Department
                      {getSortIcon('department')}
                    </button>
                  </th>
                  <th className="text-left p-4 font-semibold">Reports To</th>
                  <th className="text-center p-4 font-semibold">Manager</th>
                  <th className="text-center p-4 font-semibold">Incumbents</th>
                  <th className="text-right p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPositions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      {searchQuery ? 'No positions found matching your search.' : 'No positions yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredPositions.map((position) => (
                    <tr key={position.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {position.pos_code}
                        </code>
                      </td>
                      <td className="p-4 font-medium">{position.title}</td>
                      <td className="p-4">
                        {position.department ? (
                          <div className="text-sm">
                            <div className="font-medium">{position.department.name}</div>
                            <div className="text-muted-foreground">
                              {position.department.dept_code}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        {position.manager ? (
                          <div className="text-sm">
                            <div>{position.manager.title}</div>
                            <div className="text-muted-foreground text-xs">
                              {position.manager.pos_code}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {position.is_manager ? (
                          <Badge variant="default">Yes</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant={position.incumbents_count > 0 ? 'default' : 'secondary'}>
                          {position.incumbents_count}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/${locale}/dashboard/${orgId}/org-structure/positions/${position.id}/edit`
                            )
                          }
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="text-sm text-muted-foreground text-center">
        Showing {filteredPositions.length} of {positions.length} positions
      </div>
    </div>
  );
}
