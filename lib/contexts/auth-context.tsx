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
 * - Automatic session refresh with retry logic
 * - Loading and error states
 * 
 * Session Refresh Strategy:
 * - Nhost SDK automatically refreshes tokens before expiration (via middleware)
 * - Manual refresh available via useSessionRefresh hook with exponential backoff
 * - Session state synced across tabs via cookie updates
 * 
 * @see https://docs.nhost.io/reference/javascript/auth
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useNhostClient } from '@/components/providers/nhost-provider'
import { useSessionRefresh } from '@/lib/hooks/use-session-refresh'
import type { AuthState, User, Session, UserRole } from '@/lib/types/nhost'
import { SESSION_POLLING, AUTH_ERRORS, AUTH_LOGS } from '@/lib/constants/auth'
import { AuthErrorFactory, AuthErrorType } from '@/lib/utils/auth-errors'
import { SessionExpiredDialog } from '@/components/auth/session-expired-dialog'
import { toast } from 'sonner'

interface AuthContextValue extends AuthState {
  /**
   * Whether a manual session refresh is in progress
   */
  isRefreshing: boolean
  
  /**
   * Manually refresh the session with retry logic
   * @returns true if refresh succeeded, false otherwise
   */
  refreshSession: () => Promise<boolean>
  
  /**
   * Force an immediate check of the current session state
   * Useful after login/logout to immediately update auth state
   */
  checkSession: () => void
  
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
  const { refreshWithRetry, isRefreshing } = useSessionRefresh()
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  })

  // Session expired dialog state
  const [showSessionExpiredDialog, setShowSessionExpiredDialog] = useState(false)
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string>('')

  /**
   * Get current locale from browser
   * Returns 'en' as fallback
   */
  const getLocale = (): 'en' | 'tr' => {
    if (typeof window === 'undefined') return 'en'
    
    // Extract locale from pathname (e.g., /en/dashboard -> en)
    const match = window.location.pathname.match(/^\/(en|tr)\b/)
    return (match?.[1] as 'en' | 'tr') || 'en'
  }

  useEffect(() => {
    // Initial auth state from session storage
    const session = nhost.getUserSession() as Session | null
    const user = session?.user as User | null
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[AuthContext] Initial auth state', { 
        isAuthenticated: !!user,
        hasSession: !!session 
      })
    }
    
    // Defer setState to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => {
      setAuthState({
        user,
        session,
        isLoading: false,
        isAuthenticated: !!user,
        error: null,
      })
    }, 0)

    // Poll for session changes (Nhost v4 doesn't have direct auth state subscription)
    // Session is automatically refreshed by Nhost SDK middleware
    const intervalId = setInterval(() => {
      const currentSession = nhost.getUserSession() as Session | null
      const currentUser = currentSession?.user as User | null
      
      setAuthState(prev => {
        // Only update if session changed
        if (prev.session?.accessToken !== currentSession?.accessToken) {
          if (process.env.NODE_ENV === 'development') {
            console.log(AUTH_LOGS.SESSION_UPDATED, {
              hadSession: !!prev.session,
              hasSession: !!currentSession,
              isAuthenticated: !!currentUser
            })
          }
          
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
    }, SESSION_POLLING.INTERVAL_MS)

    // Cleanup interval and timeout
    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  }, [nhost])

  /**
   * Manually refresh the session with retry logic
   * Updates auth state with new session data on success
   */
  const refreshSession = async (): Promise<boolean> => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthContext] Manual refresh requested')
      }
      
      const result = await refreshWithRetry()
      
      if (result.success) {
        // Get the updated session from Nhost client
        const newSession = nhost.getUserSession() as Session | null
        const newUser = newSession?.user as User | null
        
        setAuthState({
          user: newUser,
          session: newSession,
          isLoading: false,
          isAuthenticated: !!newUser,
          error: null,
        })
        
        if (process.env.NODE_ENV === 'development') {
          console.log(AUTH_LOGS.REFRESH_SUCCESS)
        }
        
        return true
      } else {
        // Refresh failed - categorize the error
        const errorMessage = result.error || AUTH_ERRORS.REFRESH_FAILED
        const error = new Error(errorMessage)
        const categorizedError = AuthErrorFactory.categorize(error)
        
        if (process.env.NODE_ENV === 'development') {
          console.error(AUTH_LOGS.REFRESH_FAILED, { error: errorMessage })
        }
        
        // Handle based on error type
        if (categorizedError.type === AuthErrorType.SESSION_EXPIRED) {
          // Show session expired dialog
          const locale = getLocale()
          setSessionExpiredMessage(categorizedError.getMessage(locale))
          setShowSessionExpiredDialog(true)
        } else {
          // Show toast for other error types
          const locale = getLocale()
          toast.error(categorizedError.getMessage(locale))
        }
        
        setAuthState(prev => ({
          ...prev,
          error,
        }))
        return false
      }
    } catch (error) {
      // Handle unexpected errors
      const authError = error instanceof Error ? error : new Error(AUTH_ERRORS.REFRESH_UNKNOWN)
      const categorizedError = AuthErrorFactory.categorize(authError)
      
      if (process.env.NODE_ENV === 'development') {
        console.error(AUTH_LOGS.REFRESH_FAILED, { error: authError.message })
      }
      
      // Handle based on error type
      if (categorizedError.type === AuthErrorType.SESSION_EXPIRED) {
        // Show session expired dialog
        const locale = getLocale()
        setSessionExpiredMessage(categorizedError.getMessage(locale))
        setShowSessionExpiredDialog(true)
      } else {
        // Show toast for other error types
        const locale = getLocale()
        toast.error(categorizedError.getMessage(locale))
      }
      
      setAuthState(prev => ({
        ...prev,
        error: authError,
      }))
      return false
    }
  }

  /**
   * Force an immediate check of the current session state
   * Useful after login/logout to immediately update auth state
   */
  const checkSession = () => {
    const currentSession = nhost.getUserSession() as Session | null
    const currentUser = currentSession?.user as User | null
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[AuthContext] Manual session check', {
        hasSession: !!currentSession,
        isAuthenticated: !!currentUser
      })
    }
    
    setAuthState({
      user: currentUser,
      session: currentSession,
      isLoading: false,
      isAuthenticated: !!currentUser,
      error: null,
    })
  }

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

  /**
   * Handle session expired dialog close
   */
  const handleDialogClose = () => {
    setShowSessionExpiredDialog(false)
    setSessionExpiredMessage('')
  }

  /**
   * Handle re-authentication from session expired dialog
   * The dialog component handles navigation to login with returnUrl
   */
  const handleReAuthenticate = () => {
    handleDialogClose()
    // Navigation is handled by the dialog component itself
  }

  const value: AuthContextValue = {
    ...authState,
    isRefreshing,
    refreshSession,
    checkSession,
    hasRole,
    hasAnyRole,
    hasAllRoles,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionExpiredDialog
        isOpen={showSessionExpiredDialog}
        onClose={handleDialogClose}
        onReAuthenticate={handleReAuthenticate}
        errorMessage={sessionExpiredMessage}
      />
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
    throw new Error(AUTH_ERRORS.CONTEXT_MISSING)
  }
  
  return context
}
