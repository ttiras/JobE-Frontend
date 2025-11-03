# Evaluation Integration Visual Guide

**Directives 7.1 & 7.2 Implementation**

## Before & After

### BEFORE (Debug UI)
```
┌────────────────────────────────────────────┐
│ [← Back]                                   │
│                                            │
│ Position Evaluation               [Draft] │
│                                            │
├────────────────────────────────────────────┤
│ Position Details                           │
│ ┌──────────────────────────────────────┐  │
│ │ Position Code: MGR-001               │  │
│ │ Position Title: Marketing Manager    │  │
│ │ Department: Marketing                │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ Evaluation Information                     │
│ ┌──────────────────────────────────────┐  │
│ │ Evaluation ID: 123-456-789           │  │
│ │ Status: Draft                        │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ Evaluation Dimensions                      │
│ ┌──────────────────────────────────────┐  │
│ │ ▶ Factor 1: Knowledge      Weight 30%│  │
│ │   - Dimension 1              L5      │  │
│ │   - Dimension 2              L3      │  │
│ │                                      │  │
│ │ ▶ Factor 2: Skills         Weight 40%│  │
│ │   - Dimension 3              L4      │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ Placeholder                                │
│ ┌──────────────────────────────────────┐  │
│ │ Interactive evaluation form will be  │  │
│ │ displayed here (To be implemented)   │  │
│ └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

### AFTER (Integrated UI)

#### Desktop View (≥1024px)
```
┌──────────────────────────────────────────────────────────────┐
│ Marketing Manager (MGR-001)                    [━━━━░░░░] 50% │
│ Department: Marketing                            [Exit] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [✓ Knowledge] ──→ [→ Skills] ──→ [○ Responsibility]       │
│     30%  2/2         40%  1/2        30%  0/3              │
│                                                              │
├──────────────┬───────────────────────────────────────────────┤
│ Dimensions   │ Current Dimension                             │
│              │                                               │
│ 5/12 comp    │ Factor: Skills                                │
│              │ Dimension: Communication                      │
│ ▼ Knowledge  │                                               │
│   ✓ Tech L3  │ ┌───────────────────────────────────────────┐ │
│   ✓ Dom  L2  │ │ Name: Communication                       │ │
│              │ │ Code: COMM                                │ │
│ ▼ Skills     │ │ Max Level: 5                              │ │
│   → Comm     │ │ Questions: 3                              │ │
│   ○ Team     │ │                                           │ │
│              │ │ [Question card will appear here]          │ │
│ ▶ Resp.      │ └───────────────────────────────────────────┘ │
│   ○ Lead     │                                               │
│   ○ Dec      │                                               │
│   ○ Account  │                                               │
│              │                                               │
│ 280px        │ flex-1 (with ml-[280px])                      │
└──────────────┴───────────────────────────────────────────────┘
```

#### Mobile View (<1024px)
```
┌────────────────────────────────────────┐
│ Marketing Manager (MGR-001)            │
│ [━━━━░░░░] 50%              [Exit]     │
├────────────────────────────────────────┤
│                                        │
│  [✓] Knowledge                         │
│       30%  2/2                         │
│       ↓                                │
│  [→] Skills (current)                  │
│       40%  1/2                         │
│       ↓                                │
│  [○] Responsibility                    │
│       30%  0/3                         │
│                                        │
├────────────────────────────────────────┤
│                                        │
│ Current Dimension                      │
│                                        │
│ Factor: Skills                         │
│ Dimension: Communication               │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ Name: Communication                │ │
│ │ Code: COMM                         │ │
│ │ Max Level: 5                       │ │
│ │ Questions: 3                       │ │
│ │                                    │ │
│ │ [Question card will appear here]   │ │
│ └────────────────────────────────────┘ │
│                                        │
│                                        │
│                              [Menu]    │
│                         5/12 completed │
└────────────────────────────────────────┘
```

#### Mobile Sheet (Menu Pressed)
```
┌────────────────────────────────────────┐
│ Evaluation Dimensions         [X]      │
│ 5 of 12 completed                      │
├────────────────────────────────────────┤
│                                        │
│ ▼ Knowledge                      2/2   │
│   ✓ Technical Knowledge         L3    │
│   ✓ Domain Expertise            L2    │
│                                        │
│ ▼ Skills                         1/2   │
│   → Communication (current)            │
│   ○ Teamwork                           │
│                                        │
│ ▶ Responsibility                 0/3   │
│                                        │
│                                        │
└────────────────────────────────────────┘
```

## Component Integration Flow

```
┌─────────────────────────────────────────────────────┐
│ 1. EvaluationPageClient (Outer)                     │
│    - Fetches GraphQL data                           │
│    - Handles loading/error states                   │
│    - Prepares evaluationData object                 │
│    ↓                                                 │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 2. EvaluationProvider (Context)                 │ │
│ │    - Wraps children with context                │ │
│ │    - Provides evaluation state                  │ │
│ │    - Manages answers and progress               │ │
│ │    ↓                                             │ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │ 3. EvaluationContent (Inner)                │ │ │
│ │ │    - Uses useEvaluation() hook              │ │ │
│ │ │    - Transforms data for components         │ │ │
│ │ │    - Handles navigation events              │ │ │
│ │ │    ↓                                         │ │ │
│ │ │ ┌─────────────────────────────────────────┐ │ │ │
│ │ │ │ 4. UI Components                        │ │ │ │
│ │ │ │    ┌─────────────────────────────────┐  │ │ │ │
│ │ │ │    │ EvaluationHeader                │  │ │ │ │
│ │ │ │    │ - Position info                 │  │ │ │ │
│ │ │ │    │ - Progress bar                  │  │ │ │ │
│ │ │ │    │ - Exit button                   │  │ │ │ │
│ │ │ │    └─────────────────────────────────┘  │ │ │ │
│ │ │ │    ┌─────────────────────────────────┐  │ │ │ │
│ │ │ │    │ FactorStepper                   │  │ │ │ │
│ │ │ │    │ - Horizontal (desktop)          │  │ │ │ │
│ │ │ │    │ - Vertical (mobile)             │  │ │ │ │
│ │ │ │    │ - Progress per factor           │  │ │ │ │
│ │ │ │    └─────────────────────────────────┘  │ │ │ │
│ │ │ │    ┌─────────────────────────────────┐  │ │ │ │
│ │ │ │    │ DimensionSidebar                │  │ │ │ │
│ │ │ │    │ - Accordion factors             │  │ │ │ │
│ │ │ │    │ - Dimension list                │  │ │ │ │
│ │ │ │    │ - Visual status                 │  │ │ │ │
│ │ │ │    └─────────────────────────────────┘  │ │ │ │
│ │ │ │    ┌─────────────────────────────────┐  │ │ │ │
│ │ │ │    │ Question Card (Placeholder)     │  │ │ │ │
│ │ │ │    │ - Current dimension info        │  │ │ │ │
│ │ │ │    │ - To be implemented             │  │ │ │ │
│ │ │ │    └─────────────────────────────────┘  │ │ │ │
│ │ │ └─────────────────────────────────────────┘ │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Navigation Examples

