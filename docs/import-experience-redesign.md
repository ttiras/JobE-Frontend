# Excel Import Experience - Redesign Specification

**Date**: October 30, 2025  
**Status**: 🎯 Ready for Implementation  
**Branch**: `005-excel-import-ui`

---

## 🎯 Goals

1. **Better Mobile Experience**: Replace cramped side drawer with spacious full-page layout
2. **Visual Learning**: Show actual Excel format with preview images (no download needed to understand)
3. **Database Alignment**: Use exact database column names in Excel headers
4. **Clean Navigation**: Access import FROM departments/positions pages (no sidebar clutter)
5. **Modern & Sleek**: Professional design that users instantly understand

---

## 📊 Current Issues

### Side Drawer Problems
- Takes 55-75% width on desktop (too wide for a "side" panel)
- Full screen overlay on mobile (user loses context)
- Long scrolling with nested cards
- Download template button buried in UI

### User Friction
- Must download → open → understand → create file (too many steps)
- No visual preview of Excel format
- Hard to reference format while creating file on mobile

---

## ✨ Solution: Dedicated Full-Page Import

### Route Structure
```
/dashboard/[orgId]/org-structure/import/[type]
```

Where `[type]` is either `departments` or `positions`

### Key Features

1. **Hero Section**
   - Large, welcoming header with icon
   - Clear value proposition: "Set up in minutes"
   - Breadcrumb navigation for context

2. **Visual Format Guide**
   - **Preview Images**: Actual Excel screenshots with exactly **3 data rows**
   - Column badges (A, B, C) with explanations
   - Tabs on desktop, Accordion on mobile
   - No download needed to understand format

3. **Prominent Upload Zone**
   - Large, inviting drag-and-drop area
   - Clear visual states (idle/dragging/uploaded)
   - Immediate feedback with icons and animations

4. **Secondary Actions**
   - Download template button (visible but not primary)
   - Back navigation
   - Help/documentation links

---

## 📋 Database Column Alignment

### Departments Excel Format

| Column | Header Name | Type | Required | Description |
|--------|-------------|------|----------|-------------|
| A | `code` | Text | ✅ Yes | Unique department identifier |
| B | `name` | Text | ✅ Yes | Department name |
| C | `parent_code` | Text | ⚪ Optional | Parent department code (for hierarchy) |

**Example Data (3 rows)**:
```
code    | name          | parent_code
IT      | IT Department | 
IT-DEV  | Development   | IT
IT-OPS  | Operations    | IT
```

### Positions Excel Format

| Column | Header Name | Type | Required | Description |
|--------|-------------|------|----------|-------------|
| A | `code` | Text | ✅ Yes | Unique position identifier |
| B | `title` | Text | ✅ Yes | Position title |
| C | `department_code` | Text | ✅ Yes | Department this position belongs to |
| D | `description` | Text | ⚪ Optional | Position description |
| E | `employment_type` | Text | ⚪ Optional | Full-time, Part-time, Contract, etc. |
| F | `location` | Text | ⚪ Optional | Work location |
| G | `salary_min` | Number | ⚪ Optional | Minimum salary |
| H | `salary_max` | Number | ⚪ Optional | Maximum salary |
| I | `salary_currency` | Text | ⚪ Optional | Currency code (USD, EUR, TRY, etc.) |

**Example Data (3 rows)**:
```
code      | title               | department_code | description              | employment_type | location | salary_min | salary_max | salary_currency
IT-DEV-01 | Senior Developer    | IT-DEV          | Lead development team   | Full-time       | Remote   | 80000      | 120000     | USD
IT-DEV-02 | Junior Developer    | IT-DEV          | Support development     | Full-time       | Office   | 50000      | 70000      | USD
HR-MGR-01 | HR Manager          | HR              | Manage HR operations    | Full-time       | Office   | 60000      | 90000      | USD
```

---

## 🎨 Component Architecture

