# Tasks: Nhost Integration

**Feature ID**: 002-nhost-integration  
**Generated**: 2025-10-22  
**Input**: spec.md, plan.md, data-model.md, contracts/schema.graphql.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files### Phase Dependencies

1. **Setup (Phase 1)**: No dependencies - can start immediately
2. **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
3. **User Story 1 (Phase 3 - P1)**: Depends on Foundational phase - Authentication is MVP foundation
4. **User Story 5 (Phase 4 - P1)**: Depends on User Story 1 - Session management extends authentication
5. **User Story 2 (Phase 5 - P2)**: Depends on User Story 1 - File upload requires authentication
6. **User Story 3 (Phase 6 - P2)**: Depends on User Stories 1 & 5 - GraphQL operations require auth
7. **Polish (Phase 7)**: Depends on all desired user stories being complete

**Note**: User Story 4 (Real-time Synchronization) REMOVED - not applicable for single-user-per-client model.dencies)
- **[Story]**: User story ID (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure) ✅

**Purpose**: Project initialization and basic Nhost configuration

- [x] T001 [P] Install Nhost dependencies: `@nhost/nextjs`, `@nhost/nhost-js`, `graphql`, `@graphql-codegen/*` packages
- [x] T002 [P] Create environment configuration files: `.env.local` with local Nhost settings (subdomain=local)
- [x] T003 [P] Create environment template: `.env.staging` with staging settings (subdomain=bgkrpcjhawoxjnfxufdf, region=eu-central-1)
- [x] T004 Configure Nhost client in `lib/nhost/client.ts` with environment variables
- [x] T005 [P] Setup GraphQL Code Generator config in `codegen.ts` for TypeScript type generation
- [x] T006 [P] Add Nhost types in `lib/types/nhost.ts` for user, session, auth state
- [x] T007 [P] Configure reCAPTCHA v3 credentials in environment variables (`NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY`)

**Checkpoint**: ✅ Basic Nhost configuration complete, environment variables configured

**Note**: Hasura automatically creates database migrations when schema/permissions change. Migrations are pushed to GitHub on next commit.

---

## Phase 2: Foundational (Shared Infrastructure) ✅

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create NhostProvider in `components/providers/nhost-provider.tsx` wrapping app with Nhost context
- [x] T009 Update root layout in `app/[locale]/layout.tsx` to include NhostProvider
- [x] T010 Create AuthContext in `lib/contexts/auth-context.tsx` for authentication state management (Note: Nhost manages session state internally)
- [x] T011 Create authentication utilities in `lib/nhost/auth.ts` (login, logout, register, password reset helpers)
- [x] T012 Create storage utilities in `lib/nhost/storage.ts` (upload, download, delete file helpers)
- [x] T013 Setup GraphQL client in `lib/nhost/graphql/client.ts` with Nhost authentication headers
- [x] T014 [P] Create base GraphQL queries in `lib/nhost/graphql/queries.ts` (users, organizations, positions)
- [x] T015 [P] Create base GraphQL mutations in `lib/nhost/graphql/mutations.ts` (create/update/delete operations)
- [x] T016 [P] Implement GraphQL input validation for all mutations with schema validation (FR-032)
- [x] T017 Run GraphQL codegen script added to package.json (`pnpm codegen`)
- [x] T018 Create custom hooks: `lib/hooks/use-auth.ts` for authentication state and methods
- [x] T019 [P] Create custom hooks: `lib/hooks/use-file-upload.ts` for file upload with retry logic
- [x] T020 [P] Create custom hooks: `lib/hooks/use-graphql.ts` for GraphQL operations with error handling
- [x] T021 Update middleware in `middleware.ts` to protect dashboard routes with Nhost authentication
- [x] T022 [P] Add i18n messages for authentication in `messages/en.json` (login, register, errors)
- [x] T023 [P] Add i18n messages for authentication in `messages/tr.json` (Turkish translations)

