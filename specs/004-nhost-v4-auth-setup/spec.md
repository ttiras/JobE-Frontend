# Feature Specification: Nhost v4 Authentication & Client Architecture

**Feature Branch**: `004-nhost-v4-auth-setup`  
**Created**: October 27, 2025  
**Status**: Draft  
**Input**: User description: "I want my next.js app with nhost backend to use the best practices of @nhost/nhost-js v4 for auth and client system with createClient and createServerClient orchestrated, smooth authorization, auto-refresh after idle time, and proper server-side session refresh"

## Clarifications

### Session 2025-10-27

- Q: What cookie attributes should be configured for the session cookie? → A: Secure + HttpOnly + SameSite=Lax + Path=/
- Q: Should the refresh token expiration be extended or reset on user activity, or remain fixed at 30 days regardless of activity? → A: Sliding window: extends 30 days on each activity
- Q: What retry strategy should be used when session refresh fails due to transient errors (network timeout, 5xx errors)? → A: Exponential backoff: 3 attempts with increasing delays

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Seamless Client-Side Authentication (Priority: P1)

Users need to authenticate and maintain their session automatically in the browser without manual re-login, with sessions refreshing transparently when they return after brief periods of inactivity.

**Why this priority**: This is the foundation of user experience. Without automatic session management, users would constantly need to re-authenticate, creating friction and abandonment. This delivers the core value of "smooth authorization" requested.

**Independent Test**: Can be fully tested by logging in, leaving the app idle for several minutes, then interacting with the app. Session should refresh automatically without requiring re-login. Delivers immediate value by enabling frictionless user experience.

**Acceptance Scenarios**:

1. **Given** a user logs in successfully, **When** they navigate between pages, **Then** their session persists and they remain authenticated
2. **Given** a user has been idle for 10 minutes, **When** they return and interact with the app, **Then** their session refreshes automatically and requests proceed without interruption
3. **Given** a user's session is about to expire, **When** they are actively using the app, **Then** the session refreshes proactively in the background
4. **Given** a user's refresh token expires, **When** they attempt to use the app, **Then** they are smoothly redirected to login with a clear message about session expiration
5. **Given** a user logs in with "remember me", **When** they close and reopen the browser, **Then** they remain logged in without re-entering credentials
6. **Given** a user has multiple tabs open, **When** they log out in one tab, **Then** all tabs recognize the logout and update accordingly

---

### User Story 2 - Reliable Server-Side Session Validation (Priority: P1)

Server-rendered pages and API routes need to validate user sessions reliably, refresh expired sessions when possible, and handle unauthenticated requests appropriately without causing unnecessary redirects.

**Why this priority**: Server-side session management is critical for security and SEO. Without proper server-side handling, protected pages could leak data or create poor user experiences with unnecessary redirects. This is equally foundational as client-side auth.

**Independent Test**: Can be tested by accessing a protected server-rendered page directly (bypassing client-side navigation), verifying session validation occurs, and checking that expired sessions either refresh or redirect appropriately. Delivers value by ensuring security and proper SSR behavior.

**Acceptance Scenarios**:

1. **Given** a user with valid session accesses a protected page, **When** the page renders on the server, **Then** the session is validated and the page renders with user-specific data
2. **Given** a user with expired access token but valid refresh token accesses a protected page, **When** the server processes the request, **Then** the session refreshes automatically and the page renders without redirect
3. **Given** a user with no valid session accesses a protected page, **When** the server processes the request, **Then** the user is redirected to login with the return URL preserved
4. **Given** an API route receives a request with expired token, **When** the route processes the request, **Then** it attempts to refresh the session before rejecting the request
5. **Given** a user's session cannot be refreshed, **When** they access protected resources, **Then** the server clears invalid session data and redirects to login
6. **Given** a server-side operation needs user identity, **When** it checks the session, **Then** it receives current user data without additional database queries

---

### User Story 3 - Unified Session State Across Client and Server (Priority: P1)

The application needs to maintain consistent authentication state between client-side and server-side, ensuring both contexts work with the same session data without conflicts or race conditions.

**Why this priority**: This is the core architectural requirement. Without unified session state, users could be logged in on client but logged out on server (or vice versa), causing confusing errors and security vulnerabilities. This is what "orchestrated" means in the user request.

**Independent Test**: Can be tested by logging in on client, immediately navigating to a server-rendered page, and verifying both contexts recognize the same authenticated user. Can also test logging out on client and verifying server immediately recognizes the logout. Delivers value by ensuring consistent, predictable behavior.

