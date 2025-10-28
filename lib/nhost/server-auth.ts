/**
 * Server-Side Authentication Functions
 * 
 * This module contains server-only authentication utilities.
 * DO NOT import this file from client components.
 * 
 * Use Cases:
 * - Server Components (app/[locale]/...)
 * - Server Actions ('use server')
 * - API Routes (app/api/...)
 * - Middleware
 * 
 * @see https://docs.nhost.io/reference/javascript/nhost-js/create-server-client
 */

import { createNhostServerClient } from './server-client'
import type { UserRole, Session } from '@/lib/types/nhost'
import { getSessionFromCookies, isAccessTokenExpired, getUserRole, getAllowedRoles } from '@/lib/nhost/session'

/**
 * Authentication errors for server-side operations
 */
export class ServerAuthError extends Error {
  constructor(
    message: string,
    public readonly code: 'UNAUTHENTICATED' | 'UNAUTHORIZED',
    public readonly requiredRoles?: UserRole[]
  ) {
    super(message)
    this.name = 'ServerAuthError'
  }
}

/**
 * Result of server-side session validation
 * 
 * Contains the validated session, user data, and role check result.
 * Used by validateServerSession() to provide comprehensive auth information.
 */
export interface ServerSessionValidation {
  /**
   * The validated session, or null if no valid session exists
   */
  session: Session | null
  
  /**
   * The user data from the session, or null if no session/user
   */
  user: Session['user'] | null
  
  /**
   * Whether the user has all required roles.
   * Always true if no roles were required.
   * False if user lacks any required role.
   */
  hasRequiredRole: boolean
}

/**
 * Validate session on server-side with explicit refresh
 * 
 * Creates a server-side Nhost client, explicitly refreshes the session,
 * and validates the session including optional role-based access control.
 * 
 * This function never throws - it returns a validation result that indicates
 * success or failure. The caller is responsible for handling redirects.
 * 
 * @param requiredRoles - Optional array of roles required for access
 * @returns Session validation result with session, user, and role check
 * 
 * @example
 * ```typescript
 * const { session, user, hasRequiredRole } = await validateServerSession(['admin'])
 * 
 * if (!session) {
 *   redirect('/login')
 * }
 * 
 * if (!hasRequiredRole) {
 *   redirect('/unauthorized')
 * }
 * ```
 */
export async function validateServerSession(
  requiredRoles?: UserRole[]
): Promise<ServerSessionValidation> {
  try {
    // First, read minimal tokens directly from the cookie
    const minimal = await getSessionFromCookies()

    // No tokens at all -> unauthenticated
    if (!minimal || (!minimal.accessToken && !minimal.refreshToken)) {
      return { session: null, user: null, hasRequiredRole: false }
    }

    // If we have a valid (non-expired) access token, we can validate roles from JWT without a refresh
    const hasValidAccess = minimal.accessToken && !isAccessTokenExpired(minimal.accessToken)
    if (hasValidAccess) {
      // Compute roles from JWT claims
      const defaultRole = getUserRole(minimal.accessToken!)
      const allowedRoles = getAllowedRoles(minimal.accessToken!)

      let hasRequiredRole = true
      if (requiredRoles && requiredRoles.length > 0) {
        hasRequiredRole = requiredRoles.some((r) => allowedRoles.includes(r))
      }

      // Construct a minimal session object sufficient for downstream checks
      const pseudoSession = {
        accessToken: minimal.accessToken,
        refreshToken: minimal.refreshToken,
        user: defaultRole
          ? { defaultRole, roles: allowedRoles }
          : null,
      } as unknown as Session

      return { session: pseudoSession, user: pseudoSession.user, hasRequiredRole }
    }

    // Access token missing or expired: try server-side refresh only if we have a refresh token
    if (!minimal.refreshToken) {
      return { session: null, user: null, hasRequiredRole: false }
    }

    const client = await createNhostServerClient()
    // Suppress noisy SDK warnings for expected refresh failures (invalid/expired token)
  const originalWarn: (...args: Parameters<typeof console.warn>) => ReturnType<typeof console.warn> = console.warn
  const originalError: (...args: Parameters<typeof console.error>) => ReturnType<typeof console.error> = console.error
    console.warn = (...args: Parameters<typeof console.warn>) => { 
      const msg = String(args?.[0] ?? '')
      if (
        msg.includes('error refreshing session, retrying') ||
        msg.includes('session probably expired')
      ) {
        return
      }
      // pass-through other warnings
      return originalWarn(...args)
    }
    console.error = (...args: Parameters<typeof console.error>) => {
      const msg = String(args?.[0] ?? '')
      if (msg.includes('session probably expired')) {
        return
      }
      return originalError(...args)
    }
    try {
      await client.refreshSession()
    } catch {
      // Refresh failed (likely invalid/expired refresh token)
      return { session: null, user: null, hasRequiredRole: false }
    } finally {
      console.warn = originalWarn
      console.error = originalError
    }

    const session = client.getUserSession()
    if (!session) {
      return { session: null, user: null, hasRequiredRole: false }
    }

    // RBAC check using session.user when available; fallback to JWT roles if needed
    let hasRequiredRole = true
    if (requiredRoles && requiredRoles.length > 0) {
      const userRoles = session.user?.roles || (minimal.accessToken ? getAllowedRoles(minimal.accessToken) : [])
      hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role))
    }

    return { session, user: session.user || null, hasRequiredRole }
  } catch (error) {
    // Handle expected errors quietly; only surface unexpected ones in dev
    const msg = error instanceof Error ? error.message : String(error)
    const expected = /expired|invalid|refresh|cookie/i.test(msg)
    if (!expected && process.env.NODE_ENV === 'development') {
      console.error('[validateServerSession] Unexpected error:', error)
    }
    return { session: null, user: null, hasRequiredRole: false }
  }
}

/**
 * Get server session without validation
 * 
 * Similar to validateServerSession but returns just the session.
 * Useful when you don't need role checking.
 * 
 * @returns Session or null
 */
export async function getServerSession(): Promise<Session | null> {
  const { session } = await validateServerSession()
  return session
}

/**
 * Require authentication for Server Actions
 * 
 * Validates session and throws ServerAuthError if not authenticated.
 * Use this at the start of Server Actions that require auth.
 * 
 * @param requiredRoles - Optional roles required
 * @returns Validated session
 * @throws {ServerAuthError} If not authenticated (UNAUTHENTICATED) or missing required role (UNAUTHORIZED)
 * 
 * @example
 * ```typescript
 * 'use server'
 * 
 * export async function updateProfile(data: ProfileData) {
 *   try {
 *     const session = await requireAuth()
 *     // ... update profile
 *   } catch (error) {
 *     if (error instanceof ServerAuthError) {
 *       if (error.code === 'UNAUTHENTICATED') {
 *         // Redirect to login
 *       } else if (error.code === 'UNAUTHORIZED') {
 *         // Show permission error
 *       }
 *     }
 *   }
 * }
 * ```
 */
export async function requireAuth(
  requiredRoles?: UserRole[]
): Promise<Session> {
  const { session, hasRequiredRole } = await validateServerSession(requiredRoles)
  
  if (!session) {
    throw new ServerAuthError(
      'Authentication required. Please log in to continue.',
      'UNAUTHENTICATED'
    )
  }
  
  if (!hasRequiredRole) {
    throw new ServerAuthError(
      `Insufficient permissions. Required roles: ${requiredRoles?.join(', ')}`,
      'UNAUTHORIZED',
      requiredRoles
    )
  }
  
  return session
}