**Checkpoint**: ✅ Foundation ready - user story implementation can now begin in parallel

**Note**: Nhost automatically refreshes tokens every 15 minutes. Session state is managed by Nhost SDK.

---

## Phase 3: User Story 1 - User Authentication (Priority: P1) 🎯 MVP

**Goal**: Users can register, log in, reset passwords, and log out securely

**Independent Test**: User can complete full auth lifecycle without file upload or data management features

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T024 [P] [US1] Create login form unit test in `components/auth/__tests__/login-form.test.tsx`
- [ ] T025 [P] [US1] Create register form unit test in `components/auth/__tests__/register-form.test.tsx`
- [ ] T026 [P] [US1] Create password reset form unit test in `components/auth/__tests__/password-reset-form.test.tsx`
- [ ] T027 [P] [US1] Create CAPTCHA component unit test in `components/auth/__tests__/captcha.test.tsx`
- [ ] T028 [P] [US1] Create E2E auth flow test in `tests/e2e/auth.spec.ts` (register → verify → login → logout)
- [ ] T029 [P] [US1] Create E2E password reset test in `tests/e2e/auth.spec.ts` (request reset → verify email → set new password)
- [ ] T030 [P] [US1] Create E2E rate limiting test in `tests/e2e/auth.spec.ts` (5 failed attempts → lockout → CAPTCHA)
- [ ] T031 [P] [US1] Create E2E account deletion test in `tests/e2e/auth.spec.ts` (delete account → verify data removed)

### Implementation for User Story 1

- [ ] T032 Create authentication route group layout in `app/[locale]/(auth)/layout.tsx`
- [ ] T033 [P] Create login page in `app/[locale]/(auth)/login/page.tsx`
- [ ] T034 [P] Create register page in `app/[locale]/(auth)/register/page.tsx`
- [ ] T035 [P] Create password reset page in `app/[locale]/(auth)/reset-password/page.tsx`
- [ ] T036 [P] Create email verification page in `app/[locale]/(auth)/verify-email/page.tsx`
- [ ] T037 Create LoginForm component in `components/auth/login-form.tsx` with email/password fields (FR-001, FR-002)
- [ ] T038 Add password visibility toggle to LoginForm (FR-004)
- [ ] T039 Add remember me checkbox to LoginForm for session persistence
- [ ] T040 Create RegisterForm component in `components/auth/register-form.tsx` with validation (FR-003)
- [ ] T041 Add password strength indicator to RegisterForm (FR-003: 8+ chars, uppercase, lowercase, number)
- [ ] T042 Add email verification notice to RegisterForm (FR-009)
- [ ] T043 Create PasswordResetForm component in `components/auth/password-reset-form.tsx` (FR-006)
- [ ] T044 Create CAPTCHA component in `components/auth/captcha.tsx` using reCAPTCHA v3 (FR-008)
- [ ] T045 Integrate CAPTCHA into LoginForm after 3 failed attempts (FR-008)
- [ ] T046 Implement rate limiting logic in `lib/nhost/auth.ts`: 5 attempts max, 15-min lockout (FR-007, FR-014)
- [ ] T047 Add error handling for authentication failures with i18n messages (FR-046)
- [ ] T048 Implement email verification flow handler in `app/[locale]/(auth)/verify-email/page.tsx`
- [ ] T049 Add logout functionality to header in `components/layout/header.tsx` (FR-005)
- [ ] T050 Implement multi-device logout in `lib/nhost/auth.ts` (global session termination)
- [ ] T051 Create account settings page in `app/[locale]/(dashboard)/settings/page.tsx` with delete account option (FR-010, FR-011)
- [ ] T052 Implement account deletion with cascade logic in `lib/nhost/auth.ts` (FR-012: hard delete all user data)
- [ ] T053 Add role assignment UI component in `components/settings/role-management.tsx` for admins (FR-010)
- [ ] T054 Implement permission check middleware for role-based access control (FR-010)
- [ ] T055 Add loading states to all authentication forms
- [ ] T056 Add success/error toast notifications for auth operations

