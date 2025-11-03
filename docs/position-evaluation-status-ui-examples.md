# Position Evaluation Status - UI Integration Examples

## Quick Reference Card

### Data Structure
```typescript
position.position_evaluations?.[0] = {
  id: "uuid",
  status: "draft" | "completed",
  completed_at: "2025-11-02T10:30:00Z" | null,
  evaluated_at: "2025-11-02T10:30:00Z" | null,
  evaluated_by: "user-uuid" | null,
  created_at: "2025-11-01T08:00:00Z",
  version: 1,
  dimension_scores_aggregate: {
    aggregate: {
      count: 8  // Number of completed dimensions
    }
  }
}
```

## UI Examples

### 1. Simple Evaluation Badge
```tsx
// Show if position is evaluated
const latestEval = position.position_evaluations?.[0];
const isEvaluated = latestEval?.status === 'completed';

<Badge variant={isEvaluated ? "default" : "secondary"}>
  {isEvaluated ? "Evaluated" : "Not Evaluated"}
</Badge>
```

### 2. Evaluation Status with Progress
```tsx
// Show status with dimension progress
const evaluation = position.position_evaluations?.[0];

{evaluation ? (
  <div className="flex items-center gap-2">
    {evaluation.status === 'completed' ? (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm font-medium">Evaluated</span>
      </div>
    ) : (
      <div className="flex items-center gap-2 text-yellow-600">
        <Clock className="h-4 w-4" />
        <span className="text-sm">
          Draft ({evaluation.dimension_scores_aggregate.aggregate.count}/12)
        </span>
      </div>
    )}
  </div>
) : (
  <div className="flex items-center gap-2 text-muted-foreground">
    <AlertCircle className="h-4 w-4" />
    <span className="text-sm">Not Started</span>
  </div>
)}
```

### 3. Detailed Evaluation Card
```tsx
// Full evaluation information card
const evaluation = position.position_evaluations?.[0];

{evaluation && (
  <Card>
    <CardContent className="pt-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Evaluation Status</span>
          <Badge variant={evaluation.status === 'completed' ? 'default' : 'secondary'}>
            {evaluation.status}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Progress</span>
          <span className="text-sm font-medium">
            {evaluation.dimension_scores_aggregate.aggregate.count}/12 dimensions
          </span>
        </div>
        
        {evaluation.completed_at && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Completed</span>
            <span className="text-sm">
              {new Date(evaluation.completed_at).toLocaleDateString()}
            </span>
          </div>
        )}
        
        <Progress 
          value={(evaluation.dimension_scores_aggregate.aggregate.count / 12) * 100} 
          className="h-2"
        />
      </div>
    </CardContent>
  </Card>
)}
```

### 4. Action Buttons Based on Status
```tsx
// Different actions for different statuses
const evaluation = position.position_evaluations?.[0];

<div className="flex gap-2">
  {!evaluation ? (
    <Button>
      <TrendingUp className="h-4 w-4 mr-2" />
      Start Evaluation
    </Button>
  ) : evaluation.status === 'draft' ? (
    <>
      <Button>
        <Edit2 className="h-4 w-4 mr-2" />
        Continue Evaluation
      </Button>
      <Button variant="outline">
        <Eye className="h-4 w-4 mr-2" />
        Preview
      </Button>
    </>
  ) : (
    <>
      <Button variant="outline">
        <Eye className="h-4 w-4 mr-2" />
        View Evaluation
      </Button>
      <Button variant="outline">
        <FileText className="h-4 w-4 mr-2" />
        Export Report
      </Button>
    </>
  )}
</div>
```

### 5. Table Column with Evaluation Status
```tsx
// Add evaluation column to positions table
<table>
  <thead>
    <tr>
      <th>Code</th>
      <th>Title</th>
      <th>Department</th>
      <th>Evaluation Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {positions.map(position => {
      const evaluation = position.position_evaluations?.[0];
      
      return (
        <tr key={position.id}>
          <td>{position.pos_code}</td>
          <td>{position.title}</td>
          <td>{position.department?.name}</td>
          <td>
            {evaluation ? (
              <div className="flex flex-col gap-1">
                <Badge 
                  variant={evaluation.status === 'completed' ? 'default' : 'secondary'}
                  className="w-fit"
                >
                  {evaluation.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {evaluation.dimension_scores_aggregate.aggregate.count}/12 dimensions
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Not started</span>
            )}
          </td>
          <td>
            <Button size="sm" variant="ghost">
              <Edit2 className="h-4 w-4" />
            </Button>
          </td>
        </tr>
      );
    })}
  </tbody>
</table>
```

### 6. Filter Positions by Evaluation Status
```tsx
// Add filtering capabilities
const [statusFilter, setStatusFilter] = useState<'all' | 'evaluated' | 'draft' | 'not-started'>('all');

// Filter logic
const filteredPositions = useMemo(() => {
  return positions.filter(position => {
    const evaluation = position.position_evaluations?.[0];
    
    if (statusFilter === 'all') return true;
    if (statusFilter === 'evaluated') return evaluation?.status === 'completed';
    if (statusFilter === 'draft') return evaluation?.status === 'draft';
    if (statusFilter === 'not-started') return !evaluation;
    
    return true;
  });
}, [positions, statusFilter]);

// Filter UI
<div className="flex gap-2">
  <Button 
    variant={statusFilter === 'all' ? 'default' : 'outline'}
    onClick={() => setStatusFilter('all')}
  >
    All ({positions.length})
  </Button>
  <Button 
    variant={statusFilter === 'evaluated' ? 'default' : 'outline'}
    onClick={() => setStatusFilter('evaluated')}
  >
    Evaluated ({positions.filter(p => p.position_evaluations?.[0]?.status === 'completed').length})
  </Button>
  <Button 
    variant={statusFilter === 'draft' ? 'default' : 'outline'}
    onClick={() => setStatusFilter('draft')}
  >
    Draft ({positions.filter(p => p.position_evaluations?.[0]?.status === 'draft').length})
  </Button>
  <Button 
    variant={statusFilter === 'not-started' ? 'default' : 'outline'}
    onClick={() => setStatusFilter('not-started')}
  >
    Not Started ({positions.filter(p => !p.position_evaluations?.[0]).length})
  </Button>
</div>
```

