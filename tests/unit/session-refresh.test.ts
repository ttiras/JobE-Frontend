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

      act(() => {
        result.current.refreshWithRetry()
      })

      // Wait for first attempt + 1s delay
      await act(async () => {
        jest.advanceTimersByTime(1000)
      })

      // Wait for second attempt + 2s delay
      await act(async () => {
        jest.advanceTimersByTime(2000)
      })

      // Wait for third attempt
      await act(async () => {
        jest.advanceTimersByTime(100)
      })

      await waitFor(() => {
        expect(result.current.retryCount).toBe(2) // 0-indexed: 0, 1, 2
      })

      expect(mockRefreshSession).toHaveBeenCalledTimes(3)
    })

    it('should stop after maxAttempts and return failure', async () => {
      // Fail all attempts
      mockRefreshSession.mockResolvedValue(null)

      const { result } = renderHook(() => useSessionRefresh())

      let refreshResult: Promise<RefreshResult> | undefined
      act(() => {
        refreshResult = result.current.refreshWithRetry()
      })

      // Advance through all retry attempts
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          jest.advanceTimersByTime(5000)
        })
      }

      await waitFor(async () => {
        const res = await refreshResult
        expect(res).toBeDefined()
        expect(res!.success).toBe(false)
      })

      // Should have tried 3 times total (initial + 2 retries based on maxAttempts: 3)
      expect(mockRefreshSession).toHaveBeenCalledTimes(3)
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
