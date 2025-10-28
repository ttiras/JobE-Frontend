# Quickstart Guide: Nhost v4 Authentication Implementation

**Feature**: 004-nhost-v4-auth-setup  
**Last Updated**: 2025-10-27  
**Target Audience**: Developers implementing this feature

## Overview

This guide helps you implement Nhost v4 best practices for authentication in the JobE Next.js application. You'll set up dual-client architecture (createClient + createServerClient), configure secure session management, and implement resilient error handling.

**Estimated Time**: 4-6 hours for core implementation + 2-3 hours for tests

---

## Prerequisites

### Required Knowledge
- TypeScript and Next.js 15 App Router
- React hooks and Server Components
- HTTP cookies and browser storage
- Basic authentication concepts (JWT, sessions)

### Environment Setup
1. ✅ Nhost project created and configured
2. ✅ Environment variables set:
   - `NEXT_PUBLIC_NHOST_SUBDOMAIN`
   - `NEXT_PUBLIC_NHOST_REGION` (optional)
3. ✅ Dependencies installed (already in package.json):
   - `@nhost/nhost-js@^4.0.1`
   - `@nhost/nextjs@^2.3.1`

### Nhost Dashboard Configuration
Before starting, configure your Nhost project:

1. **Enable Sliding Window Refresh Tokens**:
   - Navigate to Nhost Dashboard → Settings → Auth
   - Set "Refresh Token Expiration" to "Sliding Window"
   - Set window to 30 days
   - Save changes

2. **Verify Email Settings**:
   - Check "Email Verification" is enabled
   - Configure email templates if needed
   - Set redirect URLs for verification

---

## Implementation Roadmap

### Phase 1: Core Client Configuration (2 hours)
- [ ] Update `lib/nhost/client.ts` with createClient v4 config
- [ ] Create `lib/nhost/server-client.ts` with createServerClient
- [ ] Update cookie configuration with security attributes
- [ ] Test both clients work independently

### Phase 2: Session Management (2 hours)
- [ ] Update `lib/nhost/session-cookie.ts` with explicit attributes
- [ ] Implement retry logic in `lib/hooks/use-session-refresh.ts`
- [ ] Test session refresh (multi-tab logout handled automatically by Nhost)

### Phase 3: Server-Side Integration (1.5 hours)
- [ ] Update Server Components to use createServerClient
- [ ] Add explicit refreshSession() calls before auth checks
- [ ] Update auth guards with proper error handling
- [ ] Test SSR with direct page access

### Phase 4: Error Handling & UX (1.5 hours)
- [ ] Implement error categorization in `lib/utils/auth-errors.ts`
- [ ] Create session expiration dialog component
- [ ] Add user-friendly error messages (EN + TR)
- [ ] Test error scenarios and recovery flows

### Phase 5: Testing (2-3 hours)
- [ ] Write unit tests for client/server creation
- [ ] Write integration tests for session sync
- [ ] Write E2E tests for complete auth flows
- [ ] Verify all success criteria met

---

## Step-by-Step Implementation

### Step 1: Update Client Configuration

**File**: `lib/nhost/client.ts`

```typescript
import { NhostClient } from '@nhost/nhost-js'

if (!process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN) {
  throw new Error('NEXT_PUBLIC_NHOST_SUBDOMAIN environment variable is required')
}

/**
 * Client-side Nhost client with automatic session refresh
 * Used in browser context (Client Components, hooks)
 */
export const nhost = new NhostClient({
  subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN,
  region: process.env.NEXT_PUBLIC_NHOST_REGION,
  
  // Use HTTP-only cookies for session storage
  clientStorageType: 'cookie',
  
  // Configure cookie security attributes
  clientStorage: {
    // Cookie attributes per spec clarifications
    cookieAttributes: {
      secure: true,           // HTTPS only
      httpOnly: true,         // Prevent XSS
      sameSite: 'Lax',       // CSRF protection + usability
      path: '/',             // Available app-wide
      maxAge: 60 * 60 * 24 * 30  // 30 days (matches refresh token)
    }
  },
  
  // Enable automatic token refresh
  autoRefreshToken: true,
  
  // Auto sign-in if valid session exists
  autoSignIn: true
})

// Helper functions remain the same
export function getVerifyEmailRedirectUrl(locale: string = 'en'): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/${locale}/verify-email`
}

export function getResetPasswordRedirectUrl(locale: string = 'en'): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/${locale}/reset-password`
}
```