### 7. Statistics Dashboard Card
```tsx
// Calculate evaluation statistics
const evaluationStats = useMemo(() => {
  const total = positions.length;
  const evaluated = positions.filter(
    p => p.position_evaluations?.[0]?.status === 'completed'
  ).length;
  const draft = positions.filter(
    p => p.position_evaluations?.[0]?.status === 'draft'
  ).length;
  const notStarted = total - evaluated - draft;
  
  return { total, evaluated, draft, notStarted };
}, [positions]);

// Display stats
<div className="grid grid-cols-4 gap-4">
  <Card>
    <CardContent className="pt-6">
      <div className="text-center">
        <div className="text-3xl font-bold">{evaluationStats.total}</div>
        <div className="text-sm text-muted-foreground">Total Positions</div>
      </div>
    </CardContent>
  </Card>
  
  <Card>
    <CardContent className="pt-6">
      <div className="text-center">
        <div className="text-3xl font-bold text-green-600">{evaluationStats.evaluated}</div>
        <div className="text-sm text-muted-foreground">Evaluated</div>
        <div className="text-xs text-muted-foreground mt-1">
          {((evaluationStats.evaluated / evaluationStats.total) * 100).toFixed(0)}%
        </div>
      </div>
    </CardContent>
  </Card>
  
  <Card>
    <CardContent className="pt-6">
      <div className="text-center">
        <div className="text-3xl font-bold text-yellow-600">{evaluationStats.draft}</div>
        <div className="text-sm text-muted-foreground">In Progress</div>
      </div>
    </CardContent>
  </Card>
  
  <Card>
    <CardContent className="pt-6">
      <div className="text-center">
        <div className="text-3xl font-bold text-gray-500">{evaluationStats.notStarted}</div>
        <div className="text-sm text-muted-foreground">Not Started</div>
      </div>
    </CardContent>
  </Card>
</div>
```

### 8. Evaluation Timeline/History
```tsx
// Note: Current implementation only fetches latest evaluation
// To show history, remove limit: 1 from the query

// Display evaluation history
{position.position_evaluations && position.position_evaluations.length > 0 && (
  <div className="space-y-2">
    <h4 className="text-sm font-medium">Evaluation History</h4>
    {position.position_evaluations.map((evaluation, index) => (
      <div key={evaluation.id} className="flex items-center justify-between p-2 border rounded">
        <div className="flex items-center gap-2">
          <Badge variant={index === 0 ? 'default' : 'outline'}>
            v{evaluation.version}
          </Badge>
          <span className="text-sm">
            {evaluation.status === 'completed' ? 'Completed' : 'Draft'}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(evaluation.created_at).toLocaleDateString()}
        </span>
      </div>
    ))}
  </div>
)}
```

## Helper Functions

### Get Evaluation Status Color
```typescript
function getEvaluationStatusColor(position: Position): string {
  const evaluation = position.position_evaluations?.[0];
  
  if (!evaluation) return 'gray';
  if (evaluation.status === 'completed') return 'green';
  if (evaluation.status === 'draft') return 'yellow';
  
  return 'gray';
}
```

### Get Evaluation Progress Percentage
```typescript
function getEvaluationProgress(position: Position, totalDimensions: number = 12): number {
  const evaluation = position.position_evaluations?.[0];
  if (!evaluation) return 0;
  
  const completed = evaluation.dimension_scores_aggregate.aggregate.count;
  return (completed / totalDimensions) * 100;
}
```

### Format Evaluation Status Text
```typescript
function formatEvaluationStatus(position: Position): string {
  const evaluation = position.position_evaluations?.[0];
  
  if (!evaluation) return 'Not started';
  if (evaluation.status === 'completed') return 'Evaluated';
  
  const count = evaluation.dimension_scores_aggregate.aggregate.count;
  return `In progress (${count}/12 dimensions)`;
}
```

## Icons to Use

- **Completed**: `<CheckCircle2 />` - Green
- **Draft/In Progress**: `<Clock />` or `<Edit2 />` - Yellow/Orange
- **Not Started**: `<AlertCircle />` or `<Circle />` - Gray
- **Evaluate Action**: `<TrendingUp />` or `<BarChart3 />`
- **View/Preview**: `<Eye />`

## Component Libraries Used

- **shadcn/ui**: Badge, Button, Card, Progress
- **lucide-react**: Icons (CheckCircle2, Clock, AlertCircle, Edit2, Eye, TrendingUp)

## Color Scheme

```css
/* Evaluation Status Colors */
.status-completed {
  color: rgb(22, 163, 74); /* green-600 */
}

.status-draft {
  color: rgb(234, 179, 8); /* yellow-600 */
}

.status-not-started {
  color: rgb(107, 114, 128); /* gray-500 */
}
```
