# UI Component Specifications

## 🎨 Design System Components for Org Structure Import

This document provides detailed specifications for all UI components needed for the redesigned org structure import experience.

---

## 1. Empty State Card

### OrgSetupEmptyState

**Purpose**: Welcome new organizations and guide them to set up their structure

**Visual Design**:
```
┌─────────────────────────────────────────────────────────┐
│  🏢  Welcome to [Organization Name]!                    │
│                                                          │
│  Let's get your organization structure set up.          │
│  This will help you evaluate positions later.           │
│                                                          │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃  📤  Import from Excel (Recommended)            ┃  │
│  ┃  Upload departments and positions in one easy   ┃  │
│  ┃  step with our pre-formatted template           ┃  │
│  ┃                                                   ┃  │
│  ┃  [Download Template]  [Start Import Wizard →]   ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ✏️  Create Manually                              │  │
│  │  Add departments and positions one at a time     │  │
│  │                                                   │  │
│  │  [Create First Department →]                     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  💡 Tip: Import is faster if you have 5+ departments   │
└─────────────────────────────────────────────────────────┘
```

**Styling**:
- **Container**: `Card` with light gradient background
- **Primary option**: Gradient border (primary color), larger size
- **Secondary option**: Standard border, subtle background
- **Typography**: 
  - Title: 2xl, bold
  - Description: base, muted-foreground
  - Option titles: lg, semibold
  - Option descriptions: sm, muted-foreground
- **Spacing**: p-8 for card, p-6 for option cards
- **Icons**: 
  - 🏢 Building2 (48px) at top
  - 📤 Upload (24px) for import
  - ✏️ Edit (24px) for manual

**Props**:
```typescript
interface OrgSetupEmptyStateProps {
  organizationId: string;
  organizationName: string;
  locale: string;
  onImportClick: () => void;
  onManualClick: () => void;
}
```

**States**:
- Default: Both options available
- Loading: Skeleton placeholders
- Error: Error message with retry

---

## 2. Progress Indicator

### OrgStructureProgress

**Purpose**: Show completion status and guide to next step

**Visual Design**:
```
┌────────────────────────────────────┐
│  Organization Structure            │
│                                     │
│         ┌──────────┐               │
│         │ ●●●●●○○  │  75%          │
│         │          │               │
│         └──────────┘               │
│                                     │
│  ✅ 8 Departments                  │
│  ✅ 24 Positions                   │
│  ⚠️  0 Evaluations                 │
│                                     │
│  Next step: Evaluate positions     │
│  to complete setup                 │
│                                     │
│  [Start Evaluating Positions →]   │
└────────────────────────────────────┘
```

**Styling**:
- **Container**: `Card` with subtle border
- **Progress Ring**: 
  - Size: 120px diameter
  - Stroke width: 8px
  - Colors: primary (completed), muted (remaining)
  - Animation: Smooth fill on mount
- **Status Items**:
  - ✅ Green check for complete
  - ⚠️ Yellow warning for incomplete
  - Font size: base
  - Icon size: 20px
- **CTA Button**: Primary variant, full width

**Props**:
```typescript
interface OrgStructureProgressProps {
  departments: number;
  positions: number;
  evaluations: number;
  totalExpectedEvaluations: number;
  organizationId: string;
  locale: string;
}
```

**Calculations**:
```typescript
const completionPercentage = calculateProgress({
  departments,    // 25% if > 0
  positions,      // 25% if > 0
  evaluations,    // 50% based on ratio
});

function calculateProgress({ departments, positions, evaluations }) {
  let progress = 0;
  if (departments > 0) progress += 25;
  if (positions > 0) progress += 25;
  progress += Math.min(50, (evaluations / positions) * 50);
  return progress;
}
```

---

## 3. Import Wizard Container

### ImportWizard

**Purpose**: Multi-step wizard for guided import

**Visual Design**:
```
┌─────────────────────────────────────────────┐
│  Import Organization Structure    [✕]      │
├─────────────────────────────────────────────┤
│                                             │
│  Step 1 of 4: Download Template            │
│  ━━━━━━━━━━━━━━━○━○━○                      │
│                                             │
│  [Step Content Here]                        │
│                                             │
├─────────────────────────────────────────────┤
│  [← Back]                      [Next →]    │
└─────────────────────────────────────────────┘
```

**Styling**:
- **Container**: Dialog/Modal, max-width 900px
- **Header**: 
  - Close button (top-right)
  - Step indicator (centered)
  - Progress bar (below header)
