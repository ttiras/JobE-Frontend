# Directives 6.1, 6.2 & 6.3: Dimension Sidebar Navigator - Complete

**Date:** November 2, 2025  
**Status:** ✅ Complete

## Overview

Successfully implemented a comprehensive Dimension Sidebar Navigator with accordion-style navigation, visual status indicators, and responsive design. The component features a fixed sidebar on desktop and a floating button with sheet drawer on mobile.

## Implementation Summary

### Components Created

**1. Collapsible Component** (`components/ui/collapsible.tsx`)
- Custom collapsible implementation
- Simple toggle functionality
- TypeScript typed
- Smooth animations

**2. DimensionSidebar Component** (`components/evaluation/DimensionSidebar.tsx`)
- Accordion-style navigation
- Visual status indicators
- Responsive design
- Auto-expand current factor

### Type Definitions

```typescript
interface DimensionItem {
  id: string;
  name: string;
  code: string;
  orderIndex: number;
  completed: boolean;
  selectedLevel: number | null;
}

interface FactorGroup {
  id: string;
  name: string;
  code: string;
  orderIndex: number;
  dimensions: DimensionItem[];
}

interface DimensionSidebarProps {
  factors: FactorGroup[];
  currentDimensionId: string;
  onDimensionClick: (dimensionId: string) => void;
  totalCompleted?: number;
  totalDimensions?: number;
}
```

## Key Features

### 🎨 Visual States

**1. Current Dimension** 🔵
- **Background**: Blue highlight (`bg-blue-50` / `dark:bg-blue-950`)
- **Border**: Blue border (`border-blue-200`)
- **Icon**: Blue arrow right (`ArrowRight`)
- **Text**: Bold blue text
- **Badge**: Default variant with level

**2. Completed Dimension** ✅
- **Background**: Green hover (`hover:bg-green-50`)
- **Icon**: Green checkmark (`Check`)
- **Text**: Green color
- **Badge**: Secondary variant with level ("L3")

**3. Not Started Dimension** ⚪
- **Background**: Subtle hover (`hover:bg-accent`)
- **Icon**: Gray circle outline (`Circle`)
- **Text**: Muted foreground color
- **Badge**: None (no level selected)

### 📂 Accordion Behavior

**Factor Groups:**
- Click to expand/collapse
- Chevron icon changes (right → down)
- Badge shows completion (e.g., "2/3")
- Smooth animation on expand

**Auto-Expand Logic:**
```typescript
useEffect(() => {
  const currentFactorId = getFactorIdForDimension(factors, currentDimensionId);
  if (currentFactorId) {
    setExpandedFactors((prev) => new Set(prev).add(currentFactorId));
  }
}, [currentDimensionId, factors]);
```

**Toggle Function:**
```typescript
const toggleFactor = (factorId: string) => {
  setExpandedFactors((prev) => {
    const newExpanded = new Set(prev);
    if (newExpanded.has(factorId)) {
      newExpanded.delete(factorId);
    } else {
      newExpanded.add(factorId);
    }
    return newExpanded;
  });
};
```

### 📱 Responsive Design

**Desktop (≥1024px) - Fixed Sidebar:**
```tsx
<aside className="hidden lg:block fixed left-0 top-0 h-screen w-[280px] border-r bg-background z-40">
  <div className="h-full flex flex-col">
    <div className="px-4 py-3 border-b">
      <h2>Dimensions</h2>
      <p>{totalCompleted} of {totalDimensions} completed</p>
    </div>
    {sidebarContent}
  </div>
</aside>
```

**Mobile (<1024px) - Floating Button + Sheet:**
```tsx
<div className="lg:hidden fixed bottom-4 right-4 z-50">
  <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
    <SheetTrigger asChild>
      <Button size="lg" className="shadow-lg">
        <Menu /> {totalCompleted}/{totalDimensions} completed
      </Button>
    </SheetTrigger>
    <SheetContent side="left" className="w-[300px] sm:w-[400px]">
      {sidebarContent}
    </SheetContent>
  </Sheet>
</div>
```

## Component Structure

### Desktop Layout

```
┌─────────────────────────┐
│ Dimensions              │
│ X of Y completed        │
├─────────────────────────┤
│ ▼ Factor 1        2/3   │
│   ✓ Dim 1          L3   │
│   → Dim 2 (bold)        │
│   ○ Dim 3               │
│                         │
│ ▶ Factor 2        0/4   │
│                         │
│ ▶ Factor 3        0/2   │
└─────────────────────────┘
```

