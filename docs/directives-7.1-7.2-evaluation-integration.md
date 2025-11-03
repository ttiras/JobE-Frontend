# Directives 7.1 & 7.2: Evaluation Component Integration - Complete

**Date:** November 2, 2025  
**Status:** ✅ Complete

## Overview

Successfully integrated all evaluation components (EvaluationHeader, FactorStepper, DimensionSidebar) into the EvaluationPageClient with EvaluationContext provider, helper functions, and navigation handlers.

## Implementation Summary

### Architecture Changes

**1. Two-Component Pattern:**
- **EvaluationPageClient** - Outer component for data fetching
- **EvaluationContent** - Inner component using EvaluationContext

**2. Context Provider Integration:**
- Wrapped content with `EvaluationProvider`
- Passes fetched data as `initialData`
- Enables context hooks in child components

**3. Helper Functions:**
- `getAllDimensionIds()` - Extract all dimension IDs
- `getFactorSteps()` - Transform factors for FactorStepper
- `getFactorGroups()` - Transform factors for DimensionSidebar

**4. Navigation Handlers:**
- `handleExit()` - Exit with unsaved changes warning
- `handleFactorClick()` - Jump to factor's first dimension
- `handleDimensionClick()` - Navigate to specific dimension

## Component Structure

### EvaluationPageClient (Outer)

**Responsibilities:**
- Fetch evaluation data from GraphQL
- Handle loading and error states
- Prepare data for context
- Render EvaluationProvider

**Key Code:**
```typescript
export function EvaluationPageClient({
  locale,
  orgId,
  evaluationId,
}: EvaluationPageClientProps) {
  // ... data fetching logic
  
  const evaluationData = {
    evaluation,
    factors,
    dimensionScores,
  };

  return (
    <EvaluationProvider initialData={evaluationData}>
      <EvaluationContent 
        locale={locale} 
        orgId={orgId} 
        evaluationId={evaluationId} 
      />
    </EvaluationProvider>
  );
}
```

### EvaluationContent (Inner)

**Responsibilities:**
- Access evaluation context
- Transform data for components
- Handle navigation events
- Render UI components

**Key Code:**
```typescript
function EvaluationContent({
  locale,
  orgId,
  evaluationId,
}: {
  locale: string;
  orgId: string;
  evaluationId: string;
}) {
  const {
    evaluationData,
    currentFactorIndex,
    currentDimensionIndex,
    progress,
    setCurrentDimension,
    answers,
    getCurrentDimension,
  } = useEvaluation();

  // ... helper functions and handlers
  
  return (
    <div className="min-h-screen bg-background">
      <EvaluationHeader {...headerProps} />
      <div className="container mx-auto px-4 py-6">
        <FactorStepper {...stepperProps} />
        <div className="mt-8 flex gap-6">
          <DimensionSidebar {...sidebarProps} />
          <div className="flex-1 lg:ml-[280px]">
            {/* Question card placeholder */}
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Helper Functions

### 1. getAllDimensionIds()

**Purpose:** Extract all dimension IDs for unsaved check

**Implementation:**
```typescript
const getAllDimensionIds = (): string[] => {
  const dimensionIds: string[] = [];
  for (const factor of evaluationData.factors) {
    for (const dimension of factor.dimensions) {
      dimensionIds.push(dimension.id);
    }
  }
  return dimensionIds;
};
```

**Usage:**
- Used in `handleExit()` to check for unsaved changes
- Passed to `getUnsavedAnswers()` from localStorage

### 2. getFactorSteps()

**Purpose:** Transform Factor[] to FactorStep[] for FactorStepper

**Implementation:**
```typescript
const getFactorSteps = () => {
  return evaluationData.factors.map((factor) => {
    const dimensionCount = factor.dimensions.length;
    const completedDimensions = factor.dimensions.filter((dim) =>
      answers.has(dim.id)
    ).length;

    return {
      id: factor.id,
      name: factor.factor_translations[0]?.name || factor.code,
      code: factor.code,
      orderIndex: factor.order_index,
      dimensionCount,
      completedDimensions,
    };
  });
};
```

**Transformation:**
```
Factor (GraphQL)          → FactorStep (Component)
├─ id                     → id
├─ code                   → code
├─ order_index            → orderIndex
├─ factor_translations    → name (first translation)
├─ dimensions[]           → dimensionCount (count)
└─ (calculated)           → completedDimensions (filtered by answers)
```

**Features:**
- Calculates progress per factor
- Uses first translation for name
- Falls back to code if no translation
- Counts completed dimensions from answers Map

### 3. getFactorGroups()

**Purpose:** Transform Factor[] to FactorGroup[] for DimensionSidebar

**Implementation:**
```typescript
const getFactorGroups = () => {
  return evaluationData.factors.map((factor) => ({
    id: factor.id,
    name: factor.factor_translations[0]?.name || factor.code,
    code: factor.code,
    orderIndex: factor.order_index,
    dimensions: factor.dimensions.map((dim) => {
      const answer = answers.get(dim.id);
      return {
        id: dim.id,
        name: dim.dimension_translations[0]?.name || dim.code,
        code: dim.code,
        orderIndex: dim.order_index,
        completed: !!answer,
        selectedLevel: answer?.level || null,
      };
    }),
  }));
};
```

**Transformation:**
```
Factor + Dimension (GraphQL)  → FactorGroup + DimensionItem
├─ factor.id                  → id
├─ factor.code                → code
├─ factor.order_index         → orderIndex
├─ factor.factor_translations → name
└─ factor.dimensions[]        → dimensions[]
    ├─ dimension.id           → id
    ├─ dimension.code         → code
    ├─ dimension.order_index  → orderIndex
    ├─ dimension_translations → name
    ├─ (from answers Map)     → completed (boolean)
    └─ (from answers Map)     → selectedLevel (number | null)