- **Content**: 
  - Min-height: 400px
  - Padding: 6 (p-6)
  - Overflow: auto
- **Footer**: 
  - Border-top
  - Flex justify-between
  - Buttons: secondary (back), primary (next)

**Progress Bar**:
```typescript
const steps = ['template', 'upload', 'review', 'success'];
const currentStepIndex = steps.indexOf(currentStep);
const progressPercentage = (currentStepIndex / (steps.length - 1)) * 100;

// Visual: filled segment for each completed step
// ━━━━━━ completed, ━━━━━━ current, ○○○○○○ future
```

**Props**:
```typescript
interface ImportWizardProps {
  organizationId: string;
  onComplete: () => void;
  onCancel?: () => void;
}
```

**State Management**:
```typescript
type WizardStep = 'template' | 'upload' | 'review' | 'success';

interface WizardState {
  currentStep: WizardStep;
  uploadedFile?: File;
  preview?: ImportPreview;
  results?: ImportResults;
}
```

---

## 4. Template Download Step

### TemplateDownloadStep

**Visual Design**:
```
┌─────────────────────────────────────────────┐
│  📥  Download Excel Template                │
│                                             │
│  The template includes:                    │
│  ✓ Pre-formatted sheets                   │
│  ✓ Example data to guide you              │
│  ✓ Built-in validation rules              │
│  ✓ Instructions and tips                  │
│                                             │
│  ┌──────────────────────────────────────┐ │
│  │  📊 Departments Sheet                │ │
│  │                                       │ │
│  │  Required columns:                   │ │
│  │  • dept_code (unique ID)             │ │
│  │  • name (department name)            │ │
│  │  • parent_dept_code (optional)       │ │
│  │                                       │ │
│  │  Example:                            │ │
│  │  DEPT-001 | Executive | -            │ │
│  │  DEPT-002 | HR | DEPT-001            │ │
│  └──────────────────────────────────────┘ │
│                                             │
│  ┌──────────────────────────────────────┐ │
│  │  💼 Positions Sheet                  │ │
│  │                                       │ │
│  │  Required columns:                   │ │
│  │  • pos_code (unique ID)              │ │
│  │  • title (position title)            │ │
│  │  • dept_code (department)            │ │
│  │  • reports_to_pos_code (optional)    │ │
│  │  • is_manager (yes/no)               │ │
│  │                                       │ │
│  │  Example:                            │ │
│  │  POS-001 | CEO | DEPT-001 | - | yes  │ │
│  └──────────────────────────────────────┘ │
│                                             │
│  [⬇ Download Template.xlsx]               │
└─────────────────────────────────────────────┘
```

**Styling**:
- **Section cards**: Light background, rounded borders
- **Lists**: Checkmarks or bullet points
- **Examples**: Monospace font, code background
- **Download button**: 
  - Size: lg
  - Icon: Download
  - Variant: outline
  - Full width on mobile

**Excel Template Structure**:
```
Sheet: "Departments"
| dept_code | name      | parent_dept_code | metadata |
|-----------|-----------|------------------|----------|
| DEPT-001  | Executive | -                | {}       |
| DEPT-002  | HR        | DEPT-001         | {}       |

Sheet: "Positions"
| pos_code | title | dept_code | reports_to | is_manager | is_active | incumbents |
|----------|-------|-----------|------------|------------|-----------|------------|
| POS-001  | CEO   | DEPT-001  | -          | yes        | yes       | 1          |
| POS-002  | CHRO  | DEPT-002  | POS-001    | yes        | yes       | 1          |

Sheet: "Instructions"
[Detailed markdown-formatted instructions]
```

---

## 5. Upload Step

### FileUploadStep

**Visual Design**:
```
┌─────────────────────────────────────────────┐
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │                                      │  │
│  │     📤  Drag & Drop Excel File      │  │
│  │            Here                     │  │
│  │                                      │  │
│  │             or                      │  │
│  │                                      │  │
│  │       [Browse Files]                │  │
│  │                                      │  │
│  │  Supported: .xlsx, .xls            │  │
│  │  Max size: 10MB                     │  │
│  │                                      │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  💡 Tips for best results:                 │
│  • Use the template we provided           │
│  • Ensure all required columns are filled │
│  • dept_code and pos_code must be unique  │
│  • Check parent references are valid      │
│                                             │
└─────────────────────────────────────────────┘
```

**States**:

**1. Idle (no file)**
```
Border: dashed, muted
Background: subtle gradient
Cursor: pointer
```

**2. Drag over**
```
Border: solid, primary
Background: primary/5
Scale: 1.02 (subtle zoom)
```