**What Changed**:
- Added `clientStorage` configuration with explicit cookie attributes
- Removed old `cookieOptions` if present
- Kept `autoRefreshToken: true` for client-side automatic refresh

**Test**:
```typescript
// Test in browser console
console.log(nhost.auth.getSession()) // Should return session or null
```

---

### Step 2: Create Server Client

**File**: `lib/nhost/server-client.ts` (NEW)

```typescript
import { NhostClient } from '@nhost/nhost-js'
import { cookies } from 'next/headers'

/**
 * Create server-side Nhost client for Server Components and Server Actions
 * Must be called per-request (not exported as singleton)
 * 
 * @example
 * // In Server Component
 * const nhost = await createServerClient()
 * await nhost.auth.refreshSession()
 * const session = nhost.auth.getSession()
 */
export async function createServerClient() {
  const cookieStore = await cookies()
  
  return new NhostClient({
    subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN!,
    region: process.env.NEXT_PUBLIC_NHOST_REGION,
    
    // Use same cookie storage as client
    clientStorageType: 'cookie',
    
    clientStorage: {
      // Custom cookie getter/setter for Next.js
      getCookie: (name: string) => {
        return cookieStore.get(name)?.value
      },
      
      setCookie: (name: string, value: string) => {
        cookieStore.set(name, value, {
          secure: true,
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30
        })
      },
      
      deleteCookie: (name: string) => {
        cookieStore.delete(name)
      }
    },
    
    // Disable automatic refresh (manual control)
    autoRefreshToken: false,
    
    // Disable auto sign-in (explicit session check)
    autoSignIn: false
  })
}
```

**Test**:
```typescript
// In a Server Component
export default async function TestPage() {
  const nhost = await createServerClient()
  const session = nhost.auth.getSession()
  
  return <div>Session: {session ? 'Active' : 'None'}</div>
}
```

---

### Step 3: Implement Retry Logic

**File**: `lib/hooks/use-session-refresh.ts` (NEW)

```typescript
'use client'

import { useState, useCallback } from 'react'
import { nhost } from '@/lib/nhost/client'

interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  backoffMultiplier: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  backoffMultiplier: 2
}

export function useSessionRefresh(config: RetryConfig = DEFAULT_RETRY_CONFIG) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  
  const refreshWithRetry = useCallback(async () => {
    setIsRefreshing(true)
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
      try {
        const { session, error } = await nhost.auth.refreshSession()
        
        if (error) {
          throw new Error(error.message)
        }
        
        setRetryCount(attempt)
        setIsRefreshing(false)
        return { session, error: null }
        
      } catch (error) {
        lastError = error as Error
        setRetryCount(attempt + 1)
        
        // Don't wait after last attempt
        if (attempt < config.maxAttempts - 1) {
          const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    setIsRefreshing(false)
    return { session: null, error: lastError }
  }, [config])
  
  return {
    refreshWithRetry,
    isRefreshing,
    retryCount
  }
}
```

**Test**:
```typescript
// In a component
function MyComponent() {
  const { refreshWithRetry, isRefreshing, retryCount } = useSessionRefresh()
  
  return (
    <button onClick={refreshWithRetry} disabled={isRefreshing}>
      Refresh {isRefreshing && `(Attempt ${retryCount + 1})`}
    </button>
  )
}
```

---

### Step 4: Server-Side Auth Guard

**File**: `components/layout/server-auth-guard.tsx` (UPDATE)

```typescript
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/nhost/server-client'

interface ServerAuthGuardProps {
  children: React.ReactNode
  requiredRoles?: string[]
  redirectTo?: string
}

export async function ServerAuthGuard({ 
  children, 
  requiredRoles,
  redirectTo = '/login'
}: ServerAuthGuardProps) {
  const nhost = await createServerClient()
  
  // CRITICAL: Explicit refresh before checking session
  await nhost.auth.refreshSession()
  
  const session = nhost.auth.getSession()
  
  if (!session) {
    redirect(redirectTo)
  }
  
  // Role check if required
  if (requiredRoles && requiredRoles.length > 0) {
    const userRoles = session.user.roles
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role))
    
    if (!hasRequiredRole) {
      redirect('/unauthorized')
    }
  }
  
  return <>{children}</>
}
```

**Usage in Server Component**:
```typescript
import { ServerAuthGuard } from '@/components/layout/server-auth-guard'

export default async function ProtectedPage() {
  return (
    <ServerAuthGuard>
      <div>Protected content</div>
    </ServerAuthGuard>
  )
}
```

