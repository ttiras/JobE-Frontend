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
  CheckCircle2,
  Clock,
  Eye,
  Network,
  ListOrdered,
  Table,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { executeQuery } from '@/lib/nhost/graphql/client';
import { Badge } from '@/components/ui/badge';
import { sortPositionsByHierarchy } from '@/lib/utils/hierarchy-sort';
import { useMutation } from '@/lib/hooks/use-graphql';
import { useAuth } from '@/lib/contexts/auth-context';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  position_evaluations?: Array<{
    id: string;
    status: 'draft' | 'completed';
    completed_at: string | null;
    evaluated_at: string | null;
    evaluated_by: string | null;
    created_at: string;
    version: number;
    dimension_scores_aggregate: {
      aggregate: {
        count: number;
      };
    };
  }>;
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
      position_evaluations(order_by: { created_at: desc }, limit: 1) {
        id
        status
        completed_at
        evaluated_at
        evaluated_by
        created_at
        version
        dimension_scores_aggregate {
          aggregate {
            count
          }
        }
      }
    }
  }
`;

interface GetPositionsResponse {
  positions: Position[];
}

/**
 * CREATE_EVALUATION mutation
 * Creates a new position evaluation in draft status
 * 
 * Note: evaluated_by is automatically set from Hasura session variables
 * created_at and updated_at are set by database triggers
 */
const CREATE_EVALUATION = `
  mutation CreateEvaluation($positionId: uuid!) {
    insert_position_evaluations_one(object: {
      position_id: $positionId
      status: "draft"
    }) {
      id
      position_id
      status
    }
  }
