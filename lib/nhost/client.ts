import { createClient } from '@nhost/nhost-js'

if (!process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN) {
  throw new Error('NEXT_PUBLIC_NHOST_SUBDOMAIN environment variable is required')
}

// Get the base URL for redirects (works in both dev and production)
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  // Server-side fallback
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export const nhost = createClient({
  subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN,
  region: process.env.NEXT_PUBLIC_NHOST_REGION || undefined,
})

/**
 * Get redirect URL for email verification
 * Defaults to English locale, but can be customized
 */
export function getVerifyEmailRedirectUrl(locale: string = 'en'): string {
  // Route groups like (auth) are not part of the URL; actual path is /[locale]/verify-email
  return `${getBaseUrl()}/${locale}/verify-email`
}

/**
 * Get redirect URL for password reset
 * Defaults to English locale, but can be customized
 */
export function getResetPasswordRedirectUrl(locale: string = 'en'): string {
  // Route groups like (auth) are not part of the URL; actual path is /[locale]/reset-password
  return `${getBaseUrl()}/${locale}/reset-password`
}

