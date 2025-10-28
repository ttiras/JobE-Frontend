/**
 * Server-side Nhost client configuration
 * 
 * Creates a per-request Nhost client optimized for server contexts (SSR, Server Actions, API routes).
 * Key differences from client-side client:
 * - Manual refresh control (no automatic refresh middleware)
 * - Cookie-based session storage using Next.js cookies()
 * - Per-request instantiation (stateless)
 * 
 * @see https://docs.nhost.io/reference/javascript/nhost-js/create-server-client
 */

import * as NhostSDK from '@nhost/nhost-js'
import type { NhostClient } from '@nhost/nhost-js'
import type { Session } from '@nhost/nhost-js/session'
import { cookies } from 'next/headers'
import { SESSION_COOKIE } from '@/lib/constants/auth'

/**
 * Creates a server-side Nhost client with manual refresh control.
 * 
 * This client is optimized for server contexts:
 * - Uses Next.js cookies() for session storage
 * - Disables automatic token refresh (must call refreshSession() explicitly)
 * - Stateless per-request instantiation
 * - Prevents race conditions in concurrent server requests
 * 
 * Usage:
 * ```typescript
 * // In Server Component or Server Action
 * const nhost = await createNhostServerClient()
 * await nhost.refreshSession()
 * const session = nhost.getUserSession()
 * ```
 * 
 * @returns Promise resolving to configured NhostClient instance
 * @throws {Error} If required environment variables are missing
 */
export async function createNhostServerClient(): Promise<NhostClient> {
  const cookieStore = await cookies()
  const key = SESSION_COOKIE.NAME
  
  // Validate required environment variables
  const subdomain = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN
  if (!subdomain) {
    throw new Error(
      'NEXT_PUBLIC_NHOST_SUBDOMAIN environment variable is required for server-side Nhost client'
    )
  }
  
  const client = NhostSDK.createServerClient({
    subdomain,
    region: process.env.NEXT_PUBLIC_NHOST_REGION || '',
    storage: {
      // Read-only storage implementation compatible with Next.js Server Components
      get: (): Session | null => {
        const raw = cookieStore.get(key)?.value || null
        if (!raw) {
          return null
        }
        try {
          // Cookie may be URL-encoded by client-side writer; decode before parsing
          const decoded = decodeURIComponent(raw)
          const session = JSON.parse(decoded) as Session
          return session
        } catch {
          return null
        }
      },
      // No-ops on server: leave cookie management entirely to client-side Nhost
      set: () => {},
      remove: () => {},
    },
  })

  return client
}

/**
 * Alias for createNhostServerClient (for backwards compatibility with tests)
 * @deprecated Use createServerClient instead
 */
export const createServerClient = createNhostServerClient
