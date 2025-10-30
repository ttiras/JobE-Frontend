# Import Experience Redesign - Implementation Checklist

**Branch**: `005-excel-import-ui`  
**Status**: Ready for Development

---

## 📋 Pre-Implementation

- [ ] **Review Design Specs**
  - Read `/docs/import-experience-redesign.md`
  - Review `/docs/import-experience-before-after.md`
  - Understand the "why" behind the changes

- [ ] **Create Preview Images**
  - Follow `/docs/create-preview-images-guide.md`
  - Create `preview-departments.png` (3 rows)
  - Create `preview-positions.png` (3 rows)
  - Place in `/public/templates/`
  - Verify file sizes < 50KB each

- [ ] **Verify Database Schema**
  - Confirm departments columns: `code`, `name`, `parent_code`
  - Confirm positions columns: `code`, `title`, `department_code`, `description`, `employment_type`, `location`, `salary_min`, `salary_max`, `salary_currency`
  - Excel headers MUST match these exactly

---

## 🏗️ Phase 1: Component Library

### 1. ExcelFormatPreview Component

**File**: `/components/import/excel-format-preview.tsx`

- [ ] Create component with TypeScript
- [ ] Accept `type` prop: `'departments' | 'positions'`
- [ ] Desktop: Use `Tabs` component (departments/positions tabs)
- [ ] Mobile: Use `Accordion` component (one section per type)
- [ ] Show preview image using Next.js `Image` component
- [ ] Display column explanations with `Badge` components (A, B, C...)
- [ ] Add helpful tip using `Alert` component
- [ ] Support light/dark themes
- [ ] Test responsive breakpoints:
  - Mobile (< 640px): Accordion
  - Tablet (640px - 1024px): Tabs
  - Desktop (1024px+): Tabs with side-by-side layout

**Key Features**:
```tsx
- Image preview (auto-switches based on type)
- Column badges (A, B, C) with descriptions
- Tip/Alert section
- Responsive tabs/accordion switcher
```

---

### 2. FileUploadZone Component

**File**: `/components/import/file-upload-zone.tsx`

- [ ] Create component with TypeScript
- [ ] Install `react-dropzone` if not already installed
- [ ] Implement drag-and-drop functionality
- [ ] Visual states:
  - Idle: Dashed border, neutral colors
  - Hover: Primary color border, subtle scale
  - Dragging: Primary background, increased scale
  - Success: Green border, checkmark icon
- [ ] File validation:
  - Accept: `.xlsx`, `.xls`
  - Max size: 10MB
  - Single file only
- [ ] Large touch targets (min-height: 280px)
- [ ] Clear icons for each state (Upload, CheckCircle2, FileSpreadsheet)
- [ ] "Click to change" message after upload
- [ ] Accessibility: Keyboard navigation, ARIA labels

**Key Features**:
```tsx
- Drag-and-drop with react-dropzone
- Visual feedback for all states
- File validation
- Large, accessible target
- Icons from lucide-react
```

---

### 3. ImportSuccessPage Component

**File**: `/components/import/import-success.tsx`

- [ ] Create component with TypeScript
- [ ] Accept `stats` prop: `{ departments: number, positions: number }`
- [ ] Large success icon (CheckCircle2)
- [ ] Display import statistics
- [ ] "What's next?" section with action cards:
  - View Departments (navigate to departments list)
  - View Positions (navigate to positions list)
  - Back to Dashboard
- [ ] Card-based layout with hover effects
- [ ] Mobile-friendly stacked cards
- [ ] Use translations for all text

**Key Features**:
```tsx
- Success icon and message
- Import statistics display
- Next action cards
- Navigation integration
```

---

## 🛣️ Phase 2: Routes

### 1. Import Page Route

**File**: `/app/[locale]/dashboard/[orgId]/org-structure/import/[type]/page.tsx`

- [ ] Create dynamic route with `[type]` param
- [ ] Validate `type`: must be `'departments'` or `'positions'`
- [ ] If invalid type, redirect to 404
- [ ] Implement page metadata (title, description)
- [ ] Server component for metadata, client component for interactivity

**Structure**:
```tsx
export async function generateMetadata({ params }): Promise<Metadata>
export default async function ImportPage({ params })
```

---

### 2. Import Page Layout

**File**: Same as above, or separate layout component

- [ ] Breadcrumb navigation: Dashboard → [Departments/Positions] → Import
- [ ] Hero section:
  - Large heading
  - Subtitle explaining the process
  - Icon (FileSpreadsheet)
  - Gradient background
