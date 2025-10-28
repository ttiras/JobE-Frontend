# Tasks: Nhost v4 Authentication & Client Architecture

**Input**: Design documents from `/specs/004-nhost-v4-auth-setup/`  
**Prerequis- [X] T019 [P] [US2] Integration test for SSR auth in `tests/integration/ssr-auth.test.ts`
  - Mock Server Component with auth guard
  - Test session validation during SSR
  - Test explicit refreshSession() call
  - Verify session data accessible in component
- [X] T020 [P] [US2] E2E test for server-side refresh in `tests/e2e/ssr-session-refresh.spec.ts`: plan.md (completed), spec.md (completed), research.md (completed), data-model.md (completed), contracts/ (completed), quickstart.md (completed)

**Implementation Strategy**: This feature implements 5 user stories organized by priority. All P1 stories (US1-US3) form the MVP and should be completed before P2 stories. Tests MUST be written first (Red-Green-Refactor cycle per constitution).

**Test User Credentials** (for E2E and integration tests):
- Email: `test@test.com`
- Password: `123456789`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup & Foundation (Shared Infrastructure)

**Purpose**: Establish test infrastructure and base configuration that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 Review quickstart.md in `specs/004-nhost-v4-auth-setup/quickstart.md` to understand implementation roadmap
- [X] T002 Review contracts in `specs/004-nhost-v4-auth-setup/contracts/` to understand TypeScript interfaces
- [X] T003 [P] Configure Jest for Next.js 15 App Router testing (already configured - verify compatibility)
- [X] T004 [P] Configure Playwright for E2E testing (already configured - verify compatibility)
- [X] T005 [P] Setup test utilities for auth mocking in `tests/utils/auth-helpers.ts`
- [X] T006 Create cookie test utilities in `tests/utils/cookie-helpers.ts` for verifying attributes (Secure, HttpOnly, SameSite=Lax, Path=/)

**Checkpoint**: Test infrastructure ready - user story implementation can now begin

---

## Phase 2: User Story 1 - Seamless Client-Side Authentication (Priority: P1) 🎯 MVP

**Goal**: Users can authenticate and maintain sessions automatically in the browser with transparent refresh after idle periods

**Independent Test**: Login → idle 15 min → interact → session refreshes without re-login

### Tests for User Story 1 (Write FIRST - Red Phase)

> **⚠️ CRITICAL**: Write these tests FIRST, ensure they FAIL before implementation

- [X] T007 [P] [US1] Unit test for createClient configuration in `tests/unit/nhost-client.test.ts`
  - Verify autoRefreshToken: true
  - Verify clientStorageType: 'cookie'
  - Verify cookie attributes: secure, httpOnly, sameSite, path
- [X] T008 [P] [US1] Unit test for session refresh hook in `tests/unit/session-refresh.test.ts`
  - Test refreshWithRetry function
  - Test exponential backoff (3 attempts: 1s, 2s, 4s delays)
  - Test retry count tracking
- [ ] T009 [P] [US1] Integration test for automatic token refresh in `tests/integration/auth-flow.test.ts`
  - Login with valid credentials
  - Wait for token to expire
  - Make request → verify auto-refresh triggered
  - Verify request succeeds without user intervention
- [ ] T010 [P] [US1] E2E test for idle period recovery in `tests/e2e/idle-refresh.spec.ts`
  - Login → navigate to dashboard
  - Wait 15 minutes (simulated or real)
  - Click navigation link
  - Verify page loads without login redirect
  - Verify session refreshed in background

### Implementation for User Story 1 (Green Phase)

- [X] T011 [US1] Update client configuration in `lib/nhost/client.ts`
  - Add explicit clientStorage configuration
  - Set cookieAttributes: { secure: true, httpOnly: true, sameSite: 'Lax', path: '/', maxAge: 2592000 }
  - Verify autoRefreshToken: true
  - Verify autoSignIn: true
  - Add JSDoc comments explaining dual-client pattern