**Acceptance Scenarios**:

1. **Given** a user logs in on the client, **When** they navigate to a server-rendered page, **Then** the server recognizes the same authenticated session
2. **Given** a user's session is refreshed on the server, **When** client-side code checks the session, **Then** it uses the refreshed session data
3. **Given** a user logs out on the client, **When** subsequent server requests are made, **Then** the server recognizes the user is logged out
4. **Given** multiple client instances are created, **When** they access session data, **Then** they don't interfere with each other
5. **Given** session data is updated in one context, **When** the other context accesses it, **Then** it receives the current session state
6. **Given** concurrent client and server operations occur, **When** both access session data, **Then** no race conditions or conflicts occur

---

### User Story 4 - Graceful Session Expiration Handling (Priority: P2)

Users need clear feedback when their sessions expire completely, with the ability to continue their work after re-authenticating without losing context or unsaved data.

**Why this priority**: While less critical than establishing working auth, proper expiration handling significantly impacts user satisfaction. Users should never lose work due to session expiration. This can be refined after core auth is stable.

**Independent Test**: Can be tested by forcing a session expiration (or waiting for natural expiration), attempting an operation, and verifying the user is prompted to re-authenticate with their work preserved. Delivers value by preventing user frustration and data loss.

**Acceptance Scenarios**:

1. **Given** a user's session expires during form entry, **When** they submit the form, **Then** they are prompted to re-authenticate and the form data is preserved for resubmission
2. **Given** a user's session expires while viewing content, **When** they attempt to interact, **Then** they see a clear message about session expiration with a login option
3. **Given** a user re-authenticates after expiration, **When** they log back in, **Then** they are returned to the page they were on
4. **Given** a user has unsaved changes when session expires, **When** they log back in, **Then** they are warned about the unsaved changes and given the option to recover them
5. **Given** multiple requests fail due to expired session, **When** the user re-authenticates, **Then** only one login prompt appears and all pending requests retry after login

---

### User Story 5 - Optimal Performance and Resource Management (Priority: P2)

The authentication system needs to minimize unnecessary network requests, optimize refresh timing, and manage client instances efficiently to ensure fast page loads and smooth interactions.

**Why this priority**: Performance is important for user experience but should not compromise security or functionality. Once auth is working correctly, performance optimization can be tuned. This supports the "smooth authorization" goal but is secondary to correctness.

**Independent Test**: Can be tested by monitoring network activity during typical usage, verifying refresh tokens are used efficiently (not refreshing unnecessarily), and checking that page loads are not delayed by auth checks. Delivers value by ensuring the app remains fast and responsive.

**Acceptance Scenarios**:

1. **Given** a user has a valid access token, **When** they make requests, **Then** no unnecessary refresh requests occur
2. **Given** a user navigates between pages, **When** pages load, **Then** auth state is checked without blocking page render
3. **Given** multiple client instances exist, **When** they perform auth operations, **Then** they don't duplicate refresh requests
4. **Given** a server-rendered page checks auth, **When** it validates the session, **Then** it completes within acceptable time limits (under 200ms overhead)
5. **Given** a user interacts with the app, **When** session refresh is needed, **Then** it happens in the background without blocking user actions
6. **Given** a user logs out, **When** client instances clean up, **Then** all auth-related resources are properly released

---

### Edge Cases

- What happens when a user has sessions in multiple browsers and logs out in one?
  - Expected: Logout only affects the current browser/device; other browsers remain logged in until their own session expires or explicit logout
  
- How does the system handle race conditions when client and server both try to refresh simultaneously?
  - Expected: Nhost v4's client architecture prevents conflicts; both use same cookies, and only one refresh succeeds while others use the refreshed token

- What happens when network is interrupted during session refresh?
  - Expected: Refresh fails gracefully with exponential backoff retry (3 attempts); user only sees login prompt if all retries fail and refresh token is also expired

- How does system handle corrupt or tampered session data?
  - Expected: Invalid session data is cleared; user is treated as logged out; clear error logging occurs for security monitoring

- What happens when server-side session refresh succeeds but client doesn't receive the updated cookie?
  - Expected: Client's next request includes the server-updated cookie via HTTP-only cookie mechanism; client and server re-sync automatically

- How does system behave when user's refresh token expires while they have the app open?
  - Expected: Next interaction triggers refresh attempt; when refresh fails, user receives clear prompt to log in again with minimal disruption

