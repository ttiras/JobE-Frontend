# Directives 5.1 & 5.2: Factor Stepper Component - Complete

**Date:** November 2, 2025  
**Status:** ✅ Complete

## Overview

Successfully implemented a responsive Factor Stepper component that displays evaluation factors as a wizard-style navigation. The component features both horizontal (desktop) and vertical (mobile) layouts with visual state indicators and smart navigation.

## Implementation Summary

### Component Structure

**File:** `components/evaluation/FactorStepper.tsx`

```typescript
interface FactorStep {
  id: string;
  name: string;
  code: string;
  orderIndex: number;
  dimensionCount: number;
  completedDimensions: number;
}

interface FactorStepperProps {
  factors: FactorStep[];
  currentFactorIndex: number;
  onFactorClick: (factorIndex: number) => void;
}
```

### Architecture

**Three-Component Structure:**
1. **`FactorStepper`** - Main component with responsive switching
2. **`HorizontalStepper`** - Desktop layout (hidden on mobile)
3. **`VerticalStepper`** - Mobile layout (hidden on desktop)

## Key Features

### 🎨 Visual States

**1. Completed State** ✅
- **Circle**: Green background (`bg-green-500`)
- **Icon**: White checkmark
- **Text**: Green color
- **Line**: Solid green to next factor
- **Hover**: Darker green (`bg-green-600`)

**2. Current State** 🔵
- **Circle**: Blue background (`bg-blue-500`)
- **Icon**: White number
- **Text**: Blue color
- **Line**: Dashed blue to next factor
- **Hover**: Darker blue (`bg-blue-600`)

**3. Upcoming State** ⚪
- **Circle**: Gray background (`bg-gray-200`)
- **Icon**: Gray number
- **Text**: Gray color
- **Line**: Solid gray to next factor
- **Hover**: Darker gray (if clickable)

### 🔒 Navigation Logic

**Clickability Rules:**
```typescript
function isFactorClickable(factorIndex, factors, currentFactorIndex) {
  // Current factor is always clickable
  if (factorIndex === currentFactorIndex) return true;
  
  // Can't skip ahead - all previous factors must be complete
  for (let i = 0; i < factorIndex; i++) {
    if (factors[i].completedDimensions < factors[i].dimensionCount) {
      return false;
    }
  }
  
  return true;
}
```

**Visual Feedback:**
- **Clickable factors**: `cursor-pointer` + hover effects
- **Locked factors**: `cursor-not-allowed` + `opacity-50`
- **Focus rings**: 2px ring with offset (accessibility)

### 📱 Responsive Design

**Desktop (≥768px) - Horizontal Layout:**
```
○──────○──────○──────○
1      2      3      4
Factor Factor Factor Factor
2/3    3/3    0/3    0/3
```

**Mobile (<768px) - Vertical Layout:**
```
○ Factor 1
│ 2/3 dimensions
│
○ Factor 2
│ 3/3 dimensions
│
○ Factor 3
  0/3 dimensions
```

**Responsive Classes:**
- Desktop stepper: `hidden md:block`
- Mobile stepper: `block md:hidden`

## Detailed Implementation

### Horizontal Stepper (Desktop)

**Layout Structure:**
```tsx
<div className="flex items-start justify-between">
  {factors.map((factor, index) => (
    <div className="flex items-start flex-1">
      {/* Factor Circle + Info */}
      <div className="flex flex-col items-center flex-1">
        <button>{/* Circle */}</button>
        <div>{/* Name + Progress */}</div>
      </div>
      
      {/* Connecting Line */}
      {!isLastFactor && <div>{/* Line */}</div>}
    </div>
  ))}
</div>
```

**Circle Styling:**
- Size: `w-12 h-12` (48px)
- Rounded: `rounded-full`
- Font: `font-semibold text-lg`
- Transitions: `transition-all duration-200`

**Connecting Lines:**
- Completed: Solid line (`bg-green-500`)
- Current: Dashed border (`border-t-2 border-dashed border-blue-500`)
- Upcoming: Solid line (`bg-gray-300`)

**Text Hierarchy:**
- Factor name: `text-sm font-medium`
- Progress: `text-xs text-muted-foreground`

### Vertical Stepper (Mobile)

**Layout Structure:**
```tsx
<div className="space-y-4">
  {factors.map((factor, index) => (
    <div className="flex items-start gap-4">
      {/* Left - Circle + Line */}
      <div className="flex flex-col items-center">
        <button>{/* Circle */}</button>
        {!isLastFactor && <div>{/* Vertical Line */}</div>}
      </div>
      
      {/* Right - Info */}
      <div className="flex-1">
        {/* Name + Progress */}
      </div>
    </div>
  ))}
</div>
```

**Circle Styling:**
- Size: `w-10 h-10` (40px - slightly smaller for mobile)
- Same states and colors as desktop
- Touch-friendly with `active:` pseudo-classes

**Vertical Lines:**
- Width: `w-0.5` (2px)
- Min height: `32px` for spacing
- Same color logic as horizontal

**Text Hierarchy:**
- Factor name: `text-base font-medium` (slightly larger)
- Progress: `text-sm text-muted-foreground`

