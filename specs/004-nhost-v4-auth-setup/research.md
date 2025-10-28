# Research: Nhost v4 Authentication & Client Architecture

**Feature**: 004-nhost-v4-auth-setup
**Date**: 2025-10-27
**Status**: Complete

## Overview

This document consolidates research findings for implementing Nhost v4 SDK best practices in a Next.js 15 application. The research focuses on the dual-client architecture (createClient vs createServerClient), session management patterns, cookie configuration, and Next.js 16 integration considerations.

---

## Decision 1: Client Architecture Pattern

### Decision
Use **dual-client architecture** with createClient for client-side operations and createServerClient for server-side operations, both sharing session state via HTTP-only cookies.

### Rationale
Nhost v4 introduced a major architectural change to support both client-side and server-side environments without instance conflicts:

1. **createClient**: Designed for browser/client-side with automatic session refresh enabled
2. **createServerClient**: Designed for SSR, Server Components, Server Actions with manual refresh control
3. **Isolation**: Multiple clients can coexist without interfering (unlike v1 singleton pattern)
4. **Session sharing**: Both clients read/write to the same cookie storage for consistent state

Key insight from Nhost maintainer David Barroso:
> "You can totally mix them, that's one of the huge wins with the new SDK, you can have as many clients with the same or different configurations and they won't mess with each other like the old SDK did. Just make sure they use the correct session storage (i.e. you will need to configure createClient and createServerClient to use the same cookies if you want them to share sessions)."

### Alternatives Considered

**Alternative 1: Single createClient everywhere**
- **Rejected because**: createClient has automatic refresh logic unsuitable for server-side rendering; can cause hydration mismatches and race conditions in SSR context

**Alternative 2: Single createServerClient everywhere**
- **Rejected because**: createServerClient requires manual refresh calls, making client-side code verbose and error-prone; loses automatic refresh benefits in browser

**Alternative 3: Custom wrapper abstracting both**
- **Rejected because**: Adds unnecessary complexity; Nhost v4's dual-client pattern is the official recommendation; abstraction would hide important behavioral differences

---

## Decision 2: Session Storage Configuration

### Decision
Configure both clients to use **HTTP-only cookies** with these attributes:
- `Secure`: true (HTTPS only)
- `HttpOnly`: true (JavaScript access blocked)
- `SameSite`: 'Lax' (CSRF protection with usability)
- `Path`: '/' (available app-wide)

### Rationale

