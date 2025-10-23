'use client'

/**
 * useAuth Hook
 * 
 * Custom React hook for authentication state and operations.
 * Provides easy access to authentication state, user info, and auth methods.
 * 
 * Features:
 * - Authentication state (user, session, loading)
 * - Role-based access control helpers
 * - Auth operations (login, logout, register, etc.)
 * - Automatic re-renders on auth state changes
 * 
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth()
 * 
 * if (!isAuthenticated) {
 *   return <LoginForm onSubmit={(email, password) => login(email, password)} />
 * }
 * 
 * return <div>Welcome, {user?.displayName}!</div>
 * ```
 */

import { useAuth as useAuthContext } from '@/lib/contexts/auth-context'
import * as authUtils from '@/lib/nhost/auth'

export function useAuth() {
  const authState = useAuthContext()

  return {
    // Auth state
    ...authState,

    // Auth operations
    login: authUtils.login,
    register: authUtils.register,
    logout: authUtils.logout,
    sendPasswordResetEmail: authUtils.sendPasswordResetEmail,
    resetPassword: authUtils.resetPassword,
    sendVerificationEmail: authUtils.sendVerificationEmail,
    changeEmail: authUtils.changeEmail,
    changePassword: authUtils.changePassword,
    refreshSession: authUtils.refreshSession,
  }
}

/**
 * Hook to require authentication
 * Throws error if user is not authenticated
 * Useful for protecting components/pages
 * 
 * @example
 * ```tsx
 * const { user } = useRequireAuth()
 * // user is guaranteed to be non-null here
 * ```
 */
export function useRequireAuth() {
  const auth = useAuth()

  if (!auth.isAuthenticated || !auth.user) {
    throw new Error('Authentication required')
  }

  return {
    ...auth,
    user: auth.user, // Non-null user
  }
}

/**
 * Hook to check if user has specific role
 * 
 * @param role - Role to check
 * @returns True if user has the role
 * 
 * @example
 * ```tsx
 * const isAdmin = useHasRole('admin')
 * if (isAdmin) {
 *   return <AdminPanel />
 * }
 * ```
 */
export function useHasRole(role: string) {
  const { hasRole } = useAuth()
  return hasRole(role as any)
}

/**
 * Hook to check if user has any of the specified roles
 * 
 * @param roles - Array of roles to check
 * @returns True if user has any of the roles
 * 
 * @example
 * ```tsx
 * const canManage = useHasAnyRole(['admin', 'recruiter'])
 * if (canManage) {
 *   return <ManagementTools />
 * }
 * ```
 */
export function useHasAnyRole(roles: string[]) {
  const { hasAnyRole } = useAuth()
  return hasAnyRole(roles as any[])
}

/**
 * Hook to check if user has all of the specified roles
 * 
 * @param roles - Array of roles to check
 * @returns True if user has all of the roles
 * 
 * @example
 * ```tsx
 * const hasBothRoles = useHasAllRoles(['admin', 'recruiter'])
 * ```
 */
export function useHasAllRoles(roles: string[]) {
  const { hasAllRoles } = useAuth()
  return hasAllRoles(roles as any[])
}