## State Determination Logic

### Factor State Function

```typescript
function getFactorState(factorIndex, factor, currentFactorIndex) {
  // Completed if all dimensions answered
  if (factor.completedDimensions === factor.dimensionCount && 
      factor.dimensionCount > 0) {
    return 'completed';
  }
  
  // Current if active
  if (factorIndex === currentFactorIndex) {
    return 'current';
  }
  
  // Otherwise upcoming
  return 'upcoming';
}
```

**Edge Cases Handled:**
- Empty factor (0 dimensions) - never marked completed
- Partial completion - stays in current state
- Future factors - upcoming state

## Accessibility Features

### ARIA Labels

**Factor Buttons:**
```tsx
<button
  aria-label={`Factor ${index + 1}: ${factor.name}`}
  aria-current={state === 'current' ? 'step' : undefined}
>
```

**Current Step Indicator:**
- Uses `aria-current="step"` for screen readers
- Announces which step is active

### Keyboard Navigation

**Focus Management:**
- Focus rings with `focus:ring-2 focus:ring-offset-2`
- Color-coordinated with state (green/blue/gray)
- Tab navigation through all factors

**Button States:**
- `disabled={!isClickable}` for locked factors
- Prevents keyboard activation

### Screen Reader Support

- Buttons announce: "Factor 1: Knowledge, button"
- Current step announced: "Factor 2: Skills, step 2 of 4, current step"
- Progress announced: "3 of 5 dimensions"

## Usage Examples

### Basic Usage

```typescript
import { FactorStepper, FactorStep } from '@/components/evaluation/FactorStepper';

function EvaluationWizard() {
  const factors: FactorStep[] = [
    {
      id: '1',
      name: 'Knowledge',
      code: 'KNO',
      orderIndex: 0,
      dimensionCount: 3,
      completedDimensions: 3,
    },
    {
      id: '2',
      name: 'Skills',
      code: 'SKL',
      orderIndex: 1,
      dimensionCount: 4,
      completedDimensions: 2,
    },
    // ... more factors
  ];

  const [currentFactorIndex, setCurrentFactorIndex] = useState(1);

  const handleFactorClick = (factorIndex: number) => {
    setCurrentFactorIndex(factorIndex);
  };

  return (
    <FactorStepper
      factors={factors}
      currentFactorIndex={currentFactorIndex}
      onFactorClick={handleFactorClick}
    />
  );
}
```

### With Context Integration

```typescript
import { useEvaluation } from '@/lib/contexts/EvaluationContext';
import { FactorStepper } from '@/components/evaluation/FactorStepper';

function EvaluationWizard() {
  const { 
    evaluationData, 
    currentFactorIndex, 
    setCurrentDimension,
    answers 
  } = useEvaluation();

  // Transform factors to FactorStep format
  const factorSteps = evaluationData.factors.map((factor, index) => {
    const completedDimensions = factor.dimensions.filter(dim => 
      answers.has(dim.id)
    ).length;

    return {
      id: factor.id,
      name: factor.factor_translations[0]?.name || factor.code,
      code: factor.code,
      orderIndex: factor.order_index,
      dimensionCount: factor.dimensions.length,
      completedDimensions,
    };
  });

  const handleFactorClick = (factorIndex: number) => {
    // Jump to first dimension of selected factor
    setCurrentDimension(factorIndex, 0);
  };

  return (
    <FactorStepper
      factors={factorSteps}
      currentFactorIndex={currentFactorIndex}
      onFactorClick={handleFactorClick}
    />
  );
}
```

### With Scroll Behavior

```typescript
function EvaluationWizard() {
  const dimensionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleFactorClick = (factorIndex: number) => {
    setCurrentFactorIndex(factorIndex);
    
    // Scroll to first dimension of factor (mobile)
    const firstDimIndex = calculateFirstDimensionIndex(factorIndex);
    dimensionRefs.current[firstDimIndex]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <>
      <FactorStepper
        factors={factorSteps}
        currentFactorIndex={currentFactorIndex}
        onFactorClick={handleFactorClick}
      />
      {/* Dimension forms with refs */}
    </>
  );
}
```

## Styling Details

### Color Palette

