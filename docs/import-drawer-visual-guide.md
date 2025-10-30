# 🎨 Import Drawer - Visual Flow & Features

## 📱 Responsive Behavior

### Desktop View (1440px+)
```
┌────────────────────────────────────────────────────────────────────────┐
│  Departments                               [Import] [+ Add Department]  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                         │
│  🔍 Search...                                         [Filter]          │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐                          │
│  │ 📁 Engineering   │  │ 📁 Marketing     │                          │
│  │ ENG • 12 pos     │  │ MKT • 8 pos      │                          │
│  └──────────────────┘  └──────────────────┘                          │
│                                                                         │
│  [Dimmed with backdrop blur when drawer opens] ◄─────────────────┐   │
└────────────────────────────────────────────────────────────────────────┘
                                                                      │
                                    ┌─────────────────────────────────┤
                                    │ [X] 📊 Import from Excel        │
                                    ├─────────────────────────────────┤
                                    │ Step 1 of 4  ●━━○○○             │
                                    │                                 │
                                    │ 📁 Upload Your File             │
                                    │                                 │
                                    │ ┌─────────────────────────┐   │
                                    │ │ [Download Template]     │   │
                                    │ └─────────────────────────┘   │
                                    │                                 │
                                    │ Drag & drop Excel file here    │
                                    │ or click to browse             │
                                    │                                 │
                                    │ ┌─────────────────────────┐   │
                                    │ │    [Choose File]        │   │
                                    │ └─────────────────────────┘   │
                                    │                                 │
                                    ├─────────────────────────────────┤
                                    │              [Next →]          │
                                    └─────────────────────────────────┘
                                    ↑
                                    Drawer: 55-70% width
                                    Slides in from right
```

### Mobile View (375px)
```
┌───────────────────────────┐
│ ☰  Departments        [+] │
├───────────────────────────┤
│ 🔍 Search...              │
├───────────────────────────┤
│                           │
│  ┌────────────────────┐  │
│  │ 📁 Engineering     │  │
│  │ 12 positions       │  │
│  └────────────────────┘  │
│                           │
│  [Import from Excel]      │
│                           │
└───────────────────────────┘
         ↓ Click
┌───────────────────────────┐
│ [X] Import from Excel     │ ← Full screen drawer
├───────────────────────────┤
│ Step 1 of 4  ●━━○○○       │
│                           │
│ 📁 Upload File            │
│                           │
│ [Download Template]       │
│                           │
│ Drag & drop or browse     │
│                           │
│    [Choose File]          │
│                           │
├───────────────────────────┤
│         [Next →]          │
└───────────────────────────┘
```

## 🎬 Animation Timeline

### Opening Sequence (500ms total)
```
T=0ms:   Click "Import from Excel" button
         ↓
T=0ms:   Overlay starts fading in (black/60 + blur)
         Drawer slides in from right
         ↓
T=250ms: Drawer 50% visible
         Overlay 50% opacity
         ↓
T=500ms: Animation complete
         Drawer fully visible
         Overlay fully applied
         Focus trapped in drawer
```

### Closing Sequence (300ms total)
```
T=0ms:   Click X or outside drawer
         ↓
T=0ms:   Drawer slides out to right
         Overlay fades out
         ↓
T=150ms: Drawer 50% hidden
         Overlay 50% transparent
         ↓
T=300ms: Animation complete
         Drawer removed from DOM
         Focus returns to main content
```

## 🎯 Interactive States

### Button States
```
┌─────────────────────────────┐
│  [Import from Excel]        │  ← Default
└─────────────────────────────┘

┌─────────────────────────────┐
│  [Import from Excel]        │  ← Hover (lighter bg)
└─────────────────────────────┘

┌─────────────────────────────┐
│  [Importing...]  ⟳          │  ← Loading (disabled)
└─────────────────────────────┘
```

### Drawer Header States
```
Fixed, always visible:
┌─────────────────────────────────────┐
│ 📊  Import from Excel          [X]  │
│ Import departments from Excel file  │
└─────────────────────────────────────┘
      ↑ Icon    ↑ Title/Desc   ↑ Close
```

### Step Progress
```
Step 1: ●━━○○○  (Upload)
Step 2: ●●━━○○  (Validate)
Step 3: ●●●━━○  (Confirm)
Step 4: ●●●●━●  (Complete)
```

## 🎨 Color Palette

### Light Theme
- Overlay: `rgba(0, 0, 0, 0.6)` with `backdrop-blur-sm`
- Drawer BG: `hsl(var(--background))` (white)
- Border: `hsl(var(--border))` (gray-200)
- Header BG: `rgba(var(--background), 0.95)` (slightly transparent)
- Icon BG: `hsl(var(--primary) / 0.1)` (blue-50)
- Icon Color: `hsl(var(--primary))` (blue-600)

