# Implementation Guide: Org Structure Import UX Redesign

## 🎯 Overview

This guide provides step-by-step instructions for implementing the redesigned organization structure import experience.

---

## 📋 Implementation Phases

### Phase 1: Navigation Restructure (2-3 days)

#### Tasks

**1. Update Navigation Config**
- File: `config/navigation.ts`
- Change: Replace flat "Import" with hierarchical "Org Structure"

```typescript
// BEFORE
{
  id: 'import',
  label: 'navigation.import',
  icon: 'Upload',
  href: '/import',
  requiredRoles: ['user', 'admin'],
}

// AFTER
{
  id: 'orgStructure',
  label: 'navigation.orgStructure',
  icon: 'Building2',
  href: '/org-structure',
  requiredRoles: ['user', 'admin'],
  children: [
    {
      id: 'departments',
      label: 'navigation.departments',
      icon: 'FolderKanban',
      href: '/org-structure/departments',
      requiredRoles: ['user', 'admin'],
    },
    {
      id: 'positions',
      label: 'navigation.positions',
      icon: 'Briefcase',
      href: '/org-structure/positions',
      requiredRoles: ['user', 'admin'],
    },
    {
      id: 'import',
      label: 'navigation.import',
      icon: 'Upload',
      href: '/org-structure/import',
      requiredRoles: ['user', 'admin'],
    },
  ],
}
```

**2. Update Sidebar Component**
- File: `components/layout/sidebar.tsx`
- Add: Support for nested navigation items
- Add: Expand/collapse for parent items

**3. Add Translation Keys**
- Files: `messages/en.json`, `messages/tr.json`

```json
// en.json
{
  "navigation": {
    "orgStructure": "Org Structure",
    "departments": "Departments",
    "positions": "Positions",
    "import": "Import Data"
  }
}

// tr.json
{
  "navigation": {
    "orgStructure": "Organizasyon Yapısı",
    "departments": "Departmanlar",
    "positions": "Pozisyonlar",
    "import": "Veri İçe Aktar"
  }
}
```

**4. Update Routes**
- Move: `/dashboard/[orgId]/import` → `/dashboard/[orgId]/org-structure/import`
- Create: `/dashboard/[orgId]/org-structure` (overview page)

---

### Phase 2: Dashboard Onboarding (3-4 days)

#### Tasks

**1. Create Empty State Component**
- File: `components/dashboard/org-setup-empty-state.tsx`
- Purpose: Show when org has no departments/positions

```tsx
interface OrgSetupEmptyStateProps {
  organizationId: string;
  organizationName: string;
  locale: string;
}

export function OrgSetupEmptyState({ 
  organizationId, 
  organizationName,
  locale 
}: OrgSetupEmptyStateProps) {
  // Component implementation
}
```

**2. Create Progress Indicator Component**
- File: `components/dashboard/org-structure-progress.tsx`
- Purpose: Show completion status

```tsx
interface OrgStructureProgressProps {
  departments: number;
  positions: number;
  evaluations: number;
  organizationId: string;
  locale: string;
}

export function OrgStructureProgress({ 
  departments, 
  positions, 
  evaluations,
  organizationId,
  locale 
}: OrgStructureProgressProps) {
  // Component implementation with progress ring
}
```

**3. Update Dashboard Page**
- File: `app/[locale]/dashboard/[orgId]/page.tsx`
- Add: Query for org structure counts
- Add: Conditional rendering based on org state

```tsx
export default async function DashboardPage() {
  const orgId = params.orgId as string;
  
  // Query org structure
  const { departments, positions, evaluations } = await getOrgStructure(orgId);
  
  const isEmpty = departments === 0 && positions === 0;
  const isComplete = evaluations > 0;
  
  return (
    <div className="p-8 space-y-6">
      {isEmpty && <OrgSetupEmptyState />}
      {!isEmpty && !isComplete && <OrgStructureProgress />}
      {/* Rest of dashboard */}
    </div>
  );
}
```

**4. Add GraphQL Queries**
- File: `lib/graphql/queries/org-structure.ts`

```typescript
export const GET_ORG_STRUCTURE_COUNTS = `
  query GetOrgStructureCounts($organizationId: uuid!) {
    departments_aggregate(where: { organizationId: { _eq: $organizationId } }) {
      aggregate {
        count
      }
    }
    positions_aggregate(where: { organizationId: { _eq: $organizationId } }) {
      aggregate {
        count
      }
    }
    evaluations_aggregate(where: { 
      position: { organizationId: { _eq: $organizationId } } 
    }) {
      aggregate {
        count
      }
    }
  }
`;
```

---

### Phase 3: Import Wizard (5-7 days)

#### Tasks