**Completed (Green):**
- Background: `bg-green-500` (#22c55e)
- Hover: `bg-green-600` (#16a34a)
- Text: `text-green-600` / `dark:text-green-400`
- Focus ring: `focus:ring-green-500`

**Current (Blue):**
- Background: `bg-blue-500` (#3b82f6)
- Hover: `bg-blue-600` (#2563eb)
- Text: `text-blue-600` / `dark:text-blue-400`
- Focus ring: `focus:ring-blue-500`

**Upcoming (Gray):**
- Background: `bg-gray-200` / `dark:bg-gray-700`
- Hover: `bg-gray-300` / `dark:bg-gray-600`
- Text: `text-gray-600` / `dark:text-gray-400`
- Focus ring: `focus:ring-gray-400`

### Dark Mode Support

All colors have dark mode variants:
- Uses Tailwind's `dark:` prefix
- Maintains contrast ratios
- Consistent visual hierarchy

### Transitions

**All states have smooth transitions:**
```tsx
transition-all duration-200
```

**Animated properties:**
- Background color
- Text color
- Border color
- Transform (hover)

## Responsive Breakpoints

**Desktop (md: 768px+):**
- Horizontal layout with `flex`
- Larger circles (48px)
- More horizontal spacing

**Mobile (< 768px):**
- Vertical layout with `flex-col`
- Smaller circles (40px)
- Vertical spacing optimized for touch

**Switching Logic:**
```tsx
<div className="hidden md:block">
  <HorizontalStepper />
</div>

<div className="block md:hidden">
  <VerticalStepper />
</div>
```

## Testing Checklist

### Visual States
- [ ] Completed factors show green with checkmark
- [ ] Current factor shows blue with number
- [ ] Upcoming factors show gray with number
- [ ] Connecting lines match factor states
- [ ] Dashed line appears for current factor
- [ ] Dark mode colors render correctly

### Interactivity
- [ ] Completed factors are clickable
- [ ] Current factor is clickable
- [ ] Upcoming factors locked until previous complete
- [ ] Hover effects work on clickable factors
- [ ] Disabled cursor shown on locked factors
- [ ] Click handler called with correct index

### Responsive Behavior
- [ ] Horizontal layout shows on desktop (≥768px)
- [ ] Vertical layout shows on mobile (<768px)
- [ ] Both layouts render correctly
- [ ] Circles sized appropriately for each layout
- [ ] Spacing works in both layouts
- [ ] Touch targets adequate on mobile (40px+)

### Accessibility
- [ ] All buttons have aria-labels
- [ ] Current step has aria-current="step"
- [ ] Focus rings visible on keyboard navigation
- [ ] Tab order follows visual order
- [ ] Disabled buttons not keyboard accessible
- [ ] Screen reader announces factor info

### Edge Cases
- [ ] Single factor displays correctly
- [ ] All factors completed (all green)
- [ ] No factors completed (all gray except first)
- [ ] Factor with 0 dimensions handled
- [ ] Very long factor names truncate/wrap properly
- [ ] Large dimension counts (e.g., 15/20)

## Performance Considerations

**Optimization:**
- Pure functions for state calculation
- Minimal re-renders with React.memo (if needed)
- CSS-only animations (no JS)
- No expensive calculations in render

**Memory:**
- Stateless component (props only)
- No internal state
- Small DOM footprint

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Flexbox | ✅ | ✅ | ✅ | ✅ |
| Grid | ✅ | ✅ | ✅ | ✅ |
| Transitions | ✅ | ✅ | ✅ | ✅ |
| Dark mode | ✅ | ✅ | ✅ | ✅ |
| Focus rings | ✅ | ✅ | ✅ | ✅ |

## Integration Points

### Used By:
- `EvaluationWizard` component
- Evaluation page layouts

### Uses:
- `lucide-react` (Check icon)
- `@/lib/utils` (cn helper)
- Tailwind CSS classes

### Context Integration:
- `useEvaluation` hook for state
- Factor data from context
- Navigation through setCurrentDimension

## Future Enhancements

### Potential Additions
1. **Factor tooltips** - Show description on hover
2. **Animation** - Slide/fade transitions between factors
3. **Compact mode** - Smaller circles for more factors
4. **Edit mode** - Allow factor reordering (admin)
5. **Time tracking** - Show time spent per factor
6. **Locked indicator** - Lock icon for locked factors
7. **Progress rings** - Circular progress around numbers

### Not Currently Needed
- Drag and drop reordering
- Expandable factor details
- Nested steps within factors
- Real-time collaboration indicators

## Files Created

1. **`components/evaluation/FactorStepper.tsx`**
   - FactorStep interface
   - FactorStepperProps interface
   - FactorStepper main component
   - HorizontalStepper component
   - VerticalStepper component
   - isFactorClickable utility
   - getFactorState utility

## Dependencies

### UI Components
- No UI component dependencies (pure Tailwind)

### Icons
- `lucide-react` (Check icon)

### Utilities
- `@/lib/utils` (cn helper for class merging)

### Styling
- Tailwind CSS utility classes
- Dark mode support via `dark:` prefix

## Technical Notes

### Why Separate Components?
- **Cleaner code**: Each layout is self-contained
- **Easier maintenance**: Changes to one don't affect other
- **Better performance**: Only one component renders
- **Responsive**: CSS-only switching with hidden/block

### Why Button Elements?
- **Semantic HTML**: Proper interactive elements
- **Accessibility**: Built-in keyboard support
- **Focus management**: Browser handles focus
- **ARIA support**: Native button semantics

### Why State Calculation Functions?
- **Reusability**: Used in both layouts
- **Consistency**: Same logic everywhere
- **Testability**: Pure functions easy to test
- **Maintainability**: Single source of truth

### Why Not CSS Grid?
- **Flexbox sufficient**: Simple linear layout
- **Better browser support**: Older browsers
- **Easier responsive**: Flex direction change
- **Simpler code**: Less complexity needed

---

**Status:** ✅ Ready for Integration with Evaluation Wizard