**Security considerations**:
1. **HttpOnly** prevents XSS attacks from stealing tokens via JavaScript
2. **Secure** ensures cookies only transmitted over HTTPS
3. **SameSite=Lax** blocks CSRF while allowing navigation from external sites (e.g., email verification links)
4. **Path=/** ensures cookie available to all routes in the application

**Why Lax vs Strict/None**:
- **Strict** would break email verification flows (clicking link from email wouldn't include cookie)
- **None** would allow cross-site requests (security risk) and requires Secure flag
- **Lax** provides the best balance: blocks CSRF POST requests but allows GET navigation

**Nhost v4 compatibility**:
- Both createClient and createServerClient support custom cookie configuration
- Configuration passed during client instantiation
- Next.js middleware/proxy.ts can read these cookies for routing decisions

### Alternatives Considered

**Alternative 1: localStorage instead of cookies**
- **Rejected because**: Not accessible from server-side; can't support SSR; vulnerable to XSS; doesn't work across subdomains

**Alternative 2: SameSite=Strict**
- **Rejected because**: Breaks common auth flows like email verification, password reset links from external email clients

**Alternative 3: Custom session storage mechanism**
- **Rejected because**: Reinventing the wheel; Nhost v4 cookie support is production-tested; adds unnecessary complexity

---

## Decision 3: Refresh Token Expiration Strategy

### Decision
Implement **sliding window expiration** that extends refresh token lifetime by 30 days on each user activity.

### Rationale

**User experience benefits**:
1. Active users never need to re-authenticate (session extends automatically)
2. Inactive users (>30 days) are automatically logged out for security
3. No surprise logouts for regular users
4. Aligns with modern SaaS application patterns

**Implementation approach**:
- Nhost backend can be configured for sliding window via dashboard settings
- Each successful token refresh extends the expiration timestamp
- Client code doesn't need special logic - handled by Nhost infrastructure
- Clear documentation needed for operators/devops about the configuration

**Security considerations**:
- 30-day inactivity threshold is industry standard (OWASP recommendation)
- Protects against abandoned sessions on shared/compromised devices
- Balances security with user convenience
- Can be revoked immediately via Nhost admin panel if needed

### Alternatives Considered

**Alternative 1: Fixed 30-day expiration**
- **Rejected because**: Forces re-authentication for active users who use app sporadically (e.g., weekly check-ins); poor UX for legitimate users

**Alternative 2: Indefinite sessions (extend infinitely)**
- **Rejected because**: Security risk for abandoned sessions; violates security best practices; no automatic cleanup of old sessions

**Alternative 3: Shorter window (7 days)**
- **Rejected because**: Too aggressive for HR application where users may check weekly or biweekly; creates unnecessary re-auth friction

---

## Decision 4: Session Refresh Retry Strategy

### Decision
Implement **exponential backoff with 3 retry attempts** for transient session refresh failures.

### Rationale

**Resilience benefits**:
1. Handles temporary network issues gracefully (intermittent connectivity, server hiccups)
2. Prevents overwhelming servers during outages (exponential backoff)
3. Fails fast after reasonable attempts (3 retries sufficient for most transient issues)
4. Better UX than immediate logout on first failure

**Retry schedule**:
- Attempt 1: Immediate
- Attempt 2: After 1 second
- Attempt 3: After 2 seconds
- Attempt 4: After 4 seconds
- Total maximum delay: ~7 seconds before giving up

**Error categorization**:
- **Retry**: 5xx errors, network timeouts, DNS failures
- **Don't retry**: 401 (invalid refresh token), 403 (forbidden), 400 (bad request)
- **User feedback**: Show generic "connecting..." during retries; show clear error message after all retries fail

### Alternatives Considered

**Alternative 1: No retry (fail immediately)**
- **Rejected because**: Fragile; temporary network blips would unnecessarily log users out; poor mobile experience

**Alternative 2: Aggressive retry (5+ attempts, fixed intervals)**
- **Rejected because**: Could worsen server outages by hammering struggling servers; longer user wait time; diminishing returns after 3 attempts

**Alternative 3: Single retry with fixed delay**
- **Rejected because**: Insufficient resilience; doesn't differentiate between temporary blip and persistent issue; fixed delay wastes time or isn't long enough

---

## Decision 5: Server-Side Session Validation Pattern

### Decision
Explicitly call `refreshSession()` before accessing protected resources in Server Components and Server Actions; redirect to login if refresh fails.

### Rationale

**Nhost v4 server behavior**:
- createServerClient **disables automatic refresh** by design
- Server-side code must explicitly refresh when needed
- This gives developers control over when refresh happens (performance optimization)
- Prevents unexpected refresh during read-only operations

**Pattern for protected pages**:
```typescript
// Server Component example
export default async function ProtectedPage() {
  const nhost = await createServerClient()
  
  // Explicit refresh before accessing session
  await nhost.auth.refreshSession()
  
  const session = nhost.auth.getSession()
  
  if (!session) {
    redirect('/login?returnTo=/protected-page')
  }
  
  // Use session.user safely
}
```

**When to refresh**:
- Before rendering protected pages (Server Components)
- Before executing privileged operations (Server Actions)
- Before API route handlers that require auth
- NOT in proxy.ts (keep lightweight per Cache Components best practice)

**Refresh failure handling**:
- Clear invalid session data
- Preserve intended destination URL
- Redirect to login with clear message
- Log failure for monitoring/debugging

### Alternatives Considered

**Alternative 1: Automatic refresh everywhere (like client)**
- **Rejected because**: Not how Nhost v4 server client works; would require custom wrapper defeating SDK benefits

**Alternative 2: Refresh in proxy.ts/middleware**
- **Rejected because**: Next.js 16 deprecates middleware; proxy.ts should stay lightweight; violates Cache Components best practice; adds latency to every request

**Alternative 3: Never refresh on server (rely on client refresh)**
- **Rejected because**: Server-rendered pages with expired tokens would fail; poor UX for direct navigation to protected pages; breaks SSR

---

## Decision 6: Multi-Tab Logout Synchronization

### Decision
Use the Nhost client in the browser. It handles updating tokens and syncing auth state across tabs.

### Rationale

**User experience requirement**:
- When user logs out in one tab, all tabs should recognize logout immediately
- Prevents confusion (user thinks they're logged out but other tabs still show authenticated UI)
- Security benefit: Ensures complete logout across all contexts

---

## Decision 7: Next.js 16 Proxy.ts Pattern

### Decision
Keep **proxy.ts lightweight** (i18n and simple redirects only); defer all authentication and session validation to Server Components.

### Rationale

**Next.js 16 context**:
- Middleware is deprecated in favor of proxy.ts
- Cache Components best practice: Keep request interception minimal
- Heavy operations (auth, DB queries) should happen in Server Components

**Proxy.ts responsibilities** (ONLY these):
1. Internationalization routing (next-intl middleware)
2. Simple redirects (e.g., root → /dashboard)
3. Static routing decisions

**Deferred to Server Components**:
- Session validation
- Auth checks
- Database queries
- Complex business logic

**Current proxy.ts analysis**:
```typescript
// Already follows best practice
export default async function proxy(request: NextRequest) {
  // ✅ GOOD: i18n handling
  // ✅ GOOD: simple redirect
  // ✅ GOOD: defers auth to server components (comment confirms)
  return intlMiddleware(request)
}
```

**Why not do auth in proxy.ts**:
- Adds latency to every request (auth check happens before route resolution)
- Harder to test (middleware runs in edge runtime)
- Violates separation of concerns (routing vs business logic)
- Cache Components pattern explicitly discourages this

### Alternatives Considered

**Alternative 1: Move auth checks to proxy.ts**
- **Rejected because**: Violates Next.js 16 best practices; adds unnecessary latency; makes code harder to test; mixes concerns

**Alternative 2: Use middleware (ignore deprecation)**
- **Rejected because**: Will break in future Next.js versions; already deprecated; proxy.ts is the migration path

**Alternative 3: No proxy.ts at all**
- **Rejected because**: Need i18n routing; need root redirect; proxy.ts serves these lightweight routing needs well

---

## Best Practices Summary

### Client-Side (createClient)
1. ✅ Enable automatic refresh
2. ✅ Configure HTTP-only cookies (Secure, HttpOnly, SameSite=Lax)
3. ✅ Implement BroadcastChannel for multi-tab sync
4. ✅ Use retry logic with exponential backoff
5. ✅ Show loading states during refresh
6. ✅ Preserve form data if session expires

### Server-Side (createServerClient)
1. ✅ Explicitly call refreshSession() before accessing session
2. ✅ Share cookie storage with createClient
3. ✅ Redirect to login with returnTo on auth failure
4. ✅ Clear invalid session data completely
5. ✅ Keep proxy.ts lightweight (no auth logic)
6. ✅ Validate sessions in Server Components

### Session Management
1. ✅ Sliding window refresh token (30-day extension on activity)
2. ✅ Access tokens: ~15 minutes lifetime (Nhost default)
3. ✅ Cookies: Secure + HttpOnly + SameSite=Lax + Path=/
4. ✅ Retry transient failures 3 times with exponential backoff
5. ✅ Synchronize logout across tabs via BroadcastChannel

### Testing
1. ✅ Unit test: Client/server client creation with correct config
2. ✅ Unit test: Cookie attribute validation
3. ✅ Unit test: Retry logic with mock failures
4. ✅ Integration test: Client-server session consistency
5. ✅ Integration test: Multi-tab logout synchronization
6. ✅ E2E test: Complete auth flows (login → idle → auto-refresh → logout)

---

## Implementation Dependencies

### NPM Packages (Already Installed)
- `@nhost/nhost-js@^4.0.1` - Core SDK with createClient/createServerClient
- `@nhost/nextjs@^2.3.1` - React integration helpers
- `next@16.0.0` - App Router framework
- `react@19.2.0` - UI framework

### No Additional Dependencies Needed
All required functionality is available in:
- Nhost v4 SDK (session management, auth operations)
- Next.js (Server Components, Server Actions, cookies API)
- Modern browsers (BroadcastChannel API for tab sync)

### Environment Configuration
Required environment variables (already set):
- `NEXT_PUBLIC_NHOST_SUBDOMAIN` - Nhost project subdomain
- `NEXT_PUBLIC_NHOST_REGION` - Nhost region (optional)

New configuration needed:
- Nhost Dashboard: Enable sliding window refresh token expiration
- Cookie settings: Configure in createClient/createServerClient initialization

---

## Migration Considerations

### From Existing Auth (v1/Legacy Patterns)

**Current state** (based on codebase review):
- Using @nhost/nhost-js v4.0.1 (correct version)
- Single createClient in lib/nhost/client.ts
- Session cookie helpers exist (session-cookie.ts)
- Auth utilities in lib/nhost/auth.ts

**Changes needed**:
1. ✅ Already on v4 SDK (no upgrade needed)
2. ⚠️ Add createServerClient for server-side operations
3. ⚠️ Update cookie configuration with explicit attributes
4. ⚠️ Add retry logic to refresh operations
5. ⚠️ Update Server Components to call refreshSession()
6. ✅ proxy.ts already lightweight (no changes needed)

**Backward compatibility**:
- Existing login/logout/register functions compatible (minor updates for retry logic)
- Cookie format remains the same (just adding explicit attributes)
- No breaking changes for end users
- Tests need updates for new patterns

---

## References

### Official Documentation
1. [Nhost v4 Migration Guide](https://nhost-chore-sdk-react-apollo-and-migration-guide.mintlify.app/reference/migration-guide)
2. [Nhost JavaScript SDK Reference](https://docs.nhost.io/reference/javascript)
3. [Next.js 15 App Router](https://nextjs.org/docs/app)
4. [Next.js 16 Cache Components](https://nextjs.org/docs) (proxy.ts best practices)

### Key Insights
1. **David Barroso quote** (Nhost maintainer): "createClient is basically a client side client while createServerClient is a server side client. You can totally mix them... Just make sure they use the correct session storage."
2. **Nhost v4 server-side refresh**: "Auto-refresh is disabled server-side (you call refresh yourself)"
3. **Cache Components pattern**: Middleware/proxy should be lightweight; defer expensive operations to Server Components

### Security Standards
1. [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
2. [MDN: Set-Cookie SameSite](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
3. [Web.dev: SameSite cookies explained](https://web.dev/samesite-cookies-explained/)