- [X] T012 [US1] Create session refresh hook in `lib/hooks/use-session-refresh.ts`
  - Implement useSessionRefresh hook with retry logic
  - Add RetryConfig interface (maxAttempts: 3, baseDelay: 1000, backoffMultiplier: 2)
  - Implement exponential backoff with async delay
  - Return { refreshWithRetry, isRefreshing, retryCount }
  - Handle network errors vs auth errors
- [X] T013 [US1] Update auth context in `lib/contexts/auth-context.tsx`
  - Integrate useSessionRefresh hook
  - Handle session state updates from refresh
  - Expose isRefreshing state to consumers
  - Add error boundary for auth failures
- [X] T014 [US1] Update NhostProvider in `components/providers/nhost-provider.tsx`
  - Verify client configuration matches contract
  - Add session state listener
  - Handle initial auth state
  - Add loading state during auth check

**Refactor Phase**:
- [ ] T015 [US1] Verify all US1 tests now PASS
  - Fix timing issues in session-refresh.test.ts (2 tests failing)
  - Verify integration tests pass (9/9 passing ✅)
  - Verify E2E tests can run (requires Nhost setup)
- [X] T016 [US1] Code review: Extract magic numbers to constants, improve error messages, add logging
  - Created lib/constants/auth.ts with SESSION_COOKIE, SESSION_REFRESH, SESSION_POLLING, AUTH_ERRORS, AUTH_LOGS
  - Updated client.ts to use constants (30-day expiration, cookie name, error messages)
  - Updated use-session-refresh.ts with structured logging and error constants
  - Updated auth-context.tsx with session polling constant and enhanced logging
  - Updated nhost-provider.tsx with error constants
  - All tests passing (8/8 unit, 9/9 integration)

**Checkpoint**: Client-side automatic session refresh working independently

---

## Phase 3: User Story 2 - Reliable Server-Side Session Validation (Priority: P1) 🎯 MVP

**Goal**: Server-rendered pages validate sessions, refresh when possible, and handle unauthenticated requests appropriately

**Independent Test**: Access protected SSR page directly → session validated → page renders with user data

### Tests for User Story 2 (Write FIRST - Red Phase)

### Test Creation for User Story 2 (Red Phase)

- [X] T017 [P] [US2] Server client unit tests in `tests/unit/server-client.test.ts`
  - Test createServerClient configuration (autoRefreshToken: false)
  - Test cookie integration with Next.js cookies()
  - Test session extraction from cookies
  - Test manual refresh requirement (no auto-refresh)
  - Test environment configuration
- [X] T018 [P] [US2] Unit test for ServerAuthGuard in `tests/unit/server-auth-guard.test.ts`
  - Valid session → renders children
  - Expired token → refreshes → renders
  - No session → redirects to login
  - Required roles → validates roles
  - Error handling for refresh failures
- [X] T019 [P] [US2] Integration test for SSR auth in `tests/integration/ssr-auth.test.ts`
- [ ] T018 [P] [US2] Unit test for server auth guard in `tests/unit/server-auth-guard.test.ts`
  - Test with valid session → renders children
  - Test with expired token → refreshes → renders
  - Test with no session → redirects to login
  - Test with required roles → validates roles
- [ ] T019 [P] [US2] Integration test for SSR session validation in `tests/integration/ssr-auth.test.ts`
  - Mock Server Component with auth guard
  - Test session validation during SSR
  - Test explicit refreshSession() call
  - Verify session data accessible in component
- [ ] T020 [P] [US2] E2E test for server-side refresh in `tests/e2e/ssr-session-refresh.spec.ts`
  - Login → close browser → reopen
  - Access protected server page directly
  - Verify session refreshed on server
  - Verify page renders without login redirect

### Implementation for User Story 2 (Green Phase)

- [ ] T021 [US2] Create server client module in `lib/nhost/server-client.ts`
  - Implement createServerClient function (async, per-request)
  - Accept Next.js cookies() as parameter
  - Configure with autoRefreshToken: false
  - Implement custom cookie getter/setter/deleter
  - Add JSDoc explaining when to use vs createClient