**3. Uploading**
```
┌─────────────────────────────────────────────┐
│  📤 Uploading: template.xlsx                │
│                                             │
│  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░  65%                │
│                                             │
│  2.1 MB / 3.2 MB                           │
└─────────────────────────────────────────────┘
```

**4. Processing**
```
┌─────────────────────────────────────────────┐
│  ⚙️ Processing file...                      │
│                                             │
│  [Spinner animation]                        │
│                                             │
│  Validating data...                        │
└─────────────────────────────────────────────┘
```

**5. Error**
```
┌─────────────────────────────────────────────┐
│  ❌ Upload failed                           │
│                                             │
│  Invalid file format. Please use .xlsx     │
│  or .xls files only.                       │
│                                             │
│  [Try Again]                               │
└─────────────────────────────────────────────┘
```

---

## 6. Review Step

### ImportReviewStep

**Visual Design**:
```
┌─────────────────────────────────────────────┐
│  ✅ Validation Complete                    │
│                                             │
│  ┌─────────────────────────────┐           │
│  │  📊 Import Summary           │           │
│  │                              │           │
│  │  Departments:                │           │
│  │  • 8 will be created  🟢    │           │
│  │  • 0 will be updated  🟡    │           │
│  │                              │           │
│  │  Positions:                 │           │
│  │  • 24 will be created 🟢    │           │
│  │  • 0 will be updated  🟡    │           │
│  │                              │           │
│  │  Total Rows: 32             │           │
│  └─────────────────────────────┘           │
│                                             │
│  📋 [Departments] [Positions]              │
│                                             │
│  ┌──────────┬─────────┬──────────┬──────┐ │
│  │ Action   │ Code    │ Name     │Parent│ │
│  ├──────────┼─────────┼──────────┼──────┤ │
│  │ CREATE 🟢│DEPT-001 │Executive │ -    │ │
│  │ CREATE 🟢│DEPT-002 │HR        │ -    │ │
│  │ UPDATE 🟡│DEPT-003 │IT        │ -    │ │
│  └──────────┴─────────┴──────────┴──────┘ │
│                                             │
│  ✅ 0 Errors | ⚠️ 0 Warnings               │
└─────────────────────────────────────────────┘
```

**With Errors**:
```
┌─────────────────────────────────────────────┐
│  ❌ Validation Failed                      │
│                                             │
│  ❌ 3 Errors | ⚠️ 2 Warnings               │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │  Errors (must fix):                 │  │
│  │                                      │  │
│  │  ❌ Row 5: Missing required field   │  │
│  │     'name' in Departments sheet     │  │
│  │                                      │  │
│  │  ❌ Row 12: Duplicate dept_code     │  │
│  │     'DEPT-003' found in row 8       │  │
│  │                                      │  │
│  │  ❌ Row 18: Invalid parent reference│  │
│  │     'DEPT-999' does not exist       │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │  Warnings (can proceed):            │  │
│  │                                      │  │
│  │  ⚠️ Row 7: Missing optional field   │  │
│  │     'parent_dept_code'              │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  [← Back to Fix File]                     │
└─────────────────────────────────────────────┘
```

**Tabs Component**:
- Active tab: Primary border-bottom, bold text
- Inactive tab: Muted text, hover effect
- Content: Animated transition on switch

**Table**:
- Sticky header on scroll
- Alternating row colors
- Action badges: 
  - CREATE: Green badge
  - UPDATE: Yellow badge
- Max height: 400px with scroll

---

## 7. Success Step

### ImportSuccessStep

**Visual Design**:
```
┌─────────────────────────────────────────────┐
│  [Confetti animation]                       │
│                                             │
│         ✨                                  │
│    Import Successful!                       │
│                                             │
│  ┌─────────────────────────────┐           │
│  │  📊 Import Results           │           │
│  │                              │           │
│  │  ✅ 8 departments created    │           │
│  │  ✅ 24 positions created     │           │
│  │  ⚡ Completed in 2.3s        │           │
│  └─────────────────────────────┘           │
│                                             │
│  🎯 What's Next?                           │
│                                             │
│  Now that your structure is set up,        │
│  you can:                                  │
│                                             │
│  1. View your organization chart           │
│  2. Start evaluating positions             │
│  3. Assign managers and relationships      │
│                                             │
│  ┌──────────────────────────────────────┐ │
│  │  [View Departments]  [View Positions] │ │
│  │                                       │ │
│  │  [Start Position Evaluation →]       │ │
│  └──────────────────────────────────────┘ │
│                                             │
│  [Done]                                    │
└─────────────────────────────────────────────┘
```