**Checkpoint**: User Story 1 complete - users can authenticate, manage accounts, system enforces security and RBAC policies

---

## Phase 4: User Story 5 - Session Management & Security (Priority: P1)

**Goal**: Secure session management with automatic token refresh and security monitoring

**Independent Test**: Sessions remain active, refresh automatically, and log security events

### Tests for User Story 5 ⚠️

- [ ] T057 [P] [US5] Create session refresh unit test in `lib/hooks/__tests__/use-auth.test.ts`
- [ ] T058 [P] [US5] Create E2E session persistence test in `tests/e2e/auth.spec.ts` (login → reload → still authenticated)
- [ ] T059 [P] [US5] Create E2E session timeout test in `tests/e2e/auth.spec.ts` (24-hour expiry validation)

### Implementation for User Story 5

- [ ] T060 Leave session duration as is on Nhost client settings (FR-007)
- [ ] T061 Add session monitoring to detect and log suspicious activity in `lib/nhost/auth.ts` (FR-015)
- [ ] T062 Implement authentication event logging in `lib/utils/error-logger.ts` (FR-040, FR-046)
- [ ] T063 Add failed login attempt tracking with timestamps and IP addresses (FR-046)
- [ ] T064 Create session state indicator in header (logged in, token refreshes automatically every 15 minutes)

**Checkpoint**: User Stories 1 AND 5 complete - full authentication with secure session management (Note: Nhost handles automatic token refresh every 15 minutes)

---

## Phase 5: User Story 2 - File Storage Management (Priority: P2)

**Goal**: Users can upload, download, and delete files with security scanning and retry logic

**Independent Test**: File operations work independently of GraphQL data management

### Tests for User Story 2 ⚠️

- [ ] T065 [P] [US2] Create file uploader unit test in `components/files/__tests__/file-uploader.test.tsx`
- [ ] T066 [P] [US2] Create file list unit test in `components/files/__tests__/file-list.test.tsx`
- [ ] T067 [P] [US2] Create file preview unit test in `components/files/__tests__/file-preview.test.tsx`
- [ ] T068 [P] [US2] Create E2E file upload test in `tests/e2e/file-upload.spec.ts` (select file → upload → preview)
- [ ] T069 [P] [US2] Create E2E file download test in `tests/e2e/file-upload.spec.ts`
- [ ] T070 [P] [US2] Create E2E upload retry test in `tests/e2e/file-upload.spec.ts` (simulate failure → retry → success)

### Implementation for User Story 2

- [ ] T071 Create file management page in `app/[locale]/(dashboard)/profile/page.tsx` with upload section
- [ ] T072 Create FileUploader component in `components/files/file-uploader.tsx` with drag-and-drop (FR-016)
- [ ] T073 Add file type validation to FileUploader: PDF, DOCX, images only (FR-018)
- [ ] T074 Add file size validation to FileUploader: 10MB max (FR-019)
- [ ] T075 Add upload progress indicator to FileUploader (FR-020)
- [ ] T076 Implement retry logic with exponential backoff in `lib/hooks/use-file-upload.ts` (FR-025, max 3 attempts)
- [ ] T077 Add retry feedback UI to FileUploader showing attempt count (FR-026)
- [ ] T078 Create FileList component in `components/files/file-list.tsx` displaying user's files (FR-017)
- [ ] T079 Add delete file functionality to FileList with confirmation dialog (FR-017)
- [ ] T080 Create FilePreview component in `components/files/file-preview.tsx` for image thumbnails
- [ ] T081 Implement secure file download in `lib/nhost/storage.ts` with signed URLs (FR-021)
- [ ] T082 Add file metadata tracking in `lib/nhost/storage.ts` (filename, size, upload date) (FR-022)
- [ ] T083 Document Nhost Storage malware scanning in `docs/file-storage.md` (FR-024: uses Nhost built-in scanning)
- [ ] T084 Add malware scan status display in FileList if available from Nhost metadata
- [ ] T085 Implement file access control: users can only access own files (FR-023)
- [ ] T086 Add i18n messages for file operations in `messages/en.json` and `messages/tr.json`