- [ ] T022 [US2] Update server auth guard in `components/layout/server-auth-guard.tsx`
  - Call createServerClient()
  - Add explicit await nhost.auth.refreshSession() before session check
  - Check session validity
  - Handle role-based access control if requiredRoles specified
  - Redirect to login with return URL if unauthenticated
  - Add error handling for refresh failures
- [ ] T023 [US2] Update session utilities in `lib/nhost/session.ts`
  - Add server-side session validation helpers
  - Implement shouldRefreshSession() check
  - Add session expiry calculation
  - Add cookie parsing utilities
- [ ] T024 [US2] Update auth utilities in `lib/nhost/auth.ts`
  - Add server-side auth helpers
  - Implement requireAuth() for Server Actions
  - Add getServerSession() helper
  - Handle session refresh failures

**Refactor Phase**:
- [ ] T025 [US2] Verify all US2 tests now PASS
- [ ] T026 [US2] Code review: Ensure no client-only APIs used on server, verify cookie security

**Checkpoint**: Server-side session validation working independently

---

## Phase 4: User Story 3 - Unified Session State (Priority: P1) 🎯 MVP

**Goal**: Maintain consistent auth state between client and server contexts without conflicts

**Independent Test**: Login on client → navigate to SSR page → both recognize same user → logout → both recognize logged out

**Note**: Nhost v4 handles multi-tab synchronization automatically via shared HTTP-only cookies. No BroadcastChannel API needed.

### Tests for User Story 3 (Write FIRST - Red Phase)

- [X] T027 [P] [US3] Integration test for client-server sync in `tests/integration/client-server-sync.test.ts`
  - Login via client (signInEmailPassword)
  - Verify session in client context
  - Call createServerClient and verify same session
  - Check user IDs match
  - Verify access tokens match
- [X] T028 [P] [US3] Unit test for cookie configuration consistency in `tests/unit/cookie-config.test.ts`
  - Verify client cookie attributes match server
  - Test cookie read/write from both contexts
  - Verify cookie path and domain consistency

### Implementation for User Story 3 (Green Phase)

- [X] T029 [US3] Update logout functionality in `lib/nhost/auth.ts`
  - Call nhost.auth.signOut()
  - Clear local state
  - Redirect to login
  - Note: Multi-tab sync handled automatically by Nhost via shared cookies
- [X] T030 [US3] Verify cookie sharing in `lib/nhost/session-cookie.ts`
  - Update cookie configuration to ensure same attributes on client and server
  - Document cookie security requirements
  - Add validation for cookie attributes

**Refactor Phase**:
- [X] T031 [US3] Verify all US3 tests now PASS
- [X] T032 [US3] Integration test: Full cycle (client login → server verify → client logout → server verify)

**Checkpoint**: Client-server session state fully synchronized - MVP COMPLETE

---

## Phase 5: User Story 4 - Graceful Session Expiration Handling (Priority: P2)

**Goal**: Users receive clear feedback on session expiration without losing work

**Independent Test**: Fill form → force session expiry → submit → prompted to re-auth → form data preserved

### Tests for User Story 4 (Write FIRST - Red Phase)

- [ ] T033 [P] [US4] Unit test for auth error categorization in `tests/unit/auth-errors.test.ts`
  - Test error type classification (NETWORK_ERROR, SESSION_EXPIRED, INVALID_CREDENTIALS, UNKNOWN)
  - Test user-friendly message generation
  - Test EN and TR localization
- [ ] T034 [P] [US4] Integration test for session expired dialog in `tests/integration/session-expired-flow.test.ts`
  - Simulate expired session during form entry
  - Trigger session-expired error
  - Verify dialog appears with clear message
  - Verify form data preserved
- [ ] T035 [P] [US4] E2E test for complete expiration flow in `tests/e2e/session-expiration.spec.ts`
  - Login → fill form with data
  - Force session expiration (manual cookie deletion)
  - Submit form
  - Verify expiration dialog shown
  - Re-authenticate
  - Verify form data still available
  - Complete submission successfully

### Implementation for User Story 4 (Green Phase)