**1. Create Wizard Component**
- File: `components/import/import-wizard.tsx`
- Features: Multi-step form, progress indicator, navigation

```tsx
type WizardStep = 'template' | 'upload' | 'review' | 'success';

interface ImportWizardProps {
  organizationId: string;
  onComplete: () => void;
}

export function ImportWizard({ organizationId, onComplete }: ImportWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('template');
  
  // Step components
}
```

**2. Create Template Download Component**
- File: `components/import/template-download-step.tsx`
- Features: Download button, format explanation, examples

```tsx
export function TemplateDownloadStep({ onNext }: { onNext: () => void }) {
  const handleDownload = () => {
    // Generate and download Excel template
  };
  
  return (
    <div className="space-y-6">
      {/* Template info and download button */}
    </div>
  );
}
```

**3. Create Template Generator**
- File: `lib/utils/excel-template-generator.ts`
- Purpose: Generate Excel file with example data and validation

```typescript
import * as XLSX from 'xlsx';

export function generateOrgStructureTemplate(): Blob {
  // Create workbook with Departments and Positions sheets
  // Add example data
  // Add validation rules (dropdowns, etc.)
  // Return as Blob for download
}
```

**4. Update Upload Component**
- File: `components/import/file-upload.tsx`
- Add: Better visual design, tips, error handling

**5. Create Review Component**
- File: `components/import/import-review-step.tsx`
- Features: Summary stats, tabbed data preview, validation status

```tsx
interface ImportReviewStepProps {
  preview: ImportPreview;
  onBack: () => void;
  onConfirm: () => void;
}

export function ImportReviewStep({ 
  preview, 
  onBack, 
  onConfirm 
}: ImportReviewStepProps) {
  return (
    <div className="space-y-6">
      {/* Summary card */}
      {/* Tabs for Departments/Positions */}
      {/* Data preview tables */}
      {/* Actions */}
    </div>
  );
}
```

**6. Create Success Component**
- File: `components/import/import-success-step.tsx`
- Features: Results summary, next steps, action buttons

```tsx
interface ImportSuccessStepProps {
  results: {
    departmentsCreated: number;
    positionsCreated: number;
    duration: number;
  };
  organizationId: string;
  onDone: () => void;
}

export function ImportSuccessStep({ 
  results, 
  organizationId,
  onDone 
}: ImportSuccessStepProps) {
  return (
    <div className="space-y-6">
      {/* Success message with animation */}
      {/* Results card */}
      {/* What's next section */}
      {/* Action buttons */}
    </div>
  );
}
```

**7. Update Import Page**
- File: `app/[locale]/dashboard/[orgId]/org-structure/import/page.tsx`
- Replace: Existing import UI with new wizard

```tsx
'use client';

import { ImportWizard } from '@/components/import/import-wizard';

export default function ImportPage() {
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId as string;
  
  const handleComplete = () => {
    router.push(`/${params.locale}/dashboard/${orgId}`);
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <ImportWizard 
        organizationId={orgId}
        onComplete={handleComplete}
      />
    </div>
  );
}
```

---

### Phase 4: Org Structure Pages (4-5 days)

#### Tasks

**1. Create Departments Page**
- File: `app/[locale]/dashboard/[orgId]/org-structure/departments/page.tsx`

```tsx
export default async function DepartmentsPage() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Departments</h1>
          <p className="text-muted-foreground">
            Manage your organization's departments
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Department
        </Button>
      </div>
      
      <DepartmentsList organizationId={orgId} />
    </div>
  );
}
```

**2. Create Departments List Component**
- File: `components/departments/departments-list.tsx`
- Features: Search, filter, list view, actions

**3. Create Positions Page**
- File: `app/[locale]/dashboard/[orgId]/org-structure/positions/page.tsx`

```tsx
export default async function PositionsPage() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Positions</h1>
          <p className="text-muted-foreground">
            Manage your organization's positions
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Position
        </Button>
      </div>
      
      <PositionsList organizationId={orgId} />
    </div>
  );
}
```

**4. Create Positions List Component**
- File: `components/positions/positions-list.tsx`
- Features: Search, filter by department, status badges, evaluation status

**5. Create Org Structure Overview Page**
- File: `app/[locale]/dashboard/[orgId]/org-structure/page.tsx`
- Purpose: Landing page showing summary and quick actions

```tsx
export default async function OrgStructurePage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Organization Structure</h1>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Departments" count={departments} />
        <StatsCard title="Positions" count={positions} />
        <StatsCard title="Evaluated" count={evaluations} />
      </div>
      
      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActionCard
          title="Import from Excel"
          description="Bulk upload departments and positions"
          href="/org-structure/import"
          icon={<Upload />}
        />
        <ActionCard
          title="View Structure"
          description="See your org chart"
          href="/org-structure/chart"
          icon={<Network />}
        />
      </div>
    </div>
  );
}
```

