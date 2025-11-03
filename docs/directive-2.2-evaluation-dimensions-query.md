# Directive 2.2: Evaluation Dimensions Query - Complete

**Date:** November 2, 2025  
**Status:** ✅ Complete

## Overview

Successfully implemented the `GET_EVALUATION_DIMENSIONS` GraphQL query to fetch the complete evaluation structure including factors, dimensions, questions, and existing dimension scores. The data is fetched in parallel with evaluation details for optimal performance.

## Implementation Summary

### 1. TypeScript Interfaces

Added comprehensive type definitions for the evaluation structure:

```typescript
// Translation interfaces
interface QuestionTranslation {
  question_text: string;
}

interface DimensionTranslation {
  name: string;
  description: string;
}

interface FactorTranslation {
  name: string;
  description: string;
}

// Core entity interfaces
interface Question {
  id: string;
  level: number;
  order_index: number;
  question_translations: QuestionTranslation[];
}

interface Dimension {
  id: string;
  code: string;
  order_index: number;
  max_level: number;
  weight: number;
  dimension_translations: DimensionTranslation[];
  questions: Question[];
}

interface Factor {
  id: string;
  code: string;
  order_index: number;
  weight: number;
  factor_translations: FactorTranslation[];
  dimensions: Dimension[];
}

interface DimensionScore {
  dimension_id: string;
  resulting_level: number;
  raw_points: number;
  weighted_points: number;
  created_at: string;
}

interface GetEvaluationDimensionsResponse {
  factors: Factor[];
  dimension_scores: DimensionScore[];
}
```

### 2. GraphQL Query

Created comprehensive query with proper ordering and localization:

```graphql
query GetEvaluationDimensions($evaluationId: uuid!, $locale: String!) {
  factors(order_by: { order_index: asc }) {
    id
    code
    order_index
    weight
    factor_translations(where: { language: { _eq: $locale } }) {
      name
      description
    }
    dimensions(order_by: { order_index: asc }) {
      id
      code
      order_index
      max_level
      weight
      dimension_translations(where: { language: { _eq: $locale } }) {
        name
        description
      }
      questions(order_by: { order_index: asc }) {
        id
        level
        order_index
        question_translations(where: { language: { _eq: $locale } }) {
          question_text
        }
      }
    }
  }
  dimension_scores(where: { evaluation_id: { _eq: $evaluationId } }) {
    dimension_id
    resulting_level
    raw_points
    weighted_points
    created_at
  }
}
```

**Query Features:**
- ✅ Ordered by `order_index` at all levels (factors, dimensions, questions)
- ✅ Locale-aware translations
- ✅ Fetches complete hierarchy (factor → dimension → question)
- ✅ Includes existing dimension scores for the evaluation
- ✅ All necessary metadata (weights, max levels, codes)

### 3. State Management

Added state variables for dimensions data:

```typescript
const [factors, setFactors] = useState<Factor[]>([]);
const [dimensionScores, setDimensionScores] = useState<DimensionScore[]>([]);
```

### 4. Parallel Data Fetching

Optimized data fetching with `Promise.all()`:

```typescript
const [evaluationData, dimensionsData] = await Promise.all([
  executeQuery<GetEvaluationResponse>(
    GET_EVALUATION_DETAILS,
    { evaluationId }
  ),
  executeQuery<GetEvaluationDimensionsResponse>(
    GET_EVALUATION_DIMENSIONS,
    { evaluationId, locale }
  ),
]);
```

**Benefits:**
- Reduced total loading time
- Single loading state for better UX
- More efficient network usage

### 5. UI Display Component

Added comprehensive display of evaluation structure:

```
┌─────────────────────────────────────────────┐
│ Evaluation Dimensions Card                  │
├─────────────────────────────────────────────┤
│ Factor 1                     Weight: XX%    │
│ └─ Description                              │
│    ├─ Dimension 1.1                         │
│    │  └─ Max Level: X | Weight: Y%          │
│    │     Score: Z (if exists)                │
│    │     N question(s)                       │
│    └─ Dimension 1.2                         │
│       └─ Max Level: X | Weight: Y%          │
│          N question(s)                       │
├─────────────────────────────────────────────┤
│ Factor 2                     Weight: XX%    │
│ └─ ...                                      │
└─────────────────────────────────────────────┘
```

**Display Features:**
- ✅ Hierarchical structure (Factor → Dimension)
- ✅ Factor name, description, and weight
- ✅ Dimension name, description, max level, and weight
- ✅ Existing scores highlighted with badge
- ✅ Question count per dimension
- ✅ Visual hierarchy with borders and indentation
- ✅ Empty state when no factors configured

## Key Features

### Type Safety
- All responses properly typed with TypeScript interfaces
- Null safety for optional fields
- Type-safe array access with proper checks

### Localization
- Query accepts `locale` parameter
- Fetches translations based on current locale
- Fallback to code if translation missing

### Performance
- Parallel queries reduce load time
- Single loading state
- Efficient data structure

### User Experience
- Clear visual hierarchy
- Color-coded badges for different data types
- Shows existing scores when available
- Empty state handling

## Data Flow

1. **Component Mount**
   - `useEffect` triggers on `evaluationId` or `locale` change
   - Calls `fetchEvaluationData()`

2. **Data Fetching**
   - Two queries execute in parallel
   - Results stored in separate state variables
   - Error handling for both queries

3. **Data Display**
   - Factors mapped with nested dimensions
   - Scores matched to dimensions by ID
   - Translations displayed based on locale

4. **Score Integration**
   - Dimension scores fetched separately
   - Matched to dimensions by `dimension_id`
   - Displayed as badges when present

## Testing Checklist

- [ ] Verify factors load in correct order (order_index)
- [ ] Verify dimensions load in correct order
- [ ] Verify translations display for current locale
- [ ] Test with English locale (en)
- [ ] Test with Turkish locale (tr)
- [ ] Verify weights display correctly
- [ ] Verify max levels display correctly
- [ ] Test with existing dimension scores
- [ ] Test without existing dimension scores
- [ ] Verify question counts are accurate
- [ ] Test empty state (no factors configured)
- [ ] Verify loading state
- [ ] Verify error handling

## Next Steps (Phase 2.3)

1. Implement interactive evaluation form/wizard
2. Add question display and answer selection
3. Implement score calculation logic
4. Add save/submit functionality
5. Add validation for required questions

## Files Modified

1. `app/[locale]/dashboard/[orgId]/evaluation/[evaluationId]/client.tsx`
   - Added TypeScript interfaces for dimensions structure
   - Added `GET_EVALUATION_DIMENSIONS` query
   - Added state management for factors and scores
   - Updated data fetching to use parallel queries
   - Added dimensions display UI

## Technical Notes

- Query is optimized with proper ordering at all levels
- Translations are filtered server-side for better performance
- Scores are matched client-side for flexibility
- Component properly re-fetches when locale changes
- Visual hierarchy makes structure easy to understand

## Dependencies

- `@/lib/nhost/graphql/client` - executeQuery function
- `@/components/ui/badge` - Badge component for metadata
- `@/components/ui/card` - Card components for layout
- React hooks - useState, useEffect

---

**Status:** ✅ Ready for Phase 2.3 (Interactive Evaluation Form)