- [ ] Container: max-width 1200px, centered, padding
- [ ] Sections:
  - Hero
  - Format Preview (ExcelFormatPreview component)
  - Upload Zone (FileUploadZone component)
  - Secondary actions (Download template button)

**Layout Structure**:
```
- Breadcrumb bar (sticky on scroll?)
- Hero section (gradient background)
- Format preview card
- Upload zone card
- Download template button (ghost variant)
```

---

### 3. Success Page Route

**File**: `/app/[locale]/dashboard/[orgId]/org-structure/import/success/page.tsx`

- [ ] Create success page
- [ ] Accept query params: `?departments=X&positions=Y`
- [ ] Display ImportSuccessPage component
- [ ] Auto-redirect after 30 seconds (optional)
- [ ] Metadata for success page

---

## 🔗 Phase 3: Navigation Updates

### 1. Departments Page

**File**: `/components/organizations/departments-content.tsx`

- [ ] Change import button behavior
- [ ] Remove `setIsImportDrawerOpen(true)` 
- [ ] Add navigation: `router.push(\`/\${locale}/dashboard/\${orgId}/org-structure/import/departments\`)`
- [ ] Update button text: "Import from Excel"
- [ ] Remove `ImportDrawer` component import
- [ ] Remove drawer state management

**Changes**:
```tsx
// Before:
<Button onClick={() => setIsImportDrawerOpen(true)}>Import</Button>

// After:
<Button asChild>
  <Link href={`/${locale}/dashboard/${orgId}/org-structure/import/departments`}>
    <FileSpreadsheet className="h-4 w-4 mr-2" />
    Import from Excel
  </Link>
</Button>
```

---

### 2. Positions Page

**File**: `/components/organizations/positions-content.tsx` (or similar)

- [ ] Same changes as departments page
- [ ] Link to `/import/positions` instead
- [ ] Update button text consistently
- [ ] Remove drawer-related code

---

## 🌍 Phase 4: Translations

### 1. English Translations

**File**: `/messages/en.json`

- [ ] Add `import.hero` section
- [ ] Add `import.format.departments` section
- [ ] Add `import.format.positions` section
- [ ] Add `import.upload` section
- [ ] Add `import.success` section
- [ ] Add `import.actions` section

**Example Structure**:
```json
{
  "import": {
    "hero": {
      "title": "Import Your Organization",
      "subtitle": "Set up departments and positions in minutes",
      "departmentsTitle": "Import Departments",
      "positionsTitle": "Import Positions"
    },
    "format": { ... },
    "upload": { ... },
    "success": { ... }
  }
}
```

---

### 2. Turkish Translations

**File**: `/messages/tr.json`

- [ ] Translate all keys from English
- [ ] Maintain same structure
- [ ] Use professional tone
- [ ] Test special characters (Turkish: ğ, ü, ş, ı, ö, ç)

---

## 🎨 Phase 5: Styling & Polish

### 1. Responsive Design

- [ ] Test on iPhone SE (375px width)
- [ ] Test on iPad (768px width)
- [ ] Test on MacBook (1440px width)
- [ ] Verify accordion on mobile
- [ ] Verify tabs on desktop
- [ ] Check touch target sizes (min 44x44px)
- [ ] Test landscape orientation on mobile

---

### 2. Theme Support

- [ ] Test all components in light mode
- [ ] Test all components in dark mode
- [ ] Verify color contrast (WCAG AA)
- [ ] Check preview images visibility in both themes
- [ ] Test gradient backgrounds in dark mode

---

### 3. Animations

- [ ] Upload zone scale animation (hover/drag)
- [ ] Smooth transitions (200ms duration)
- [ ] Success state animation (fade-in, scale)
- [ ] Loading states during import
- [ ] No layout shifts (CLS = 0)

---

## 🧪 Phase 6: Testing

### 1. Unit Tests

- [ ] Test `ExcelFormatPreview` component
  - Renders departments format
  - Renders positions format
  - Shows correct image based on type
  - Displays all column descriptions
- [ ] Test `FileUploadZone` component
  - Accepts valid files (.xlsx, .xls)
  - Rejects invalid files
  - Shows error for files > 10MB
  - Displays success state after upload
- [ ] Test `ImportSuccessPage` component
  - Displays correct statistics
  - Renders action cards
  - Navigation links work

---

### 2. Integration Tests