---

### Phase 5: Polish & Responsive (3-4 days)

#### Tasks

**1. Responsive Design**
- Mobile: Simplify wizard steps, use accordions
- Tablet: Optimize two-column layouts
- Desktop: Full wizard experience

**2. Micro-interactions**
- Add: Loading animations
- Add: Success confetti on import complete
- Add: Smooth transitions between steps
- Add: Hover effects on cards

**3. Accessibility**
- Add: Proper ARIA labels
- Add: Keyboard navigation support
- Add: Focus management in wizard
- Test: Screen reader compatibility

**4. Error Handling**
- Add: Graceful error messages
- Add: Retry mechanisms
- Add: Help text and tooltips
- Add: Inline validation

---

## 🔧 Technical Requirements

### Dependencies

```json
{
  "xlsx": "^0.18.5",           // Excel file generation
  "react-confetti": "^6.1.0",  // Success animation
  "framer-motion": "^11.0.0"   // Smooth animations
}
```

### API Endpoints

**1. Generate Template**
```typescript
// GET /api/organizations/[orgId]/import/template
// Returns: Excel file blob
```

**2. Get Org Structure Counts**
```typescript
// GET /api/organizations/[orgId]/structure/counts
// Returns: { departments, positions, evaluations }
```

### Database Queries

**Check if org is empty:**
```sql
SELECT 
  (SELECT COUNT(*) FROM departments WHERE organization_id = $1) as dept_count,
  (SELECT COUNT(*) FROM positions WHERE organization_id = $1) as pos_count;
```

---

## 📊 Testing Checklist

### Unit Tests
- [ ] Template generator creates valid Excel
- [ ] Progress calculation is correct
- [ ] Empty state detection works
- [ ] Step navigation logic

### Integration Tests
- [ ] Complete wizard flow
- [ ] Template download works
- [ ] File upload and validation
- [ ] Import execution
- [ ] Navigation updates

### E2E Tests
- [ ] New user creates org → sees onboarding
- [ ] User downloads template
- [ ] User uploads template → sees preview
- [ ] User confirms import → sees success
- [ ] User redirected to dashboard with progress

### Manual Testing
- [ ] Mobile responsiveness
- [ ] Tablet layout
- [ ] Desktop experience
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Error scenarios
- [ ] Network failures

---

## 🚀 Deployment Strategy

### Phase 1: Feature Flag
Deploy behind feature flag `enable_new_import_ux`

```typescript
// config/features.ts
export const features = {
  enableNewImportUX: process.env.ENABLE_NEW_IMPORT_UX === 'true',
};
```

### Phase 2: Beta Users
Enable for 10% of organizations

### Phase 3: Rollout
Gradually increase to 100% over 1 week

### Phase 4: Cleanup
Remove old import page and feature flag

---

## 📈 Success Metrics

Track these metrics post-launch:

### User Behavior
- Time from org creation to first import
- Import success rate (first attempt)
- Wizard completion rate
- Template download rate
- Average time in wizard

### Business Impact
- User activation rate
- Time to first evaluation
- Support ticket volume
- User satisfaction scores

### Technical
- API response times
- Error rates
- Template download failures
- Upload success rates

---

## 🐛 Known Issues & Mitigations

### Issue 1: Large Excel Files
- **Problem**: Files > 5MB slow down preview
- **Mitigation**: Limit preview to first 100 rows
- **Future**: Server-side processing

### Issue 2: Browser Compatibility
- **Problem**: Older browsers may not support File API
- **Mitigation**: Polyfills for IE11 (if needed)
- **Fallback**: Traditional file input

### Issue 3: Mobile Upload
- **Problem**: Mobile file picking is limited
- **Mitigation**: Support multiple upload methods
- **Alternative**: Email template feature

---

## 📚 Documentation

### User Documentation
- [ ] How to use Excel import (help article)
- [ ] Template format guide
- [ ] Video tutorial
- [ ] FAQ section

### Developer Documentation
- [ ] Component API docs
- [ ] State management flow
- [ ] Error handling guide
- [ ] Testing guide

---

## 🎯 Next Steps

1. **Review this implementation guide** with the team
2. **Create Jira/Linear tickets** for each phase
3. **Design high-fidelity mockups** in Figma
4. **Set up feature flag** infrastructure
5. **Begin Phase 1 implementation**

---

## 📞 Support

Questions or issues during implementation? Reach out to:
- **UX Design**: [Your UX Designer]
- **Tech Lead**: [Your Tech Lead]
- **Product**: [Your PM]

---

**Last Updated**: 2025-10-29
**Version**: 1.0
**Status**: Ready for Implementation
