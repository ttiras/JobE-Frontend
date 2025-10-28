/**
 * Client Session Contracts
 * 
 * TypeScript interfaces for client-side authentication using createClient.
 * These contracts define the shape of session data, configuration, and
 * operations available in the browser context.
 * 
 * @module contracts/client-session
 */

import type { NhostClient } from '@nhost/nhost-js'

/**
 * Configuration for createClient
 * Defines cookie attributes and behavior for client-side session management
 */
export interface ClientConfig {
  /** Nhost project subdomain */
  subdomain: string
  
  /** Nhost region (optional, defaults to nearest) */
  region?: string
  
  /** Cookie configuration for session storage */
  clientStorageType: 'cookie'
  
  /** Cookie attributes for security */
  cookieAttributes: CookieAttributes
  
  /** Automatically refresh access tokens before expiration */
  autoRefreshToken: true
  
  /** Auto sign-in if valid session exists in storage */
  autoSignIn: true
}

/**
 * HTTP-only cookie attributes for session security
 * These settings prevent XSS attacks and CSRF while maintaining usability
 */
export interface CookieAttributes {
  /** Require HTTPS for cookie transmission */
  secure: true
  
  /** Prevent JavaScript access to cookie */
  httpOnly: true
  
  /** CSRF protection strategy */
  sameSite: 'Lax'
  
  /** Cookie available across entire app */
  path: '/'
  
  /** Cookie lifetime in seconds (30 days for refresh token) */
  maxAge: 2592000
}

/**
 * Client-side session state
 * Represents the current authentication state in the browser
 */
export interface ClientSessionState {
  /** Current session or null if logged out */
  session: Session | null
  
  /** Loading state during auth operations */
  isLoading: boolean
  
  /** Computed authentication status */
  isAuthenticated: boolean
  
  /** Error from last auth operation */
  error: AuthError | null
}

/**
 * Session object containing tokens and user data
 * Shared between client and server contexts
 */
export interface Session {
  /** Short-lived JWT for API requests */
  accessToken: string
  
  /** Seconds until access token expires */
  accessTokenExpiresIn: number
  
  /** Long-lived token for renewing access tokens */
  refreshToken: string
  
  /** Authenticated user data */
  user: User
}

/**
 * User entity with profile information
 * Matches Nhost user schema
 */
export interface User {
  /** Unique user identifier (UUID) */
  id: string
  
  /** User email address */
  email: string
  
  /** Email verification status */
  emailVerified: boolean
  
  /** User's display name */
  displayName: string | null
  
  /** Profile picture URL */
  avatarUrl: string | null
  
  /** User's language preference */
  locale: 'en' | 'tr'
  
  /** Primary role */
  defaultRole: string
  
  /** All assigned roles */
  roles: string[]
  
  /** Custom user metadata */
  metadata: Record<string, any>
  
  /** Account creation timestamp */
  createdAt: string
  
  /** Last update timestamp */
  updatedAt: string
}

/**
 * Authentication error with categorization
 * Enables user-friendly error messages and proper handling
 */
export interface AuthError {
  /** Error type for programmatic handling */
  type: AuthErrorType
  
  /** Human-readable error message */
  message: string
  
  /** HTTP status code if applicable */
  status?: number
  
  /** Additional error context */
  details?: Record<string, any>
}

/**
 * Categorized authentication error types
 * Maps to specific error handling strategies
 */
export type AuthErrorType =
  | 'INVALID_CREDENTIALS'      // Wrong email/password
  | 'EMAIL_NOT_VERIFIED'       // Account exists but email not confirmed
  | 'USER_DISABLED'            // Account disabled by admin
  | 'NETWORK_ERROR'            // Connection failed
  | 'SESSION_EXPIRED'          // Refresh token expired
  | 'RATE_LIMITED'             // Too many requests
  | 'UNKNOWN_ERROR'            // Unexpected error

/**
 * Login operation parameters
 */
export interface LoginParams {
  /** User email address */
  email: string
  
  /** User password */
  password: string
  
  /** Optional: Remember user across browser restarts */
  remember?: boolean
}

/**
 * Registration operation parameters
 */
export interface RegisterParams {
  /** User email address */
  email: string
  
  /** User password (min 8 characters) */
  password: string
  
  /** User's display name */
  displayName?: string
  
  /** User's language preference */
  locale?: 'en' | 'tr'
  
  /** Custom user metadata */
  metadata?: Record<string, any>
  
  /** Redirect URL after email verification */
  redirectTo?: string
}

/**
 * Password reset request parameters
 */
export interface PasswordResetParams {
  /** User email address */
  email: string
  
  /** Redirect URL with reset token */
  redirectTo: string
}

/**
 * Password change parameters
 */
export interface PasswordChangeParams {
  /** New password (min 8 characters) */
  newPassword: string
  
  /** Password reset token from email */
  ticket?: string
}

/**
 * Retry configuration for failed refresh operations
 * Implements exponential backoff strategy
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: 3
  
  /** Base delay between retries (ms) */
  baseDelay: 1000
  
  /** Exponential backoff multiplier */
  backoffMultiplier: 2
  
  /** Maximum delay cap (ms) */
  maxDelay: 8000
}

/**
 * BroadcastChannel message for multi-tab sync
 */
export interface AuthChannelMessage {
  /** Message type */
  type: 'LOGOUT' | 'LOGIN' | 'SESSION_REFRESH'
  
  /** Message payload */
  payload?: {
    /** User ID (for verification) */
    userId?: string
    
    /** Timestamp of event */
    timestamp: number
  }
}

/**
 * Client-side auth operations interface
 * Defines all available authentication methods
 */
export interface ClientAuthOperations {
  /** Sign in with email and password */
  signInEmailPassword(params: LoginParams): Promise<{ session: Session | null; error: AuthError | null }>
  
  /** Sign up new user with email and password */
  signUpEmailPassword(params: RegisterParams): Promise<{ session: Session | null; error: AuthError | null }>
  
  /** Sign out current user */
  signOut(): Promise<{ error: AuthError | null }>
  
  /** Request password reset email */
  resetPassword(params: PasswordResetParams): Promise<{ error: AuthError | null }>
  
  /** Change password with reset token */
  changePassword(params: PasswordChangeParams): Promise<{ error: AuthError | null }>
  
  /** Manually refresh access token */
  refreshSession(): Promise<{ session: Session | null; error: AuthError | null }>
  
  /** Get current session */
  getSession(): Session | null
  
  /** Get current user */
  getUser(): User | null
  
  /** Check if user is authenticated */
  isAuthenticated(): boolean
}

/**
 * Type guard to check if error is AuthError
 */
export function isAuthError(error: any): error is AuthError {
  return (
    error &&
    typeof error === 'object' &&
    'type' in error &&
    'message' in error
  )
}

/**
 * Type guard to check if session is valid
 */
export function isValidSession(session: any): session is Session {
  return (
    session &&
    typeof session === 'object' &&
    'accessToken' in session &&
    'refreshToken' in session &&
    'user' in session &&
    typeof session.user === 'object' &&
    'id' in session.user
  )
}
