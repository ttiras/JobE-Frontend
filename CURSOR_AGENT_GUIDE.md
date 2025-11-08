# JobE Frontend - Comprehensive AI Agent Guide

> **Purpose**: This document provides comprehensive context for AI agents (like Cursor) to understand the JobE Frontend application architecture, patterns, and conventions.

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Application Overview](#application-overview)
3. [Architecture & Patterns](#architecture--patterns)
4. [Key Features & Implementation](#key-features--implementation)
5. [Common Tasks & Solutions](#common-tasks--solutions)
6. [Testing Strategy](#testing-strategy)
7. [Documentation Structure](#documentation-structure)

---

## Quick Start

### Essential Files to Read First
1. **`.cursorrules`** - Core rules and patterns (Cursor automatically reads this)
2. **`.specify/memory/constitution.md`** - Non-negotiable principles
3. **`README.md`** - Project setup and overview
4. **This file** - Comprehensive architecture guide

### Key Commands
```bash
pnpm dev          # Start development server
pnpm test         # Run all tests
pnpm type-check   # TypeScript type checking
pnpm lint         # ESLint checking
```

---

## Application Overview

### What is JobE?
JobE is a **multi-tenant HR application** for:
- Managing organizational structures (departments, positions)
- Evaluating positions through questionnaires
- Analyzing compensation strategies
- Comparing with industry standards (Mercer, Korn Ferry)

### Tech Stack Summary
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend**: Nhost (GraphQL API, Authentication, File Storage)
- **State**: React Context API + Hooks
- **i18n**: next-intl (English default, Turkish support)
- **Testing**: Jest, React Testing Library, Playwright
- **Package Manager**: pnpm

### Current Status
- **Test Coverage**: 457 tests passing (100% pass rate)
- **TypeScript**: Strict mode, zero errors
- **Accessibility**: WCAG 2.1 AA compliant
- **Implementation**: ~48% complete (120/251 tasks)

---

## Architecture & Patterns

### File Structure
```
JobE-Frontend/
├── app/[locale]/              # Next.js App Router with i18n
│   ├── (auth)/               # Auth routes (login, register)
│   ├── (dashboard)/          # Protected dashboard routes
│   └── dashboard/[orgId]/    # Organization-scoped routes
├── components/               # Reusable components
│   ├── auth/                # Authentication components
│   ├── hierarchy/           # Org structure visualization
│   ├── import/              # Excel import wizard
│   ├── layout/              # Layout components (sidebar, header)
│   └── ui/                  # shadcn/ui base components
├── lib/                     # Core utilities
│   ├── nhost/              # Nhost client setup (server/client)
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # React contexts (auth, org)
│   └── utils/              # Utility functions
├── hooks/                   # Feature-specific hooks
├── tests/                   # Test files
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
└── docs/                   # Comprehensive documentation
```

### Routing Pattern
- **Default locale (en)**: URLs omit locale prefix
  - ✅ `/dashboard` (correct)
  - ❌ `/en/dashboard` (wrong)
- **Turkish locale**: Uses `/tr` prefix
  - ✅ `/tr/dashboard` (correct)
- **Organization-scoped**: `/dashboard/[orgId]/...`
- **Protected routes**: Middleware checks authentication

### Component Architecture

#### Component-First Principle
Every feature is built with reusable components:
- Components are self-contained with single responsibility
- Independently testable without external dependencies
- Clear, documented interfaces (TypeScript props)
- Composition over configuration

#### Example Component Structure
```typescript
// components/feature/component-name.tsx
'use client';

import { useTranslations } from 'next-intl';

interface ComponentNameProps {
  // Clear TypeScript interface
  required: string;
  optional?: number;
}

export function ComponentName({ required, optional }: ComponentNameProps) {
  const t = useTranslations('namespace');
  // Implementation
}
```

### State Management
- **Local State**: `useState`, `useReducer` for component state
- **Shared State**: React Context API
  - `AuthContext` - Authentication state
  - `OrganizationContext` - Current organization
- **Server State**: Nhost GraphQL queries/mutations
- **No Redux/Zustand**: Keep it simple (YAGNI principle)

### Authentication Flow

#### Session Management
- **Storage**: HTTP-only cookies (secure, SSR-compatible)
- **Refresh**: Automatic with exponential backoff
- **SSR**: Server-side session validation
- **Client**: Client-side session refresh hooks

#### Key Files
- `lib/nhost/server-client.ts` - Server-side Nhost client
- `lib/nhost/client.ts` - Client-side Nhost client
- `lib/hooks/use-session-refresh.ts` - Auto-refresh hook
- `lib/contexts/auth-context.tsx` - Auth state context

#### Pattern
```typescript
// Server Component
import { createServerClient } from '@/lib/nhost/server-client';
const nhost = await createServerClient();
const session = await nhost.auth.getSession();

// Client Component
import { useAuth } from '@/lib/contexts/auth-context';
const { user, isLoading } = useAuth();
```

---

## Key Features & Implementation

### Excel Import System

#### Architecture
- **Separate Pages**: Departments and positions imported on different routes
- **Single Sheet**: Parser only reads first sheet of Excel file
- **Type Parameter**: `parseExcelImport(buffer, importType)` requires explicit type

#### Import Flow
1. User uploads Excel file
2. File parsed based on `importType` ('departments' or 'positions')
3. Data validated (required fields, references, duplicates)
4. Preview shown with CREATE/UPDATE operations
5. User confirms import
6. Batch import executed with progress tracking

#### Key Files
- `lib/utils/excel/parser.ts` - Excel parsing logic
- `lib/utils/excel/validator.ts` - Data validation
- `hooks/useImportWorkflow.ts` - Import workflow state
- `components/import/` - Import wizard components

#### Important Notes
- **Single sheet only**: Parser uses `workbook.SheetNames[0]`
- **Import type required**: Must pass 'departments' or 'positions'
- **Validation**: Checks required fields, referential integrity, duplicates
- **Batch processing**: Uses `BatchImportManager` for progress tracking

### Internationalization (i18n)

#### Locale Handling
- **Default (en)**: Omitted from URLs
- **Turkish (tr)**: Uses `/tr` prefix
- **Detection**: Automatic based on URL or browser preference

#### Translation Pattern
```typescript
// In component
import { useTranslations } from 'next-intl';
const t = useTranslations('namespace.key');

// Translation files
// messages/en.json
{
  "namespace": {
    "key": "English text"
  }
}
```

#### URL Pattern
```typescript
// Correct: Default locale omitted
href={locale === 'en' ? '/dashboard' : `/${locale}/dashboard`}

// Navigation
router.push(locale === 'en' ? '/login' : `/${locale}/login`);
```

### Role-Based Access Control (RBAC)

#### Implementation
- **Database**: Roles stored in `auth.roles` table
- **Middleware**: Route protection based on roles
- **Navigation**: Menu items filtered by user role
- **JWT**: Roles included in JWT token

#### Pattern
```typescript
// Navigation config
{
  id: 'feature',
  requiredRoles: ['admin', 'hr_manager'],
  // ...
}

// Component check
const { user } = useAuth();
const hasAccess = user?.roles?.includes('admin');
```

### Error Handling

#### Strategy
- **User-Facing**: Translated error messages
- **Logging**: `lib/utils/error-logger.ts` for server errors
- **Boundaries**: React error boundaries for component errors
- **Network**: Graceful handling with retry logic

#### Pattern
```typescript
try {
  // Operation
} catch (error) {
  logError(error); // Server-side logging
  showError(t('errors.operationFailed')); // User-friendly message
}
```

---

## Common Tasks & Solutions

### Adding a New Page

1. **Create route file**: `app/[locale]/dashboard/[orgId]/new-page/page.tsx`
2. **Add navigation**: Update `config/navigation.ts`
3. **Add translations**: Update `messages/en.json` and `messages/tr.json`
4. **Write tests**: Create test file in `tests/unit/` or `tests/integration/`
5. **Update docs**: Document in `docs/` if significant feature

### Creating a New Component

1. **Write test first** (TDD requirement)
2. **Create component**: `components/feature/component-name.tsx`
3. **Add TypeScript interface** for props
4. **Ensure accessibility**: ARIA labels, keyboard nav, focus management
5. **Add translations** if user-facing text
6. **Export from index.ts** if part of feature module

### Adding a GraphQL Query/Mutation

1. **Define in Nhost Console** (Hasura)
2. **Generate types**: `pnpm codegen` (if configured)
3. **Create query file**: `lib/graphql/queries/feature.graphql`
4. **Use in component**: `nhost.graphql.request(query, variables)`
5. **Handle errors**: Try-catch with user-friendly messages

### Fixing Tests

1. **Run specific test**: `pnpm test path/to/test.ts`
2. **Check error message**: Understand what's failing
3. **Review implementation**: Check if test or code needs fixing
4. **Update test**: Fix expectations to match actual behavior
5. **Run full suite**: `pnpm test` to ensure no regressions

### Debugging Session Issues

1. **Check cookies**: Browser DevTools → Application → Cookies
2. **Check server logs**: Nhost dashboard → Logs
3. **Verify middleware**: `middleware.ts` session validation
4. **Test refresh**: Check `use-session-refresh.ts` hook
5. **Review docs**: `docs/security-audit-session-control.md`

---

## Testing Strategy

### Test Types

#### Unit Tests (`tests/unit/`)
- Test individual functions/components in isolation
- Mock external dependencies
- Fast execution
- Example: `tests/unit/excel/parser.test.ts`

#### Integration Tests (`tests/integration/`)
- Test feature workflows
- Test component interactions
- May use real dependencies
- Example: `tests/integration/import/upload-flow.test.ts`

#### E2E Tests (`tests/e2e/`)
- Test complete user flows
- Use Playwright
- Run against deployed/staging environment
- Example: `tests/e2e/auth.spec.ts`

### TDD Workflow
1. **Write test** (should fail initially)
2. **Run test** (confirm it fails)
3. **Write minimal implementation** (make test pass)
4. **Refactor** (improve code while keeping tests green)
5. **Repeat**

### Test Patterns

#### Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

const messages = { /* mock translations */ };

it('should render component', () => {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <Component />
    </NextIntlClientProvider>
  );
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

#### Hook Testing
```typescript
import { renderHook, act } from '@testing-library/react';

it('should update state', () => {
  const { result } = renderHook(() => useCustomHook());
  act(() => {
    result.current.updateState('value');
  });
  expect(result.current.state).toBe('value');
});
```

---

## Documentation Structure

### Key Documentation Files

#### Core Principles
- **`.specify/memory/constitution.md`** - Non-negotiable principles (MUST READ)
- **`.cursorrules`** - Cursor AI agent rules (automatically read)

#### Project Overview
- **`README.md`** - Setup, overview, getting started
- **`CURSOR_AGENT_GUIDE.md`** - This file (comprehensive guide)

#### Implementation Status
- **`IMPLEMENTATION_SUMMARY.md`** - Current progress and status
- **`PHASE-*-COMPLETE.md`** - Phase completion summaries

#### Feature Documentation
- **`docs/rbac.md`** - Role-Based Access Control
- **`docs/security-audit-session-control.md`** - Session management
- **`docs/database-setup-instructions.md`** - Database schema
- **`docs/cicd-pipeline-summary.md`** - CI/CD setup

#### Feature-Specific
- **`docs/parser-import-type-fix.md`** - Excel import architecture
- **`docs/test-fix-plan.md`** - Test fixing strategies
- **`EXCEL-IMPORT-SERVER-SIDE.md`** - Server-side import details

### Documentation Conventions
- **Markdown format**: All docs in `.md` files
- **Code examples**: Include TypeScript/TSX examples
- **File paths**: Use relative paths from project root
- **Links**: Use relative links between docs
- **Status badges**: Use ✅/❌/🚧 for status indicators

---

## Important Reminders

### Before Making Changes
- ✅ Check if tests exist (if not, write them first - TDD)
- ✅ Review existing patterns for consistency
- ✅ Check `.specify/memory/constitution.md` for principles
- ✅ Ensure TypeScript types are correct
- ✅ Consider accessibility requirements

### Before Committing
- ✅ Run `pnpm test` (all tests must pass)
- ✅ Run `pnpm type-check` (no TypeScript errors)
- ✅ Run `pnpm lint` (no ESLint errors)
- ✅ Update documentation if needed
- ✅ Follow commit message conventions

### Common Pitfalls to Avoid
- ❌ Don't add dependencies without justification (YAGNI)
- ❌ Don't skip tests (TDD is non-negotiable)
- ❌ Don't forget translations for user-facing text
- ❌ Don't use `/en/` prefix in URLs (default locale omitted)
- ❌ Don't create components without clear single responsibility
- ❌ Don't forget accessibility (ARIA, keyboard nav, focus)

---

## Quick Reference

### File Paths
- **Components**: `components/[feature]/component-name.tsx`
- **Hooks**: `hooks/use-feature-name.ts` or `lib/hooks/use-feature-name.ts`
- **Utils**: `lib/utils/feature-name.ts`
- **Tests**: `tests/[type]/feature-name.test.ts`
- **GraphQL**: `lib/graphql/queries/feature.graphql`

### Import Patterns
```typescript
// Components
import { ComponentName } from '@/components/feature/component-name';

// Hooks
import { useFeature } from '@/hooks/use-feature';

// Utils
import { utilityFunction } from '@/lib/utils/utility';

// Types
import { TypeName } from '@/lib/types/feature';
```

### Common Hooks
- `useAuth()` - Authentication state
- `useOrganization()` - Current organization
- `useTranslations()` - i18n translations
- `useRouter()` - Next.js navigation
- `usePathname()` - Current pathname
- `useParams()` - Route parameters

---

## Getting Help

### When Stuck
1. **Check documentation**: Start with this file and README
2. **Review similar features**: Look for existing patterns
3. **Check tests**: Tests are living documentation
4. **Review constitution**: `.specify/memory/constitution.md` has principles
5. **Check error messages**: Often point to the solution

### Useful Commands
```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm start            # Start production server

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # Coverage report

# Code Quality
pnpm type-check       # TypeScript checking
pnpm lint             # ESLint
pnpm lint:fix         # Auto-fix ESLint issues

# Dependencies
pnpm install          # Install dependencies
pnpm update           # Update dependencies
pnpm audit            # Security audit
```

---

**Last Updated**: Based on current codebase state (all tests passing, 457 tests)
**Maintained By**: Development team
**For Questions**: Review documentation files in `docs/` directory

