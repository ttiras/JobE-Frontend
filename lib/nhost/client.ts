import { createClient } from '@nhost/nhost-js'
import { CookieStorage } from '@nhost/nhost-js/session'
import { SESSION_COOKIE, DEFAULTS, AUTH_ERRORS } from '@/lib/constants/auth'

// Only validate subdomain at runtime, not during build/static generation
// This allows Next.js to build even if env vars aren't set (they'll be set at runtime)
const getSubdomain = () => {
  const subdomain = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN
  if (!subdomain && typeof window !== 'undefined') {
    // Only throw in browser context (runtime), not during build
    throw new Error(AUTH_ERRORS.MISSING_SUBDOMAIN)
  }
  return subdomain || 'placeholder' // Use placeholder during build
}

// Get the base URL for redirects (works in both dev and production)
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  // Server-side fallback
  return process.env.NEXT_PUBLIC_APP_URL || DEFAULTS.LOCAL_URL
}

/**
 * Nhost client for browser/client-side operations
 * 
 * This is the primary client for Client Components and browser contexts.
 * It automatically handles:
 * - Session refresh before token expiration (Nhost SDK auto-refresh is built-in)
 * - Auto sign-in on page load if valid session exists
 * - Secure cookie storage for tokens (Secure, SameSite=Lax, 30-day expiration)
 * 
 * Cookie Security Configuration:
 * - secure: true - Only transmitted over HTTPS in production
 * - sameSite: 'lax' - CSRF protection while allowing navigation from external sites
 * - expirationDays: 30 - Matches refresh token sliding window expiration
 * 
 * Token Refresh Behavior:
 * - Access token expires in 15 minutes (configured in nhost.toml)
 * - Nhost SDK automatically refreshes tokens before expiration
 * - Refresh happens during API calls when token is near expiration
 * - IMPORTANT: If no API calls are made, token refresh won't happen automatically
 * 
 * For Server Components and Server Actions, use createServerClient instead.
 * 
 * @see lib/nhost/server-client.ts for server-side client creation
 * @see lib/constants/auth.ts for configuration values
 */
export const nhost = createClient({
  subdomain: getSubdomain(),
  region: process.env.NEXT_PUBLIC_NHOST_REGION || undefined,
  
  /**
   * Use cookie-based storage for session persistence
   * This enables session sharing between client and server contexts
   * and prevents XSS attacks through HttpOnly cookies (set server-side)
   */
  storage: new CookieStorage({
    cookieName: SESSION_COOKIE.NAME,
    expirationDays: SESSION_COOKIE.EXPIRATION_DAYS,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: SESSION_COOKIE.SAME_SITE,
  }),
})

/**
 * Get redirect URL for email verification
 * Defaults to English locale, but can be customized
 * Omit locale prefix for default locale ('en')
 */
export function getVerifyEmailRedirectUrl(locale: string = 'en'): string {
  // Route groups like (auth) are not part of the URL; actual path is /[locale]/verify-email
  const path = locale === 'en' ? '/verify-email' : `/${locale}/verify-email`
  return `${getBaseUrl()}${path}`
}

/**
 * Get redirect URL for password reset
 * Defaults to English locale, but can be customized
 * Omit locale prefix for default locale ('en')
 */
export function getResetPasswordRedirectUrl(locale: string = 'en'): string {
  // Route groups like (auth) are not part of the URL; actual path is /[locale]/reset-password
  const path = locale === 'en' ? '/reset-password' : `/${locale}/reset-password`
  return `${getBaseUrl()}${path}`
}

