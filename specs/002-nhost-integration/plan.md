# Implementation Plan: Nhost Integration for Authentication, Storage, and Database

**Branch**: `002-nhost-integration` | **Date**: 2025-10-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-nhost-integration/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Integrate Nhost as the backend-as-a-service (BaaS) platform to provide authentication, file storage, and PostgreSQL database with GraphQL API for the JobE frontend. This implementation will establish secure user authentication with email/password, role-based access control (admin, employer, candidate), file upload/download capabilities for resumes and documents, and a GraphQL API for managing organizations, positions, questionnaires, and applications. The Nhost backend is already deployed and running with local development using subdomain "local" and staging environment using subdomain "bgkrpcjhawoxjnfxufdf" in eu-central-1 region.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled) with Next.js 15.0.3  
**Primary Dependencies**: 
- @nhost/nextjs (Nhost SDK for Next.js with React hooks)
- @nhost/nhost-js (Core Nhost client)
- graphql (GraphQL client for queries/mutations/subscriptions)
- @graphql-codegen/* (GraphQL code generation for TypeScript types)

**Storage**: 
- Nhost Storage (S3-compatible object storage) for file uploads
- PostgreSQL (via Nhost) for relational data
- GraphQL API (via Hasura on Nhost) for data operations

**Testing**: Jest + React Testing Library (unit/integration), Playwright (E2E)  
**Target Platform**: Web (Next.js App Router with Server/Client Components)  
**Project Type**: Web application (Next.js frontend with Nhost backend)  
**Performance Goals**: 
- GraphQL queries <500ms for datasets up to 1000 records
- File uploads <10s for 5MB files on standard broadband
- Login/authentication <5s
- Real-time updates <2s

**Constraints**: 
- Session timeout: 24 hours inactivity
- File size limit: 10MB per file
- Login rate limiting: CAPTCHA after 3 failures, 15-min lockout after 5
- 500 concurrent authenticated users support
- WCAG 2.1 AA accessibility compliance

**Scale/Scope**: 
- Multi-tenant HR platform (single-user per client workflow)
- 8 key entities (User, Organization, Position, Questionnaire, Application, File, Role, Session)
- 48 functional requirements across authentication, storage, database, security, and observability
- English and Turkish language support (i18n)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Component-First Architecture ✅ PASS
- **Reusable auth components**: Login, Register, PasswordReset, Profile forms
- **File upload components**: FileUploader, FileList, FilePreview with clear props
- **GraphQL query hooks**: Custom hooks wrapping Nhost/GraphQL operations
- **Self-contained**: Each component manages its own state and side effects
- **Single responsibility**: Auth components handle authentication, file components handle storage

### II. Test-Driven Development (TDD) ✅ PASS (Commitment Required)
- TDD will be strictly followed for all implementation
- Tests written before implementation for:
  - Authentication flows (login, register, logout, password reset)
  - File upload/download/delete operations
  - GraphQL queries and mutations
  - Rate limiting and CAPTCHA logic
  - Session management and security

### III. Clean Code & Simplicity (YAGNI) ✅ PASS
- Using Nhost SDK (existing, well-tested solution) instead of custom auth
- Minimal dependencies: @nhost/nextjs, @nhost/nhost-js, graphql
- No premature abstractions: Direct use of Nhost hooks initially
- Simple patterns: React hooks and Context API for state management
- Justified dependencies: Nhost chosen for managed infrastructure vs building custom backend

### IV. Progressive Disclosure UX ✅ PASS
- Core authentication flow accessible immediately (login/register)
- Advanced features (file management, profile settings) accessible after login
- Error messages inline and contextual
- Multi-step processes (file upload with retry) show clear progress
- Mobile-first responsive design with Tailwind CSS
- Keyboard navigation for all interactive elements

### V. Accessibility as Standard ✅ PASS
- Form inputs with proper labels and ARIA attributes
- Keyboard navigation for auth forms and file uploads
- Focus indicators visible (Tailwind focus utilities)
- Error messages announced to screen readers
- Semantic HTML throughout (forms, buttons, inputs)
- CAPTCHA alternative for accessibility compliance
- Screen reader tested for critical workflows

### VI. Branch Strategy & Deployment Discipline ✅ PASS
- Feature branch `002-nhost-integration` created from `develop`
- All changes via PR with tests passing
- No direct commits to `develop` or `main`
- Staging validation before production merge

### Technology Stack Constraints ✅ PASS
- ✅ Next.js 15.0.3 with TypeScript (strict mode)
- ✅ Tailwind CSS for styling
- ✅ React hooks and Context for state (Nhost SDK provides these)
- ✅ Jest + React Testing Library + Playwright
- ✅ pnpm package manager
- ✅ English and Turkish i18n support (via next-intl)

## Project Structure

### Documentation (this feature)

```text
specs/002-nhost-integration/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── schema.graphql   # Generated GraphQL schema
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── [locale]/
│   ├── (auth)/                  # Authentication routes group
│   │   ├── login/
│   │   │   └── page.tsx        # Login page
│   │   ├── register/
│   │   │   └── page.tsx        # Registration page
│   │   ├── reset-password/
│   │   │   └── page.tsx        # Password reset page
│   │   └── verify-email/
│   │       └── page.tsx        # Email verification page
│   └── (dashboard)/             # Protected dashboard routes
│       ├── profile/
│       │   └── page.tsx        # User profile with file management
│       └── [existing pages]

components/
├── auth/                        # Authentication components
│   ├── login-form.tsx
│   ├── register-form.tsx
│   ├── password-reset-form.tsx
│   ├── captcha.tsx
│   └── __tests__/
│       ├── login-form.test.tsx
│       ├── register-form.test.tsx
│       └── password-reset-form.test.tsx
├── files/                       # File management components
│   ├── file-uploader.tsx
│   ├── file-list.tsx
│   ├── file-preview.tsx
│   └── __tests__/
│       ├── file-uploader.test.tsx
│       ├── file-list.test.tsx
│       └── file-preview.test.tsx
├── providers/
│   ├── nhost-provider.tsx      # Nhost client provider
│   ├── auth-provider.tsx       # Authentication context
│   └── theme-provider.tsx      # [existing]
└── [existing layout/ui components]

lib/
├── nhost/
│   ├── client.ts               # Nhost client configuration
│   ├── auth.ts                 # Authentication utilities
│   ├── storage.ts              # File storage utilities
│   └── graphql/
│       ├── client.ts           # GraphQL client setup
│       ├── queries.ts          # GraphQL queries
│       ├── mutations.ts        # GraphQL mutations
│       ├── subscriptions.ts    # GraphQL subscriptions
│       └── generated/          # Auto-generated types from schema
│           └── graphql.ts
├── hooks/
│   ├── use-auth.ts             # Authentication hook
│   ├── use-file-upload.ts      # File upload hook with retry
│   └── use-graphql.ts          # GraphQL query/mutation hooks
├── types/
│   ├── nhost.ts                # Nhost-specific types
│   └── [existing types]
└── [existing lib files]

middleware.ts                    # Updated with Nhost auth middleware

.env.local                       # Local Nhost configuration
.env.staging                     # Staging Nhost configuration (template)

tests/
├── e2e/                         # Playwright E2E tests
│   ├── auth.spec.ts            # Authentication flows
│   ├── file-upload.spec.ts     # File upload/download
│   └── graphql.spec.ts         # GraphQL operations
└── [existing test structure]
```

**Structure Decision**: Next.js App Router structure with route groups for authentication and protected dashboard routes. Nhost integration follows Next.js patterns with providers at app level, reusable components in `components/`, and Nhost utilities in `lib/nhost/`. This aligns with existing project structure and Next.js 15 best practices.

## Complexity Tracking

> **No violations - all Constitution principles satisfied**

This implementation introduces no complexity violations:
- Uses existing Next.js patterns and structure
- Minimal dependencies (Nhost SDK is justified as managed BaaS)
- Component-first architecture with reusable auth and file components
- TDD approach with comprehensive test coverage
- Clean, simple code using Nhost SDK hooks and utilities
- No custom abstractions beyond what Nhost provides

---

## Phase 0: Research ✅ COMPLETE

**Output**: [research.md](./research.md)

**Key Decisions Made**:
1. **Nhost SDK**: `@nhost/nextjs` and `@nhost/nhost-js` for official Next.js support
2. **GraphQL Tooling**: `graphql-codegen` for TypeScript type generation
3. **Authentication**: Nhost built-in auth with custom UI components
4. **File Upload**: Direct upload to Nhost Storage with retry logic
5. **Rate Limiting**: Nhost + reCAPTCHA v3 for security
6. **i18n Integration**: Extend existing `next-intl` for auth messages
7. **Environment Config**: Separate configs for local/staging/production
8. **Middleware**: Nhost middleware for route protection
9. **Error Handling**: Structured logging per FR-043 through FR-048
10. **Testing**: Multi-layered with mocked Nhost SDK

All technical unknowns resolved. Ready for Phase 1.

---

## Phase 1: Design & Contracts ✅ COMPLETE

**Outputs**:
- [data-model.md](./data-model.md) - Database schema with 8 entities
- [contracts/schema.graphql.md](./contracts/schema.graphql.md) - GraphQL API schema
- [quickstart.md](./quickstart.md) - Developer quick reference guide
- `.github/copilot-instructions.md` - Updated agent context

**Data Model Summary**:
- 8 core entities: User, Role, UserRole, Organization, Position, Questionnaire, Application, File
- Row-level security (RLS) for all tables
- Referential integrity with foreign keys
- Audit trails with created_at/updated_at timestamps
- Hard delete for users (FR-012), soft delete where appropriate

**GraphQL API Summary**:
- Queries for all entities with filtering, sorting, pagination
- Mutations for CRUD operations with validation
- Subscriptions for real-time updates
- Type-safe operations with auto-generated TypeScript types
- Hasura permissions model (admin, employer, candidate, anonymous)

**Environment Configuration**:
- Local: `subdomain=local, region=` (empty)
- Staging: `subdomain=bgkrpcjhawoxjnfxufdf, region=eu-central-1`
- Production: TBD

**Agent Context Updated**: GitHub Copilot instructions now include TypeScript 5.x with Next.js 15.0.3

---

## Constitution Re-Check ✅ PASS

All principles verified after Phase 1 design:

- ✅ **Component-First**: Auth, file upload, GraphQL components designed as reusable units
- ✅ **TDD**: Testing strategy defined with mocking patterns
- ✅ **Clean Code**: Nhost SDK usage minimizes custom code, no unnecessary abstractions
- ✅ **Progressive Disclosure**: Auth flows simple, advanced features accessible after login
- ✅ **Accessibility**: Keyboard navigation, ARIA, semantic HTML in all components
- ✅ **Branch Strategy**: Feature branch workflow followed
- ✅ **Tech Stack**: All constraints satisfied (Next.js, TypeScript, Tailwind, pnpm, i18n)

---

## Next Steps

Phase 2 planning complete. To proceed with task breakdown and implementation:

```bash
/speckit.tasks
```

This will generate `tasks.md` with detailed, granular implementation tasks following TDD methodology.

**Estimated Scope**:
- ~40-50 implementation tasks
- ~20-30 test tasks
- ~10 configuration/setup tasks
- Total: ~70-90 tasks

**Critical Path**:
1. Nhost provider and environment setup
2. Authentication components (login, register, password reset)
3. File upload components with retry logic
4. GraphQL client and code generation
5. Database schema deployment
6. Middleware for route protection
7. i18n message integration
8. E2E testing

**Ready for**: `/speckit.tasks` command to generate detailed task breakdown.

