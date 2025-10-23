'use client'

/**
 * AuthContext
 * 
 * Provides authentication state and methods throughout the application.
 * Wraps Nhost's authentication system with application-specific logic
 * and error handling.
 * 
 * Features:
 * - Real-time authentication state updates
 * - User session management
 * - Role-based access control helpers
 * - Loading and error states
 * 
 * Note: Nhost SDK manages session state internally with automatic
 * token refresh every 15 minutes.
 * 
 * @see https://docs.nhost.io/reference/javascript/auth
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useNhostClient } from '@/components/providers/nhost-provider'
import type { AuthState, User, Session, UserRole } from '@/lib/types/nhost'

interface AuthContextValue extends AuthState {
  /**
   * Check if user has a specific role
   */
  hasRole: (role: UserRole) => boolean
  
  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole: (roles: UserRole[]) => boolean
  
  /**
   * Check if user has all of the specified roles
   */
  hasAllRoles: (roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const nhost = useNhostClient()
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  })

  useEffect(() => {
    // Initial auth state from session storage
    const session = nhost.getUserSession() as Session | null
    const user = session?.user as User | null
    
    setAuthState({
      user,
      session,
      isLoading: false,
      isAuthenticated: !!user,
      error: null,
    })

    // Poll for session changes (Nhost v4 doesn't have direct auth state subscription)
    // Session is automatically refreshed by Nhost SDK every 15 minutes
    const intervalId = setInterval(() => {
      const currentSession = nhost.getUserSession() as Session | null
      const currentUser = currentSession?.user as User | null
      
      setAuthState(prev => {
        // Only update if session changed
        if (prev.session?.accessToken !== currentSession?.accessToken) {
          return {
            user: currentUser,
            session: currentSession,
            isLoading: false,
            isAuthenticated: !!currentUser,
            error: null,
          }
        }
        return prev
      })
    }, 1000) // Check every second for session changes

    // Cleanup interval
    return () => {
      clearInterval(intervalId)
    }
  }, [nhost])

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: UserRole): boolean => {
    if (!authState.user) return false
    return authState.user.roles.includes(role)
  }

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!authState.user) return false
    return roles.some(role => authState.user!.roles.includes(role))
  }

  /**
   * Check if user has all of the specified roles
   */
  const hasAllRoles = (roles: UserRole[]): boolean => {
    if (!authState.user) return false
    return roles.every(role => authState.user!.roles.includes(role))
  }

  const value: AuthContextValue = {
    ...authState,
    hasRole,
    hasAnyRole,
    hasAllRoles,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access authentication state and methods
 * @throws Error if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  
  return context
}
