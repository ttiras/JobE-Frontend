'use client'

/**
 * NhostProvider Component
 * 
 * Provides Nhost client instance to the application via React Context.
 * This is a lightweight wrapper that makes the Nhost client available
 * throughout the component tree.
 * 
 * Features:
 * - Automatic token refresh every 15 minutes
 * - Session persistence across page reloads
 * - Authentication state management
 * - Storage client for file operations
 * - GraphQL client with auth headers
 * 
 * Note: Using @nhost/nhost-js v4 directly instead of deprecated @nhost/nextjs
 * 
 * @see https://docs.nhost.io/reference/javascript
 */

import { createContext, useContext, type ReactNode } from 'react'
import { nhost } from '@/lib/nhost/client'
import type { NhostClient } from '@nhost/nhost-js'

const NhostContext = createContext<NhostClient | null>(null)

interface NhostProviderProps {
  children: ReactNode
}

export function NhostProvider({ children }: NhostProviderProps) {
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
    throw new Error('useNhostClient must be used within NhostProvider')
  }
  
  return client
}
