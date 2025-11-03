# Task 5: Evaluation Context - Complete

**Date:** November 2, 2025  
**Status:** ✅ Complete

## Overview

Successfully implemented a comprehensive React Context for managing evaluation state, navigation, and progress tracking. The context provides a clean API for the evaluation wizard with localStorage integration and automatic progress calculation.

## Implementation Summary

### 1. Enhanced Type Definitions

**File:** `lib/types/evaluation.ts`

Added complete type hierarchy for evaluation data:

```typescript
// Question structure
interface QuestionTranslation { question_text: string; }
interface Question {
  id: string;
  level: number;
  order_index: number;
  question_translations: QuestionTranslation[];
}

// Dimension structure
interface DimensionTranslation { name: string; description: string; }
interface Dimension {
  id: string;
  code: string;
  order_index: number;
  max_level: number;
  weight: number;
  dimension_translations: DimensionTranslation[];
  questions: Question[];
}

// Factor structure
interface FactorTranslation { name: string; description: string; }
interface Factor {
  id: string;
  code: string;
  order_index: number;
  weight: number;
  factor_translations: FactorTranslation[];
  dimensions: Dimension[];
}

// Position and Evaluation
interface Position {
  id: string;
  pos_code: string;
  title: string;
  department: { dept_code: string; name: string; } | null;
}

interface Evaluation {
  id: string;
  position_id: string;
  status: EvaluationStatus;
  evaluated_by: string | null;
  evaluated_at: string | null;
  completed_at: string | null;
  position: Position;
}

// Complete evaluation data
interface EvaluationData {
  evaluation: Evaluation;
  factors: Factor[];
  dimensionScores: DimensionScore[];
}

// Progress tracking
interface EvaluationProgress {
  totalDimensions: number;
  completedDimensions: number;
  percentComplete: number;
  unsavedCount: number;
}
```

### 2. Evaluation Context

**File:** `lib/contexts/EvaluationContext.tsx`

#### Context Type Definition

```typescript
interface EvaluationContextType {
  // Data
  evaluationData: EvaluationData | null;
  answers: Map<string, DimensionAnswer>;
  progress: EvaluationProgress;
  
  // Navigation state
  currentFactorIndex: number;
  currentDimensionIndex: number;
  
  // Navigation functions
  setCurrentDimension: (factorIndex: number, dimensionIndex: number) => void;
  goToNextDimension: () => void;
  goToPreviousDimension: () => void;
  
  // Answer management
  saveCurrentAnswer: (level: number) => Promise<void>;
  
  // Utility functions
  getCurrentDimension: () => Dimension | null;
  isDimensionAnswered: (dimensionId: string) => boolean;
  
  // Completion check
  canFinalize: boolean;
}
```

#### Hook Usage

```typescript
export function useEvaluation() {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error('useEvaluation must be used within EvaluationProvider');
  }
  return context;
}
```

#### Provider Implementation

```typescript
export function EvaluationProvider({ 
  children, 
  initialData 
}: EvaluationProviderProps) {
  // State management
  // localStorage integration
  // Progress calculation
  // Navigation logic
}
```

## Key Features

### 🎯 State Management

**Navigation State:**
- `currentFactorIndex` - Current factor position (0-based)
- `currentDimensionIndex` - Current dimension within factor (0-based)
- Tracks position in multi-level hierarchy

**Answer State:**
- `answers` - Map<dimensionId, DimensionAnswer>
- O(1) lookups by dimension ID
- Merged from localStorage and database

**Progress State:**
- `totalDimensions` - Total count across all factors
- `completedDimensions` - Answered dimension count
- `percentComplete` - Progress percentage (0-100)
- `unsavedCount` - Number of pending saves

### 🔄 Data Initialization

**Multi-source merge strategy:**
1. Load answers from localStorage
2. Load dimension scores from database
3. Merge with database taking precedence
4. Database scores marked as `savedToDb: true`
5. localStorage answers marked as `savedToDb: false`