```

**Features:**
- Nested transformation (factors + dimensions)
- Checks answers Map for completion status
- Extracts selected level from answers
- Falls back to code for names

## Navigation Handlers

### 1. handleExit()

**Purpose:** Navigate back with unsaved changes warning

**Implementation:**
```typescript
const handleExit = () => {
  const allDimensionIds = getAllDimensionIds();
  const unsavedAnswers = getUnsavedAnswers(evaluationId, allDimensionIds);
  const unsavedCount = unsavedAnswers.length;

  if (unsavedCount > 0) {
    if (
      confirm(
        `You have ${unsavedCount} unsaved change${unsavedCount > 1 ? 's' : ''}. Are you sure you want to exit?`
      )
    ) {
      router.push(`/${locale}/dashboard/${orgId}/org-structure/positions`);
    }
  } else {
    router.push(`/${locale}/dashboard/${orgId}/org-structure/positions`);
  }
};
```

**Features:**
- Checks localStorage for unsaved answers
- Shows confirmation dialog if unsaved changes exist
- Uses plural/singular correctly ("1 change" vs "2 changes")
- Navigates to positions list on confirm or if no changes
- Connected to EvaluationHeader's onExit prop

**User Experience:**
```
No unsaved changes:
  Click Exit → Navigate immediately

1 unsaved change:
  Click Exit → "You have 1 unsaved change. Are you sure?"
  ├─ OK → Navigate
  └─ Cancel → Stay

3 unsaved changes:
  Click Exit → "You have 3 unsaved changes. Are you sure?"
  ├─ OK → Navigate
  └─ Cancel → Stay
```

### 2. handleFactorClick()

**Purpose:** Jump to a factor when clicked in stepper

**Implementation:**
```typescript
const handleFactorClick = (factorIndex: number) => {
  // Jump to first dimension of this factor
  setCurrentDimension(factorIndex, 0);
};
```

**Features:**
- Accepts factor index from FactorStepper
- Always navigates to first dimension (index 0)
- Uses context's setCurrentDimension()
- Simple and predictable behavior

**User Experience:**
```
User clicks "Factor 2" in stepper
  → Navigate to Factor 2, Dimension 1
  → FactorStepper highlights Factor 2
  → DimensionSidebar expands Factor 2
  → Question card shows Dimension 1
```

### 3. handleDimensionClick()

**Purpose:** Navigate to a specific dimension when clicked in sidebar

**Implementation:**
```typescript
const handleDimensionClick = (dimensionId: string) => {
  // Find the factor and dimension indices
  for (let factorIndex = 0; factorIndex < evaluationData.factors.length; factorIndex++) {
    const factor = evaluationData.factors[factorIndex];
    const dimensionIndex = factor.dimensions.findIndex((d) => d.id === dimensionId);

    if (dimensionIndex !== -1) {
      setCurrentDimension(factorIndex, dimensionIndex);
      break;
    }
  }
};
```

**Features:**
- Accepts dimension ID from DimensionSidebar
- Searches through factors to find matching dimension
- Calculates both factor and dimension indices
- Uses context's setCurrentDimension()
- Breaks loop after finding match

**Algorithm:**
```
Input: dimensionId = "dim-5"

