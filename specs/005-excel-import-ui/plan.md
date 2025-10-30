# Implementation Plan: Excel Import for Departments and Positions

**Branch**: `005-excel-import-ui` | **Date**: October 29, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-excel-import-ui/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Create a user-friendly Excel import interface that allows organization administrators to bulk upload departments and positions data. The system will use Nhost's file upload function for server-side processing, support upsert behavior (update existing records, insert new ones), validate data integrity including circular reference detection, and provide clear error messages with row/column specificity. The feature restricts import functionality to users with write/admin permissions and uses human-readable codes (dept_code, pos_code) for establishing relationships rather than UUIDs.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled) with Next.js 16.0.0 (App Router)  
**Primary Dependencies**: @nhost/nextjs ^2.3.1, @nhost/nhost-js ^4.0.1, next-intl ^4.4.0 (i18n), NEEDS CLARIFICATION: Excel parsing library  
**Storage**: Nhost (PostgreSQL with GraphQL API via Hasura), Nhost File Storage for uploaded Excel files  
**Testing**: Jest ^30.2.0 + React Testing Library ^16.3.0 (unit/integration), Playwright ^1.56.1 (E2E)  
**Target Platform**: Web application (responsive: desktop primary, mobile-friendly)  
**Project Type**: Web application (Next.js frontend with Nhost backend)  
**Performance Goals**: Import 100 departments + 500 positions in <30 seconds (excluding upload time), file upload <5MB, validation response <2 seconds  
**Constraints**: 5MB max file size, HTTP-only cookies for auth, RBAC enforcement (write/admin only), transactional imports (all-or-nothing)  
**Scale/Scope**: Support organizations up to 1,000 departments and 5,000 positions per import, handle up to ~25,000 Excel rows within 5MB limit

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Component-First Architecture ✅ PASS
- **Upload component**: Reusable file upload with drag-drop, progress tracking
- **Template download button**: Standalone downloadable template component  
- **Validation error list**: Reusable error display with row/column specificity
- **Data preview table**: Reusable table component showing parsed data with create/update indicators
- **Import confirmation dialog**: Reusable modal for confirming import operation
- All components will be self-contained, testable, and follow composition patterns

### II. Test-Driven Development (NON-NEGOTIABLE) ✅ PASS
- TDD mandatory for all components and business logic
- Test coverage for: file upload, Excel parsing, validation logic, upsert detection, error handling
- Unit tests for validation functions (circular reference detection, code uniqueness, reference validation)
- Integration tests for upload → parse → validate → preview → import flow
- E2E tests for complete user journeys (P1 user stories from spec)
- All tests written before implementation

### III. Clean Code & Simplicity (YAGNI) ✅ PASS
- Minimal new dependencies (only Excel parsing library to be researched)
- Single responsibility: separate concerns (upload, parse, validate, import)
- No premature optimization (meet performance goals without over-engineering)
- Self-documenting code with clear naming (e.g., `validateCircularReferences`, `upsertDepartments`)

### IV. Progressive Disclosure UX ✅ PASS
- Primary action: drag-drop upload prominent on page
- Instructions and template download visible but not intrusive
- Advanced features (partial imports, metadata) documented but not required
- Step-by-step flow: upload → validate → preview → confirm → success
- Error messages progressive: summary first, drill-down to row details
- Mobile-responsive design for accessibility across devices

### V. Accessibility as Standard ✅ PASS
- File upload accessible via keyboard (Enter/Space to trigger)
- Drag-drop has keyboard alternative (file picker)
- All error messages announced to screen readers
- Data preview table keyboard navigable
- Focus management through upload → preview → confirmation flow
- Clear labels on all interactive elements
- Color not sole indicator (use icons + text for validation states)

### VI. Branch Strategy & Deployment Discipline ✅ PASS
- Feature branch: `005-excel-import-ui` from `develop`
- All tests must pass before PR to `develop`
- Staging validation on Nhost before production
- Breaking changes: None (net new feature)

### Technology Stack Constraints ✅ PASS
- Next.js 16.0.0 with TypeScript strict mode ✓
- Tailwind CSS for styling ✓
- React hooks and Context API for state ✓
- Jest + React Testing Library + Playwright ✓
- pnpm package manager ✓
- Bilingual support (EN/TR) via next-intl ✓
- Nhost for backend/storage ✓

**Gate Status**: ✅ **PASS** - All constitution principles satisfied. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/005-excel-import-ui/
├── spec.md              # Feature specification
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── import-api.graphql
├── checklists/
│   └── requirements.md  # Specification quality validation
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
└── [locale]/
    └── (dashboard)/
        └── import/
            ├── page.tsx              # Main import page
            └── layout.tsx            # Import section layout

components/
├── import/
│   ├── file-upload.tsx               # Drag-drop upload component
│   ├── template-download.tsx         # Template download button
│   ├── import-preview.tsx            # Data preview table
│   ├── validation-errors.tsx         # Error list component
│   ├── import-confirmation.tsx       # Confirmation dialog
│   └── import-progress.tsx           # Progress indicator
└── ui/
    └── [existing shadcn/ui components]

lib/
├── import/
│   ├── excel-parser.ts               # Excel file parsing logic
│   ├── validators.ts                 # Validation functions (circular refs, uniqueness, etc.)
│   ├── upsert-detector.ts            # Detect create vs update operations
│   └── template-generator.ts         # Generate downloadable Excel template
├── nhost/
│   ├── client.ts                     # Nhost client (existing)
│   └── import-api.ts                 # GraphQL mutations for import
└── types/
    └── import.ts                     # TypeScript types for import operations

tests/
├── unit/
│   ├── excel-parser.test.ts
│   ├── validators.test.ts
│   └── upsert-detector.test.ts
├── integration/
│   └── import-flow.test.tsx
└── e2e/
    └── excel-import.spec.ts

public/
└── templates/
    └── departments-positions-template.xlsx

messages/
├── en.json                           # English translations (import UI)
└── tr.json                           # Turkish translations (import UI)
```

**Structure Decision**: Web application structure using Next.js App Router. Feature located in dashboard section under `/import` route. Import-specific components isolated in `components/import/` directory. Business logic extracted to `lib/import/` for testability. Follows existing project structure patterns with locale-based routing and component organization.

---

## Phase 0: Research & Unknowns