```
app/[locale]/dashboard/[orgId]/org-structure/import/[type]/
  └── page.tsx                    # Main import page

components/import/
  ├── excel-format-preview.tsx     # Format guide with images
  ├── file-upload-zone.tsx         # Drag-and-drop upload
  ├── import-success.tsx           # Success state with next steps
  └── import-wizard.tsx            # (existing - validate & process)

public/templates/
  ├── preview-departments.png      # 3 rows example
  └── preview-positions.png        # 3 rows example
```

---

## 📱 Responsive Design

### Mobile (< 640px)
- Single column layout
- Accordion for format switcher
- Large touch targets (min 44x44px)
- Upload zone: full width, large height
- Stacked action buttons

### Tablet (640px - 1024px)
- Single column, increased spacing
- Tabs for format switcher
- Upload zone: centered, max-width 700px

### Desktop (1024px+)
- Max-width 1200px container, centered
- Side-by-side preview comparison (optional)
- Spacious upload zone
- Inline action buttons

---

## 🔄 User Flow

### From Departments Page
1. User on `/dashboard/[orgId]/org-structure/departments`
2. Clicks "Import from Excel" button
3. Navigates to `/dashboard/[orgId]/org-structure/import/departments`
4. Sees format preview for departments
5. Uploads file
6. System validates & imports
7. Redirects to success page
8. Can choose: View Departments | Back to Dashboard

### From Positions Page
Same flow, but with `type=positions`

---

## 🎯 Preview Images Specification

### Create with Figma/Canva/Screenshot

**Requirements**:
- Show Excel interface (realistic grid)
- Header row in **bold** with light background
- Exactly **3 data rows** with realistic examples
- Use system fonts (Arial, Helvetica, or SF Pro)
- High contrast for readability
- Dimensions: ~800x200px (landscape)
- Format: PNG with transparency or white background

**Departments Image**: `/public/templates/preview-departments.png`
```
┌─────────────────────────────────────────────┐
│   A       │    B              │ C           │
├─────────────────────────────────────────────┤
│ code      │ name              │ parent_code │
├─────────────────────────────────────────────┤
│ IT        │ IT Department     │             │
│ IT-DEV    │ Development       │ IT          │
│ IT-OPS    │ Operations        │ IT          │
└─────────────────────────────────────────────┘
```

**Positions Image**: `/public/templates/preview-positions.png`
```
┌────────────────────────────────────────────────────────────────────────────────┐
│ A         │ B                │ C             │ D              │ E          │ ...│
├────────────────────────────────────────────────────────────────────────────────┤
│ code      │ title            │ department_code│ description   │ employment...│
├────────────────────────────────────────────────────────────────────────────────┤
│ IT-DEV-01 │ Senior Developer │ IT-DEV         │ Lead dev team │ Full-time  │ ...│
│ IT-DEV-02 │ Junior Developer │ IT-DEV         │ Support dev   │ Full-time  │ ...│
│ HR-MGR-01 │ HR Manager       │ HR             │ Manage HR ops │ Full-time  │ ...│
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Visual Design Tokens

```typescript
// Colors
const design = {
  hero: {
    background: 'bg-gradient-to-br from-background via-background to-primary/5',
    icon: 'bg-primary/10 ring-1 ring-primary/20',
  },
  uploadZone: {
    idle: 'border-2 border-dashed border-muted-foreground/25',
    hover: 'border-primary/50 bg-primary/5',
    active: 'border-primary bg-primary/10 scale-[1.02]',
    success: 'border-green-500 bg-green-50 dark:bg-green-950/20',
  },
  preview: {
    card: 'border-2 border-dashed border-muted-foreground/25',
    image: 'rounded shadow-sm',
  },
}

// Spacing
const spacing = {
  container: 'max-w-6xl mx-auto',
  section: 'space-y-8 md:space-y-12',
  card: 'p-6 md:p-8',
}