`;

export function PositionsPageClient({ locale, orgId }: PositionsPageClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'hierarchy' | 'alphabetical'>('alphabetical');
  const [sortBy, setSortBy] = useState<'code' | 'title' | 'department'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [evaluationStatusFilter, setEvaluationStatusFilter] = useState<'all' | 'evaluated' | 'draft' | 'not-started'>('all');
  const [creatingEvaluationFor, setCreatingEvaluationFor] = useState<string | null>(null);

  // Fetch positions from database
  const fetchPositions = async () => {
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
  };

  // Mutation for creating evaluation
  const [createEvaluationMutation, { loading: isCreatingEvaluation }] = useMutation<{
    insert_position_evaluations_one: {
      id: string;
      position_id: string;
      status: string;
    };
  }>(CREATE_EVALUATION, {
    onSuccess: async (data) => {
      const evaluationId = data.insert_position_evaluations_one.id;
      toast.success('Evaluation started successfully');
      
      // Optimistically update the position in the list
      setPositions(prevPositions => 
        prevPositions.map(pos => 
          pos.id === creatingEvaluationFor
            ? {
                ...pos,
                position_evaluations: [{
                  id: evaluationId,
                  status: 'draft' as const,
                  completed_at: null,
                  evaluated_at: null,
                  evaluated_by: user?.id || null,
                  created_at: new Date().toISOString(),
                  version: 1,
                  dimension_scores_aggregate: {
                    aggregate: {
                      count: 0,
                    },
                  },
                }],
              }
            : pos
        )
      );
      
      // Navigate to evaluation page
      router.push(`/${locale}/dashboard/${orgId}/evaluation/${evaluationId}`);
    },
    onError: (error) => {
      toast.error('Failed to start evaluation', {
        description: error.message || 'An unexpected error occurred',
      });
      setCreatingEvaluationFor(null);
    },
  });

  // Handler for starting evaluation
  const handleStartEvaluation = async (positionId: string) => {
    if (!user?.id) {
      toast.error('Authentication required', {
        description: 'You must be logged in to start an evaluation',
      });
      return;
    }

    try {
      setCreatingEvaluationFor(positionId);
      await createEvaluationMutation({
        positionId,
      });
    } catch (error) {
      // Error already handled by onError callback
      console.error('Failed to start evaluation:', error);
    }
  };

  // Fetch positions on mount
  useEffect(() => {
    fetchPositions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  // Filter and search positions
  const filteredPositions = useMemo(() => {
    let filtered = positions;

    // Filter by evaluation status
    if (evaluationStatusFilter !== 'all') {
      filtered = filtered.filter(position => {
        const evaluation = position.position_evaluations?.[0];
        
        if (evaluationStatusFilter === 'evaluated') return evaluation?.status === 'completed';
        if (evaluationStatusFilter === 'draft') return evaluation?.status === 'draft';
        if (evaluationStatusFilter === 'not-started') return !evaluation;
        
        return true;
      });
    }

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

    // Sort positions based on sort mode
    if (sortMode === 'hierarchy') {
      // Use hierarchical sorting
      filtered = sortPositionsByHierarchy(filtered);
    } else {
      // Use alphabetical sorting
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
    }

    return filtered;
  }, [positions, searchQuery, sortMode, sortBy, sortOrder, evaluationStatusFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalPositions = positions.length;
    const managerPositions = positions.filter(p => p.is_manager).length;
    const filledPositions = positions.filter(p => p.incumbents_count > 0).length;
    const totalIncumbents = positions.reduce((sum, p) => sum + p.incumbents_count, 0);
    
    // Evaluation statistics
    const evaluated = positions.filter(p => p.position_evaluations?.[0]?.status === 'completed').length;
    const draft = positions.filter(p => p.position_evaluations?.[0]?.status === 'draft').length;
    const notStarted = totalPositions - evaluated - draft;
    const evaluationPercentage = totalPositions > 0 ? Math.round((evaluated / totalPositions) * 100) : 0;

    return {
      total: totalPositions,
      managers: managerPositions,
      filled: filledPositions,
      incumbents: totalIncumbents,
      evaluated,
      draft,
      notStarted,
      evaluationPercentage,
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
                <p className="text-sm font-medium text-muted-foreground">Evaluated</p>
                <p className="text-2xl font-bold text-green-600">{stats.evaluated}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.evaluationPercentage}% complete
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Not Started</p>
                <p className="text-2xl font-bold text-gray-500">{stats.notStarted}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        {/* Status Filter Dropdown */}
        <div className="w-[200px]">
          <Select value={evaluationStatusFilter} onValueChange={(value: any) => setEvaluationStatusFilter(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions ({stats.total})</SelectItem>
              <SelectItem value="not-started">Not Started ({stats.notStarted})</SelectItem>
              <SelectItem value="draft">In Progress ({stats.draft})</SelectItem>
              <SelectItem value="evaluated">Completed ({stats.evaluated})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by code, title, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/50">
          <Button
            variant={sortMode === 'alphabetical' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSortMode('alphabetical')}
            className="gap-2"
            title="Table View"
          >
            <Table className="h-4 w-4" />
            Table
          </Button>
          <Button
            variant={sortMode === 'hierarchy' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSortMode('hierarchy')}
            className="gap-2"
            title="Tree View"
          >
            <GitBranch className="h-4 w-4" />
            Tree
          </Button>
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
                    {sortMode === 'alphabetical' ? (
                      <button
                        onClick={() => handleSort('code')}
                        className="flex items-center font-semibold hover:text-primary transition-colors"
                      >
                        Code
                        {getSortIcon('code')}
                      </button>
                    ) : (
                      <span className="font-semibold">Code</span>
                    )}
                  </th>
                  <th className="text-left p-4">
                    {sortMode === 'alphabetical' ? (
                      <button
                        onClick={() => handleSort('title')}
                        className="flex items-center font-semibold hover:text-primary transition-colors"
                      >
                        Title
                        {getSortIcon('title')}
                      </button>
                    ) : (
                      <span className="font-semibold">Title</span>
                    )}
                  </th>
                  <th className="text-left p-4">
                    {sortMode === 'alphabetical' ? (
                      <button
                        onClick={() => handleSort('department')}
                        className="flex items-center font-semibold hover:text-primary transition-colors"
                      >
                        Department
                        {getSortIcon('department')}
                      </button>
                    ) : (
                      <span className="font-semibold">Department</span>
                    )}
                  </th>
                  <th className="text-left p-4 font-semibold">Reports To</th>
                  <th className="text-center p-4 font-semibold">Manager</th>
                  <th className="text-center p-4 font-semibold">Incumbents</th>
                  <th className="text-left p-4 font-semibold">Evaluation Status</th>
                  <th className="text-right p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPositions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      {searchQuery ? 'No positions found matching your search.' : 'No positions yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredPositions.map((position) => {
                    const hierarchyDepth = ('_hierarchyDepth' in position ? position._hierarchyDepth : 0) as number;
                    const indentSize = sortMode === 'hierarchy' ? hierarchyDepth * 24 : 0;
                    
                    return (
                      <tr key={position.id} className="hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2" style={{ paddingLeft: `${indentSize}px` }}>
                            {sortMode === 'hierarchy' && hierarchyDepth > 0 && (
                              <span className="text-muted-foreground">
                                {'└─ '.repeat(Math.min(hierarchyDepth, 1))}
                              </span>
                            )}
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                              {position.pos_code}
                            </code>
                          </div>
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
                      <td className="p-4">
                        {(() => {
                          const evaluation = position.position_evaluations?.[0];
                          
                          if (!evaluation) {
                            return (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm">Not started</span>
                              </div>
                            );
                          }
                          
                          if (evaluation.status === 'completed') {
                            return (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-green-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span className="text-sm font-medium">Evaluated</span>
                                </div>
                                {evaluation.completed_at && (
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(evaluation.completed_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            );
                          }
                          
                          // Draft status
                          const dimensionCount = evaluation.dimension_scores_aggregate.aggregate.count;
                          return (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-yellow-600">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm font-medium">Draft</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {dimensionCount}/12 dimensions
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-4 text-right">
                        {(() => {
                          const evaluation = position.position_evaluations?.[0];
                          const isThisPositionLoading = creatingEvaluationFor === position.id;
                          
                          if (!evaluation) {
                            return (
                              <Button 
                                size="sm"
                                onClick={() => handleStartEvaluation(position.id)}
                                disabled={isThisPositionLoading || isCreatingEvaluation}
                              >
                                {isThisPositionLoading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Starting...
                                  </>
                                ) : (
                                  <>
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    Start Evaluation
                                  </>
                                )}
                              </Button>
                            );
                          }
                          
                          if (evaluation.status === 'draft') {
                            return (
                              <div className="flex gap-1 justify-end">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => 
                                    router.push(`/${locale}/dashboard/${orgId}/evaluation/${evaluation.id}`)
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => 
                                    router.push(`/${locale}/dashboard/${orgId}/evaluation/${evaluation.id}`)
                                  }
                                >
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Continue
                                </Button>
                              </div>
                            );
                          }
                          
                          // Completed
                          return (
                            <div className="flex gap-1 justify-end">
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
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                    );
                  })
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