```typescript
// Initialize answers from both sources
useEffect(() => {
  const dimensionIds = getAllDimensionIds();
  const localAnswers = loadAllAnswers(evaluationId, dimensionIds);
  const mergedAnswers = new Map<string, DimensionAnswer>();
  
  // Add localStorage answers
  for (const [dimensionId, answer] of localAnswers) {
    mergedAnswers.set(dimensionId, answer);
  }
  
  // Database scores take precedence
  for (const score of dimensionScores) {
    mergedAnswers.set(score.dimension_id, {
      dimensionId: score.dimension_id,
      evaluationId: evaluationId,
      level: score.resulting_level,
      savedAt: score.created_at,
      savedToDb: true,
    });
  }
  
  setAnswers(mergedAnswers);
}, [evaluationData, getAllDimensionIds]);
```

### 📊 Progress Calculation

**Automatic updates:**
- Recalculates when answers change
- Uses Map.size for O(1) count
- Checks unsaved count from localStorage
- Provides real-time progress tracking

```typescript
useEffect(() => {
  const totalDimensions = getTotalDimensions();
  const completedDimensions = answers.size;
  const percentComplete = totalDimensions > 0 
    ? Math.round((completedDimensions / totalDimensions) * 100)
    : 0;
  
  const unsavedCount = getUnsavedCount(evaluationId, dimensionIds);

  setProgress({
    totalDimensions,
    completedDimensions,
    percentComplete,
    unsavedCount,
  });
}, [answers, evaluationId, getAllDimensionIds, getTotalDimensions]);
```

### 🧭 Navigation Functions

**1. setCurrentDimension(factorIndex, dimensionIndex)**
- Jump to specific dimension
- Validates indices before setting
- Bounds checking prevents errors

**2. goToNextDimension()**
- Moves to next dimension in current factor
- Auto-advances to next factor's first dimension
- Stops at last dimension of last factor

```typescript
const goToNextDimension = useCallback(() => {
  const currentFactor = factors[currentFactorIndex];
  
  if (currentDimensionIndex < currentFactor.dimensions.length - 1) {
    // Next dimension in same factor
    setCurrentDimensionIndex(prev => prev + 1);
  } else if (currentFactorIndex < factors.length - 1) {
    // First dimension of next factor
    setCurrentFactorIndex(prev => prev + 1);
    setCurrentDimensionIndex(0);
  }
  // Otherwise stay at end
}, [factors, currentFactorIndex, currentDimensionIndex]);
```

**3. goToPreviousDimension()**
- Moves to previous dimension in current factor
- Auto-reverses to previous factor's last dimension
- Stops at first dimension of first factor

```typescript
const goToPreviousDimension = useCallback(() => {
  if (currentDimensionIndex > 0) {
    // Previous dimension in same factor
    setCurrentDimensionIndex(prev => prev - 1);
  } else if (currentFactorIndex > 0) {
    // Last dimension of previous factor
    const previousFactor = factors[currentFactorIndex - 1];
    setCurrentFactorIndex(prev => prev - 1);
    setCurrentDimensionIndex(previousFactor.dimensions.length - 1);
  }
  // Otherwise stay at beginning
}, [factors, currentFactorIndex, currentDimensionIndex]);
```

### 💾 Answer Management

**saveCurrentAnswer(level)**
- Validates level against dimension's max_level
- Saves to localStorage immediately
- Updates React state
- Returns Promise for async operations

```typescript
const saveCurrentAnswer = useCallback(async (level: number): Promise<void> => {
  const currentDimension = getCurrentDimension();
  if (!currentDimension) {
    throw new Error('No current dimension selected');
  }

  // Validate level
  if (level < 1 || level > currentDimension.max_level) {
    throw new Error(`Level must be between 1 and ${currentDimension.max_level}`);
  }

  // Save to localStorage
  saveAnswer(evaluationId, currentDimension.id, level);

  // Update state
  const newAnswer: DimensionAnswer = {
    dimensionId: currentDimension.id,
    evaluationId: evaluationId,
    level,
    savedAt: new Date().toISOString(),
    savedToDb: false,
  };

  setAnswers(prev => {
    const newMap = new Map(prev);
    newMap.set(currentDimension.id, newAnswer);
    return newMap;
  });
}, [evaluationId, getCurrentDimension]);
```

### 🛠️ Utility Functions

**getCurrentDimension()**
- Returns current Dimension object or null
- Uses current navigation indices
- Type-safe with bounds checking