// Typography
const typography = {
  hero: 'text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight',
  subtitle: 'text-lg text-muted-foreground max-w-2xl mx-auto',
  columnLabel: 'font-medium text-sm',
  columnDescription: 'text-xs text-muted-foreground',
}
```

---

## 🔌 Integration Points

### Existing Components to Reuse
- `ImportWizard` - Validation and processing logic
- `useBatchImport` - Import state management
- `useImportProgress` - Progress tracking
- `excel-file-validator.ts` - File validation

### New Components to Create
- `ExcelFormatPreview` - Format guide with images
- `FileUploadZone` - Upload UI component
- `ImportSuccessPage` - Success state with next actions

### Update Existing
- `departments-content.tsx` - Change button to navigate to import page
- `positions-content.tsx` - Change button to navigate to import page

---

## 🌍 Translation Keys

### Add to `messages/en.json` and `messages/tr.json`

```json
{
  "import": {
    "hero": {
      "title": "Import Your Organization",
      "subtitle": "Set up departments and positions in minutes using Excel.",
      "departments": "Import Departments",
      "positions": "Import Positions"
    },
    "format": {
      "title": "Excel Format Guide",
      "departments": {
        "title": "Departments Format",
        "description": "Just 3 columns needed",
        "columns": {
          "code": {
            "label": "code",
            "description": "Unique department identifier (e.g., IT, HR, FIN)"
          },
          "name": {
            "label": "name",
            "description": "Full department name"
          },
          "parent_code": {
            "label": "parent_code",
            "description": "Leave empty for top-level departments"
          }
        },
        "tip": "Start with row 2 (row 1 is headers). Add as many rows as you need."
      },
      "positions": {
        "title": "Positions Format",
        "description": "Required columns plus optional details",
        "columns": {
          "code": "Unique position identifier",
          "title": "Position title",
          "department_code": "Must match a department code",
          "description": "Job description (optional)",
          "employment_type": "Full-time, Part-time, Contract (optional)",
          "location": "Work location (optional)",
          "salary_min": "Minimum salary number (optional)",
          "salary_max": "Maximum salary number (optional)",
          "salary_currency": "Currency code like USD, EUR (optional)"
        }
      }
    },
    "upload": {
      "idle": "Drop your Excel file here",
      "click": "or click to browse files",
      "dragging": "Drop it here!",
      "success": "File uploaded",
      "change": "Click to change file",
      "formats": "Supports .xlsx and .xls • Max 10MB"
    },
    "actions": {
      "download_template": "Download Blank Template",
      "back": "Back to {page}"
    },
    "success": {
      "title": "Import Successful!",
      "stats": "Imported {departments} departments, {positions} positions",
      "nextSteps": "What's next?",
      "viewDepartments": "View Departments",
      "viewPositions": "View Positions",
      "backToDashboard": "Back to Dashboard"
    }
  }
}
```

---

## ✅ Acceptance Criteria

1. ✅ Import accessed from departments/positions pages (not sidebar)
2. ✅ Full-page layout with max-width 1200px
3. ✅ Preview images show exactly 3 data rows
4. ✅ Excel headers match database column names exactly
5. ✅ Tabs on desktop, accordion on mobile
6. ✅ Large, accessible upload zone (min 280px height)
7. ✅ Clear visual feedback for upload states
8. ✅ Success page with navigation options
9. ✅ Works smoothly on mobile, tablet, desktop
10. ✅ Download template available but secondary

---

## 🚀 Implementation Order

1. **Create preview images** (manually in design tool)
2. **Build component library** (ExcelFormatPreview, FileUploadZone)
3. **Create import route** with full-page layout
4. **Update navigation** from departments/positions
5. **Add success page** with next actions
6. **Add translations** for all new UI text
7. **Test on all devices** (mobile/tablet/desktop)
8. **Remove old drawer** component (cleanup)

---

## 📝 Notes

- Keep existing validation and processing logic (`ImportWizard`, `useBatchImport`)
- Reuse `excel-file-validator.ts` for validation
- Use shadcn/ui components for consistency
- Follow Next.js 15 App Router patterns
- Maintain accessibility (ARIA labels, keyboard navigation)
- Support both light and dark themes

---

## 🎨 Design Philosophy

> "Show, don't tell. The best UI is one where users immediately understand what to do without reading instructions."

This redesign embodies that philosophy:
- **Visual First**: See the format before uploading
- **Spacious**: Room to breathe, not cramped
- **Guided**: Clear path from format → upload → success
- **Professional**: Feels like a proper enterprise tool

---

**Ready to implement!** 🚀