**Checkpoint**: User Stories 1, 5, AND 2 complete - authentication + file management working

---

## Phase 6: User Story 3 - Data Management via GraphQL (Priority: P2)

**Goal**: Users can create, read, update, delete business entities (organizations, positions, applications)

**Independent Test**: GraphQL operations work with proper permissions and validation

### Tests for User Story 3 ⚠️

- [ ] T087 [P] [US3] Create GraphQL query unit tests in `lib/nhost/graphql/__tests__/queries.test.ts`
- [ ] T088 [P] [US3] Create GraphQL mutation unit tests in `lib/nhost/graphql/__tests__/mutations.test.ts`
- [ ] T089 [P] [US3] Create E2E organization CRUD test in `tests/e2e/graphql.spec.ts`
- [ ] T090 [P] [US3] Create E2E position CRUD test in `tests/e2e/graphql.spec.ts`
- [ ] T091 [P] [US3] Create E2E application submission test in `tests/e2e/graphql.spec.ts`

### Implementation for User Story 3

#### Backend Prerequisites (Handled in separate backend repository)

**TODO for Backend Team:**
- Database tables required: `roles`, `user_roles`, `organizations`, `positions`, `questionnaires`, `applications`, `files`, `file_metadata`
- Table relationships: Configure foreign keys, one-to-many, many-to-many in Hasura console
- RLS policies: Row-level security based on user roles (admin, employer, candidate)
- Seed data: Initial roles (admin, employer, candidate)
- GraphQL schema: Ensure all queries/mutations are exposed via Hasura

**Frontend Dependency**: Backend must be deployed with schema from `specs/002-nhost-integration/data-model.md` and GraphQL contracts from `specs/002-nhost-integration/contracts/schema.graphql.md`

#### GraphQL Operations (Frontend)

- [ ] T092 [P] Implement organization queries in `lib/nhost/graphql/queries.ts` (list, get by ID, filter, sort)
- [ ] T093 [P] Implement position queries in `lib/nhost/graphql/queries.ts` (list, get by ID, filter by status)
- [ ] T094 [P] Implement application queries in `lib/nhost/graphql/queries.ts` (user applications, position applications)
- [ ] T095 [P] Implement questionnaire queries in `lib/nhost/graphql/queries.ts`
- [ ] T096 Implement organization mutations in `lib/nhost/graphql/mutations.ts` (create, update, delete)
- [ ] T097 Implement position mutations in `lib/nhost/graphql/mutations.ts` (create, update, delete, publish, close)
- [ ] T098 Implement application mutations in `lib/nhost/graphql/mutations.ts` (submit, update status, add notes)
- [ ] T099 Implement questionnaire mutations in `lib/nhost/graphql/mutations.ts` (create, update, delete)
- [ ] T100 Add pagination support to all list queries (FR-034: limit, offset)
- [ ] T101 Add filtering support to queries (FR-033: where clauses for common fields)
- [ ] T102 Add sorting support to queries (FR-033: order_by clauses)
- [ ] T103 Regenerate TypeScript types from GraphQL schema using codegen

#### UI Components & Pages

