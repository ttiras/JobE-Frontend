# Data Model: Nhost v4 Authentication & Client Architecture

**Feature**: 004-nhost-v4-auth-setup
**Date**: 2025-10-27
**Status**: Complete

## Overview

This document defines the data entities, relationships, and state transitions for the Nhost v4 authentication system. The model focuses on session management, token lifecycle, and the synchronization between client-side and server-side contexts.

---

## Core Entities

### 1. Session

Represents the authenticated state of a user in both client and server contexts.

**Attributes**:
- `accessToken`: string - Short-lived JWT for API requests (~15 min lifetime)
- `accessTokenExpiresIn`: number - Seconds until access token expires
- `refreshToken`: string - Long-lived token for obtaining new access tokens
- `refreshTokenExpiresAt`: Date - Timestamp when refresh token expires (sliding window)
- `user`: User - Authenticated user object with profile data

**Identity**: Unique per user per device/browser

**Lifecycle**:
1. **Created**: On successful login (signInEmailPassword, signUpEmailPassword)
2. **Active**: While access token valid OR refresh token can renew it
3. **Refreshing**: During token refresh operation (automatic on client, manual on server)
4. **Expired**: When refresh token passes expiration timestamp
5. **Destroyed**: On explicit logout or session invalidation

**Storage**:
- HTTP-only cookie (primary storage, shared between client/server)
- In-memory (Nhost SDK internal cache)
- NOT in localStorage (security risk)

**Validation Rules**:
- Access token must be valid JWT signed by Nhost
- Refresh token must not be past expiration timestamp
- User object must contain minimum fields: id, email, emailVerified

---

### 2. Client Session Context

Client-side representation of session managed by createClient.

**Attributes**:
- `session`: Session | null - Current session or null if logged out
- `isLoading`: boolean - Loading state during auth operations
- `isAuthenticated`: boolean - Computed from session presence
- `autoRefresh`: boolean - Always true for client-side (automatic)

**Behaviors**:
- **Automatic Refresh**: Monitors access token expiration, refreshes proactively before expiry
- **Cookie Sync**: Reads/writes session to HTTP-only cookie
- **Event Emission**: Fires auth state change events (login, logout, tokenRefreshed)
- **Retry Logic**: Implements exponential backoff on refresh failures

**State Transitions**:
```
[Logged Out] --login()--> [Authenticated]
[Authenticated] --token expires--> [Auto Refreshing] --success--> [Authenticated]
[Authenticated] --logout()--> [Logged Out]
[Auto Refreshing] --failure--> [Retry 1] --failure--> [Retry 2] --failure--> [Retry 3] --failure--> [Logged Out]
```

---

### 3. Server Session Context

Server-side representation of session managed by createServerClient.

**Attributes**:
- `session`: Session | null - Current session from cookie
- `requiresRefresh`: boolean - Indicates if manual refresh needed
- `autoRefresh`: boolean - Always false for server-side (manual control)

**Behaviors**:
- **Manual Refresh**: Requires explicit refreshSession() call
- **Cookie Sync**: Reads session from request cookies, writes updated session to response cookies
- **SSR Compatible**: Works in Server Components, Server Actions, API routes
- **No State Persistence**: Each request creates fresh instance

**State Transitions**:
```
[No Session] --refreshSession()--> [Check Cookie]
[Check Cookie] --valid access token--> [Authenticated]
[Check Cookie] --expired access token + valid refresh token--> [Refresh] --success--> [Authenticated]
[Check Cookie] --no valid tokens--> [Unauthenticated]
[Authenticated] --explicit check--> [Return Session]
```

---

### 4. Access Token

Short-lived JWT used to authorize API requests.

**Attributes**:
- `token`: string - JWT string
- `expiresAt`: Date - Expiration timestamp
- `issuedAt`: Date - Creation timestamp
- `claims`: object - JWT payload (user ID, roles, custom claims)