### Dark Theme
- Overlay: `rgba(0, 0, 0, 0.6)` with `backdrop-blur-sm`
- Drawer BG: `hsl(var(--background))` (gray-950)
- Border: `hsl(var(--border))` (gray-800)
- Header BG: `rgba(var(--background), 0.95)`
- Icon BG: `hsl(var(--primary) / 0.1)`
- Icon Color: `hsl(var(--primary))`

## 📐 Spacing & Layout

### Drawer Dimensions
```
Width (responsive):
- Mobile (<640px):   100vw
- SM    (640px+):    90vw
- MD    (768px+):    70vw
- LG    (1024px+):   60vw
- XL    (1280px+):   55vw

Height: 100vh (full screen)
Z-Index: 50 (overlay + drawer)

Padding:
- Header: px-6 pt-6 pb-4
- Content: px-6 py-4
```

### Content Sections
```
┌─────────────────────────────┐
│ HEADER (Fixed)              │  ← 80px height
│ px-6 pt-6 pb-4 border-b     │
├─────────────────────────────┤
│                             │
│ SCROLLABLE CONTENT          │  ← flex-1, overflow-y-auto
│ px-6 py-4                   │
│                             │
│ (Wizard steps render here)  │
│                             │
│                             │
└─────────────────────────────┘
```

## 🎭 User Interactions

### 1. Opening Drawer
```
Trigger Points:
├─ Header "Import" button (departments/positions page)
├─ Empty state "Import from Excel" button
└─ Keyboard shortcut (future enhancement)

Result:
├─ Drawer slides in from right
├─ Overlay fades in with blur
├─ Main content dimmed but visible
└─ Focus moves to drawer
```

### 2. Navigating Wizard
```
Step Flow:
Step 1 (Upload)
    ↓ Click "Next" or auto-advance after upload
Step 2 (Validate)
    ↓ Click "Next" (only if no errors)
Step 3 (Confirm)
    ↓ Click "Confirm & Import"
Step 4 (Complete)
    ↓ Auto-close after 2s OR click "View Data"
```

### 3. Closing Drawer
```
Exit Points:
├─ Click X button (top-right)
├─ Click outside drawer (on overlay)
├─ Press ESC key
├─ Auto-close after successful import
└─ Click "View Data" button

Result:
├─ Drawer slides out to right
├─ Overlay fades out
├─ Focus returns to main page
└─ Data refreshes (if import successful)
```

## ✨ Special Features

### Context Preservation
```
Main List View (Always Visible)
┌──────────────────────┐
│ Dept 1               │ ◄── Still visible
│ Dept 2               │     (dimmed)
│ Dept 3               │
└──────────────────────┘
         │
         └─► User maintains visual context
             of what they're importing to
```

### Smart Auto-Close
```
Success Flow:
Import Complete (Step 4)
    ↓ Wait 2 seconds
Show success message
    ↓ Auto-close drawer
Refresh main list
    ↓
Show new imported items with highlight animation
```

### Error Handling
```
If Error During Import:
├─ Show error in Step 4
├─ Provide "Try Again" button
├─ Log error details
└─ Don't auto-close (let user read error)
```

## 🚀 Performance

### Optimizations
- Lazy render: Wizard only mounts when drawer opens
- Scroll optimization: Virtual scrolling for large datasets
- Backdrop blur: CSS-based (GPU accelerated)
- Animations: Transform-based (no layout thrashing)

### Bundle Impact
```
New Components:
├─ ImportDrawer: ~2KB
├─ DepartmentsContent: ~3KB
└─ PositionsContent: ~3KB

Total Added: ~8KB (gzipped)
Removed: ~4KB (old import page)
Net Impact: +4KB
```

## 🎓 Accessibility

### Keyboard Navigation
- `Tab` - Navigate between focusable elements
- `Shift+Tab` - Navigate backwards
- `Esc` - Close drawer
- `Enter` - Submit forms/activate buttons
- `Space` - Toggle checkboxes/activate buttons

### Screen Reader Support
- Drawer announced as "dialog"
- Step progress announced
- Upload status announced
- Error messages announced
- Success messages announced

### Focus Management
- Focus trapped within drawer when open
- Focus returns to trigger button on close
- Clear focus indicators
- Skip links for long content

---

**Pro Tip:** The drawer pattern excels at:
✅ Quick, focused tasks (like imports)
✅ Maintaining context
✅ Mobile responsiveness
✅ Progressive disclosure

**Avoid using for:**
❌ Complex multi-page flows
❌ Full content editing
❌ Primary navigation
