# Implementation Plan: Nhost v4 Authentication & Client Architecture

**Branch**: `004-nhost-v4-auth-setup` | **Date**: 2025-10-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-nhost-v4-auth-setup/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement Nhost v4 SDK best practices for authentication in a Next.js 15 application, establishing a robust dual-client architecture (createClient for client-side, createServerClient for server-side) with unified session state via HTTP-only cookies. The system will support automatic session refresh on the client, manual refresh on the server, sliding window token expiration (30-day extension on activity), and resilient error handling with exponential backoff retries. This creates a seamless authentication experience where users remain logged in indefinitely with regular use, sessions refresh transparently after idle periods, and auth state remains consistent across client and server contexts.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled) with Next.js 15.0.3 (App Router)
**Primary Dependencies**: 
  - @nhost/nhost-js v4.0.1 (createClient, createServerClient)
  - @nhost/nextjs v2.3.1 (React integration)
  - next v16.0.0 (App Router, Server Components, Server Actions)
  - next-intl v4.4.0 (internationalization)
  - React 19.2.0

**Storage**: HTTP-only cookies for session storage (Secure, HttpOnly, SameSite=Lax, Path=/)
**Testing**: Jest + React Testing Library (unit/integration), Playwright (E2E auth flows)
**Target Platform**: Web application (SSR + CSR), Vercel deployment
**Project Type**: Web (Next.js App Router with Server Components)
**Performance Goals**: 
  - Session refresh operations: 95% complete in <500ms
  - Server-side validation overhead: <100ms
  - Session resume after idle: <2 seconds
  
**Constraints**: 
  - Next.js middleware deprecated in v16; must use proxy.ts for request interception
  - proxy.ts must remain lightweight (i18n, redirects only) per Cache Components best practice
  - All auth/session validation deferred to Server Components
  - Session state must be consistent between client and server contexts
  - No race conditions during concurrent refresh operations
  
**Scale/Scope**: 
  - Support 100+ concurrent session refresh operations
  - Multi-tab synchronization (logout propagation within 1 second)
  - Multi-device sessions (independent per browser/device)
  - Sliding window refresh tokens (extends 30 days on activity)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Component-First Architecture
✅ **PASS** - Auth functionality will be implemented as reusable components and hooks:
- Client-side: Reusable auth provider component wrapping createClient
- Server-side: Reusable server auth utilities using createServerClient
- Session management hooks (useAuth, useSession) with clear interfaces
- Auth guard components for protected routes

### II. Test-Driven Development
✅ **PASS** - TDD will be strictly followed:
- Unit tests for auth utilities (login, logout, refresh, cookie handling)
- Integration tests for client-server session synchronization
- E2E tests for complete auth flows (login → navigation → logout)
- Tests written before implementation per Red-Green-Refactor cycle

### III. Clean Code & Simplicity (YAGNI)
✅ **PASS** - Implementation focuses on essential Nhost v4 patterns:
- Minimal abstraction: Use Nhost SDK directly without unnecessary wrappers
- Clear separation: createClient for client, createServerClient for server
- No premature optimization: Start with Nhost defaults, optimize only if metrics show need
- Justified dependencies: Only Nhost SDK v4 (already installed)

### IV. Progressive Disclosure UX
✅ **PASS** - Auth UX will be non-intrusive:
- Automatic session refresh happens in background (no user interruption)
- Clear, contextual error messages only when needed
- Graceful degradation: Form data preserved if session expires during entry
- Return-to-intended-page after login (no navigation loss)

### V. Accessibility as Standard
✅ **PASS** - Auth flows will be fully accessible:
- Login/logout UI components already implement keyboard navigation
- Error messages use proper ARIA attributes
- Focus management during session expiration prompts
- Screen reader friendly session status indicators

### VI. Branch Strategy & Deployment Discipline
✅ **PASS** - Following standard workflow:
- Feature branch: 004-nhost-v4-auth-setup (created from develop)
- Tests must pass before PR to develop
- No breaking changes (enhancing existing auth, not replacing)

