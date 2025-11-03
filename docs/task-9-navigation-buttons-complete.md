# Task 9: NavigationButtons Component - Complete Implementation

**Status**: ✅ Complete  
**Date**: November 2, 2025  
**Component**: `components/evaluation/NavigationButtons.tsx`

---

## Overview

The `NavigationButtons` component provides navigation controls for moving between evaluation dimensions. It includes Previous/Next buttons, loading states, disabled states, and optional save draft functionality.

---

## Component Structure

```typescript
interface NavigationButtonsProps {
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isNextLoading: boolean;
  showSaveAndExit?: boolean;
  onSaveAndExit?: () => void;
  isLastDimension?: boolean;
}
```

---

## Features Implemented

### ✅ Directive 9.1: Button Group Structure

#### 1. Previous Button
```tsx
<Button
  variant="outline"
  onClick={onPrevious}
  disabled={!canGoPrevious}
  className={cn(!canGoPrevious && 'opacity-50 cursor-not-allowed')}
  title={!canGoPrevious ? 'First Dimension' : 'Go to previous dimension'}
>
  <ChevronLeft className="h-4 w-4 mr-2" />
  Previous
</Button>
```

**Features**:
- ✅ Outline variant (secondary styling)
- ✅ ChevronLeft icon on left side
- ✅ Disabled when `canGoPrevious === false`
- ✅ Reduced opacity (50%) when disabled
- ✅ Cursor not-allowed when disabled
- ✅ Tooltip: "First Dimension" when disabled
- ✅ Tooltip: "Go to previous dimension" when enabled

#### 2. Save & Next Button
```tsx
<Button
  onClick={onNext}
  disabled={!canGoNext || isNextLoading}
  title={!canGoNext ? 'Please select a level to continue' : undefined}
>
  {isNextLoading ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Saving...
    </>
  ) : (
    <>
      {isLastDimension ? 'Finalize' : 'Save & Next'}
      <ChevronRight className="h-4 w-4 ml-2" />
    </>
  )}
</Button>
```

**Features**:
- ✅ Default variant (primary styling)
- ✅ ChevronRight icon on right side
- ✅ Disabled when `canGoNext === false` (no level selected)
- ✅ Disabled during loading (`isNextLoading`)
- ✅ Loading state with spinning Loader2 icon
- ✅ Text changes to "Saving..." during load
- ✅ Dynamic text: "Save & Next" or "Finalize" based on `isLastDimension`
- ✅ Tooltip: "Please select a level to continue" when disabled
- ✅ Reduced opacity when disabled

#### 3. Save Draft & Exit Button (Optional)
```tsx
{showSaveAndExit && (
  <Button variant="ghost" onClick={onSaveAndExit}>
    <Save className="h-4 w-4 mr-2" />
    Save Draft
  </Button>
)}
```

**Features**:
- ✅ Ghost variant (minimal styling)
- ✅ Save icon on left side
- ✅ Only renders when `showSaveAndExit === true`
- ✅ Positioned between Previous and Save & Next buttons
- ✅ Allows users to save progress and exit

---

### ✅ Directive 9.2: Layout and Styling

#### Desktop Layout (≥640px)
```
┌──────────────────────────────────────────────────────┐
│ border-top                                           │
│                                                      │
│ [Previous]              [Save Draft]  [Save & Next] │
│                                                      │
│ ← Left aligned          Right aligned →             │
└──────────────────────────────────────────────────────┘
```

**Classes**: `sm:flex-row sm:items-center sm:justify-between`

#### Mobile Layout (<640px)
```
┌──────────────────────┐
│ border-top           │
│                      │
│ [Previous]           │  ← Full width
│                      │
│ [Save Draft]         │  ← Full width
│                      │
│ [Save & Next]        │  ← Full width
│                      │
│ ↕ Stacked vertically │
└──────────────────────┘
```

**Classes**: `flex-col gap-4` (default), `w-full` on buttons

---

## Visual States

### 1. Normal State (Can Navigate)
```
┌─────────────────────────────────────────────────┐
│                                                 │
│ [< Previous]              [Save]  [Save & Next >] │
│   Enabled                Enabled     Enabled    │
└─────────────────────────────────────────────────┘
```

### 2. First Dimension (Cannot Go Back)
```
┌─────────────────────────────────────────────────┐
│                                                 │
│ [< Previous]              [Save]  [Save & Next >] │
│   Disabled                Enabled     Enabled    │
│   (50% opacity)                                  │
│   Tooltip: "First Dimension"                     │
└─────────────────────────────────────────────────┘
```

### 3. No Level Selected (Cannot Go Forward)
```
┌─────────────────────────────────────────────────┐
│                                                 │
│ [< Previous]              [Save]  [Save & Next >] │
│   Enabled                Enabled     Disabled    │
│                                      (50% opacity)│
│   Tooltip: "Please select a level to continue"  │
└─────────────────────────────────────────────────┘
```

