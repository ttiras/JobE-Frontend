'use client'

/**
 * NhostProvider Component
 * 
 * Provides Nhost client instance to the application via React Context.
 * This is a lightweight wrapper that makes the Nhost client available
 * throughout the component tree.
 * 
 * Architecture:
 * - NhostProvider: Provides raw Nhost client instance
 * - AuthContext: Wraps NhostProvider and adds auth-specific state/methods
 * - Usage: Wrap app with NhostProvider, then AuthProvider
 * 
 * Features:
 * - Cookie-based session storage (30-day sliding window)
 * - Automatic token refresh via Nhost SDK middleware
 * - Session persistence across page reloads
 * - Storage client for file operations
 * - GraphQL client with auth headers
 * 
 * Client Configuration (verified in lib/nhost/client.ts):
 * - CookieStorage with secure, sameSite=lax, 30-day expiration
 * - Automatic refresh middleware enabled by default
 * - Cookie-based session sharing with server-side client
 * 
 * Note: Session state management is handled by AuthContext, not here.
 * This provider only makes the Nhost client instance available.
 * 
 * @see https://docs.nhost.io/reference/javascript
 * @see lib/contexts/auth-context.tsx for session state management
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { nhost } from '@/lib/nhost/client'
import type { NhostClient } from '@nhost/nhost-js'
import { AUTH_ERRORS, AUTH_LOGS } from '@/lib/constants/auth'

const NhostContext = createContext<NhostClient | null>(null)

interface NhostProviderProps {
  children: ReactNode
}

export function NhostProvider({ children }: NhostProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  
  useEffect(() => {
    // Verify client is configured (dev-time check)
    if (process.env.NODE_ENV === 'development') {
      if (!nhost || !nhost.auth) {
        console.error(AUTH_LOGS.CLIENT_ERROR)
      } else {
        console.log(AUTH_LOGS.CLIENT_INITIALIZED)
      }
    }
    
    // Mark as initialized
    setIsInitialized(true)
  }, [])
  
  // Show loading state during initial client setup
  if (!isInitialized) {
    return null // Or a loading spinner if needed
  }
  
  return (
    <NhostContext.Provider value={nhost}>
      {children}
    </NhostContext.Provider>
  )
}

/**
 * Hook to access the Nhost client instance
 * @throws Error if used outside NhostProvider
 */
export function useNhostClient() {
  const client = useContext(NhostContext)
  
  if (!client) {
    throw new Error(AUTH_ERRORS.CLIENT_MISSING)
  }
  
  return client
}
