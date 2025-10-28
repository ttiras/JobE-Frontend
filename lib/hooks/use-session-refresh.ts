/**
 * useSessionRefresh Hook
 * 
 * React hook for managing session refresh with exponential backoff retry logic.
 * Provides resilient session refresh capability for automatic token renewal.
 * 
 * @module hooks/use-session-refresh
 */

'use client'

import { useState, useCallback } from 'react'
import { nhost } from '@/lib/nhost/client'
import { SESSION_REFRESH, AUTH_ERRORS, AUTH_LOGS } from '@/lib/constants/auth'

/**
 * Retry configuration for session refresh
 */
export interface RetryConfig {
  /** Maximum number of refresh attempts */
  maxAttempts: number
  /** Base delay in milliseconds (first retry) */
  baseDelay: number
  /** Multiplier for exponential backoff */
  backoffMultiplier: number
}

/**
 * Result of a refresh operation
 */
export interface RefreshResult {
  /** Whether the refresh was successful */
  success: boolean
  /** Error message if failed */
  error?: string
  /** Number of attempts made */
  attempts: number
}

/**
 * Default retry configuration from constants
 * - maxAttempts: 3 (initial + 2 retries)
 * - baseDelay: 1000ms (1 second for first retry)
 * - backoffMultiplier: 2 (exponential: 1s, 2s, 4s)
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: SESSION_REFRESH.MAX_ATTEMPTS,
  baseDelay: SESSION_REFRESH.BASE_DELAY_MS,
  backoffMultiplier: SESSION_REFRESH.BACKOFF_MULTIPLIER,
}

/**
 * Hook for session refresh with retry logic
 * 
 * @param config - Optional retry configuration
 * @returns Session refresh state and refresh function
 * 
 * @example
 * ```tsx
 * const { refreshWithRetry, isRefreshing, retryCount } = useSessionRefresh()
 * 
 * // Attempt to refresh session with automatic retries
 * const result = await refreshWithRetry()
 * if (result.success) {
 *   console.log('Session refreshed successfully')
 * }
 * ```
 */
export function useSessionRefresh(config: Partial<RetryConfig> = {}) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  
  /**
   * Delay helper for exponential backoff
   */
  const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  /**
   * Attempt to refresh the session with exponential backoff retry logic
   * 
   * Retry pattern:
   * - Attempt 1: Immediate
   * - Attempt 2: After 1 second delay
   * - Attempt 3: After 2 second delay (from attempt 2)
   * - Attempt 4: After 4 second delay (from attempt 3)
   * 
   * @returns Result indicating success/failure and attempt count
   */
  const refreshWithRetry = useCallback(async (): Promise<RefreshResult> => {
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
    setIsRefreshing(true)
    setRetryCount(0)
    
    if (process.env.NODE_ENV === 'development') {
      console.log(AUTH_LOGS.REFRESH_STARTED, { maxAttempts: retryConfig.maxAttempts })
    }
    
    let lastError: string | undefined
    
    for (let attempt = 0; attempt < retryConfig.maxAttempts; attempt++) {
      try {
        // Add delay before retry (except first attempt)
        if (attempt > 0) {
          const delayMs = retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1)
          
          if (process.env.NODE_ENV === 'development') {
            console.log(AUTH_LOGS.REFRESH_RETRY, { 
              attempt: attempt + 1, 
              delayMs,
              maxAttempts: retryConfig.maxAttempts 
            })
          }
          
          await delay(delayMs)
        }
        
        // Update retry count
        setRetryCount(attempt)
        
        // Attempt to refresh session (force refresh with 0 seconds threshold)
        const session = await nhost.refreshSession(SESSION_REFRESH.FORCE_REFRESH_THRESHOLD)
        
        if (session) {
          // Success!
          setIsRefreshing(false)
          setRetryCount(0)
          
          if (process.env.NODE_ENV === 'development') {
            console.log(AUTH_LOGS.REFRESH_SUCCESS, { attempts: attempt + 1 })
          }
          
          return {
            success: true,
            attempts: attempt + 1,
          }
        }
        
        // Store error message for final result
        lastError = AUTH_ERRORS.REFRESH_NO_SESSION
        
      } catch (err) {
        lastError = err instanceof Error ? err.message : AUTH_ERRORS.REFRESH_UNKNOWN
        
        if (process.env.NODE_ENV === 'development') {
          console.error(AUTH_LOGS.REFRESH_FAILED, { 
            attempt: attempt + 1, 
            error: lastError 
          })
        }
      }
    }
    
    // All attempts failed
    setIsRefreshing(false)
    
    if (process.env.NODE_ENV === 'development') {
      console.error(AUTH_LOGS.REFRESH_FAILED, { 
        attempts: retryConfig.maxAttempts,
        finalError: lastError 
      })
    }
    
    return {
      success: false,
      error: lastError,
      attempts: retryConfig.maxAttempts,
    }
  }, [config])
  
  return {
    /**
     * Function to refresh session with automatic retries
     */
    refreshWithRetry,
    
    /**
     * Whether a refresh operation is currently in progress
     */
    isRefreshing,
    
    /**
     * Current retry attempt number (0-indexed)
     * - 0: First attempt (not a retry)
     * - 1: First retry
     * - 2: Second retry
     */
    retryCount,
  }
}