- [ ] T104 Create organizations page in `app/[locale]/(dashboard)/organizations/page.tsx` listing user's orgs
- [ ] T105 Create organization form component for create/edit in `components/organizations/organization-form.tsx`
- [ ] T106 Create positions page in `app/[locale]/(dashboard)/positions/page.tsx` listing available positions
- [ ] T107 Create position form component for create/edit in `components/positions/position-form.tsx`
- [ ] T108 Add position status transitions (draft → published → closed) with validation
- [ ] T109 Create application form in `components/applications/application-form.tsx` for submission
- [ ] T110 Add questionnaire display component in `components/questionnaires/questionnaire-view.tsx`
- [ ] T111 Implement GraphQL error handling with i18n messages in `lib/nhost/graphql/client.ts` (FR-047)
- [ ] T112 Add optimistic UI updates for mutations using Nhost SDK patterns
- [ ] T113 Add loading skeletons for all GraphQL queries

**Checkpoint**: User Stories 1, 5, 2, AND 3 complete - full CRUD operations with GraphQL

**Note**: Real-time subscriptions (User Story 4) NOT IMPLEMENTED - application uses single-user-per-client model. Users see changes after their own transactions complete. No collaborative editing or real-time synchronization needed.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T114 [P] Create comprehensive error handling guide in `docs/error-handling.md`
- [ ] T115 [P] Document authentication flows in `docs/authentication.md` with diagrams
- [ ] T116 [P] Document GraphQL API usage in `docs/graphql-api.md` with examples
- [ ] T117 [P] Document edge case handling in `docs/edge-cases.md` (connection loss, token expiry, special chars, quota, migrations)
- [ ] T118 [P] Add Storybook stories for all auth components (if Storybook configured)
- [ ] T119 [P] Add Storybook stories for all file components
- [ ] T120 Implement comprehensive logging for all Nhost operations using Nhost built-in logging (FR-043: info, warn, error levels)
- [ ] T121 Configure Nhost built-in monitoring dashboard for metrics tracking (FR-044, FR-048)
- [ ] T122 Configure alerting in Nhost console for critical errors and performance issues (FR-045)
- [ ] T123 Perform accessibility audit on all auth and file components (WCAG 2.1 AA)
- [ ] T124 Add keyboard navigation support to all interactive components
- [ ] T125 Test with screen readers (VoiceOver on macOS, NVDA on Windows)
- [ ] T126 Optimize GraphQL queries to reduce response time below 500ms (SC-005)
- [ ] T127 Load test with 500 concurrent users to verify performance (SC-006)
- [ ] T128 Validate all success criteria (SC-001 through SC-012) with end-to-end tests
- [ ] T129 Run quickstart.md validation to ensure developer setup instructions work
- [ ] T130 Update project README.md with Nhost integration overview
- [ ] T131 Create migration guide from current auth system (if applicable)
- [ ] T132 Document Nhost platform responsibilities (PostgreSQL management, encryption at rest, HTTPS/WSS, transactions) in `docs/infrastructure.md`
- [ ] T133 Document backend schema requirements in `docs/backend-requirements.md` referencing data-model.md and contracts/

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)**: No dependencies - can start immediately
2. **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
3. **User Story 1 (Phase 3 - P1)**: Depends on Foundational phase - Authentication is MVP foundation
4. **User Story 5 (Phase 4 - P1)**: Depends on User Story 1 - Session management extends authentication
5. **User Story 2 (Phase 5 - P2)**: Depends on User Story 1 - File upload requires authentication
6. **User Story 3 (Phase 6 - P2)**: Depends on User Stories 1 & 5 - GraphQL operations require auth
7. **User Story 4 (Phase 7 - P3)**: Depends on User Story 3 - Real-time updates extend GraphQL
8. **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (Authentication)**: Foundation - must complete first
- **US5 (Session Management)**: Extends US1 - complete immediately after US1
- **US2 (File Storage)**: Independent after US1 - can run parallel to US3
- **US3 (Data Management)**: Independent after US1 & US5 - can run parallel to US2
- **US4 (Real-time Sync)**: NOT IMPLEMENTED - single-user-per-client model, no real-time collaboration needed

### Recommended Execution Order

**MVP (Minimum Viable Product)**:
```
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1) → Phase 4 (US5)
```