### Mobile Layout

**Floating Button:**
```
┌─────────────────────────────┐
│                             │
│                             │
│                             │
│                       [Menu]│
│                 X/Y completed│
└─────────────────────────────┘
```

**Drawer (when opened):**
```
┌─────────────────────────────┐
│ Evaluation Dimensions   [X] │
│ X of Y completed            │
├─────────────────────────────┤
│ ▼ Factor 1            2/3   │
│   ✓ Dimension 1        L3   │
│   → Dimension 2 (current)   │
│   ○ Dimension 3             │
└─────────────────────────────┘
```

## State Management

### Expanded Factors State

```typescript
const [expandedFactors, setExpandedFactors] = useState<Set<string>>(new Set());
```

**Benefits of using Set:**
- O(1) lookups
- Easy add/remove
- No duplicates
- Clean API

### Mobile Sheet State

```typescript
const [mobileOpen, setMobileOpen] = useState(false);
```

**Auto-close on dimension click:**
```typescript
const handleDimensionClick = (dimensionId: string) => {
  onDimensionClick(dimensionId);
  setMobileOpen(false); // Close mobile drawer
};
```

## Visual Design Details

### Factor Header

**Button Styling:**
```tsx
className={cn(
  'w-full flex items-center justify-between gap-2 px-3 py-2',
  'rounded-md hover:bg-accent transition-colors',
  'text-sm font-medium'
)}
```

**Chevron Animation:**
- ChevronRight → ChevronDown
- Instant rotation (no CSS transition)
- Clear visual feedback

**Progress Badge:**
- Secondary variant
- Shows "X/Y" format
- Shrink-0 to prevent squishing

### Dimension Item

**Dynamic Styling:**
```typescript
className={cn(
  'w-full flex items-center gap-2 px-3 py-2',
  'rounded-md transition-all duration-150',
  'text-sm group',
  {
    // Current
    'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800': isCurrent,
    'font-semibold text-blue-700 dark:text-blue-300': isCurrent,
    
    // Completed
    'hover:bg-green-50 dark:hover:bg-green-950/50': completed && !isCurrent,
    'text-green-700 dark:text-green-400': completed && !isCurrent,
    
    // Not started
    'hover:bg-accent': !completed && !isCurrent,
    'text-muted-foreground': !completed && !isCurrent,
  }
)}
```

**Icon Selection Logic:**
```typescript
{isCurrent ? (
  <ArrowRight className="h-4 w-4 text-blue-600" />
) : dimension.completed ? (
  <Check className="h-4 w-4 text-green-600" />
) : (
  <Circle className="h-4 w-4" />
)}
```

**Level Badge:**
```typescript
{dimension.selectedLevel !== null && (
  <Badge
    variant={isCurrent ? 'default' : 'secondary'}
    className="shrink-0 text-xs font-mono"
  >
    L{dimension.selectedLevel}
  </Badge>
)}
```

## Usage Examples

### Basic Usage

```typescript
import { DimensionSidebar } from '@/components/evaluation/DimensionSidebar';

function EvaluationPage() {
  const [currentDimensionId, setCurrentDimensionId] = useState('dim-1');

  const factors = [
    {
      id: 'factor-1',
      name: 'Knowledge',
      code: 'KNO',
      orderIndex: 0,
      dimensions: [
        {
          id: 'dim-1',
          name: 'Technical Knowledge',
          code: 'TECH',
          orderIndex: 0,
          completed: true,
          selectedLevel: 3,
        },
        {
          id: 'dim-2',
          name: 'Domain Expertise',
          code: 'DOM',
          orderIndex: 1,
          completed: false,
          selectedLevel: null,
        },
      ],
    },
  ];

  return (
    <DimensionSidebar
      factors={factors}
      currentDimensionId={currentDimensionId}
      onDimensionClick={setCurrentDimensionId}
      totalCompleted={1}
      totalDimensions={2}
    />
  );
}
```

### With Context Integration

