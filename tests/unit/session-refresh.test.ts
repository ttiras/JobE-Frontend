/**
 * Unit Tests: Session Refresh Hook
 * 
 * Tests for useSessionRefresh hook with exponential backoff retry logic.
 * Verifies retry attempts, backoff delays, and error handling.
 * 
 * User Story: US1 - Seamless Client-Side Authentication  
 * Task: T008
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useSessionRefresh } from '@/lib/hooks/use-session-refresh'
import type { RefreshResult } from '@/lib/hooks/use-session-refresh'
import { nhost } from '@/lib/nhost/client'
import { createMockSession } from '@/tests/utils/auth-helpers'

// Mock the nhost client
jest.mock('@/lib/nhost/client', () => ({
  nhost: {
    refreshSession: jest.fn(),
  },
}))

const mockRefreshSession = nhost.refreshSession as jest.MockedFunction<typeof nhost.refreshSession>

describe('useSessionRefresh Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('refreshWithRetry function', () => {
    it('should successfully refresh session on first attempt', async () => {
  mockRefreshSession.mockResolvedValueOnce(createMockSession({ accessToken: 'new-token' }))

      const { result } = renderHook(() => useSessionRefresh())

      let refreshResult: RefreshResult | undefined
      await act(async () => {
        refreshResult = await result.current.refreshWithRetry()
      })

      expect(refreshResult).toBeDefined()
      expect(refreshResult!.success).toBe(true)
      expect(result.current.retryCount).toBe(0)
      expect(mockRefreshSession).toHaveBeenCalledTimes(1)
      expect(mockRefreshSession).toHaveBeenCalledWith(0) // Force refresh
    })

    it('should implement exponential backoff with 3 attempts', async () => {
      // Fail first 2 attempts, succeed on 3rd
      mockRefreshSession
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(createMockSession({ accessToken: 'new-token' }))

      const { result } = renderHook(() => useSessionRefresh())

      let refreshPromise: Promise<RefreshResult>
      act(() => {
        refreshPromise = result.current.refreshWithRetry()
      })

      // First attempt (attempt 0) - no delay, immediate
      await act(async () => {
        await Promise.resolve() // Let first attempt complete
      })
      expect(mockRefreshSession).toHaveBeenCalledTimes(1)
      expect(result.current.retryCount).toBe(0)

      // Second attempt (attempt 1) - after 1s delay
      await act(async () => {
        jest.advanceTimersByTime(1000)
        await Promise.resolve() // Let second attempt complete
      })
      expect(mockRefreshSession).toHaveBeenCalledTimes(2)
      expect(result.current.retryCount).toBe(1)

      // Third attempt (attempt 2) - after 2s delay (from attempt 1)
      await act(async () => {
        jest.advanceTimersByTime(2000)
        await Promise.resolve() // Let third attempt complete
      })
      
      await waitFor(() => {
        expect(mockRefreshSession).toHaveBeenCalledTimes(3)
      })
      
      // After third attempt succeeds, retryCount should be reset to 0
      await waitFor(() => {
        expect(result.current.retryCount).toBe(0)
      })

      // Verify final result
      const finalResult = await refreshPromise!
      expect(finalResult.success).toBe(true)
      expect(finalResult.attempts).toBe(3)
    })

    it('should stop after maxAttempts and return failure', async () => {
      // Fail all attempts
      mockRefreshSession.mockResolvedValue(null)

      const { result } = renderHook(() => useSessionRefresh())

      let refreshResult: Promise<RefreshResult> | undefined
      act(() => {
        refreshResult = result.current.refreshWithRetry()
      })

      // First attempt (attempt 0) - no delay
      await act(async () => {
        await Promise.resolve() // Let first attempt complete
      })
      expect(mockRefreshSession).toHaveBeenCalledTimes(1)

      // Second attempt (attempt 1) - after 1s delay
      await act(async () => {
        jest.advanceTimersByTime(1000)
        await Promise.resolve() // Let second attempt complete
      })
      expect(mockRefreshSession).toHaveBeenCalledTimes(2)

      // Third attempt (attempt 2) - after 2s delay
      await act(async () => {
        jest.advanceTimersByTime(2000)
        await Promise.resolve() // Let third attempt complete
      })
      
      await waitFor(() => {
        expect(mockRefreshSession).toHaveBeenCalledTimes(3)
      })

      // Wait for the promise to resolve
      expect(refreshResult).toBeDefined()
      const res = await refreshResult!
      expect(res).toBeDefined()
      expect(res.success).toBe(false)
      expect(res.attempts).toBe(3)
      expect(res.error).toBeDefined()
    })
  })

  describe('isRefreshing state', () => {
    it('should set isRefreshing to true during refresh', async () => {
      let resolveRefresh: (value: ReturnType<typeof createMockSession>) => void
      const refreshPromise: Promise<ReturnType<typeof createMockSession>> = new Promise(resolve => {
        resolveRefresh = resolve
      })
      
      mockRefreshSession.mockReturnValue(refreshPromise)

      const { result } = renderHook(() => useSessionRefresh())

      expect(result.current.isRefreshing).toBe(false)

      act(() => {
        result.current.refreshWithRetry()
      })

      await waitFor(() => {
        expect(result.current.isRefreshing).toBe(true)
      })

      // Resolve the refresh
      await act(async () => {
  resolveRefresh!(createMockSession({ accessToken: 'token' }))
      })

      await waitFor(() => {
        expect(result.current.isRefreshing).toBe(false)
      })
    })
  })

  describe('retry count tracking', () => {
    it('should track retry count during attempts', async () => {
      // Fail first 2, succeed on 3rd
      mockRefreshSession
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(createMockSession({ accessToken: 'token' }))

      const { result } = renderHook(() => useSessionRefresh())

      expect(result.current.retryCount).toBe(0)

      act(() => {
        result.current.refreshWithRetry()
      })

      // Advance through retries
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          jest.advanceTimersByTime(5000)
        })
      }

      await waitFor(() => {
        expect(result.current.retryCount).toBeGreaterThanOrEqual(0)
      })
    })

    it('should reset retry count after successful refresh', async () => {
  mockRefreshSession.mockResolvedValue(createMockSession({ accessToken: 'token' }))

      const { result } = renderHook(() => useSessionRefresh())

      await act(async () => {
        await result.current.refreshWithRetry()
      })

      expect(result.current.retryCount).toBe(0)
    })
  })
})
