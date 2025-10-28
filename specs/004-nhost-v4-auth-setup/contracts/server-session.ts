/**
 * Server Session Contracts
 * 
 * TypeScript interfaces for server-side authentication using createServerClient.
 * These contracts define session management in Server Components, Server Actions,
 * and API routes with manual refresh control.
 * 
 * @module contracts/server-session
 */

import type { Session, User, AuthError } from './client-session'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import type { ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies'

/**
 * Configuration for createServerClient
 * Defines cookie handling for server-side session management
 */
export interface ServerClientConfig {
  /** Nhost project subdomain */
  subdomain: string
  
  /** Nhost region (optional) */
  region?: string
  
  /** Cookie storage configuration */
  clientStorageType: 'cookie'
  
  /** Cookie getter function (from request) */
  cookieStore: ServerCookieStore
  
  /** Disable automatic refresh (manual control) */
  autoRefreshToken: false
  
  /** Disable auto sign-in (explicit session check) */
  autoSignIn: false
}

/**
 * Server-side cookie store interface
 * Abstracts Next.js cookie APIs for request/response handling
 */
export interface ServerCookieStore {
  /** Get cookie value from request */
  get(name: string): { value: string } | undefined
  
  /** Set cookie value in response */
  set(name: string, value: string, options: CookieSetOptions): void
  
  /** Delete cookie from response */
  delete(name: string): void
  
  /** Get all cookies */
  getAll(): { name: string; value: string }[]
}

/**
 * Options for setting cookies in responses
 */
export interface CookieSetOptions {
  secure: boolean
  httpOnly: boolean
  sameSite: 'strict' | 'lax' | 'none'
  path: string
  maxAge: number
  domain?: string
}

/**
 * Server session context
 * Represents session state during server-side rendering
 */
export interface ServerSessionContext {
  /** Current session from cookie (may be expired) */
  session: Session | null
  
  /** Indicates if session needs refresh */
  requiresRefresh: boolean
  
  /** Last refresh attempt timestamp */
  lastRefreshAttempt?: number
}

/**
 * Server-side auth guard result
 * Used to control access to protected routes
 */
export interface AuthGuardResult {
  /** Authentication status */
  isAuthenticated: boolean
  
  /** Session data if authenticated */
  session: Session | null
  
  /** User data if authenticated */
  user: User | null
  
  /** Error if auth check failed */
  error: AuthError | null
  
  /** Redirect path if unauthenticated */
  redirectTo?: string
}

/**
 * Parameters for protected route access
 */
export interface ProtectedRouteParams {
  /** Current request path */
  path: string
  
  /** Required roles for access (optional) */
  requiredRoles?: string[]
  
  /** Fallback redirect URL */
  loginUrl?: string
  
  /** Preserve return URL after login */
  preserveReturnUrl?: boolean
}

/**
 * Server-side refresh operation result
 */
export interface RefreshResult {
  /** Refresh success status */
  success: boolean
  
  /** Updated session if successful */
  session: Session | null
  
  /** Error if refresh failed */
  error: AuthError | null
  
  /** Indicates if retry is recommended */
  shouldRetry: boolean
}

/**
 * Parameters for manual session refresh
 */
export interface RefreshParams {
  /** Force refresh even if access token valid */
  force?: boolean
  
  /** Cookie store for reading/writing session */
  cookieStore: ServerCookieStore
}

/**
 * Server-side auth operations interface
 * Defines methods available in Server Components and Server Actions
 */
export interface ServerAuthOperations {
  /** Manually refresh session (required before accessing session) */
  refreshSession(params?: RefreshParams): Promise<RefreshResult>
  
  /** Get current session (may be expired) */
  getSession(): Session | null
  
  /** Get current user (may be null) */
  getUser(): User | null
  
  /** Check authentication and redirect if needed */
  requireAuth(params: ProtectedRouteParams): Promise<AuthGuardResult>
  
  /** Clear session and redirect to login */
  signOut(redirectTo?: string): Promise<void>
}

/**
 * Server Component auth helper result
 * Combines session data with utility methods
 */
export interface ServerAuthHelper {
  /** Current session state */
  session: Session | null
  
  /** Current user */
  user: User | null
  
  /** Authentication status */
  isAuthenticated: boolean
  
  /** Check if user has required role */
  hasRole(role: string): boolean
  
  /** Check if user has any of the required roles */
  hasAnyRole(roles: string[]): boolean
  
  /** Get user metadata value */
  getMetadata<T = unknown>(key: string): T | undefined
}

/**
 * Cookie parsing result
 * Validates and extracts session from cookie
 */
export interface CookieParseResult {
  /** Parse success status */
  success: boolean
  
  /** Parsed session if successful */
  session: Session | null
  
  /** Parse error if failed */
  error: ParseError | null
}

/**
 * Cookie parsing error types
 */
export interface ParseError {
  type: 'MISSING_COOKIE' | 'INVALID_JSON' | 'INVALID_SCHEMA' | 'EXPIRED_TOKEN'
  message: string
}

/**
 * Server Actions form data with auth
 * Type-safe wrapper for form submissions requiring authentication
 */
export interface AuthenticatedFormAction<T> {
  /** Execute action with authenticated context */
  execute(data: T, session: Session): Promise<FormActionResult<T>>
}

/**
 * Form action execution result
 */
export interface FormActionResult<T> {
  /** Action success status */
  success: boolean
  
  /** Result data if successful */
  data?: T
  
  /** Error if action failed */
  error?: {
    message: string
    field?: keyof T
  }
  
  /** Redirect path after action */
  redirectTo?: string
}

/**
 * Next.js cookies() API wrapper
 * Provides type-safe access to request/response cookies
 */
export interface NextCookiesWrapper {
  /** Request cookies (read-only) */
  request: ReadonlyRequestCookies
  
  /** Response cookies (read-write) */
  response?: ResponseCookies
}

/**
 * Server-side session refresh strategy
 * Defines when and how to refresh sessions
 */
export interface RefreshStrategy {
  /** Refresh if access token expires within this window (seconds) */
  refreshWindow: number
  
  /** Maximum age for session before forcing re-auth (seconds) */
  maxSessionAge: number
  
  /** Whether to refresh on every server request */
  alwaysRefresh: boolean
}

/**
 * Utility: Create server cookie store from Next.js cookies
 */
export function createServerCookieStore(cookies: NextCookiesWrapper): ServerCookieStore {
  return {
    get: (name: string) => {
      const cookie = cookies.request.get(name)
      return cookie ? { value: cookie.value } : undefined
    },
    
    set: (name: string, value: string, options: CookieSetOptions) => {
      if (cookies.response) {
        cookies.response.set(name, value, options)
      }
    },
    
    delete: (name: string) => {
      if (cookies.response) {
        cookies.response.delete(name)
      }
    },
    
    getAll: () => {
      return cookies.request.getAll()
    }
  }
}

/**
 * Utility: Check if session requires refresh
 */
export function shouldRefreshSession(
  session: Session | null,
  strategy: RefreshStrategy
): boolean {
  if (!session) return false
  
  if (strategy.alwaysRefresh) return true
  
  const expiresIn = session.accessTokenExpiresIn
  return expiresIn <= strategy.refreshWindow
}

/**
 * Utility: Extract session from cookie
 */
export function extractSessionFromCookie(
  cookieStore: ServerCookieStore,
  cookieName: string = 'nhostSession'
): CookieParseResult {
  const cookie = cookieStore.get(cookieName)
  
  if (!cookie) {
    return {
      success: false,
      session: null,
      error: { type: 'MISSING_COOKIE', message: 'No session cookie found' }
    }
  }
  
  try {
    const session = JSON.parse(cookie.value) as Session
    
    // Validate session structure
    if (!session.accessToken || !session.refreshToken || !session.user) {
      return {
        success: false,
        session: null,
        error: { type: 'INVALID_SCHEMA', message: 'Session cookie missing required fields' }
      }
    }
    
    return {
      success: true,
      session,
      error: null
    }
  } catch (error) {
    return {
      success: false,
      session: null,
      error: { type: 'INVALID_JSON', message: 'Failed to parse session cookie' }
    }
  }
}

/**
 * Utility: Create auth guard for Server Components
 */
export async function createServerAuthGuard(
  operations: ServerAuthOperations,
  params: ProtectedRouteParams
): Promise<AuthGuardResult> {
  return await operations.requireAuth(params)
}
