# DimensionQuestionCard - Visual Guide

**Component**: `components/evaluation/DimensionQuestionCard.tsx`  
**Status**: ✅ Complete

---

## Component Preview

### Unanswered State
```
╔═══════════════════════════════════════════════════════╗
║ [Gradient Background - Primary/5 to transparent]      ║
║                                                       ║
║  Technical Skills                                     ║
║                                                       ║
║  [D1]  [Weight: 33%]  [Max: S5]  [ℹ]                ║
║                                                       ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  LevelSelector component will be rendered here        ║
║                                                       ║
║  3 levels available                                   ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

### Answered State (with Selection)
```
╔═══════════════════════════════════════════════════════╗
║ [Gradient Background - Primary/5 to transparent]      ║
║                                                       ║
║  Technical Skills            [✓ S3 Selected]          ║
║                                                       ║
║  [D1]  [Weight: 33%]  [Max: S5]  [ℹ]                ║
║                                                       ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  LevelSelector component will be rendered here        ║
║                                                       ║
║  3 levels available                                   ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

### Error State (with Validation)
```
╔═══════════════════════════════════════════════════════╗
║ [Gradient Background - Primary/5 to transparent]      ║
║                                                       ║
║  Technical Skills                                     ║
║                                                       ║
║  [D1]  [Weight: 33%]  [Max: S5]  [ℹ]                ║
║                                                       ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  LevelSelector component will be rendered here        ║
║                                                       ║
║  3 levels available                                   ║
║                                                       ║
║  ╔═══════════════════════════════════════════════╗   ║
║  ║ ⚠  Please select a level before continuing   ║   ║
║  ╚═══════════════════════════════════════════════╝   ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

---

## Badge Color Guide

### Code Badge (Secondary)
```
╭─────╮
│ D1  │  ← Muted gray background
╰─────╯
```

### Weight Badge (Outline)
```
┌────────────────┐
│ Weight: 33%    │  ← Border only, no fill
└────────────────┘
```

### Max Level Badge (Outline)
```
┌──────────┐
│ Max: S5  │  ← Border only, no fill
└──────────┘
```

### Selected Badge (Default - Primary)
```
╭────────────────────╮
│ ✓ S3 Selected     │  ← Primary color background
╰────────────────────╯
```

---

## Info Tooltip

### Trigger Button
```
┌───┐
│ ℹ │  ← Hover for tooltip
└───┘
  ↓ On hover/click
┌─────────────────────────────────────┐
│ Measures technical competency and   │
│ knowledge across various domains    │
└─────────────────────────────────────┘
```

---

## Spacing & Layout

### Header Structure
```
┌─────────────────────────────────────────────────┐
│ gap-4                                           │
│ ┌─────────────────────────┐  ┌───────────────┐ │
│ │ flex-1                  │  │ ml-auto       │ │
│ │                         │  │               │ │
│ │ Title                   │  │ [✓ Selected]  │ │
│ │                         │  │               │ │
│ │ [Badges row]            │  │               │ │
│ │ gap-2, flex-wrap        │  │               │ │
│ └─────────────────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────┘
```

### Badge Row Spacing
```
[D1] ←gap-2→ [Weight: 33%] ←gap-2→ [Max: S5] ←gap-2→ [ℹ]
```

### Content Padding
```
╔═══════════════════════════╗
║ Header (has default pad)  ║
╠═══════════════════════════╣ ← Border
║ ↕ pt-6                   ║
║                          ║
║ Content (space-y-4)      ║
║                          ║
║ ↕ mt-4 (if error)        ║
║ [Error Alert]            ║
║                          ║
╚═══════════════════════════╝
```

---

## Gradient Visualization

```
Header Background Gradient (left to right):

primary/5     primary/3    transparent
   ████████████▓▓▓▓▓▓▓▓░░░░░░░░
   ↑           ↑            ↑
   Strongest   Medium       Invisible