```typescript
import { useEvaluation } from '@/lib/contexts/EvaluationContext';
import { DimensionSidebar } from '@/components/evaluation/DimensionSidebar';

function EvaluationWizard() {
  const { 
    evaluationData, 
    getCurrentDimension,
    setCurrentDimension,
    answers,
    progress 
  } = useEvaluation();

  const currentDimension = getCurrentDimension();

  // Transform factors to FactorGroup format
  const factorGroups = evaluationData.factors.map((factor) => ({
    id: factor.id,
    name: factor.factor_translations[0]?.name || factor.code,
    code: factor.code,
    orderIndex: factor.order_index,
    dimensions: factor.dimensions.map((dimension) => {
      const answer = answers.get(dimension.id);
      return {
        id: dimension.id,
        name: dimension.dimension_translations[0]?.name || dimension.code,
        code: dimension.code,
        orderIndex: dimension.order_index,
        completed: answer !== undefined,
        selectedLevel: answer?.level || null,
      };
    }),
  }));

  const handleDimensionClick = (dimensionId: string) => {
    // Find factor and dimension indices
    for (let factorIndex = 0; factorIndex < evaluationData.factors.length; factorIndex++) {
      const factor = evaluationData.factors[factorIndex];
      const dimensionIndex = factor.dimensions.findIndex((d) => d.id === dimensionId);
      
      if (dimensionIndex !== -1) {
        setCurrentDimension(factorIndex, dimensionIndex);
        break;
      }
    }
  };

  return (
    <div className="flex">
      <DimensionSidebar
        factors={factorGroups}
        currentDimensionId={currentDimension?.id || ''}
        onDimensionClick={handleDimensionClick}
        totalCompleted={progress.completedDimensions}
        totalDimensions={progress.totalDimensions}
      />
      
      <main className="lg:ml-[280px] flex-1">
        {/* Evaluation form content */}
      </main>
    </div>
  );
}
```

### With Scroll Sync

```typescript
function EvaluationWizard() {
  const dimensionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleDimensionClick = (dimensionId: string) => {
    // Update context
    setCurrentDimension(factorIndex, dimensionIndex);
    
    // Scroll to dimension on desktop
    const element = dimensionRefs.current.get(dimensionId);
    if (element && window.innerWidth >= 1024) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <>
      <DimensionSidebar
        factors={factorGroups}
        currentDimensionId={currentDimensionId}
        onDimensionClick={handleDimensionClick}
      />
      
      <main className="lg:ml-[280px]">
        {factorGroups.map((factor) =>
          factor.dimensions.map((dimension) => (
            <div
              key={dimension.id}
              ref={(el) => {
                if (el) dimensionRefs.current.set(dimension.id, el);
              }}
            >
              {/* Dimension form */}
            </div>
          ))
        )}
      </main>
    </>
  );
}
```

## Styling Details

### Colors & Theme

**Current Dimension (Blue):**
- Background: `bg-blue-50` / `dark:bg-blue-950`
- Border: `border-blue-200` / `dark:border-blue-800`
- Text: `text-blue-700` / `dark:text-blue-300`
- Icon: `text-blue-600` / `dark:text-blue-400`

**Completed Dimension (Green):**
- Hover: `hover:bg-green-50` / `dark:hover:bg-green-950/50`
- Text: `text-green-700` / `dark:text-green-400`
- Icon: `text-green-600` / `dark:text-green-400`

**Not Started (Gray):**
- Hover: `hover:bg-accent`
- Text: `text-muted-foreground`
- Icon: Default muted color

### Spacing & Layout

**Sidebar:**
- Width: `280px` (fixed)
- Height: `100vh` (full screen)
- Padding: `p-4` for content

**Factor Header:**
- Padding: `px-3 py-2`
- Gap: `gap-2`

**Dimension Item:**
- Padding: `px-3 py-2`
- Left margin: `ml-6` (indentation)
- Gap: `gap-2`

**Mobile Button:**
- Position: `fixed bottom-4 right-4`
- Size: `size-lg`
- Shadow: `shadow-lg`
- Z-index: `z-50`

### Animations

**Expand Animation:**
```tsx
className="animate-in slide-in-from-top-2 duration-200"
```

**Transition:**
```tsx
className="transition-all duration-150"
```

**Hover Effects:**
- Background color transitions
- Smooth 150ms duration

## Accessibility Features

### ARIA Labels

**Dimension Buttons:**
- Implicit button role
- Text content as label
- Visual status indicators

**Sheet Drawer:**
- `SheetTitle` for screen readers
- Close button with aria-label