### 4. Loading State (Saving Data)
```
┌─────────────────────────────────────────────────┐
│                                                 │
│ [< Previous]              [Save]  [⟳ Saving...] │
│   Enabled                Enabled    Disabled    │
│                                    (spinning)    │
└─────────────────────────────────────────────────┘
```

### 5. Last Dimension (Finalize Text)
```
┌─────────────────────────────────────────────────┐
│                                                 │
│ [< Previous]              [Save]  [Finalize >]  │
│   Enabled                Enabled    Enabled     │
│                                   (different text)│
└─────────────────────────────────────────────────┘
```

### 6. Without Save Draft (Optional Hidden)
```
┌─────────────────────────────────────────────────┐
│                                                 │
│ [< Previous]                      [Save & Next >] │
│   Enabled                              Enabled    │
└─────────────────────────────────────────────────┘
```

---

## Props Breakdown

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `onPrevious` | `() => void` | Handler for Previous button click |
| `onNext` | `() => void` | Handler for Save & Next button click |
| `canGoPrevious` | `boolean` | Whether user can navigate to previous dimension |
| `canGoNext` | `boolean` | Whether user can navigate to next dimension (level selected) |
| `isNextLoading` | `boolean` | Whether save operation is in progress |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showSaveAndExit` | `boolean` | `false` | Whether to show Save Draft button |
| `onSaveAndExit` | `() => void` | `undefined` | Handler for Save Draft button click |
| `isLastDimension` | `boolean` | `false` | Whether this is the last dimension (changes text to "Finalize") |

---

## Button Variants

### Previous Button
```css
variant="outline"
- Border with transparent background
- Secondary color scheme
- Less prominent than primary action
```

### Save & Next Button
```css
variant="default"
- Primary color background
- Most prominent button
- Primary action emphasis
```

### Save Draft Button
```css
variant="ghost"
- No border or background (until hover)
- Minimal visual weight
- Secondary/tertiary action
```

---

## Responsive Behavior

### Breakpoint: 640px (sm)

#### Mobile (<640px)
```tsx
className="flex flex-col gap-4"
// Stacks vertically
// All buttons full width (w-full)
// 16px gap between buttons
```

#### Desktop (≥640px)
```tsx
className="sm:flex-row sm:items-center sm:justify-between"
// Horizontal layout
// Previous on left
// Save Draft + Save & Next on right
// Buttons auto-width (sm:w-auto)
```

---

## Accessibility Features

### ARIA & Tooltips
```tsx
// Previous button
title={!canGoPrevious ? 'First Dimension' : 'Go to previous dimension'}

// Save & Next button
title={!canGoNext ? 'Please select a level to continue' : undefined}
```

### Disabled States
- ✅ `disabled` attribute set properly
- ✅ Visual feedback (opacity-50)
- ✅ Cursor change (cursor-not-allowed)
- ✅ Tooltips explain why disabled

### Keyboard Support
- ✅ All buttons keyboard accessible
- ✅ Native button elements
- ✅ Tab order: Previous → Save Draft → Save & Next

### Screen Reader Support
- ✅ Button text clearly describes action
- ✅ Loading state announced ("Saving...")
- ✅ Disabled states communicated via aria-disabled

---

## Loading Animation

### Loader2 Icon
```tsx
<Loader2 className="h-4 w-4 mr-2 animate-spin" />
```

**Features**:
- Spinning animation (Tailwind `animate-spin`)
- Same size as navigation icons (16x16px)
- Positioned before text with 8px margin

**Animation**:
```css
animate-spin {
  animation: spin 1s linear infinite;
}
```

---

## Integration Points

### With EvaluationContext
```tsx
const {
  currentDimension,
  allDimensions,
  canNavigatePrevious,
  canNavigateNext,
  goToPreviousDimension,
  goToNextDimension,
  isLastDimension,
} = useEvaluation();

<NavigationButtons
  onPrevious={goToPreviousDimension}
  onNext={goToNextDimension}
  canGoPrevious={canNavigatePrevious}
  canGoNext={canNavigateNext}
  isNextLoading={isSaving}
  isLastDimension={isLastDimension}
  showSaveAndExit={true}
  onSaveAndExit={handleSaveAndExit}
/>
```

### With DimensionQuestionCard
```tsx
// Place at bottom of card content
<CardContent>
  <LevelSelector {...props} />
  
  <NavigationButtons
    onPrevious={handlePrevious}
    onNext={handleNext}
    canGoPrevious={currentIndex > 0}
    canGoNext={selectedLevel !== null}
    isNextLoading={saving}
    isLastDimension={currentIndex === totalDimensions - 1}
  />
</CardContent>
```

---

## Usage Examples

### Basic Usage (No Save Draft)
```tsx
<NavigationButtons
  onPrevious={() => console.log('Previous')}
  onNext={() => console.log('Next')}
  canGoPrevious={true}
  canGoNext={true}
  isNextLoading={false}
/>
```

### With Save Draft
```tsx
<NavigationButtons
  onPrevious={() => navigate(-1)}
  onNext={() => saveAndNext()}
  canGoPrevious={currentIndex > 0}
  canGoNext={answer !== null}
  isNextLoading={saving}
  showSaveAndExit={true}
  onSaveAndExit={() => saveDraft()}