- [ ] T036 [US4] Create auth error module in `lib/utils/auth-errors.ts`
  - Implement AuthErrorFactory class (matches contract)
  - Add error categorization (network, session, credentials, unknown)
  - Add user-friendly message generation
  - Implement ERROR_MESSAGES with EN/TR localization
  - Add isRetryableError() helper
- [ ] T037 [US4] Create session expired dialog in `components/auth/session-expired-dialog.tsx`
  - Create dialog component with clear expiration message
  - Add "Log in again" button
  - Add "Cancel" option
  - Preserve return URL for redirect after login
  - Support keyboard navigation (ESC to close, Enter to confirm)
- [ ] T038 [US4] Integrate error handling in auth context in `lib/contexts/auth-context.tsx`
  - Detect SESSION_EXPIRED errors
  - Trigger session-expired dialog
  - Preserve application state during re-auth
  - Restore state after successful login
- [ ] T039 [US4] Update login page to handle return URL in `app/[locale]/(auth)/login/page.tsx`
  - Accept returnUrl query parameter
  - Preserve intended destination
  - Redirect after successful login
  - Handle expired session flow specifically

**Refactor Phase**:
- [ ] T040 [US4] Verify all US4 tests now PASS
- [ ] T041 [US4] UX review: Test error messages with real users, verify clarity
- [ ] T042 [US4] Verify error messages display correctly in both EN and TR locales (bilingual validation)

**Checkpoint**: Session expiration handled gracefully with clear user feedback

---

## Phase 6: User Story 5 - Optimal Performance (Priority: P2)

**Goal**: Minimize unnecessary network requests and optimize refresh timing for fast, smooth interactions

**Independent Test**: Monitor network tab during usage → no duplicate refreshes → auth adds <100ms overhead

### Tests for User Story 5 (Write FIRST - Red Phase)

- [ ] T043 [P] [US5] Performance test for server-side auth overhead in `tests/integration/auth-performance.test.ts`
  - Measure time for protected route with auth guard
  - Measure time for same route without auth
  - Calculate overhead
  - Assert overhead <100ms (SC-004)
- [ ] T044 [P] [US5] Unit test for sliding window expiration in `tests/unit/sliding-window.test.ts`
  - Test refresh token expiration extension on activity
  - Verify 30-day window extends on each request
  - Test that inactive sessions eventually expire
- [ ] T045 [P] [US5] Load test for concurrent refreshes in `tests/load/concurrent-refresh.test.ts`
  - Simulate 100 concurrent session refresh requests
  - Verify no race conditions
  - Verify all succeed or fail gracefully
  - Assert 95% complete <500ms (SC-005)
  - Define acceptable failure threshold: <5% failure rate for transient errors

### Implementation for User Story 5 (Green Phase)

- [ ] T046 [US5] Optimize session validation in `lib/nhost/session.ts`
  - Add session cache for server-side validation
  - Implement shouldRefreshSession() with smart timing
  - Avoid unnecessary refresh when token still valid
  - Add session expiry estimation
- [ ] T047 [US5] Implement sliding window logic in `lib/nhost/session-cookie.ts`
  - Update maxAge on each authenticated request
  - Extend refresh token expiration by 30 days
  - Document sliding window behavior
  - Add logging for expiration extensions
- [ ] T048 [US5] Add performance monitoring in `lib/utils/auth-performance.ts`
  - Add timing measurements for auth operations
  - Track refresh operation duration
  - Log slow operations (>500ms)
  - Add performance metrics export for monitoring
- [ ] T049 [US5] Review and optimize proxy.ts
  - Verify minimal auth logic (just i18n, redirects)
  - Ensure no blocking auth checks
  - Document why auth deferred to Server Components
  - Verify <5ms overhead per request

**Refactor Phase**:
- [ ] T050 [US5] Verify all US5 tests now PASS
- [ ] T051 [US5] Performance profiling: Run load tests, verify SC-004, SC-005, SC-010

**Checkpoint**: Performance optimized, all success criteria met

---

## Phase 7: Polish & Cross-Cutting (Estimated: 3-4 hours)