Step 1: Loop through factors
  Factor 0: dimensions = [dim-1, dim-2, dim-3]
    findIndex("dim-5") → -1 (not found)
  
  Factor 1: dimensions = [dim-4, dim-5, dim-6]
    findIndex("dim-5") → 1 (found!)
    
Step 2: Call setCurrentDimension(1, 1)
  → Navigate to Factor 1, Dimension 1 (dim-5)
  
Step 3: Break loop
```

**User Experience:**
```
User clicks "Technical Knowledge" in sidebar
  → Find dimension in factors array
  → Calculate factorIndex = 0, dimensionIndex = 2
  → Navigate to that dimension
  → FactorStepper highlights Factor 1
  → DimensionSidebar highlights dimension
  → Question card loads dimension questions
  → Mobile sheet auto-closes (handled in DimensionSidebar)
```

## Layout Structure

### Desktop Layout (≥1024px)

```
┌─────────────────────────────────────────────────────────┐
│ EvaluationHeader (sticky)                               │
│ Position Title | Progress: 5/12 | [Exit]                │
├─────────────────────────────────────────────────────────┤
│ FactorStepper (horizontal)                              │
│ [✓ Factor 1] → [→ Factor 2] → [○ Factor 3]            │
├──────────────┬──────────────────────────────────────────┤
│ Dimension    │ Question Card                            │
│ Sidebar      │                                          │
│ (fixed)      │ Current: Factor 2, Dimension 1           │
│              │                                          │
│ ▼ Factor 1   │ [Dimension content and questions]        │
│   ✓ Dim 1    │                                          │
│   ✓ Dim 2    │                                          │
│              │                                          │
│ ▼ Factor 2   │                                          │
│   → Dim 1    │                                          │
│   ○ Dim 2    │                                          │
│              │                                          │
│ ▶ Factor 3   │                                          │
│              │                                          │
│ 280px        │ flex-1 (ml-[280px])                      │
└──────────────┴──────────────────────────────────────────┘
```

### Mobile Layout (<1024px)

```
┌─────────────────────────────────────────┐
│ EvaluationHeader                        │
│ Position Title | Progress | [Exit]      │
├─────────────────────────────────────────┤
│ FactorStepper (vertical)                │
│ [✓] Factor 1                            │
│ [→] Factor 2 (current)                  │
│ [○] Factor 3                            │
├─────────────────────────────────────────┤
│ Question Card                           │
│                                         │
│ Current: Factor 2, Dimension 1          │
│                                         │
│ [Dimension content and questions]       │
│                                         │
│                                         │
│                                         │
│                                  [Menu] │
│                             5/12 comp   │
└─────────────────────────────────────────┘

[Menu button pressed]

┌─────────────────────────────────────────┐
│ Evaluation Dimensions              [X]  │
│ 5 of 12 completed                       │
├─────────────────────────────────────────┤
│ ▼ Factor 1                        2/3   │
│   ✓ Technical Knowledge           L3    │
│   ✓ Domain Expertise              L2    │
│   ○ Problem Solving                     │
│                                         │
│ ▼ Factor 2                        1/4   │
│   → Communication (current)             │
│   ○ Teamwork                            │
│   ○ Leadership                          │
│   ○ Presentation                        │
└─────────────────────────────────────────┘
```

## Data Flow

### 1. Initialization Flow

```
EvaluationPageClient
  ├─ Fetch GraphQL data
  │   ├─ GET_EVALUATION_DETAILS
  │   └─ GET_EVALUATION_DIMENSIONS
  ├─ Prepare evaluationData object
  └─ Render EvaluationProvider
      └─ EvaluationContent
          ├─ useEvaluation() hook
          ├─ Load answers from localStorage
          ├─ Calculate progress
          └─ Render UI components