- [ ] Full import flow (departments)
  1. Navigate from departments list
  2. See format preview
  3. Upload valid file
  4. See success page
  5. Navigate to departments list
- [ ] Full import flow (positions)
  - Same steps as above
- [ ] Error handling
  - Invalid file format
  - Empty file
  - File too large
  - Invalid data in Excel

---

### 3. E2E Tests (Playwright)

- [ ] Create `tests/e2e/import-flow.spec.ts`
- [ ] Test full departments import
- [ ] Test full positions import
- [ ] Test mobile viewport
- [ ] Test desktop viewport
- [ ] Test file upload interaction
- [ ] Test success navigation

---

### 4. Accessibility Tests

- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Screen reader compatibility (ARIA labels)
- [ ] Focus indicators visible
- [ ] Color contrast ratios pass WCAG AA
- [ ] Images have alt text
- [ ] Forms have labels

---

## 🧹 Phase 7: Cleanup

### 1. Remove Old Code

- [ ] Remove `/components/import/import-drawer.tsx` (if fully replaced)
- [ ] Remove drawer state from departments page
- [ ] Remove drawer state from positions page
- [ ] Remove drawer-related translations (if unused elsewhere)
- [ ] Update imports in affected files

---

### 2. Update Documentation

- [ ] Update README.md with new import flow
- [ ] Add screenshots to docs
- [ ] Update feature list
- [ ] Document new routes
- [ ] Add troubleshooting section

---

## 🚀 Phase 8: Deployment

### 1. Pre-Deployment

- [ ] Run TypeScript compilation (`pnpm tsc --noEmit`)
- [ ] Run linter (`pnpm lint`)
- [ ] Run all tests (`pnpm test`)
- [ ] Build production bundle (`pnpm build`)
- [ ] Test production build locally (`pnpm start`)
- [ ] Verify preview images are included in build

---

### 2. Deploy to Staging

- [ ] Deploy to staging environment
- [ ] Test full import flow on staging
- [ ] Test with real data
- [ ] Verify file uploads work (storage integration)
- [ ] Check analytics/monitoring

---

### 3. Deploy to Production

- [ ] Create deployment PR
- [ ] Get code review approval
- [ ] Merge to main branch
- [ ] Deploy to production
- [ ] Monitor error logs for 24 hours
- [ ] Verify import success metrics

---

## 📊 Success Metrics

After deployment, track:

- [ ] Import completion rate (target: > 85%)
- [ ] Average time to first upload (target: < 3 minutes)
- [ ] Mobile vs desktop usage (expect mobile increase)
- [ ] Template download rate (should decrease)
- [ ] Support tickets related to import format (should decrease)
- [ ] User satisfaction feedback

---

## 🐛 Known Issues & Considerations

- [ ] **File size limits**: Ensure 10MB is sufficient for typical org structures
- [ ] **Browser compatibility**: Test file upload in Safari, Chrome, Firefox, Edge
- [ ] **Mobile browser differences**: iOS Safari vs Android Chrome
- [ ] **Preview image loading**: Add loading states, error fallbacks
- [ ] **Slow network**: Test on 3G/4G connections
- [ ] **Large organizations**: Test with 1000+ departments/positions

---

## 📝 Notes

### Important Reminders:
1. **Excel headers MUST match database columns exactly** (no synonyms)
2. **Exactly 3 data rows** in preview images (not 2, not 4)
3. **No sidebar navigation** for import (access from pages only)
4. **Mobile-first** design approach
5. **Visual learning** is the key innovation

### Dependencies:
- `react-dropzone` for file upload
- `next/image` for optimized images
- `lucide-react` for icons
- shadcn/ui components (Tabs, Accordion, Alert, Badge, Card, Button)

### Future Enhancements (Not in Scope):
- [ ] Column mapping (if user's Excel has different names)
- [ ] Live preview of parsed data before import
- [ ] Bulk edit capabilities after import
- [ ] Import history/logs
- [ ] Template generator (dynamic based on existing data)

---

## ✅ Definition of Done

A task is complete when:
- [ ] Code is written and tested
- [ ] TypeScript has no errors
- [ ] Component is responsive (mobile/tablet/desktop)
- [ ] Light and dark themes work
- [ ] Translations are added (en + tr)
- [ ] Accessibility requirements met
- [ ] Unit tests pass
- [ ] Code review approved
- [ ] Deployed to staging and tested

---

**Ready to build!** 🚀

Start with Phase 1 (components), then routes, then integration. Test thoroughly at each phase.