- How should proxy.ts handle authentication since it's deprecated to do auth checks in middleware (Next.js v16)?
  - Expected: proxy.ts remains lightweight for i18n and simple redirects only; all authentication and session validation is deferred to Server Components following Cache Components best practice

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST use createClient for client-side session management with automatic refresh enabled
- **FR-002**: System MUST use createServerClient for all server-side operations (Server Components, Server Actions, Route Handlers, proxy.ts)
- **FR-003**: Both createClient and createServerClient MUST share the same session storage via HTTP-only cookies with attributes: Secure, HttpOnly, SameSite=Lax, Path=/
- **FR-004**: System MUST automatically refresh access tokens when they expire (client-side only)
- **FR-005**: Server-side code MUST explicitly call refreshSession() before accessing protected resources when session may be expired
- **FR-006**: System MUST handle idle timeout by successfully refreshing sessions when users return after inactivity (up to refresh token expiration)
- **FR-006a**: System MUST extend refresh token expiration by 30 days on each user activity (sliding window approach)
- **FR-007**: Client instances MUST NOT interfere with each other even when multiple instances exist in the same application
- **FR-008**: System MUST maintain session consistency between client-side navigation and server-side rendering
- **FR-009**: System MUST clear invalid or expired sessions completely to prevent auth state corruption
- **FR-010**: System MUST redirect unauthenticated users to login when accessing protected resources, preserving the intended destination URL
- **FR-011**: System MUST provide clear error messages distinguishing between network errors, expired sessions, and invalid credentials
- **FR-011a**: System MUST retry failed session refresh operations using exponential backoff strategy (3 attempts with increasing delays)
- **FR-012**: Session refresh operations MUST NOT block critical user interactions or page renders
- **FR-013**: System MUST handle logout by clearing session data in both client and server contexts
- **FR-014**: System MUST support session persistence across browser restarts when user opts to stay logged in
- **FR-015**: System MUST synchronize logout state across multiple browser tabs for the same user
- **FR-016**: Server-side session refresh MUST update cookies that client-side code can immediately access

### Key Entities

- **Client Session**: Represents the user's authentication state in the browser, managed by createClient, includes access token, refresh token, user metadata, automatic refresh enabled
- **Server Session**: Represents the user's authentication state during server-side rendering/operations, managed by createServerClient, validated per-request, manual refresh control
- **Session Cookie**: HTTP-only cookie storing session data, shared between client and server contexts, serves as single source of truth for session state, configured with Secure, HttpOnly, SameSite=Lax, and Path=/ attributes for security
- **Refresh Token**: Long-lived token used to obtain new access tokens, stored securely in session cookie, uses sliding window expiration (extends 30 days on each activity for indefinite sessions with regular use)
- **Access Token**: Short-lived token used for API requests, automatically refreshed by client, manually refreshed on server, typical lifespan of minutes

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can remain authenticated indefinitely as long as they interact with the application at least once every 30 days (sliding window refresh token expiration)
- **SC-002**: Users returning after 15+ minutes of inactivity can resume work within 2 seconds without re-entering credentials
- **SC-003**: Zero authentication state inconsistencies between client and server contexts during normal operations
- **SC-004**: Server-side session validation adds less than 100ms latency overhead to protected route responses
- **SC-005**: 95% of session refresh operations complete in under 500ms
- **SC-006**: Zero race conditions or conflicts when client and server refresh sessions concurrently
- **SC-007**: Users redirected to login retain their intended destination and can continue navigation after authentication
- **SC-008**: Session-related errors provide clear, actionable feedback to users (no generic "something went wrong" messages)
- **SC-009**: Multiple browser tabs remain synchronized for logout events within 1 second
- **SC-010**: System handles at least 100 concurrent session refresh operations without degradation

### Assumptions

- Nhost v4 SDK (@nhost/nhost-js) is already installed and configured with appropriate environment variables
- Next.js 15 App Router is being used (Server Components, Server Actions)
- Next.js middleware is deprecated in Next.js v16; application uses proxy.ts for request interception instead
- HTTP-only cookies are enabled and supported by the deployment environment
- Refresh token uses sliding window expiration, extending 30 days on each user activity
- Default Nhost access token expiration is acceptable (~15 minutes)
- Users have JavaScript enabled in their browsers
- Network conditions allow for occasional background refresh requests
- The application uses industry-standard session management patterns (no custom token storage mechanisms)
- proxy.ts remains lightweight and defers authentication/session checks to Server Components (Cache Components best practice)