```

### 2. Navigation Flow

```
User clicks dimension in sidebar
  → handleDimensionClick(dimensionId)
      ├─ Find factor and dimension indices
      └─ setCurrentDimension(factorIdx, dimIdx)
          └─ EvaluationContext updates
              ├─ currentFactorIndex = factorIdx
              ├─ currentDimensionIndex = dimIdx
              └─ Trigger re-render
                  ├─ FactorStepper highlights new factor
                  ├─ DimensionSidebar highlights dimension
                  └─ Question card loads new dimension
```

### 3. Answer Flow (Future)

```
User selects level in question card
  → saveCurrentAnswer(level)
      ├─ Save to localStorage
      ├─ Update answers Map
      ├─ Update progress
      └─ Trigger re-render
          ├─ FactorStepper updates completion count
          ├─ DimensionSidebar shows checkmark + level
          └─ Header updates progress bar
```

### 4. Exit Flow

```
User clicks Exit button
  → handleExit()
      ├─ getAllDimensionIds()
      ├─ getUnsavedAnswers(evaluationId, dimensionIds)
      ├─ Check unsavedCount
      ├─ Show confirmation if > 0
      └─ Navigate on confirm or if 0
```

## Type Safety

### Interface Transformations

**Factor → FactorStep:**
```typescript
interface Factor {
  id: string;
  code: string;
  order_index: number;
  weight: number;
  factor_translations: FactorTranslation[];
  dimensions: Dimension[];
}

interface FactorStep {
  id: string;
  name: string;
  code: string;
  orderIndex: number;
  dimensionCount: number;
  completedDimensions: number;
}
```

**Factor → FactorGroup + DimensionItem:**
```typescript
interface FactorGroup {
  id: string;
  name: string;
  code: string;
  orderIndex: number;
  dimensions: DimensionItem[];
}

interface DimensionItem {
  id: string;
  name: string;
  code: string;
  orderIndex: number;
  completed: boolean;
  selectedLevel: number | null;
}
```

### Type Imports

```typescript
import type { DimensionAnswer } from '@/lib/types/evaluation';
```

All types are properly imported and typed throughout.

## GraphQL Updates

### Updated Query

Added `evaluation_id` to dimension_scores:

```graphql
dimension_scores(where: { evaluation_id: { _eq: $evaluationId } }) {
  dimension_id
  evaluation_id  # ← Added this field
  resulting_level
  raw_points
  weighted_points
  created_at
}
```

### Updated Interface

```typescript
interface DimensionScore {
  dimension_id: string;
  evaluation_id: string;  // ← Added this field
  resulting_level: number;
  raw_points: number;
  weighted_points: number;
  created_at: string;
}
```

This matches the EvaluationData type in lib/types/evaluation.ts.

## Placeholder Content

### Current Question Card

```typescript
<Card>
  <CardContent className="pt-6 space-y-4">
    <div className="text-center">
      <p className="text-lg font-medium text-muted-foreground">
        Question card will appear here
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        Current: Factor {currentFactorIndex + 1}, Dimension{' '}
        {currentDimensionIndex + 1}
      </p>
    </div>

    {currentDimension && (
      <div className="mt-6 p-4 border rounded-lg bg-muted/50">
        <h3 className="font-semibold mb-2">Current Dimension:</h3>
        <p className="text-sm">
          <span className="font-medium">Name:</span>{' '}
          {currentDimension.dimension_translations[0]?.name || currentDimension.code}
        </p>
        <p className="text-sm">
          <span className="font-medium">Code:</span> {currentDimension.code}
        </p>
        <p className="text-sm">
          <span className="font-medium">Max Level:</span> {currentDimension.max_level}
        </p>
        <p className="text-sm">
          <span className="font-medium">Questions:</span>{' '}
          {currentDimension.questions.length}
        </p>
      </div>
    )}
  </CardContent>
</Card>
```

**Shows:**
- Current factor and dimension indices
- Current dimension details
- Name, code, max level, question count

**To be replaced with:**
- DimensionQuestionCard component
- Question list with level selection
- Save/Next/Previous buttons
- Auto-save functionality

## Responsive Behavior

### Desktop (≥1024px)
- Fixed sidebar on left (280px width)
- Content area with left margin (ml-[280px])
- Horizontal factor stepper
- Sticky header at top

### Mobile (<1024px)
- No fixed sidebar
- Floating menu button (bottom-right)
- Sheet drawer for dimensions
- Vertical factor stepper
- Sticky header at top
- Full-width content area

### Breakpoint

```css
/* DimensionSidebar desktop */
.lg:block { display: block; }  /* ≥1024px */