**Animations**:
1. **Confetti**: 
   - Trigger on mount
   - Duration: 3 seconds
   - Colors: Primary palette

2. **Success icon**:
   - Scale up with bounce
   - Slight rotation

3. **Results card**:
   - Fade in with slide up
   - Delay: 300ms after mount

**Styling**:
- **Title**: 3xl, bold, center
- **Results card**: Success background tint
- **Next steps**: Numbered list, clear hierarchy
- **Action buttons**: 
  - Primary CTA: "Start Position Evaluation"
  - Secondary: Outline variant

---

## 8. Navigation with Children

### Sidebar with Nested Items

**Visual Design**:
```
┌────────────────────────┐
│  📊 Dashboard          │
│                        │
│  🏢 Org Structure  ▾   │ ← Expanded
│    📂 Departments      │
│    💼 Positions        │
│    📤 Import Data      │
│                        │
│  📋 Questionnaire      │
│  📈 Analytics          │
│  ⚙️  Settings          │
└────────────────────────┘
```

**Collapsed Icon-only**:
```
┌────┐
│ 📊 │
│    │
│ 🏢 │ ← No expand arrow
│    │
│ 📋 │
│ 📈 │
│ ⚙️  │
└────┘
```

**Expanded (on hover)**:
```
┌────────────────────────┐
│  📊 Dashboard          │
│                        │
│  🏢 Org Structure  ▾   │
│    📂 Departments      │
│    💼 Positions        │
│    📤 Import Data      │
│                        │
└────────────────────────┘
```

**Interaction**:
- Click parent: Toggle expand/collapse
- Click child: Navigate to page
- Active state: Primary background tint
- Hover: Subtle background change
- Transition: 200ms ease

---

## 🎨 Color Palette

### Status Colors
- **Success**: Green-500 (#22c55e)
- **Warning**: Yellow-500 (#eab308)
- **Error**: Red-500 (#ef4444)
- **Info**: Blue-500 (#3b82f6)

### Operation Badges
- **CREATE**: Green-100 bg, Green-700 text
- **UPDATE**: Yellow-100 bg, Yellow-700 text
- **DELETE**: Red-100 bg, Red-700 text

### Progress
- **Completed**: Primary-500
- **Current**: Primary-300
- **Future**: Gray-300

---

## 📐 Spacing & Sizing

### Cards
- **Padding**: p-6 (24px)
- **Gap**: space-y-6 (24px vertical)
- **Border radius**: rounded-lg (8px)

### Buttons
- **Height**: 
  - sm: 32px
  - md: 40px
  - lg: 48px
- **Padding**: 
  - sm: px-3
  - md: px-4
  - lg: px-6

### Icons
- **Nav icons**: 20px
- **Card icons**: 24px
- **Hero icons**: 48px

---

## 🔤 Typography

### Headings
- **H1**: 3xl (30px), bold
- **H2**: 2xl (24px), semibold
- **H3**: xl (20px), semibold
- **H4**: lg (18px), medium

### Body
- **Large**: lg (18px), regular
- **Default**: base (16px), regular
- **Small**: sm (14px), regular
- **Extra small**: xs (12px), regular

---

## 📱 Responsive Breakpoints

### Mobile (< 768px)
- Single column layouts
- Bottom navigation
- Full-width buttons
- Simplified wizard steps

### Tablet (768px - 1024px)
- Two-column where appropriate
- Icon-only sidebar
- Expanded nav on hover

### Desktop (> 1024px)
- Multi-column layouts
- Full sidebar with labels
- Larger wizard dialog

---

## ♿ Accessibility

### ARIA Labels
```tsx
// Wizard steps
<div role="dialog" aria-labelledby="wizard-title">
  <h2 id="wizard-title">Import Organization Structure</h2>
</div>

// Progress indicator
<div role="progressbar" 
     aria-valuenow={75} 
     aria-valuemin={0} 
     aria-valuemax={100}>
  75%
</div>

// Status
<span role="status" aria-live="polite">
  Validation complete
</span>
```

### Keyboard Navigation
- Tab: Move between interactive elements
- Enter/Space: Activate buttons
- Escape: Close dialogs
- Arrow keys: Navigate lists

### Focus Management
- Visible focus rings
- Focus trap in dialogs
- Return focus on close

---

**Last Updated**: 2025-10-29
**Version**: 1.0
**Design System**: shadcn/ui + Tailwind CSS