/>
```

### Last Dimension (Finalize)
```tsx
<NavigationButtons
  onPrevious={() => navigate(-1)}
  onNext={() => finalize()}
  canGoPrevious={true}
  canGoNext={answer !== null}
  isNextLoading={finalizing}
  isLastDimension={true}
  showSaveAndExit={true}
  onSaveAndExit={() => saveDraft()}
/>
```

---

## Component Composition

```
NavigationButtons
├── Container (flex, border-top, responsive)
│   ├── Previous Button (left, outline)
│   │   ├── ChevronLeft Icon
│   │   └── "Previous" Text
│   └── Right Button Group (flex, gap-2)
│       ├── Save Draft Button (optional, ghost)
│       │   ├── Save Icon
│       │   └── "Save Draft" Text
│       └── Save & Next Button (default)
│           ├── Loader2 Icon (if loading)
│           ├── ChevronRight Icon (if not loading)
│           └── Dynamic Text ("Save & Next" / "Finalize" / "Saving...")
```

---

## State Management

### Button Enable/Disable Logic

```typescript
// Previous Button
disabled = !canGoPrevious
// Disabled on first dimension

// Save & Next Button
disabled = !canGoNext || isNextLoading
// Disabled if:
// 1. No level selected (!canGoNext)
// 2. Currently saving (isNextLoading)

// Save Draft Button
disabled = never (always enabled when shown)
```

---

## Styling Details

### Border Top
```css
border-t
- Separates navigation from content above
- Uses default border color from theme
```

### Padding Top
```css
pt-6 (24px)
- Provides breathing room above buttons
- Separates from border line
```

### Gap Between Buttons
```css
gap-4 (16px) on mobile
gap-2 (8px) on desktop for right group
- Comfortable tap targets on mobile
- Tighter grouping on desktop
```

### Width Behavior
```css
Mobile:  w-full (100% width)
Desktop: sm:w-auto (content width)
```

---

## Performance Considerations

### Efficient Rendering
- ✅ No expensive computations
- ✅ Simple boolean checks
- ✅ Conditional rendering with `&&`
- ✅ No unnecessary re-renders

### Optimization Opportunities
```typescript
// Could memoize if parent re-renders frequently
const NavigationButtons = React.memo(NavigationButtonsComponent);
```

---

## Testing Scenarios

### Unit Tests
```typescript
describe('NavigationButtons', () => {
  it('should render Previous and Save & Next buttons');
  it('should disable Previous when canGoPrevious is false');
  it('should disable Save & Next when canGoNext is false');
  it('should show loading state when isNextLoading is true');
  it('should render Save Draft when showSaveAndExit is true');
  it('should hide Save Draft when showSaveAndExit is false');
  it('should show "Finalize" on last dimension');
  it('should call onPrevious when Previous clicked');
  it('should call onNext when Save & Next clicked');
  it('should call onSaveAndExit when Save Draft clicked');
  it('should show tooltips on disabled buttons');
  it('should be responsive on mobile');
});
```

### Integration Tests
- Test with DimensionQuestionCard
- Verify state synchronization
- Test navigation flow
- Check loading states

### E2E Tests
- Complete navigation through all dimensions
- Save draft and resume
- Finalize on last dimension
- Mobile responsive behavior

---

## Known Limitations

1. **No Progress Indicator**: Doesn't show current position (e.g., "2 of 5")
   - Future: Add dimension counter

2. **No Confirmation**: No confirmation dialog on Save Draft
   - Future: Add confirmation modal

3. **Fixed Text**: Button text not internationalized
   - Future: Use i18n for all text

---

## Code Quality

### Type Safety ✅
- All props properly typed
- No `any` types
- Optional props with defaults

### Accessibility ✅
- Proper button semantics
- Tooltips for context
- Keyboard navigation
- Loading states announced

### Performance ✅
- Simple logic
- No heavy computations
- Efficient conditionals

### Maintainability ✅
- Clear prop names
- Well-commented
- Logical structure
- Easy to extend

---

## Related Documentation

- [Task 7: DimensionQuestionCard](./task-7-dimension-question-card-complete.md)
- [Task 8: LevelSelector](./task-8-level-selector-complete.md)
- [Directive 9.1-9.2 Implementation](./directive-9.1-9.2-navigation-buttons.md)

---

## Validation Checklist

- ✅ Previous button with ChevronLeft icon
- ✅ Save & Next button with ChevronRight icon
- ✅ Loading state with spinner
- ✅ Optional Save Draft button
- ✅ Disabled states handled
- ✅ Tooltips on disabled buttons
- ✅ Dynamic "Finalize" text
- ✅ Responsive mobile layout
- ✅ Border top separator
- ✅ Proper spacing (pt-6, gap-4/gap-2)
- ✅ TypeScript compilation
- ✅ Zero errors

---

**Implementation Complete**: ✅  
**Production Ready**: ✅  
**Next Step**: Integrate with evaluation page layout