**Lifecycle**:
- **Lifetime**: ~15 minutes (Nhost default)
- **Renewal**: Via refresh token exchange
- **Invalidation**: On logout, password change, manual revocation

**Usage Pattern**:
- Attached to Authorization header: `Bearer {token}`
- Validated by Nhost backend on each request
- Automatic renewal by client (before expiration)
- Manual renewal by server (when needed)

**Security Properties**:
- Signed by Nhost (RS256 algorithm)
- Cannot be forged or modified
- Short lifetime limits exposure window if stolen
- Revoked when parent session destroyed

---

### 5. Refresh Token

Long-lived token used to obtain new access tokens without re-authentication.

**Attributes**:
- `token`: string - Opaque token string (not JWT)
- `expiresAt`: Date - Expiration timestamp (sliding window)
- `lastUsedAt`: Date - Last refresh operation timestamp
- `deviceInfo`: string - Browser/device identifier (optional)

**Lifecycle**:
- **Initial Expiration**: 30 days from creation
- **Sliding Window**: Extends 30 days on each successful refresh
- **Invalidation**: On logout, security event, explicit revocation

**Usage Pattern**:
- Stored in HTTP-only cookie (never exposed to JavaScript)
- Exchanged for new access token when access token expires
- Each use extends expiration timestamp (sliding window)
- Can only be used once per refresh (Nhost enforces single-use)

**Security Properties**:
- HTTP-only cookie prevents XSS theft
- Sliding window encourages regular use (active sessions extend)
- Automatic expiration for abandoned sessions (30 days idle)
- Single-use pattern prevents replay attacks

---

### 6. User

Represents the authenticated user entity.

**Attributes** (from Nhost):
- `id`: string (UUID) - Unique user identifier
- `email`: string - User email address
- `emailVerified`: boolean - Email verification status
- `displayName`: string | null - User's display name
- `avatarUrl`: string | null - Profile picture URL
- `locale`: string - User's language preference ('en' | 'tr')
- `defaultRole`: string - Primary role (e.g., 'user', 'admin')
- `roles`: string[] - All assigned roles
- `metadata`: object - Custom user metadata

**Relationships**:
- One-to-many with Sessions (user can have multiple device sessions)
- One-to-many with Organizations (via application data model)

**Validation Rules**:
- Email must be valid format and unique
- Email verified required for certain operations (spec-dependent)
- At least one role must be assigned
- Metadata must be valid JSON

---

## Relationships

### Session ↔ User
- **Type**: Many-to-One
- **Description**: Each session belongs to exactly one user; a user can have multiple concurrent sessions (different devices/browsers)
- **Cascade**: Logout in one session does NOT affect other sessions (device-independent)

### Client Session ↔ Server Session
- **Type**: Synchronized via Cookie
- **Description**: Both contexts read/write the same session cookie; changes in one context visible to the other
- **Consistency**: Session ID and tokens match; state synchronized on each request/refresh

### Access Token ↔ Refresh Token
- **Type**: Derived
- **Description**: Access tokens are generated from valid refresh tokens; refresh token outlives access token
- **Dependency**: Access token cannot exist without parent refresh token

---

## State Transitions

### Complete Auth Flow State Machine