### Technology Stack Constraints
✅ **PASS** - All constraints satisfied:
- Next.js 16.0.0 with TypeScript strict mode ✓
- Tailwind CSS for styling ✓
- React hooks for state management ✓
- Jest + RTL + Playwright for testing ✓
- pnpm package manager ✓
- Vercel deployment ✓
- English + Turkish i18n support (already implemented) ✓

**Result**: All constitution gates PASS. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/004-nhost-v4-auth-setup/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (Nhost v4 best practices)
├── data-model.md        # Phase 1 output (Session entities & lifecycle)
├── quickstart.md        # Phase 1 output (Developer setup guide)
├── contracts/           # Phase 1 output (TypeScript interfaces)
│   ├── client-session.ts
│   ├── server-session.ts
│   └── auth-operations.ts
├── checklists/          # Quality gates
│   └── requirements.md  # Spec validation (completed)
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created yet)
```

### Source Code (repository root)

```text
lib/
├── nhost/
│   ├── client.ts                    # MODIFY: Update createClient with v4 patterns
│   ├── server-client.ts             # NEW: createServerClient for SSR/Server Actions
│   ├── session-cookie.ts            # MODIFY: Add cookie attribute configuration
│   ├── session.ts                   # MODIFY: Add sliding window refresh logic
│   ├── auth.ts                      # MODIFY: Integrate retry logic, update to use both clients
│   └── storage.ts                   # REVIEW: Ensure compatibility with v4
│
├── hooks/
│   ├── use-auth.ts                  # MODIFY: Update to use new client patterns
│   └── use-session-refresh.ts       # NEW: Hook for manual refresh + retry logic
│
├── contexts/
│   └── auth-context.tsx             # MODIFY: Update provider to use createClient v4
│
└── utils/
    └── auth-errors.ts               # NEW: Error categorization & user-friendly messages
    # Note: Multi-tab sync handled automatically by Nhost via shared cookies - no session-sync.ts needed

components/
├── auth/
│   ├── login-form.tsx               # REVIEW: Ensure compatibility with new auth flow
│   ├── register-form.tsx            # REVIEW: Ensure compatibility
│   └── session-expired-dialog.tsx   # NEW: User-friendly session expiration prompt
│
├── layout/
│   ├── auth-guard.tsx               # MODIFY: Update to use new server client
│   └── server-auth-guard.tsx        # MODIFY: Add explicit refreshSession() calls
│
└── providers/
    └── nhost-provider.tsx           # MODIFY: Update to configure v4 client properly

app/
├── [locale]/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx             # REVIEW: Verify return URL handling
│   │
│   └── (dashboard)/
│       └── */page.tsx               # MODIFY: Add server-side session refresh

proxy.ts                              # MODIFY: Ensure lightweight (no auth logic)

tests/
├── unit/
│   ├── nhost-client.test.ts         # NEW: Test client/server client creation
│   ├── session-refresh.test.ts      # NEW: Test retry logic
│   ├── cookie-config.test.ts        # NEW: Verify cookie attributes
│   └── sliding-window.test.ts       # NEW: Test token expiration extension
│
├── integration/
│   ├── client-server-sync.test.ts   # NEW: Test session state consistency
│   ├── tab-sync.test.ts             # NEW: Test multi-tab logout
│   └── auth-flow.test.ts            # MODIFY: Update for v4 patterns
│
└── e2e/
    ├── auth.spec.ts                 # MODIFY: Update for new session behavior
    ├── idle-refresh.spec.ts         # NEW: Test idle → return → auto-refresh
    └── session-expiration.spec.ts   # NEW: Test complete expiration flow
```

**Structure Decision**: This is a Next.js App Router web application. The structure follows the existing pattern with lib/ for utilities, components/ for UI, app/ for pages, and tests/ for test suites. Auth logic is centralized in lib/nhost/ with clear separation between client-side (client.ts) and server-side (server-client.ts) concerns. This aligns with Nhost v4 best practices and Next.js 15 App Router patterns.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - table not needed.
