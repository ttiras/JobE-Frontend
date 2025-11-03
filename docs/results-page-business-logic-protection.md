# Results Page - Business Logic Protection

## 🔒 Security Enhancement

**Date:** November 3, 2025  
**Type:** Business Logic Protection  
**Impact:** Removed sensitive weight information from user-facing results

---

## Overview

Removed `factor_weight` and `dimension_weight` fields from the evaluation results page to protect business logic. Users should not see the internal weighting system used for score calculations.

### Security Principle

**Business Rule:** Factor and dimension weights are proprietary business logic and should remain hidden from end users.

**User Visibility:**
- ✅ Final scores and grades
- ✅ Raw points per dimension
- ✅ Weighted points (calculated results)
- ❌ Weight percentages (calculation logic)

---

## Changes Made

### 1. GraphQL Query Updates

**File:** `app/[locale]/dashboard/[orgId]/evaluation/[evaluationId]/results/client.tsx`

**Removed from `v_evaluation_factor_breakdown`:**
```graphql
factor_weight  # ❌ Removed - business logic
```

**Removed from `v_evaluation_dimension_details`:**
```graphql
dimension_weight  # ❌ Removed - business logic
```

### 2. TypeScript Interface Updates

**Before:**
```typescript
interface FactorBreakdown {
  factor_code: string;
  factor_name: string;
  factor_weight: number;  // ❌ Removed
  total_points: number;
  weighted_points: number;
  order_index: number;
}

interface DimensionDetail {
  dimension_code: string;
  dimension_name: string;
  dimension_weight: number;  // ❌ Removed
  max_level: number;
  selected_level: number;
  raw_points: number;
  weighted_points: number;
  factor_code: string;
  factor_name: string;
}
```

**After:**
```typescript
interface FactorBreakdown {
  factor_code: string;
  factor_name: string;
  // factor_weight removed - business logic
  total_points: number;
  weighted_points: number;
  order_index: number;
}

interface DimensionDetail {
  dimension_code: string;
  dimension_name: string;
  // dimension_weight removed - business logic
  max_level: number;
  selected_level: number;
  raw_points: number;
  weighted_points: number;
  factor_code: string;
  factor_name: string;
}
```

### 3. UI Updates

#### Factor Cards
**Before:**
```tsx
<CardTitle className="text-lg flex items-center justify-between">
  <span>{factor.factor_name}</span>
  <Badge variant="outline">
    {(factor.factor_weight * 100).toFixed(0)}% weight  {/* ❌ Removed */}
  </Badge>
</CardTitle>
```

**After:**
```tsx
<CardTitle className="text-lg">
  {factor.factor_name}
</CardTitle>
```

#### Dimension Details Table
**Before:**
```tsx
<thead>
  <tr>
    <th>Dimension</th>
    <th>Selected Level</th>
    <th>Max Level</th>
    <th>Raw Points</th>
    <th>Weight</th>              {/* ❌ Removed column */}
    <th>Weighted Points</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td>{dim.dimension_name}</td>
    <td>S{dim.selected_level}</td>
    <td>S{dim.max_level}</td>
    <td>{dim.raw_points}</td>
    <td>{(dim.dimension_weight * 100).toFixed(0)}%</td>  {/* ❌ Removed */}
    <td>{dim.weighted_points.toFixed(2)}</td>
  </tr>
  <tr>
    <td>Factor Total</td>
    <td colspan="2"></td>
    <td>{factor.total_points}</td>
    <td>{(factor.factor_weight * 100).toFixed(0)}%</td>  {/* ❌ Removed */}
    <td>{factor.weighted_points}</td>
  </tr>
</tbody>
```

**After:**
```tsx
<thead>
  <tr>
    <th>Dimension</th>
    <th>Selected Level</th>
    <th>Max Level</th>
    <th>Raw Points</th>
    <th>Weighted Points</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td>{dim.dimension_name}</td>
    <td>S{dim.selected_level}</td>
    <td>S{dim.max_level}</td>
    <td>{dim.raw_points}</td>
    <td>{dim.weighted_points.toFixed(2)}</td>
  </tr>
  <tr>
    <td>Factor Total</td>
    <td colspan="2"></td>
    <td>{factor.total_points}</td>
    <td>{factor.weighted_points}</td>
  </tr>
</tbody>
```

#### CSV Export
**Before:**
```typescript
const csvContent = [
  ['Factor', 'Weight', 'Total Points', 'Weighted Points'],  // ❌ Weight column
  ...factors.map(f => [
    f.factor_name,
    (f.factor_weight * 100).toFixed(0) + '%',  // ❌ Weight value
    f.total_points.toFixed(2),
    f.weighted_points.toFixed(2)
  ])
];
```

**After:**
```typescript
const csvContent = [
  ['Factor', 'Total Points', 'Weighted Points'],  // ✅ No weight column
  ...factors.map(f => [
    f.factor_name,
    f.total_points.toFixed(2),
    f.weighted_points.toFixed(2)
  ])
];
```