```

---

## Icon Sizes

| Icon | Size | Usage |
|------|------|-------|
| Info | 4×4 (h-4 w-4) | Tooltip trigger |
| Check | 3×3 (h-3 w-3) | Selected badge |
| AlertCircle | 4×4 (h-4 w-4) | Error alert |

---

## Responsive Behavior

### Desktop (>768px)
```
┌─────────────────────────────────────────────────────┐
│ Dimension Name                  [✓ S3 Selected]     │
│                                                     │
│ [D1] [Weight: 33%] [Max: S5] [ℹ]                  │
└─────────────────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌─────────────────────────┐
│ Dimension Name          │
│ [✓ S3 Selected]         │
│                         │
│ [D1]                    │
│ [Weight: 33%]           │  ← Wraps to new lines
│ [Max: S5] [ℹ]          │
└─────────────────────────┘
```

---

## State Transitions

### Selection Flow
```
Step 1: Initial (Unanswered)
  selectedLevel = null
  isAnswered = false
  ↓ User selects level
  
Step 2: Selected
  selectedLevel = 3
  isAnswered = true
  ↓ Badge appears
  
Step 3: Answered State
  Shows: "✓ S3 Selected"
```

### Validation Flow
```
Step 1: No Error
  validationError = null
  ↓ User tries to proceed without selection
  
Step 2: Error Set
  validationError = "Please select a level"
  ↓ Alert appears at bottom
  
Step 3: Error Display
  Shows red destructive alert with message
  ↓ User selects level
  
Step 4: Error Cleared
  validationError = null
  Alert disappears
```

---

## Component Hierarchy

```
DimensionQuestionCard
├── Card
│   ├── CardHeader (with gradient)
│   │   ├── CardTitle
│   │   │   ├── Text (dimensionName)
│   │   │   └── Badge (if isAnswered)
│   │   │       ├── Check icon
│   │   │       └── Text ("S{n} Selected")
│   │   └── Badges Row
│   │       ├── Badge (code)
│   │       ├── Badge (weight)
│   │       ├── Badge (max level)
│   │       └── TooltipProvider (if description)
│   │           └── Tooltip
│   │               ├── TooltipTrigger (button)
│   │               │   └── Info icon
│   │               └── TooltipContent
│   │                   └── Text (description)
│   └── CardContent
│       ├── Placeholder (LevelSelector)
│       │   └── Temporary text
│       └── Alert (if validationError)
│           ├── AlertCircle icon
│           └── AlertDescription
│               └── Text (error message)
```

---

## Color Palette

### Badges
- **Secondary**: `bg-secondary text-secondary-foreground`
- **Outline**: `border border-input bg-background`
- **Default**: `bg-primary text-primary-foreground`

### Alert
- **Destructive**: `bg-destructive/15 text-destructive border-destructive/50`

### Gradient
- **Start**: `primary` color at 5% opacity
- **Middle**: `primary` color at 3% opacity  
- **End**: Transparent

---

## Accessibility Landmarks

```
<article>              ← Card (implicit)
  <header>             ← CardHeader
    <h2>               ← CardTitle
    <div role="group"> ← Badges container
  </header>
  <main>               ← CardContent
    <div>              ← Content area
    <div role="alert"> ← Error alert (when present)
  </main>
</article>
```

---

## Quick Reference

### Show Completion Badge
```tsx
const isAnswered = selectedLevel !== null;
{isAnswered && <Badge>✓ S{selectedLevel} Selected</Badge>}
```

### Show Info Tooltip
```tsx
{dimensionDescription && (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger><Info /></TooltipTrigger>
      <TooltipContent>{dimensionDescription}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
)}
```

### Show Validation Error
```tsx
{validationError && (
  <Alert variant="destructive">
    <AlertCircle />
    <AlertDescription>{validationError}</AlertDescription>
  </Alert>
)}
```

---

**Figma-style Component Specs**:
- Min Height: ~200px (without error)
- Header Height: ~100px
- Content Padding: 24px (pt-6)
- Badge Height: 24px (default)
- Icon Size: 16px (h-4 w-4)
- Border Radius: 8px (default Card)
- Gradient: 3-stop linear (left to right)

---

**Implementation Complete**: ✅  
**Visual Polish**: ✅  
**Accessibility**: ✅  
**Ready for Integration**: ✅
