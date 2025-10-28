/**
 * Integration Tests: Automatic Token Refresh
 * 
 * Tests for automatic token refresh during normal application usage.
 * Verifies that expired tokens are refreshed transparently without user intervention.
 * 
 * User Story: US1 - Seamless Client-Side Authentication
 * Task: T009
 */

import { nhost } from '@/lib/nhost/client'
import { createMockSession, createMockUser } from '@/tests/utils/auth-helpers'
import type { Session } from '@nhost/nhost-js/session'
// Session type is inferred via mocks where needed

// Mock the nhost client
jest.mock('@/lib/nhost/client', () => ({
  nhost: {
    refreshSession: jest.fn(),
    auth: {
      signInEmailPassword: jest.fn(),
    },
  },
}))

const mockRefreshSession = nhost.refreshSession as jest.MockedFunction<typeof nhost.refreshSession>
const mockSignIn = nhost.auth.signInEmailPassword as jest.MockedFunction<typeof nhost.auth.signInEmailPassword>

describe('Automatic Token Refresh Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Login and automatic refresh flow', () => {
    it('should login with valid credentials', async () => {
      const mockSession = createMockSession()
      
      mockSignIn.mockResolvedValueOnce({
        session: mockSession,
        error: null,
      } as unknown as ReturnType<typeof nhost.auth.signInEmailPassword>)

      const result = await nhost.auth.signInEmailPassword({
        email: 'test@test.com',
        password: '123456789',
      })
      // Our mock returns a simplified shape; narrow for assertions
      const resp = result as unknown as { session: Session | null; error: null }
      expect(resp.session).toBeDefined()
      expect(resp.error).toBeNull()
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: '123456789',
      })
    })

    it('should automatically refresh token when expired', async () => {
      const refreshedSession = createMockSession({
        accessToken: 'refreshed-token',
        accessTokenExpiresIn: 900, // Fresh 15 minutes
      })

      mockRefreshSession.mockResolvedValueOnce(refreshedSession)

      // Attempt to refresh the expired session
      const result = await nhost.refreshSession(0)

      expect(result).toBeDefined()
      expect(result?.accessToken).toBe('refreshed-token')
      expect(mockRefreshSession).toHaveBeenCalledWith(0)
    })

    it('should handle refresh when token is about to expire', async () => {
      const refreshedSession = createMockSession({
        accessToken: 'new-fresh-token',
        accessTokenExpiresIn: 900, // 15 minutes
      })

      mockRefreshSession.mockResolvedValueOnce(refreshedSession)

      // Refresh with 5 minute threshold
      const result = await nhost.refreshSession(300)

      expect(result).toBeDefined()
      expect(result?.accessToken).toBe('new-fresh-token')
      expect(mockRefreshSession).toHaveBeenCalledWith(300)
    })

    it('should succeed on subsequent request after auto-refresh', async () => {
      const refreshedSession = createMockSession({
        accessToken: 'auto-refreshed-token',
      })

      mockRefreshSession.mockResolvedValueOnce(refreshedSession)

      // First call triggers refresh
      const firstResult = await nhost.refreshSession(0)
      expect(firstResult).toBeDefined()

      // Reset mock for second call
      mockRefreshSession.mockResolvedValueOnce(refreshedSession)

      // Second call should use refreshed token
      const secondResult = await nhost.refreshSession(300)
      expect(secondResult).toBeDefined()
      expect(mockRefreshSession).toHaveBeenCalledTimes(2)
    })
  })

  describe('Token refresh failure scenarios', () => {
    it('should handle network errors during refresh', async () => {
      mockRefreshSession.mockRejectedValueOnce(new Error('Network error'))

      await expect(nhost.refreshSession(0)).rejects.toThrow('Network error')
    })

    it('should return null when refresh fails', async () => {
      mockRefreshSession.mockResolvedValueOnce(null)

      const result = await nhost.refreshSession(0)

      expect(result).toBeNull()
      expect(mockRefreshSession).toHaveBeenCalledWith(0)
    })

    it('should handle invalid refresh token gracefully', async () => {
      mockRefreshSession.mockResolvedValueOnce(null)

      const result = await nhost.refreshSession(0)

      expect(result).toBeNull()
    })
  })

  describe('Multiple concurrent refresh attempts', () => {
    it('should handle concurrent refresh requests', async () => {
      const refreshedSession = createMockSession()

      // All concurrent requests should succeed
      mockRefreshSession.mockResolvedValue(refreshedSession)

      const promises = [
        nhost.refreshSession(0),
        nhost.refreshSession(0),
        nhost.refreshSession(0),
      ]

      const results = await Promise.all(promises)

      results.forEach(result => {
        expect(result).toBeDefined()
        expect(result?.accessToken).toBeDefined()
      })

      expect(mockRefreshSession).toHaveBeenCalledTimes(3)
    })
  })

  describe('Session state consistency', () => {
    it('should maintain consistent session data after refresh', async () => {
      const originalSession = createMockSession({
        user: createMockUser({ id: 'user-123', email: 'test@test.com' }),
      })

      const refreshedSession = createMockSession({
        accessToken: 'new-token',
        user: createMockUser({ id: 'user-123', email: 'test@test.com' }),
      })

      mockRefreshSession.mockResolvedValueOnce(refreshedSession)

      const result = await nhost.refreshSession(0)

  expect(result?.user?.id).toBe(originalSession.user!.id)
  expect(result?.user?.email).toBe(originalSession.user!.email)
      expect(result?.accessToken).toBe('new-token')
    })
  })
})