---

## Testing Guide

### Unit Tests

**File**: `tests/unit/nhost-client.test.ts`

```typescript
import { nhost } from '@/lib/nhost/client'
import { createServerClient } from '@/lib/nhost/server-client'

describe('Nhost Client Configuration', () => {
  test('client has automatic refresh enabled', () => {
    expect(nhost.auth.client.autoRefreshToken).toBe(true)
  })
  
  test('server client disables automatic refresh', async () => {
    const serverClient = await createServerClient()
    expect(serverClient.auth.client.autoRefreshToken).toBe(false)
  })
  
  test('both clients use cookie storage', () => {
    expect(nhost.auth.client.clientStorageType).toBe('cookie')
  })
})
```

### Integration Tests

**File**: `tests/integration/client-server-sync.test.ts`

```typescript
describe('Client-Server Session Sync', () => {
  test('login on client updates server session', async () => {
    // Login via client
    const { session } = await nhost.auth.signInEmailPassword({
      email: 'test@example.com',
      password: 'password123'
    })
    
    expect(session).toBeTruthy()
    
    // Verify server can read same session
    const serverClient = await createServerClient()
    const serverSession = serverClient.auth.getSession()
    
    expect(serverSession?.user.id).toBe(session?.user.id)
  })
})
```

### E2E Tests

**File**: `tests/e2e/idle-refresh.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test('session refreshes after idle period', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  // Wait for dashboard
  await expect(page).toHaveURL('/dashboard')
  
  // Simulate idle (wait 10 minutes)
  await page.waitForTimeout(10 * 60 * 1000)
  
  // Interact with page (should trigger refresh)
  await page.click('a[href="/profile"]')
  
  // Should navigate without login redirect
  await expect(page).toHaveURL('/profile')
})
```

---

## Troubleshooting

### Common Issues

**Issue**: "Session not found" on server-rendered pages
- **Cause**: Forgot to call `refreshSession()` before accessing session
- **Fix**: Add `await nhost.auth.refreshSession()` in Server Component

**Issue**: Cookie not shared between client and server
- **Cause**: Cookie attributes mismatch or domain issues
- **Fix**: Verify both clients use identical cookie configuration

**Issue**: Multi-tab logout not working
- **Cause**: Nhost handles this automatically via shared cookies
- **Fix**: Verify both clients use same cookie storage configuration; no manual sync needed

**Issue**: Refresh fails with network error
- **Cause**: Retry logic not implemented
- **Fix**: Use `useSessionRefresh` hook with retry config

---

## Success Criteria Verification

After implementation, verify these criteria from spec:

- [ ] **SC-001**: Users stay authenticated indefinitely with regular use (test by using app daily for a week)
- [ ] **SC-002**: Return after 15 min idle resumes in <2 sec (test with timer)
- [ ] **SC-003**: Zero client-server auth inconsistencies (test by alternating CSR/SSR navigation)
- [ ] **SC-004**: Server validation adds <100ms overhead (test with performance profiling)
- [ ] **SC-005**: 95% of refreshes complete <500ms (test with metrics collection)
- [ ] **SC-006**: No race conditions during concurrent refresh (test with parallel requests)
- [ ] **SC-007**: Login preserves intended destination (test with deep links)
- [ ] **SC-008**: Clear error messages (test all error scenarios)
- [ ] **SC-009**: Multi-tab logout within 1 sec (test with stopwatch)
- [ ] **SC-010**: Handle 100 concurrent refreshes (load test)

---

## Next Steps

After completing implementation:

1. **Review** generated code against contracts in `specs/004-nhost-v4-auth-setup/contracts/`
2. **Run** full test suite: `npm test && npm run test:e2e`
3. **Performance test** with production-like load
4. **Document** any deviations from plan in `specs/004-nhost-v4-auth-setup/tasks.md`
5. **Create PR** with comprehensive test coverage
6. **Request review** focusing on constitution compliance

---

## Additional Resources

- [Nhost v4 Migration Guide](https://nhost-chore-sdk-react-apollo-and-migration-guide.mintlify.app/reference/migration-guide)
- [Next.js App Router Auth Patterns](https://nextjs.org/docs/app/building-your-application/authentication)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

---

**Document Version**: 1.1  
**Last Updated**: 2025-10-27 (Removed BroadcastChannel - Nhost handles multi-tab sync automatically)  
**Maintainer**: Development Team