### Example 1: User Clicks Factor 2

```
1. Initial State
   ┌──────────────────────────────────────┐
   │ [→ Factor 1] → [○ Factor 2]          │
   │                                      │
   │ ▼ Factor 1                           │
   │   → Dimension 1 (current)            │
   │   ○ Dimension 2                      │
   └──────────────────────────────────────┘

2. User Action
   [User clicks "Factor 2" in stepper]
   
3. Handler Called
   handleFactorClick(1)  // factorIndex = 1
   
4. Context Update
   setCurrentDimension(1, 0)  // Factor 2, First Dimension
   
5. New State
   ┌──────────────────────────────────────┐
   │ [✓ Factor 1] → [→ Factor 2]          │
   │                                      │
   │ ▶ Factor 1                           │
   │                                      │
   │ ▼ Factor 2 (auto-expanded)           │
   │   → Dimension 3 (current)            │
   │   ○ Dimension 4                      │
   └──────────────────────────────────────┘
```

### Example 2: User Clicks Dimension in Sidebar

```
1. Initial State
   ┌──────────────────────────────────────┐
   │ ▼ Factor 1                           │
   │   ✓ Dimension 1            L3        │
   │   → Dimension 2 (current)            │
   │                                      │
   │ ▼ Factor 2                           │
   │   ○ Dimension 3                      │
   │   ○ Dimension 4                      │
   └──────────────────────────────────────┘

2. User Action
   [User clicks "Dimension 4"]
   
3. Handler Called
   handleDimensionClick("dim-4-id")
   
4. Find Indices
   Loop through factors:
     Factor 0: dimensions = [dim-1, dim-2]  ❌
     Factor 1: dimensions = [dim-3, dim-4]  ✅
       findIndex("dim-4-id") = 1
   
5. Context Update
   setCurrentDimension(1, 1)  // Factor 2, Dimension 4
   
6. New State
   ┌──────────────────────────────────────┐
   │ ▶ Factor 1 (collapsed)               │
   │                                      │
   │ ▼ Factor 2 (expanded)                │
   │   ○ Dimension 3                      │
   │   → Dimension 4 (current)            │
   └──────────────────────────────────────┘
```

### Example 3: User Tries to Exit with Unsaved Changes