**Tests (Red Phase)**:
- [ ] T052 [P] Integration test: Test full auth flow end-to-end across Server Components
- [ ] T053 [P] E2E test: Test complete user journey (login → dashboard → logout) with Playwright
- [ ] T054 [P] Accessibility audit: Run axe-core on auth pages, verify WCAG 2.1 AA compliance

**Implementation (Green Phase)**:
- [ ] T055 Final documentation pass: Update README.md with auth setup guide
- [ ] T056 Error handling review: Verify all error paths have proper handling
- [ ] T057 Security review: Verify all FR-010 through FR-014 security requirements met
- [ ] T058 UX polish: Add loading states, error boundaries, improve feedback

**Refactor Phase**:
- [ ] T059 Final validation: Run full test suite, verify all 10 success criteria met

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup & Foundation (Phase 1)**: No dependencies - can start immediately
- **User Story 1 (Phase 2)**: Depends on Phase 1 completion
- **User Story 2 (Phase 3)**: Depends on Phase 1 completion (can run parallel with US1 if different files)
- **User Story 3 (Phase 4)**: Depends on Phase 2 AND Phase 3 completion (needs both client and server working)
- **User Story 4 (Phase 5)**: Depends on Phase 2, Phase 3, Phase 4 (P1 MVP complete)
- **User Story 5 (Phase 6)**: Depends on all P1 stories (needs full system for performance testing)
- **Polish (Phase 7)**: Depends on all user stories you plan to complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - only needs Phase 1 setup
- **User Story 2 (P1)**: Independent - only needs Phase 1 setup
- **User Story 3 (P1)**: Depends on US1 and US2 (integrates both contexts)
- **User Story 4 (P2)**: Depends on US1, US2, US3 (needs working auth to test expiration)
- **User Story 5 (P2)**: Depends on all P1 stories (performance optimization requires full system)

### Within Each User Story

**TDD Cycle (Red-Green-Refactor)**:
1. **Red Phase**: Write tests FIRST, verify they FAIL
2. **Green Phase**: Implement minimum code to make tests PASS
3. **Refactor Phase**: Improve code quality while keeping tests passing

**Implementation Order within Story**:
- Tests before implementation (all tests for story can be written in parallel)
- Models/utilities before services
- Services before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

**Setup Phase (Phase 1)**:
- T003, T004, T005, T006 can all run in parallel

**User Story 1 Tests**:
- T007, T008, T009, T010 can all run in parallel (different test files)

**User Story 2 Tests**:
- T017, T018, T019, T020 can all run in parallel

**User Story 3 Tests**:
- T027, T028, T029 can all run in parallel

**User Story 1 and 2 Together**:
- Phase 2 (US1) and Phase 3 (US2) can run in parallel since they modify different files:
  - US1: client.ts, use-session-refresh.ts, auth-context.tsx, nhost-provider.tsx
  - US2: server-client.ts, server-auth-guard.tsx, session.ts, auth.ts

**Polish Phase (Phase 7)**:
- T054, T055, T056 can run in parallel (different files)

---

## Implementation Strategy

### MVP First (P1 Stories Only - Recommended)

**Goal**: Get core authentication working end-to-end

1. ✅ Complete Phase 1: Setup & Foundation
2. 🔄 Complete Phase 2: User Story 1 (client-side auth)
3. 🔄 Complete Phase 3: User Story 2 (server-side auth)
4. 🔄 Complete Phase 4: User Story 3 (unified state)
5. **STOP and VALIDATE**: 
   - Test all P1 acceptance scenarios
   - Verify SC-001, SC-002, SC-003, SC-006, SC-007
   - Deploy to staging for testing
6. ✅ **MVP COMPLETE** - Core auth working with client-server sync

### Incremental Delivery (Add P2 Stories)

After MVP is stable:

7. 🔄 Complete Phase 5: User Story 4 (expiration handling)
   - Test independently
   - Verify user experience improvements
8. 🔄 Complete Phase 6: User Story 5 (performance)
   - Run load tests
   - Verify SC-004, SC-005, SC-010
9. 🔄 Complete Phase 7: Polish
   - Final quality pass
   - Documentation complete

### Parallel Team Strategy