**Full Feature Set**:
```
Phase 1 → Phase 2 → Phase 3 (US1) → Phase 4 (US5) → Phase 5 (US2) || Phase 6 (US3) → Phase 7 (Polish)
```

### Parallel Opportunities

After Foundational phase (Phase 2):
- **US2 (File Storage)** and **US3 (Data Management)** can be implemented in parallel by different team members
- All tasks marked `[P]` within a phase can run in parallel

**Example Parallel Execution in Phase 3 (US1)**:
```bash
# Terminal 1: Component tests
npm test -- components/auth/__tests__/login-form.test.tsx
npm test -- components/auth/__tests__/register-form.test.tsx
npm test -- components/auth/__tests__/password-reset-form.test.tsx

# Terminal 2: E2E tests (run sequentially due to browser sharing)
npx playwright test tests/e2e/auth.spec.ts

# Terminal 3: Component implementation
# Work on T030-T050 in sequence
```

**Example Parallel Execution in Phase 6 (US3)**:
```bash
# Developer 1: Database schema
# Tasks T088-T096 (Hasura migrations)

# Developer 2: GraphQL operations
# Tasks T097-T108 (queries, mutations, codegen)

# Developer 3: UI components
# Tasks T109-T118 (pages and forms)
```

---

## Summary

**Total Tasks**: 133 (frontend-only, backend tasks moved to TODO)
- **Setup**: 7 tasks (added reCAPTCHA config)
- **Foundational**: 16 tasks (BLOCKING, added validation task)
- **US1 (Authentication - P1)**: 32 tasks (8 tests + 24 implementation, added RBAC and account deletion)
- **US5 (Session Management - P1)**: 8 tasks (3 tests + 5 implementation, simplified with Nhost auto-refresh)
- **US2 (File Storage - P2)**: 22 tasks (6 tests + 16 implementation)
- **US3 (Data Management - P2)**: 28 tasks (5 tests + 23 implementation, backend DB tasks in TODO)
- **US4 (Real-time Sync - P3)**: REMOVED (not needed for single-user-per-client)
- **Polish**: 20 tasks (added edge case docs, infrastructure docs, backend requirements doc)

**MVP Scope** (Recommended first delivery):
- Phase 1 (Setup): 7 tasks
- Phase 2 (Foundational): 16 tasks
- Phase 3 (US1 - Authentication): 32 tasks
- Phase 4 (US5 - Session Management): 8 tasks
- **Total MVP**: 63 tasks (frontend-only)

**Estimated Timeline** (1 developer, TDD approach):
- MVP: 3-4 weeks (assumes backend API ready)
- Full feature set: 5-6 weeks (frontend implementation only)
- With 2-3 developers (parallel execution): 3-4 weeks for full feature set

**Backend Dependency**: Backend team must implement database schema per data-model.md before US3 implementation can begin.

**Parallel Capacity**:
- Setup: 4 tasks can run in parallel
- Foundational: 7 tasks can run in parallel
- User Stories: US2 and US3 can run in parallel after US1+US5
- Tests within story: 5-8 tests can run in parallel

**Critical Path**:
```
Setup → Foundational → US1 (Auth) → US5 (Session) → [US2 || US3] → Polish
```

**Key Simplifications**:
- Nhost manages sessions and token refresh (auto-refresh every 15 minutes)
- Backend handles database schema, migrations, and RLS policies (separate repository)
- Nhost built-in monitoring for observability (FR-043 to FR-048)
- No real-time subscriptions needed (single-user-per-client model)

**Backend Dependencies**:
- Database schema must match `specs/002-nhost-integration/data-model.md`
- GraphQL API must expose queries/mutations per `specs/002-nhost-integration/contracts/schema.graphql.md`
- Backend team coordinates schema changes via separate repository

**Success Validation**: All 12 success criteria (SC-001 through SC-012) covered by tasks and tests.
