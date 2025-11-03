# Phase 2.3 Quick Reference

## Component Import Paths

```typescript
// Question Components (Phase 2.3)
import { DimensionQuestionCard } from '@/components/evaluation/DimensionQuestionCard';
import { LevelSelector } from '@/components/evaluation/LevelSelector';
import { NavigationButtons } from '@/components/evaluation/NavigationButtons';

// Context
import { useEvaluation } from '@/lib/contexts/EvaluationContext';
```

## Usage Example

```typescript
'use client';

import { useState } from 'react';
import { useEvaluation } from '@/lib/contexts/EvaluationContext';
import { DimensionQuestionCard } from '@/components/evaluation/DimensionQuestionCard';
import { NavigationButtons } from '@/components/evaluation/NavigationButtons';

export function EvaluationPage() {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const {
    evaluationData,
    currentFactorIndex,
    currentDimensionIndex,
    answers,
    getCurrentDimension,
    saveCurrentAnswer,
    goToNextDimension,
    goToPreviousDimension,
  } = useEvaluation();

  const currentDimension = getCurrentDimension();
  
  // Transform questions
  const levelOptions = currentDimension?.questions.map((q) => ({
    id: q.id,
    level: q.level,
    questionText: q.question_translations[0]?.question_text || '',
  })) || [];
  
  // Get current answer
  const currentAnswer = currentDimension ? answers.get(currentDimension.id) : null;
  
  // Navigation flags
  const canGoPrevious = currentFactorIndex > 0 || currentDimensionIndex > 0;
  const canGoNext = currentAnswer !== null;
  const isLastDimension = /* calculate based on indices */;
  
  // Handlers
  const handleLevelSelect = (level: number) => {
    setValidationError(null);
    saveCurrentAnswer(level);
  };
  
  const handlePrevious = () => {
    setValidationError(null);
    goToPreviousDimension();
  };
  
  const handleNext = async () => {
    if (!currentAnswer) {
      setValidationError('Please select a level before continuing');
      return;
    }
    
    try {
      setIsSaving(true);
      await saveCurrentAnswer(currentAnswer.level);
      goToNextDimension();
    } catch (error) {
      setValidationError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div>
      <DimensionQuestionCard
        dimensionName={currentDimension.dimension_translations[0]?.name}
        dimensionCode={currentDimension.code}
        dimensionDescription={currentDimension.dimension_translations[0]?.description}
        weight={currentDimension.weight}
        maxLevel={currentDimension.max_level}
        questions={levelOptions}
        selectedLevel={currentAnswer?.level || null}
        onLevelSelect={handleLevelSelect}
        validationError={validationError}
      />
      
      <NavigationButtons
        onPrevious={handlePrevious}
        onNext={handleNext}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        isNextLoading={isSaving}
        showSaveAndExit={true}
        onSaveAndExit={handleExit}
        isLastDimension={isLastDimension}
      />
    </div>
  );
}
```

## Context Methods

```typescript
// Navigation
goToNextDimension()          // Move to next dimension
goToPreviousDimension()      // Move to previous dimension
setCurrentDimension(f, d)    // Jump to specific dimension

// Answer Management
saveCurrentAnswer(level)     // Save answer for current dimension
getCurrentDimension()        // Get current dimension object
isDimensionAnswered(id)      // Check if dimension answered

// State Access
evaluationData              // All factors and dimensions
currentFactorIndex          // Current factor (0-based)
currentDimensionIndex       // Current dimension (0-based)
answers                     // Map of all answers
progress                    // Progress tracking object
canFinalize                 // True if all answered
```

## Common Patterns

### Check if Last Dimension
```typescript
const totalFactors = evaluationData.factors.length;
const isLastFactor = currentFactorIndex === totalFactors - 1;
const totalDimensions = evaluationData.factors[currentFactorIndex]?.dimensions.length || 0;
const isLastDimensionInFactor = currentDimensionIndex === totalDimensions - 1;
const isLastDimension = isLastFactor && isLastDimensionInFactor;
```

### Transform Questions for LevelSelector
```typescript
const levelOptions = currentDimension?.questions.map((q) => ({
  id: q.id,
  level: q.level,
  questionText: q.question_translations[0]?.question_text || '',
})) || [];
```

### Validation Before Navigation
```typescript
const handleNext = async () => {
  const currentDim = getCurrentDimension();
  if (!currentDim) return;
  
  const currentAnswer = answers.get(currentDim.id);
  if (!currentAnswer) {
    setValidationError('Please select a level before continuing');
    return;
  }
  
  // Proceed with save and navigation...
};
```

## Color Coding Function

```typescript
function getLevelColor(level: number, maxLevel: number): string {
  const percentage = (level / maxLevel) * 100;
  
  if (percentage <= 30) {
    return 'bg-green-100 text-green-700 border-green-300';
  } else if (percentage <= 60) {
    return 'bg-yellow-100 text-yellow-700 border-yellow-300';
  } else {
    return 'bg-orange-100 text-orange-700 border-orange-300';
  }
}
```

## Keyboard Shortcuts

### Application Level
- `Ctrl/Cmd + ←`: Previous dimension
- `Ctrl/Cmd + →`: Next dimension (if answered)
- `Escape`: Exit confirmation

### LevelSelector
- `↑/↓`: Navigate levels
- `Enter/Space`: Select level

## localStorage Keys

```typescript
// Answer storage
Key: `evaluation_${evaluationId}_dimension_${dimensionId}`
Value: { level: number, savedAt: string }

// Helper functions
import { saveAnswer, loadAllAnswers, getUnsavedAnswers } from '@/lib/localStorage/evaluationStorage';
```

## TypeScript Interfaces

```typescript
interface Question {
  id: string;
  level: number;
  questionText: string;
}

interface DimensionAnswer {
  dimensionId: string;
  evaluationId: string;
  level: number;
  savedAt: string;
  savedToDb: boolean;
}

interface EvaluationProgress {
  totalDimensions: number;
  completedDimensions: number;
  percentComplete: number;
  unsavedCount: number;
}
```

## Documentation Files

- **Task 7**: `docs/task-7-dimension-question-card-complete.md`
- **Task 8**: `docs/task-8-level-selector-complete.md`
- **Task 8 Visual**: `docs/level-selector-visual-guide.md`
- **Task 9**: `docs/task-9-navigation-buttons-complete.md`
- **Task 9 Visual**: `docs/navigation-buttons-visual-guide.md`
- **Task 10**: `docs/task-10-integration-complete.md`
- **Phase Summary**: `docs/phase-2.3-complete-summary.md`

## Testing Commands

```bash
# TypeScript check
npx tsc --noEmit

# Check evaluation components only
npx tsc --noEmit 2>&1 | grep -E "(evaluation|error)"

# Run tests (when implemented)
npm test

# Check specific component
npx tsc --noEmit 2>&1 | grep "DimensionQuestionCard"
```