**isDimensionAnswered(dimensionId)**
- O(1) lookup in answers Map
- Used for progress indicators
- Returns boolean

**canFinalize**
- Computed property
- True when all dimensions answered
- Used to enable "Complete" button

```typescript
const canFinalize = getTotalDimensions() > 0 && 
                    answers.size === getTotalDimensions();
```

## Usage Examples

### 1. Wrapping Evaluation Page

```typescript
import { EvaluationProvider } from '@/lib/contexts/EvaluationContext';

export function EvaluationPageClient({ evaluationData }) {
  return (
    <EvaluationProvider initialData={evaluationData}>
      <EvaluationWizard />
    </EvaluationProvider>
  );
}
```

### 2. Using in Components

```typescript
import { useEvaluation } from '@/lib/contexts/EvaluationContext';

function DimensionForm() {
  const {
    getCurrentDimension,
    saveCurrentAnswer,
    goToNextDimension,
    progress,
  } = useEvaluation();

  const dimension = getCurrentDimension();

  const handleSubmit = async (level: number) => {
    await saveCurrentAnswer(level);
    goToNextDimension();
  };

  return (
    <div>
      <h2>{dimension?.dimension_translations[0]?.name}</h2>
      <p>Progress: {progress.percentComplete}%</p>
      {/* Form UI */}
    </div>
  );
}
```

### 3. Progress Indicator

```typescript
function ProgressBar() {
  const { progress, canFinalize } = useEvaluation();

  return (
    <div>
      <div className="progress-bar">
        <div style={{ width: `${progress.percentComplete}%` }} />
      </div>
      <p>
        {progress.completedDimensions} / {progress.totalDimensions} completed
      </p>
      {progress.unsavedCount > 0 && (
        <Badge variant="warning">
          {progress.unsavedCount} unsaved
        </Badge>
      )}
      {canFinalize && (
        <Button>Complete Evaluation</Button>
      )}
    </div>
  );
}
```

### 4. Navigation Buttons

```typescript
function NavigationButtons() {
  const {
    currentFactorIndex,
    currentDimensionIndex,
    goToNextDimension,
    goToPreviousDimension,
    evaluationData,
  } = useEvaluation();

  const isFirstDimension = 
    currentFactorIndex === 0 && currentDimensionIndex === 0;
  
  const isLastFactor = 
    currentFactorIndex === evaluationData.factors.length - 1;
  const currentFactor = evaluationData.factors[currentFactorIndex];
  const isLastDimension = 
    currentDimensionIndex === currentFactor.dimensions.length - 1;

  return (
    <div>
      <Button 
        onClick={goToPreviousDimension}
        disabled={isFirstDimension}
      >
        Previous
      </Button>
      <Button 
        onClick={goToNextDimension}
        disabled={isLastFactor && isLastDimension}
      >
        Next
      </Button>
    </div>
  );
}
```

### 5. Dimension List with Status

```typescript
function DimensionList() {
  const { 
    evaluationData, 
    isDimensionAnswered,
    setCurrentDimension,
  } = useEvaluation();

  return (
    <div>
      {evaluationData.factors.map((factor, factorIndex) => (
        <div key={factor.id}>
          <h3>{factor.factor_translations[0]?.name}</h3>
          {factor.dimensions.map((dimension, dimIndex) => (
            <button
              key={dimension.id}
              onClick={() => setCurrentDimension(factorIndex, dimIndex)}
            >
              {dimension.dimension_translations[0]?.name}
              {isDimensionAnswered(dimension.id) && (
                <CheckIcon />
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
```

## Architecture Decisions

### Why Context API?
- ✅ Global state without prop drilling
- ✅ Clean separation of concerns
- ✅ Easy to test
- ✅ Type-safe with TypeScript
- ✅ No external dependencies

### Why Map for Answers?
- ✅ O(1) lookups by dimensionId
- ✅ Easy to check existence
- ✅ Natural key-value pairing
- ✅ Better performance than array.find()

### Why useCallback?
- ✅ Prevents unnecessary re-renders
- ✅ Stable function references
- ✅ Better performance in child components
- ✅ Proper dependency tracking

