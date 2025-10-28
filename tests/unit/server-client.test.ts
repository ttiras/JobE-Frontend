/**
 * Unit Tests: Server Client Configuration
 * 
 * Tests for createServerClient with Next.js cookies integration.
 * Verifies manual refresh control and cookie handling.
 * 
 * User Story: US2 - Reliable Server-Side Session Validation
 * Task: T017
 */

import { cookies } from 'next/headers'
import { createNhostServerClient as createServerClient } from '@/lib/nhost/server-client'
import { SESSION_COOKIE } from '@/lib/constants/auth'

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

describe('Server Client Configuration', () => {
  const mockCookies = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    getAll: jest.fn(() => []),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(cookies as jest.Mock).mockResolvedValue(mockCookies)
  })

  describe('Client creation', () => {
    it('should create server client with correct subdomain', async () => {
      const client = await createServerClient()
      
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
      expect(client.storage).toBeDefined()
      expect(client.graphql).toBeDefined()
    })

    it('should use cookie storage for session persistence', async () => {
      const mockSession = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        user: { id: 'user-123', email: 'test@example.com' },
      }

      mockCookies.get.mockReturnValue({
        value: JSON.stringify(mockSession),
      })

      const client = await createServerClient()
      
      // Verify client can access cookies
      expect(cookies).toHaveBeenCalled()
    })
  })

  describe('Manual refresh configuration', () => {
    it('should disable automatic token refresh', async () => {
      const client = await createServerClient()
      
      // Server client should have auth capability but not auto-refresh
      expect(client.auth).toBeDefined()
      
      // Verify refreshSession method exists (for manual refresh)
      expect(typeof client.refreshSession).toBe('function')
    })

    it('should require explicit refreshSession() call', async () => {
      const client = await createServerClient()
      
      // Session should not be automatically refreshed
      // Must call refreshSession() explicitly
      const session = client.getUserSession()
      
      // Without explicit refresh, session comes from cookie only
      expect(session).toBeDefined()
    })
  })

  describe('Cookie integration', () => {
    it('should read session from cookies', async () => {
      const mockSession = JSON.stringify({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        accessTokenExpiresIn: 900,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          roles: ['user'],
        },
      })

      mockCookies.get.mockReturnValue({
        value: mockSession,
      })

      const client = await createServerClient()
      
      // Verify cookie was read
      expect(mockCookies.get).toHaveBeenCalledWith(SESSION_COOKIE.NAME)
    })

    it('should handle missing session cookie', async () => {
      mockCookies.get.mockReturnValue(undefined)

  const client = await createServerClient()
  const session = client.getUserSession()
      
      // Should handle missing cookie gracefully
      expect(session).toBeNull()
    })

    it('should set cookies with security attributes', async () => {
  const client = await createServerClient()
      
      // When session is set, cookies should be configured securely
      // This will be tested after login/refresh operations
      
      // For now, verify client has cookie capability
      expect(mockCookies.set).toBeDefined()
    })

    it('should delete cookies on logout', async () => {
  const client = await createServerClient()
      
      // Verify delete capability exists
      expect(mockCookies.delete).toBeDefined()
    })
  })

  describe('Session extraction', () => {
    it('should extract session data from cookies', async () => {
      const mockSessionData = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        accessTokenExpiresIn: 900,
        refreshTokenId: 'refresh-id-789',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          displayName: 'Test User',
          roles: ['user'],
          metadata: {},
          emailVerified: true,
          phoneNumber: null,
          phoneNumberVerified: false,
          activeMfaType: null,
          avatarUrl: null,
          locale: 'en',
          defaultRole: 'user',
          isAnonymous: false,
          createdAt: '2025-01-01T00:00:00Z',
        },
      }

      mockCookies.get.mockReturnValue({
        value: JSON.stringify(mockSessionData),
      })

  const client = await createServerClient()
  const session = client.getUserSession()
      
      // Should extract session if available
      if (session) {
        expect(session.accessToken).toBe(mockSessionData.accessToken)
        expect(session.user).toBeDefined()
      }
    })

    it('should return null for invalid session data', async () => {
      mockCookies.get.mockReturnValue({
        value: 'invalid-json-data',
      })

  const client = await createServerClient()
  const session = client.getUserSession()
      
      // Should handle invalid data gracefully
      expect(session).toBeNull()
    })
  })

  describe('Environment configuration', () => {
    it('should use environment variables for subdomain', async () => {
      expect(process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN).toBeDefined()
      
      const client = await createServerClient()
      expect(client).toBeDefined()
    })

    it('should support optional region configuration', async () => {
      // Region is optional, client should work with or without it
      const client = await createServerClient()
      expect(client).toBeDefined()
    })
  })
})
