# Position Evaluation Status Integration

## Overview
Extended the `GET_POSITIONS` GraphQL query and `Position` interface to include evaluation data, enabling the UI to display evaluation status, progress, and completion information.

## Implementation Date
November 2, 2025

## Changes Made

### 1. GraphQL Query Extension
**File:** `app/[locale]/dashboard/[orgId]/org-structure/positions/positions-page-client.tsx`

#### Added Fields to GET_POSITIONS Query:
```graphql
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
```

#### Query Features:
- **Latest Evaluation Only**: Uses `order_by: { created_at: desc }, limit: 1` to fetch only the most recent evaluation
- **Status Tracking**: Includes `status` field (draft/completed)
- **Completion Metadata**: Captures `completed_at`, `evaluated_at`, and `evaluated_by`
- **Progress Tracking**: Uses `dimension_scores_aggregate` to count completed dimensions

### 2. TypeScript Interface Update
**File:** `app/[locale]/dashboard/[orgId]/org-structure/positions/positions-page-client.tsx`

#### Extended Position Interface:
```typescript
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
```

#### Interface Features:
- **Optional Field**: `position_evaluations` is optional (may not exist for all positions)
- **Type Safety**: Uses TypeScript union type for status: `'draft' | 'completed'`
- **Nullable Fields**: Properly handles `completed_at`, `evaluated_at`, and `evaluated_by` as nullable
- **Nested Aggregates**: Includes aggregate count structure for dimension scores

## Data Structure

### Evaluation Status Values
- `draft`: Evaluation in progress
- `completed`: Evaluation finished

### Progress Calculation
The `dimension_scores_aggregate.aggregate.count` field can be used to show progress:
```typescript
const evaluation = position.position_evaluations?.[0];
const completedDimensions = evaluation?.dimension_scores_aggregate.aggregate.count ?? 0;
const progressText = `${completedDimensions}/12 dimensions`; // Assuming 12 total
```

### Latest Evaluation Access
```typescript
const latestEvaluation = position.position_evaluations?.[0];
const evaluationStatus = latestEvaluation?.status; // 'draft' | 'completed' | undefined
const evaluationId = latestEvaluation?.id;
const completedAt = latestEvaluation?.completed_at;
```

## Usage Examples

### Check if Position is Evaluated
```typescript
const isEvaluated = position.position_evaluations?.[0]?.status === 'completed';
```

### Display Evaluation Progress
```typescript
const evaluation = position.position_evaluations?.[0];
if (evaluation) {
  const dimensionCount = evaluation.dimension_scores_aggregate.aggregate.count;
  const status = evaluation.status;
  const progress = `${dimensionCount} dimensions ${status === 'completed' ? 'completed' : 'in progress'}`;
}
```

### Get Completion Date
```typescript
const completedAt = position.position_evaluations?.[0]?.completed_at;
if (completedAt) {
  const formattedDate = new Date(completedAt).toLocaleDateString();
}
```

## Database Schema Reference

### position_evaluations Table
- `id` (uuid): Evaluation ID
- `status` (text): 'draft' or 'completed'
- `completed_at` (timestamptz): Completion timestamp
- `evaluated_at` (timestamptz): Evaluation timestamp
- `evaluated_by` (uuid): User who performed evaluation
- `created_at` (timestamptz): Creation timestamp
- `version` (integer): Evaluation version

### dimension_scores Table
- Linked to evaluations via `evaluation_id`
- Count used to track progress (e.g., "8/12 dimensions completed")

## Benefits

1. **Real-time Status**: Positions now include their current evaluation status
2. **Progress Tracking**: Dimension count enables progress indicators
3. **Completion Metadata**: Tracks who evaluated and when
4. **Version Control**: Evaluation version tracking for audit trails
5. **Type Safety**: Full TypeScript support prevents runtime errors
6. **Performance**: Fetches only latest evaluation per position

## Future Enhancements

### Potential UI Additions:
1. **Evaluation Badge**: Show draft/completed status in position list
2. **Progress Bar**: Visual indicator of dimension completion (e.g., "8/12")
3. **Last Evaluated**: Display completion date/time
4. **Evaluator**: Show who performed the evaluation
5. **Quick Actions**: 
   - "Continue Evaluation" for draft status
   - "View Evaluation" for completed status

### Example UI Component:
```tsx
{position.position_evaluations?.[0] && (
  <div className="flex items-center gap-2">
    {position.position_evaluations[0].status === 'completed' ? (
      <Badge variant="success">Evaluated</Badge>
    ) : (
      <Badge variant="warning">
        Draft ({position.position_evaluations[0].dimension_scores_aggregate.aggregate.count}/12)
      </Badge>
    )}
  </div>
)}
```

## Testing

### Verification Steps:
1. ✅ TypeScript compilation passes with no errors
2. ✅ GraphQL query syntax validated
3. ✅ Interface properly typed with optional evaluation data
4. ✅ Backward compatible with positions without evaluations

### Query Test:
```graphql
query GetPositions($orgId: uuid!) {
  positions(
    where: { organization_id: { _eq: $orgId } }
    order_by: { pos_code: asc }
  ) {
    id
    pos_code
    title
    position_evaluations(order_by: { created_at: desc }, limit: 1) {
      id
      status
      completed_at
      dimension_scores_aggregate {
        aggregate {
          count
        }
      }
    }
  }
}
```

## Related Files
- `app/[locale]/dashboard/[orgId]/org-structure/positions/positions-page-client.tsx` - Main implementation
- `lib/nhost/graphql/mutations.ts` - Contains `CREATE_POSITION_EVALUATION` mutation
- `components/organizations/positions-content.tsx` - Alternative positions display component

## Notes
- The query fetches only the **latest** evaluation per position using `order_by` and `limit`
- All evaluation fields are optional to handle positions without evaluations
- The `dimension_scores_aggregate` provides a count for progress tracking
- The `factor_scores` field from the user's query was not included but can be added similarly if needed
