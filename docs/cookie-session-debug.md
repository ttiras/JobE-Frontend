# Cookie Session Loss on Page Refresh - Debugging Guide

## Problem
The `nhostSession` cookie is being removed on page refresh, causing:
- User loses authentication
- GraphQL queries fail with `public` role (no permissions)
- Errors: "field 'organizations' not found in type: 'query_root'"

## Root Cause Analysis

### How Nhost Cookies Work
1. **Client-side**: Nhost's `CookieStorage` sets cookies via `document.cookie` (JavaScript)
2. **These are NOT HttpOnly** - They can be read/written by JavaScript
3. **On page refresh**: Browser should persist these cookies
4. **If cookies disappear**: Something is deleting them

### Common Causes

#### 1. Secure Flag Mismatch ✅ (Likely NOT the issue)
Your config:
```typescript
secure: process.env.NODE_ENV === 'production'
```
- In development: `secure: false` (works with http://localhost)
- In production: `secure: true` (requires HTTPS)

#### 2. SameSite Policy
Your config:
```typescript
sameSite: 'lax'
```
- ✅ Correct for most cases
- Allows navigation but blocks cross-site requests

#### 3. Cookie Expiration
Your config:
```typescript
expirationDays: 30
Max-Age: 2592000 seconds (30 days)
```
- ✅ Should persist

#### 4. Path Mismatch
Your config:
```typescript
Path=/
```
- ✅ Accessible from all routes

### Debugging Steps

#### Step 1: Check Cookie Persistence
1. Navigate to: http://localhost:3000/en/session-debug
2. Note the cookies shown
3. Click "Refresh Page"
4. Check if `nhostSession` cookie is still there

#### Step 2: Browser DevTools
Open DevTools → Application → Cookies → localhost:

Check for `nhostSession` cookie:
- **Name**: nhostSession
- **Value**: Should contain JSON with accessToken/refreshToken
- **Domain**: localhost
- **Path**: /
- **Expires**: ~30 days from now
- **HttpOnly**: ❌ (should be unchecked)
- **Secure**: ❌ in dev, ✅ in production
- **SameSite**: Lax

#### Step 3: Check Console for Errors
Look for:
```
Failed to write nhostSession cookie
Cookie blocked
Third-party cookie
```

#### Step 4: Network Tab
1. Filter for `/v1/graphql` requests
2. Check Request Headers for cookies
3. Look for `cookie: nhostSession=...`

### Potential Issues & Fixes

#### Issue 1: Cookie Not Being Set
**Symptom**: No `nhostSession` cookie in DevTools after login

**Fix**: Check if `setSessionCookie()` is being called:
```typescript
// In login-form.tsx line ~96
setSessionCookie({ 
  accessToken: result?.accessToken, 
  refreshToken: result?.refreshToken 
})
```

#### Issue 2: Nhost SDK Not Using Cookie
**Symptom**: Cookie exists but Nhost doesn't see it

**Possible cause**: Nhost's `CookieStorage` might be looking for a different cookie name

**Fix**: Ensure cookie name matches:
```typescript
// In lib/nhost/client.ts
storage: new CookieStorage({
  cookieName: SESSION_COOKIE.NAME, // Should be 'nhostSession'
  // ...
})
```

#### Issue 3: Cookie Being Cleared by Code
**Search for**: Any code that clears cookies
```bash
grep -r "clearSessionCookie\|document.cookie.*=" --include="*.ts" --include="*.tsx"
```

**Known places**:
- `/app/[locale]/clear-session/page.tsx` - Intentional clear
- `lib/nhost/auth.ts` - Clears on logout
- `lib/nhost/session-cookie.ts` - Clear function

#### Issue 4: Browser Extension Interference
- Disable all browser extensions
- Try in incognito/private window
- Try different browser

#### Issue 5: Multiple Cookie Writers Conflict
You have TWO cookie mechanisms:
1. Nhost's built-in `CookieStorage` (in `client.ts`)
2. Manual `setSessionCookie()` (in `login-form.tsx`)

**They might be conflicting!**

### Recommended Fix

**Option A: Use Only Nhost's Cookie Storage (Recommended)**

Remove the manual cookie setting:

```typescript
// In components/auth/login-form.tsx
// REMOVE these lines:
try {
  setSessionCookie({ 
    accessToken: result?.accessToken, 
    refreshToken: result?.refreshToken 
  })
} catch {}
```

Nhost SDK already handles cookie persistence via `CookieStorage`.

**Option B: Debug Current Setup**

Add logging to see what's happening:

```typescript
// In lib/nhost/session-cookie.ts
export function setSessionCookie(session: BasicSessionShape): void {
  console.log('[setSessionCookie] Called with:', session ? 'valid session' : 'null session')
  
  // ... existing code ...
  
  // After setting cookie, verify it
  const cookies = document.cookie
  console.log('[setSessionCookie] Cookies after set:', cookies)
}
```

### Quick Test

Run this in browser console after login:
```javascript
// Check if cookie exists
console.log('Cookies:', document.cookie)

// Check Nhost session
console.log('Session:', window.nhost?.getUserSession())

// Refresh and check again
location.reload()
```

### Next Steps

1. Visit `/en/session-debug` page after logging in
2. Check if cookie persists after refresh
3. If cookie disappears, check browser console for errors
4. If cookie persists but auth fails, check GraphQL request headers

## Additional Notes

- The error "field 'organizations' not found in type: 'query_root'" happens when querying as `public` role
- This means the user is NOT authenticated when the query runs
- If cookie persists, the issue might be in how the server reads it