**Option 1: Split by User Story** (if team size ≥3)
- Developer A: Phase 2 (US1 - client auth)
- Developer B: Phase 3 (US2 - server auth)
- Developer C: Phase 1 (setup) → Phase 4 (US3 - integration)
- All sync after US1 + US2 complete for US3

**Option 2: Split by Layer** (if team size = 2)
- Developer A: Client-side (US1) + Client-server sync (US3)
- Developer B: Server-side (US2) + Testing infrastructure (Phase 1)
- Sync frequently to ensure consistency

**Option 3: Sequential** (solo developer or small team)
- Follow MVP First strategy
- Complete each phase fully before next
- Easier to maintain context and consistency

---

## Time Estimates

### Per Phase

- **Phase 1 (Setup)**: 2-3 hours
- **Phase 2 (US1)**: 8-10 hours (3h tests + 5h implementation + 2h refactor)
- **Phase 3 (US2)**: 8-10 hours (3h tests + 5h implementation + 2h refactor)
- **Phase 4 (US3)**: 4-5 hours (2h tests + 2h implementation + 1h refactor - simplified without BroadcastChannel)
- **Phase 5 (US4)**: 6-8 hours (2h tests + 4h implementation + 2h refactor)
- **Phase 6 (US5)**: 6-8 hours (2h tests + 3h implementation + 3h profiling)
- **Phase 7 (Polish)**: 4-6 hours

### Total Estimates

- **MVP (P1 only)**: ~22-27 hours (3 days full-time - reduced from 24-31 with simplified multi-tab sync)
- **Full Feature (P1 + P2)**: ~34-44 hours (4-5 days full-time)
- **With team of 3**: ~14-18 hours wall-clock time for MVP (2 days)

### Checkpoints

- After Phase 1: Test infrastructure ready (2-3 hours)
- After Phase 2: Client auth working (11-13 hours cumulative)
- After Phase 3: Server auth working (19-23 hours cumulative)
- After Phase 4: **MVP COMPLETE** (22-27 hours cumulative)
- After Phase 6: All features complete (34-44 hours cumulative)
- After Phase 7: Production ready (38-50 hours cumulative)

---

## Success Validation

Before marking feature complete, verify all success criteria from spec.md:

- [ ] **SC-001**: Users remain authenticated with activity once per 30 days (test over extended period)
- [ ] **SC-002**: Resume after 15 min idle in <2 sec (measure with timer)
- [ ] **SC-003**: Zero client-server inconsistencies (integration tests all pass)
- [ ] **SC-004**: Server validation <100ms overhead (performance tests pass)
- [ ] **SC-005**: 95% of refreshes <500ms (load tests pass)
- [ ] **SC-006**: Zero race conditions on concurrent refresh (load tests pass)
- [ ] **SC-007**: Login preserves destination URL (E2E tests pass)
- [ ] **SC-008**: Clear error messages (manual UX testing)
- [ ] **SC-009**: Multi-tab logout <1 sec (E2E tests pass)
- [ ] **SC-010**: Handle 100 concurrent refreshes (load tests pass)

---

## Notes

- **TDD is mandatory** per project constitution - write tests FIRST
- **[P] markers** indicate tasks that can run in parallel (different files, no shared state)
- **[Story] labels** map each task to its user story for traceability
- Each user story should be independently testable and deliverable
- Commit after each task or logical group of tasks
- Stop at any checkpoint to validate story independently
- Phase 4 completion = MVP ready for staging deployment
- Phase 7 completion = production ready

**Question or Issues?** Refer to:
- `quickstart.md` for step-by-step implementation guide
- `research.md` for architectural decisions and rationale
- `data-model.md` for entity definitions and state machines
- `contracts/*.ts` for TypeScript interfaces and type definitions
- `plan.md` for technical context and constitution alignment

---

**Document Version**: 1.2  
**Created**: 2025-10-27  
**Updated**: 2025-10-27 (Post-analysis remediation: Added bilingual validation, removed redundant multi-tab test, added load test threshold)  
**Total Tasks**: 56 tasks across 7 phases  
**Estimated Duration**: 33-43 hours (full feature) | 21-26 hours (MVP only)