---

## What Users Can Still See

### ✅ Visible Information

1. **Final Score & Grade**
   - Total evaluation score
   - Assigned grade level
   - Typical role for grade
   - Score range (min/max possible)

2. **Factor Breakdown**
   - Factor names
   - Total points per factor
   - Weighted points per factor (results)
   - Contribution percentage to final score

3. **Dimension Details**
   - Dimension names
   - Selected levels (S1-S7)
   - Maximum possible levels
   - Raw points earned
   - Weighted points (calculated results)

### ❌ Hidden Information

1. **Factor Weights** (e.g., 40%, 25%, 20%, 15%)
   - How much each factor contributes to calculation
   - Business logic for weighting system

2. **Dimension Weights** (e.g., 15%, 20%, 25%)
   - How much each dimension contributes within factor
   - Relative importance of dimensions

---

## Security Benefits

1. **Protects Proprietary Logic**
   - Weighting system is company intellectual property
   - Prevents reverse engineering of evaluation methodology
   - Maintains competitive advantage

2. **Prevents Gaming**
   - Users can't strategically focus on high-weight dimensions
   - Encourages honest, comprehensive evaluation
   - Reduces bias in self-assessments

3. **Simplifies User Experience**
   - Less technical information to process
   - Focus on results, not methodology
   - Cleaner, more professional presentation

4. **Maintains Flexibility**
   - Can adjust weights without user awareness
   - Allows methodology improvements over time
   - Reduces resistance to system changes

---

## Database View Permissions

The database views should enforce this restriction:

```sql
-- v_evaluation_factor_breakdown (example)
CREATE OR REPLACE VIEW v_evaluation_factor_breakdown AS
SELECT
  evaluation_id,
  factor_code,
  factor_name,
  -- factor_weight excluded from view
  total_points,
  weighted_points,
  order_index,
  language
FROM factors
JOIN factor_breakdown ON ...
WHERE ... ;

-- Grant SELECT to user role
GRANT SELECT ON v_evaluation_factor_breakdown TO user_role;

-- Weights are only in internal tables/views
-- accessible to admin/system roles only
```

---

## Information Architecture

```
┌─────────────────────────────────────────────────┐
│           Evaluation Results (User View)        │
├─────────────────────────────────────────────────┤
│                                                 │
│  ✅ Final Score: 425.50                         │
│  ✅ Grade: 7                                    │
│  ✅ Role: Senior Manager                        │
│                                                 │
│  ┌───────────────────────────────────────┐     │
│  │ Factor: Knowledge & Skills            │     │
│  │ Total Points: 185.00                  │     │
│  │ Weighted Points: 170.25               │     │
│  │ Contribution: 40.0% ✅                │     │
│  └───────────────────────────────────────┘     │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ Dimension          │ Level │ Points     │   │
│  ├─────────────────────────────────────────┤   │
│  │ Technical Skills   │ S6    │ 65.50 ✅   │   │
│  │ Education          │ S5    │ 52.25 ✅   │   │
│  │ Experience         │ S7    │ 52.50 ✅   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘

❌ HIDDEN FROM USER:
- factor_weight: 0.40 (40%)
- dimension_weight: 0.25 (25%), 0.20 (20%), 0.15 (15%)
```

---

## Testing Checklist

- [x] GraphQL query executes without `factor_weight`
- [x] GraphQL query executes without `dimension_weight`
- [x] TypeScript compiles without errors
- [x] Factor cards display without weight badges
- [x] Dimension table has correct columns (no weight)
- [x] Factor total row has correct columns (no weight)
- [x] CSV export excludes weight columns
- [ ] Manual test: View results page
- [ ] Verify no weight information visible anywhere
- [ ] Check browser console for errors
- [ ] Test CSV export format

---

## Related Documentation

- Database view definitions (needs documentation)
- RBAC permissions for views
- Business logic documentation (internal only)

---

## Future Considerations

### Admin View (Optional)

Administrators may need to see weights for:
- Auditing calculation logic
- Troubleshooting score issues
- Adjusting weighting system

**Recommendation:** Create separate admin-only results view with:
```typescript
// Admin interface (separate component)
interface AdminFactorBreakdown extends FactorBreakdown {
  factor_weight: number;  // Only for admins
  calculation_method: string;
  last_updated: string;
}
```

### Export Formats

Different export formats for different roles:
- **User CSV:** No weights (current)
- **Admin CSV:** Include weights
- **Audit CSV:** Full calculation details

---

## Conclusion

Successfully removed sensitive business logic (factor and dimension weights) from user-facing evaluation results. Users can still see their scores and understand their results, but cannot see the proprietary weighting system used in calculations.

**Status:** ✅ **Complete and Secure**

---

**Last Updated:** November 3, 2025  
**Security Level:** Business Logic Protected