```
┌─────────────┐
│  Anonymous  │
└──────┬──────┘
       │
       │ signUpEmailPassword() or signInEmailPassword()
       ↓
┌─────────────────┐
│  Authenticating │ (Loading state)
└────────┬────────┘
         │
         ├──[Success]──→ ┌──────────────┐
         │               │ Authenticated │
         │               └───────┬───────┘
         │                       │
         │                       │ (Activity continues)
         │                       │
         │                       ↓
         │               ┌────────────────────┐
         │               │ Token Near Expiry  │
         │               └─────────┬──────────┘
         │                         │
         │                         │ Auto-refresh (client) or Manual refreshSession() (server)
         │                         ↓
         │               ┌─────────────────┐
         │               │   Refreshing    │
         │               └────────┬────────┘
         │                        │
         │        ┌───[Success]───┤───[Fail]───┐
         │        │                │            │
         │        ↓                ↓            ↓
         │   [Authenticated]  [Retry 1]   [Logged Out]
         │                         │
         │                    [Fail]→[Retry 2]→[Retry 3]→[Logged Out]
         │
         └──[Failure]──→ ┌──────────────┐
                         │ Auth Failed  │ (Invalid credentials)
                         └──────────────┘

Explicit Logout:
[Authenticated] --signOut()--> [Logging Out] --> [Anonymous]

Multi-Tab Logout:
[Tab 1: Authenticated] --signOut()--> [BroadcastChannel]
                                           ↓
[Tab 2: Authenticated] <--logout event-- [All Tabs: Anonymous]
```

### Session Refresh Decision Tree

```
Server Component or Server Action receives request
    ↓
Check for session cookie
    ↓
    ├── No cookie → [Unauthenticated] → Redirect to /login
    │
    ├── Has cookie → Check access token
                         ↓
                         ├── Valid (not expired) → [Use session]
                         │
                         └── Expired → Check refresh token
                                          ↓
                                          ├── Valid → refreshSession()
                                          │              ↓
                                          │           [Success] → Update cookie → [Use session]
                                          │              ↓
                                          │           [Fail] → Clear cookie → Redirect to /login
                                          │
                                          └── Expired/Invalid → Clear cookie → Redirect to /login
```

---

## Cookie Schema

### Session Cookie Structure

**Name**: `nhostSession` (default, configurable)

**Attributes**:
```typescript
{
  Secure: true,              // HTTPS only
  HttpOnly: true,            // No JavaScript access
  SameSite: 'Lax',          // CSRF protection + usability
  Path: '/',                 // Available app-wide
  MaxAge: 2592000,          // 30 days (refresh token lifetime)
  Domain: undefined          // Current domain only (no subdomain sharing)
}
```

**Value** (JSON string, encrypted by Nhost):
```typescript
{
  accessToken: string,
  accessTokenExpiresIn: number,
  refreshToken: string,
  user: {
    id: string,
    email: string,
    // ... other user fields
  }
}
```

**Size**: Typically 2-4 KB (within 4KB cookie limit)

**Security Notes**:
- Encrypted by Nhost SDK before storage
- Cannot be read/modified by client JavaScript
- Automatically sent with requests to same domain
- SameSite=Lax prevents CSRF while allowing navigation

---

## Validation Rules & Constraints

### Session Validation
1. **Access Token**:
   - Must be valid JWT with correct signature
   - Must not be expired (current time < expiresAt)
   - Must contain required claims (user ID, email)

2. **Refresh Token**:
   - Must exist in Nhost database (not revoked)
   - Must not be past expiration timestamp
   - Can only be used once per refresh (single-use constraint)

3. **Cookie**:
   - Must be parseable as JSON
   - Must match expected schema
   - Must have all security attributes (Secure, HttpOnly, SameSite)

### State Consistency Rules
1. **Client-Server Sync**:
   - Cookie is single source of truth
   - Client reads cookie on mount, updates on auth operations
   - Server reads cookie per request, updates on refresh
   - No caching of session data beyond cookie

2. **Multi-Tab Consistency**:
   - Logout broadcasts to all tabs via BroadcastChannel
   - Each tab maintains own in-memory session copy
   - Tabs sync on logout events within 1 second (SC-009)

3. **Refresh Idempotency**:
   - Multiple simultaneous refresh calls return same new token
   - Nhost backend handles concurrency (deduplicates requests)
   - First refresh succeeds, subsequent use new token

---

## Performance Considerations

### Access Token Caching
- **Client**: Cached in memory by Nhost SDK, refreshed proactively before expiration
- **Server**: No caching (stateless), validated fresh per request
- **Benefit**: Reduces unnecessary refresh calls, improves response time

