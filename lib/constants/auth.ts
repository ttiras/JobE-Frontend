/**
 * Authentication Constants
 * 
 * Centralized configuration values for authentication behavior.
 * Extracted from various auth-related modules for maintainability.
 * 
 * @module constants/auth
 */

/**
 * Session cookie configuration
 */
export const SESSION_COOKIE = {
  /** Cookie name for Nhost session storage */
  NAME: 'nhostSession',
  
  /** Cookie expiration in days (sliding window) */
  EXPIRATION_DAYS: 30,
  
  /** Cookie expiration in seconds (for maxAge calculations) */
  EXPIRATION_SECONDS: 30 * 24 * 60 * 60, // 30 days = 2,592,000 seconds
  
  /** SameSite policy for CSRF protection */
  SAME_SITE: 'lax' as const,
  
  /** Cookie path (app-wide availability) */
  PATH: '/',
} as const

/**
 * Session refresh retry configuration
 */
export const SESSION_REFRESH = {
  /** Maximum number of refresh attempts (initial + retries) */
  MAX_ATTEMPTS: 3,
  
  /** Base delay in milliseconds for exponential backoff */
  BASE_DELAY_MS: 1000, // 1 second
  
  /** Multiplier for exponential backoff (delays: 1s, 2s, 4s) */
  BACKOFF_MULTIPLIER: 2,
  
  /** Force refresh threshold (0 = always refresh) */
  FORCE_REFRESH_THRESHOLD: 0,
} as const

/**
 * Session state polling configuration
 */
export const SESSION_POLLING = {
  /** Interval in milliseconds to check for session changes */
  INTERVAL_MS: 1000, // 1 second
} as const

/**
 * Default fallback values
 */
export const DEFAULTS = {
  /** Default local development URL */
  LOCAL_URL: 'http://localhost:3000',
} as const

/**
 * Error messages for authentication operations
 */
export const AUTH_ERRORS = {
  /** Error when NHOST_SUBDOMAIN is not configured */
  MISSING_SUBDOMAIN: 'NEXT_PUBLIC_NHOST_SUBDOMAIN environment variable is required. Please check your .env.local file.',
  
  /** Error when useAuth is called outside AuthProvider */
  CONTEXT_MISSING: 'useAuth must be used within AuthProvider. Wrap your component tree with <AuthProvider>.',
  
  /** Error when useNhostClient is called outside NhostProvider */
  CLIENT_MISSING: 'useNhostClient must be used within NhostProvider. Wrap your component tree with <NhostProvider>.',
  
  /** Error when session refresh fails */
  REFRESH_FAILED: 'Failed to refresh session. Please try logging in again.',
  
  /** Error when session refresh fails with no session returned */
  REFRESH_NO_SESSION: 'Session refresh failed - no session data returned from server.',
  
  /** Generic unknown error during refresh */
  REFRESH_UNKNOWN: 'Unknown error occurred during session refresh.',
  
  /** Error when client is not properly configured */
  CLIENT_NOT_CONFIGURED: 'Nhost client is not properly configured. Check environment variables and client initialization.',
} as const

/**
 * Log message templates for authentication operations
 */
export const AUTH_LOGS = {
  /** Client initialization messages */
  CLIENT_INITIALIZED: '[NhostProvider] Client initialized successfully',
  CLIENT_ERROR: '[NhostProvider] Client not properly configured',
  
  /** Session refresh messages */
  REFRESH_STARTED: '[Auth] Session refresh started',
  REFRESH_SUCCESS: '[Auth] Session refreshed successfully',
  REFRESH_FAILED: '[Auth] Session refresh failed',
  REFRESH_RETRY: '[Auth] Session refresh retry attempt',
  
  /** Session state changes */
  SESSION_UPDATED: '[Auth] Session state updated',
  SESSION_EXPIRED: '[Auth] Session expired',
  USER_AUTHENTICATED: '[Auth] User authenticated',
  USER_LOGGED_OUT: '[Auth] User logged out',
} as const