### Keyboard Navigation

**Focus Management:**
- All buttons focusable
- Tab order follows visual order
- Focus visible styles
- Enter/Space to activate

**Sheet Navigation:**
- ESC to close
- Focus trap when open
- Return focus on close

### Screen Reader Support

- Factor names announced
- Completion counts announced
- Dimension names announced
- Current dimension highlighted

## Performance Considerations

### Optimizations

**Set for Expanded State:**
- O(1) add/remove operations
- Efficient membership checks
- No array iterations

**Shared Content:**
- Single sidebar content element
- Rendered once, displayed conditionally
- Reduced DOM nodes

**Smooth Animations:**
- CSS-only transitions
- No JS-based animations
- GPU-accelerated transforms

### Memory Usage

- Minimal state (Set + boolean)
- No large data structures
- Efficient re-renders

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Fixed positioning | ✅ | ✅ | ✅ | ✅ |
| CSS animations | ✅ | ✅ | ✅ | ✅ |
| Responsive design | ✅ | ✅ | ✅ | ✅ |
| Sheet component | ✅ | ✅ | ✅ | ✅ |

## Testing Checklist

### Visual States
- [ ] Current dimension highlighted blue
- [ ] Completed dimensions show green checkmark
- [ ] Not started dimensions show gray circle
- [ ] Level badges display correctly
- [ ] Dark mode colors correct

### Accordion Behavior
- [ ] Factors expand/collapse on click
- [ ] Chevron icon changes direction
- [ ] Current factor auto-expands
- [ ] Multiple factors can be open
- [ ] Smooth expand animation

### Navigation
- [ ] Clicking dimension calls onDimensionClick
- [ ] Current dimension updates correctly
- [ ] Mobile sheet closes after click
- [ ] Scroll behavior works (if implemented)

### Responsive Design
- [ ] Desktop shows fixed sidebar (≥1024px)
- [ ] Mobile shows floating button (<1024px)
- [ ] Sheet opens/closes correctly
- [ ] Content renders in both layouts
- [ ] Button shows correct progress

### Accessibility
- [ ] All buttons keyboard accessible
- [ ] Tab order is logical
- [ ] Focus visible on all interactive elements
- [ ] Sheet has focus trap
- [ ] ESC closes sheet

### Edge Cases
- [ ] No factors (empty state)
- [ ] Single factor
- [ ] Many dimensions (scrolling)
- [ ] Long dimension names (truncate)
- [ ] All dimensions completed
- [ ] No dimensions completed

## Integration Points

### Used By:
- `EvaluationWizard` component
- Evaluation page layouts

### Uses:
- `@/components/ui/button`
- `@/components/ui/badge`
- `@/components/ui/sheet`
- `@/components/ui/scroll-area`
- `lucide-react` icons

### Context Integration:
- `useEvaluation` hook for data
- Factor/dimension transformation
- Navigation through setCurrentDimension

## Future Enhancements

### Potential Additions
1. **Search/Filter** - Search dimensions by name
2. **Bookmarks** - Favorite/bookmark dimensions
3. **Notes** - Add notes per dimension
4. **Progress rings** - Visual progress indicators
5. **Drag to reorder** - Custom dimension order
6. **Keyboard shortcuts** - Quick navigation
7. **Breadcrumbs** - Show current path
8. **Mini-map** - Overview of all dimensions

## Files Created/Modified

### Created:
1. **`components/ui/collapsible.tsx`**
   - Custom Collapsible component
   - CollapsibleTrigger component
   - CollapsibleContent component

2. **`components/evaluation/DimensionSidebar.tsx`**
   - DimensionItem interface
   - FactorGroup interface
   - DimensionSidebarProps interface
   - DimensionSidebar component
   - Utility functions
   - Responsive layouts

## Technical Notes

### Why Custom Collapsible?
- Simpler than Radix UI dependency
- Full control over behavior
- Lightweight implementation
- Easy to customize

### Why Set for Expanded State?
- Efficient O(1) operations
- Natural for unique IDs
- Clean add/remove API
- TypeScript friendly

### Why Shared Content?
- DRY principle
- Consistent behavior
- Easier maintenance
- Single source of truth

### Why Fixed Sidebar?
- Always accessible
- Common pattern
- Better UX
- Industry standard

---

**Status:** ✅ Ready for Integration with Evaluation Wizard