### Refresh Token Optimization
- **Sliding Window**: Prevents frequent re-authentication for active users
- **Exponential Backoff**: Avoids overwhelming server during failures
- **Single-Use**: Prevents token replay attacks while allowing safe retry

### Cookie Read Performance
- **Server**: Reading cookie adds ~1-5ms overhead (negligible)
- **Client**: Cookie auto-attached by browser (no additional request)
- **Optimization**: Validate cookie format before parsing (fail fast on corruption)

---

## Security Model

### Threat Protection

1. **XSS (Cross-Site Scripting)**:
   - **Mitigation**: HttpOnly cookies prevent JavaScript access to tokens
   - **Impact**: Stolen cookies cannot be read by injected scripts

2. **CSRF (Cross-Site Request Forgery)**:
   - **Mitigation**: SameSite=Lax blocks cross-origin POST requests
   - **Impact**: Malicious sites cannot trigger auth operations

3. **Token Theft**:
   - **Mitigation**: Short access token lifetime (15 min), HTTPS-only transmission
   - **Impact**: Stolen access tokens expire quickly; refresh tokens require HttpOnly cookie

4. **Session Fixation**:
   - **Mitigation**: New session ID generated on login
   - **Impact**: Cannot force user into attacker's session

5. **Replay Attacks**:
   - **Mitigation**: Single-use refresh tokens, short access token lifetime
   - **Impact**: Cannot reuse captured tokens beyond their validity window

### Compliance Considerations

- **GDPR**: Session data stored in EU region (configurable via Nhost), automatic cleanup on logout
- **OWASP**: Follows Session Management Cheat Sheet recommendations
- **Industry Standard**: 30-day inactivity timeout, secure cookie attributes, encrypted storage

---

## Migration Path

### From Current Implementation

**Current State**:
- Using Nhost SDK v4 (correct)
- Single createClient instance
- Basic cookie handling

**Required Changes**:
1. Add createServerClient for server-side operations
2. Update cookie configuration with explicit attributes
3. Add retry logic with exponential backoff
4. Implement BroadcastChannel for tab sync
5. Update Server Components to call refreshSession()

**Data Migration**:
- **Not required**: Cookie format remains compatible
- **Session continuity**: Existing sessions will continue to work
- **User re-auth**: Not required for existing users

**Rollback Plan**:
- Keep existing auth.ts functions as fallback
- Feature flag new patterns during testing
- Gradual rollout: Server-side first, then client-side enhancements

---

## Testing Scenarios

### Unit Test Coverage
1. Session creation from login response
2. Token expiration detection
3. Cookie attribute validation
4. Sliding window timestamp calculation
5. Retry backoff timing

### Integration Test Coverage
1. Client-server session synchronization
2. Multi-tab logout propagation
3. Concurrent refresh deduplication
4. Cookie read/write cycle
5. Graceful degradation on errors

### E2E Test Coverage
1. Complete login flow
2. Idle → return → auto-refresh
3. Logout in one tab → verify all tabs
4. Session expiration → clear error message
5. Network failure → retry → success

---

## Appendix: Type Definitions

```typescript
// Complete type definitions provided in contracts/ directory
// See: contracts/client-session.ts, contracts/server-session.ts

interface Session {
  accessToken: string
  accessTokenExpiresIn: number
  refreshToken: string
  user: User
}

interface User {
  id: string
  email: string
  emailVerified: boolean
  displayName: string | null
  avatarUrl: string | null
  locale: string
  defaultRole: string
  roles: string[]
  metadata: Record<string, any>
}

interface CookieConfig {
  Secure: boolean
  HttpOnly: boolean
  SameSite: 'Strict' | 'Lax' | 'None'
  Path: string
  MaxAge: number
}
```

---

**Document Status**: Complete
**Next Step**: Review contracts/ directory for TypeScript interface definitions