### Why Separate Indices?
- ✅ Clear navigation model
- ✅ Easy to calculate position
- ✅ Simple next/previous logic
- ✅ Supports nested structure

## Performance Considerations

### Optimizations
- **useCallback** for all functions (stable references)
- **useMemo** not needed (calculations are cheap)
- **Map** for O(1) answer lookups
- **Selective re-renders** only when state changes

### Memory Usage
- Single evaluation data copy
- Map for answers (optimal structure)
- Minimal state duplication
- Efficient localStorage access

## Error Handling

### Provider Errors
```typescript
if (!context) {
  throw new Error('useEvaluation must be used within EvaluationProvider');
}
```

### Answer Validation
```typescript
if (level < 1 || level > currentDimension.max_level) {
  throw new Error(`Level must be between 1 and ${currentDimension.max_level}`);
}
```

### Navigation Bounds
- Checks before setting indices
- Prevents out-of-bounds access
- Graceful handling at boundaries

## Testing Checklist

### State Management
- [ ] Answers initialize from localStorage
- [ ] Answers initialize from database scores
- [ ] Database scores override localStorage
- [ ] Progress updates when answers change
- [ ] Unsaved count updates correctly

### Navigation
- [ ] setCurrentDimension validates indices
- [ ] goToNextDimension advances correctly
- [ ] goToNextDimension moves to next factor
- [ ] goToNextDimension stops at end
- [ ] goToPreviousDimension reverses correctly
- [ ] goToPreviousDimension moves to previous factor
- [ ] goToPreviousDimension stops at beginning

### Answer Management
- [ ] saveCurrentAnswer validates level
- [ ] saveCurrentAnswer saves to localStorage
- [ ] saveCurrentAnswer updates state
- [ ] Answer saved with correct timestamp
- [ ] Answer marked as unsaved (savedToDb: false)

### Utility Functions
- [ ] getCurrentDimension returns correct dimension
- [ ] getCurrentDimension returns null when invalid
- [ ] isDimensionAnswered checks Map correctly
- [ ] canFinalize requires all dimensions answered
- [ ] canFinalize is false with incomplete evaluation

### Progress Tracking
- [ ] totalDimensions counts correctly
- [ ] completedDimensions equals answer count
- [ ] percentComplete calculated correctly
- [ ] unsavedCount matches localStorage

## Integration Points

### Used By:
1. **Evaluation Page Client** - Provider wrapper
2. **Evaluation Wizard** - Main UI component
3. **Dimension Form** - Answer input
4. **Progress Bar** - Progress display
5. **Navigation** - Next/Previous buttons
6. **Dimension List** - Status indicators

### Uses:
1. **localStorage utilities** - Answer persistence
2. **Type definitions** - TypeScript types
3. **React Context API** - State management

## Future Enhancements

### Potential Additions
1. **Auto-save timer** - Periodic database sync
2. **Undo/Redo** - Answer history
3. **Validation rules** - Required questions
4. **Skip logic** - Conditional dimensions
5. **Draft mode** - Save partial evaluations
6. **Collaboration** - Multi-user evaluations
7. **Analytics** - Time tracking per dimension

## Files Created/Modified

### Created:
1. **`lib/contexts/EvaluationContext.tsx`**
   - EvaluationContext definition
   - useEvaluation hook
   - EvaluationProvider component
   - Navigation logic
   - Answer management
   - Progress tracking

### Modified:
1. **`lib/types/evaluation.ts`**
   - Added Question, Dimension, Factor types
   - Added Position, Evaluation types
   - Added EvaluationData type
   - Added EvaluationProgress type

## Technical Specifications

### State Structure
```typescript
{
  evaluationData: EvaluationData,           // Immutable
  currentFactorIndex: number,               // 0-based
  currentDimensionIndex: number,            // 0-based
  answers: Map<string, DimensionAnswer>,    // Dynamic
  progress: EvaluationProgress,             // Computed
}
```

### Navigation Model
```
Factors → [Factor 0, Factor 1, Factor 2]
              ↓
Dimensions → [Dim 0, Dim 1, Dim 2]
```

**Linear progression:**
```
F0D0 → F0D1 → F0D2 → F1D0 → F1D1 → ...
```

---

**Status:** ✅ Ready for Task 6 (Evaluation Wizard UI)