/* Content area margin */
.lg:ml-[280px] { margin-left: 280px; }  /* ≥1024px */
```

## Testing Checklist

### Data Loading
- [ ] Evaluation loads correctly
- [ ] Factors load with translations
- [ ] Dimensions load with questions
- [ ] Existing scores load
- [ ] Loading state shows spinner
- [ ] Error state shows alert

### Context Integration
- [ ] EvaluationProvider wraps content
- [ ] useEvaluation() hook works
- [ ] Initial data propagates to context
- [ ] localStorage answers load
- [ ] Progress calculates correctly

### Helper Functions
- [ ] getAllDimensionIds() returns all IDs
- [ ] getFactorSteps() transforms correctly
- [ ] getFactorGroups() transforms correctly
- [ ] Completion counts are accurate
- [ ] Names use first translation
- [ ] Falls back to code if no translation

### Navigation Handlers
- [ ] handleExit() checks unsaved changes
- [ ] Confirmation dialog shows when unsaved
- [ ] Navigates correctly on confirm
- [ ] handleFactorClick() jumps to first dimension
- [ ] handleDimensionClick() finds correct dimension
- [ ] setCurrentDimension() updates context

### Component Integration
- [ ] EvaluationHeader receives correct props
- [ ] FactorStepper receives factor steps
- [ ] DimensionSidebar receives factor groups
- [ ] Current dimension ID is correct
- [ ] Progress values are accurate

### Responsive Layout
- [ ] Desktop shows fixed sidebar
- [ ] Mobile shows floating button
- [ ] Sheet opens/closes on mobile
- [ ] Content area has correct margin
- [ ] Factor stepper orientation changes
- [ ] Header stays sticky

### Type Safety
- [ ] No TypeScript errors
- [ ] All props properly typed
- [ ] Interface transformations work
- [ ] GraphQL responses match types

## Future Enhancements

### Next Steps
1. **DimensionQuestionCard Component**
   - Display dimension questions
   - Level selection UI
   - Save answer functionality
   - Navigation buttons (Next/Previous)

2. **Database Sync**
   - GraphQL mutation for saving scores
   - Auto-save from localStorage to DB
   - Retry logic for failed saves
   - Sync status indicator

3. **Navigation Guards**
   - Route change detection
   - Unsaved changes warning
   - Browser back button handling
   - Page refresh warning

4. **Progress Enhancement**
   - Visual progress indicators
   - Factor completion checkmarks
   - Estimated time remaining
   - Last saved timestamp

5. **Validation**
   - Required dimensions
   - Minimum level validation
   - Question answer validation
   - Completion requirements

## Files Modified

### Updated:
1. **`app/[locale]/dashboard/[orgId]/evaluation/[evaluationId]/client.tsx`**
   - Added component imports
   - Split into outer/inner components
   - Added EvaluationProvider wrapper
   - Created helper functions
   - Implemented navigation handlers
   - Replaced debug UI with integrated components
   - Updated GraphQL query
   - Fixed DimensionScore interface

## Technical Notes

### Why Two-Component Pattern?

**Problem:**
- Data fetching happens before context exists
- Context needs data to initialize
- Hooks must be inside provider

**Solution:**
```
EvaluationPageClient (fetch data)
  → EvaluationProvider (provide context)
    → EvaluationContent (use context)
```

**Benefits:**
- Clean separation of concerns
- Data ready before context
- No prop drilling
- Easy to test

### Why Transform Data?

**Problem:**
- GraphQL returns nested Factor + Dimension
- Components need flat FactorStep / DimensionItem
- Need to add completion state from answers Map

**Solution:**
- Helper functions transform on render
- Calculated fields (completedDimensions, selectedLevel)
- Single source of truth (answers Map)

**Benefits:**
- Components stay simple
- Data shape matches component needs
- Real-time updates when answers change
- No duplication

### Why Use confirm()?

**Problem:**
- Need to warn about unsaved changes
- Simple use case (exit only)
- No complex dialog needed yet

**Solution:**
- Native confirm() dialog
- Simple boolean result
- Works everywhere

**Future:**
- Replace with custom Dialog component
- Better styling and control
- Consistent with design system

---

**Status:** ✅ Ready for DimensionQuestionCard Implementation

**Next Directive:** Create DimensionQuestionCard component to display questions and handle answer selection.