```
1. Current State
   - 3 dimensions answered
   - 2 answers saved to database
   - 1 answer only in localStorage (unsaved)

2. User Action
   [User clicks "Exit" button]
   
3. Handler Called
   handleExit()
   
4. Check Unsaved
   getAllDimensionIds() → [dim-1, dim-2, ..., dim-12]
   getUnsavedAnswers(evalId, dimensionIds) → [dim-3]
   unsavedCount = 1
   
5. Show Confirmation
   ┌────────────────────────────────────┐
   │ ⚠️ Confirmation                    │
   │                                    │
   │ You have 1 unsaved change.         │
   │ Are you sure you want to exit?     │
   │                                    │
   │            [Cancel]  [OK]          │
   └────────────────────────────────────┘
   
6a. User clicks Cancel
    → Stay on page
    
6b. User clicks OK
    → Navigate to positions list
```

## Helper Function Transformations

### getFactorSteps() Transformation

```
INPUT (Factor from GraphQL):
{
  id: "factor-1",
  code: "KNO",
  order_index: 0,
  weight: 30,
  factor_translations: [
    { name: "Knowledge", description: "..." }
  ],
  dimensions: [
    { id: "dim-1", ... },
    { id: "dim-2", ... },
    { id: "dim-3", ... }
  ]
}

TRANSFORMATION:
const dimensionCount = 3;  // dimensions.length
const completedDimensions = 2;  // filter by answers.has()

OUTPUT (FactorStep for Stepper):
{
  id: "factor-1",
  name: "Knowledge",  // from translation
  code: "KNO",
  orderIndex: 0,
  dimensionCount: 3,
  completedDimensions: 2
}

VISUAL RESULT:
┌─────────────────────────┐
│ [→] Knowledge           │
│      30%  2/3           │
└─────────────────────────┘
```

### getFactorGroups() Transformation

```
INPUT (Factor from GraphQL):
{
  id: "factor-1",
  code: "KNO",
  factor_translations: [{ name: "Knowledge" }],
  dimensions: [
    {
      id: "dim-1",
      code: "TECH",
      dimension_translations: [{ name: "Technical" }],
      ...
    },
    {
      id: "dim-2",
      code: "DOM",
      dimension_translations: [{ name: "Domain" }],
      ...
    }
  ]
}

ANSWERS MAP:
Map {
  "dim-1" => { level: 3, savedAt: "...", savedToDb: true },
  "dim-2" => { level: 2, savedAt: "...", savedToDb: true }
}

OUTPUT (FactorGroup for Sidebar):
{
  id: "factor-1",
  name: "Knowledge",
  code: "KNO",
  orderIndex: 0,
  dimensions: [
    {
      id: "dim-1",
      name: "Technical",
      code: "TECH",
      orderIndex: 0,
      completed: true,      // has answer
      selectedLevel: 3       // from answer
    },
    {
      id: "dim-2",
      name: "Domain",
      code: "DOM",
      orderIndex: 1,
      completed: true,
      selectedLevel: 2
    }
  ]
}

VISUAL RESULT:
┌──────────────────────────┐
│ ▼ Knowledge        2/2   │
│   ✓ Technical      L3    │
│   ✓ Domain         L2    │
└──────────────────────────┘
```

## State Synchronization

```
┌─────────────────────────────────────────────────────┐
│ User Interaction                                    │
└────────────┬────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────┐
│ Navigation Handler                                  │
│ - handleFactorClick()                               │
│ - handleDimensionClick()                            │
└────────────┬────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────┐
│ Context Update                                      │
│ setCurrentDimension(factorIdx, dimIdx)              │
└────────────┬────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────┐
│ State Changes                                       │
│ - currentFactorIndex updated                        │
│ - currentDimensionIndex updated                     │
└────────────┬────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────┐
│ Re-render Triggered                                 │
└────────────┬────────────────────────────────────────┘
             │
             ├──────────────┬──────────────┬───────────┤
             ↓              ↓              ↓           ↓
      ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
      │ Header   │  │ Stepper  │  │ Sidebar  │  │ Card     │
      │ Progress │  │ Current  │  │ Current  │  │ Current  │
      │ Updates  │  │ Highlight│  │ Highlight│  │ Dimension│
      └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

## Key Improvements

### Before Integration
❌ Flat list of factors/dimensions  
❌ No navigation between items  
❌ No progress tracking  
❌ Static display only  
❌ Not responsive  
❌ No context management  

### After Integration
✅ Interactive wizard interface  
✅ Click navigation (stepper + sidebar)  
✅ Real-time progress tracking  
✅ Dynamic UI updates  
✅ Fully responsive (desktop + mobile)  
✅ Context-based state management  
✅ Unsaved changes detection  
✅ Visual status indicators  

---

**Visual Guide Complete**  
Ready for DimensionQuestionCard implementation!
