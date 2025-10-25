/**
 * Client-side helper to sync Nhost session to a cookie that the server can read.
 *
 * The server guard (`getSessionFromCookies`) expects a URL-encoded JSON value
 * with `{ accessToken, refreshToken }` under the `nhostSession` cookie name.
 *
 * Notes:
 * - SameSite=Lax is used so normal navigations include the cookie.
 * - Secure is set only when running on HTTPS to avoid issues on localhost.
 * - Path=/ to ensure the cookie is visible on all routes.
 */

export type BasicSessionShape = {
  accessToken?: string
  refreshToken?: string
} | null

function isHttps(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.protocol === 'https:'
}

export function setSessionCookie(session: BasicSessionShape): void {
  if (typeof document === 'undefined') return

  if (!session || (!session.accessToken && !session.refreshToken)) {
    // Clear cookie if session is empty
    clearSessionCookie()
    return
  }

  try {
    const value = encodeURIComponent(JSON.stringify({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    }))

    const attrs = [
      'Path=/',
      'SameSite=Lax',
      isHttps() ? 'Secure' : undefined,
      // Optionally, set an expiry far in the future; we can rely on refresh flow instead
      // e.g., `Max-Age=2592000` (30 days). Leaving session cookie as-is for now.
    ].filter(Boolean)

    document.cookie = `nhostSession=${value}; ${attrs.join('; ')}`
  } catch (e) {
    // Non-fatal if cookie write fails; server guard will fall back to redirecting
    console.warn('Failed to write nhostSession cookie:', e)
  }
}

export function clearSessionCookie(): void {
  if (typeof document === 'undefined') return
  const attrs = [
    'Path=/',
    'SameSite=Lax',
    isHttps() ? 'Secure' : undefined,
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ].filter(Boolean)
  document.cookie = `nhostSession=; ${attrs.join('; ')}`
}
