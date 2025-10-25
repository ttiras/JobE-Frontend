'use cache: private'

import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getSessionFromCookies, getUserRole, isAccessTokenExpired } from '@/lib/nhost/session'
import type { UserRole } from '@/lib/types/nhost'

interface ServerAuthGuardProps {
  children: ReactNode
  locale: string
  allowedRoles?: UserRole[]
}

/**
 * Server-side auth guard for protected routes.
 * - Private-cached to ensure per-user isolation under Cache Components
 * - Reads Nhost session cookie and optionally enforces RBAC by default role
 * - Redirects unauthenticated users to the localized login page
 *
 * Note on token freshness:
 * If an access token is expired but a refresh token exists, we still allow
 * rendering since the client will refresh after hydration. If RBAC is
 * required and role cannot be derived, we conservatively allow and defer to
 * client guards or page-level checks.
 */
export default async function ServerAuthGuard({ children, locale, allowedRoles }: ServerAuthGuardProps) {
  const session = await getSessionFromCookies()

  // No session => redirect to login
  if (!session?.refreshToken) {
    return redirect(`/${locale}/login`)
  }

  // Optional RBAC: derive role only when a (non-expired) access token exists
  if (allowedRoles && allowedRoles.length > 0) {
    if (session.accessToken && !isAccessTokenExpired(session.accessToken)) {
      const role = getUserRole(session.accessToken)
      if (!role || !allowedRoles.includes(role)) {
        return redirect(`/${locale}/dashboard?error=insufficient_permissions`)
      }
    }
    // If we cannot derive a role (expired/missing token), allow and let the
    // client refine authorization after hydration.
  }

  return <>{children}</>
}
