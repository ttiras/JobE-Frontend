/**
 * Authentication Test Helpers
 * 
 * Utilities for mocking authentication state in unit and integration tests.
 * Provides mock session data, user objects, and Nhost client behavior.
 */

import type { Session, User } from '@/lib/types/nhost'

/**
 * Test user credentials (from tasks.md)
 */
export const TEST_USER_CREDENTIALS = {
  email: 'test@test.com',
  password: '123456789',
} as const

/**
 * Create a mock user object for testing
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'test-user-id-123',
    email: TEST_USER_CREDENTIALS.email,
    displayName: 'Test User',
    locale: 'en',
    avatarUrl: '',
    createdAt: new Date().toISOString(),
    isAnonymous: false,
    defaultRole: 'user',
    roles: ['user'],
    metadata: {},
    emailVerified: true,
    phoneNumber: undefined,
    phoneNumberVerified: false,
    activeMfaType: undefined,
    ...overrides,
  }
}

/**
 * Create a mock session object for testing
 */
export function createMockSession(overrides?: Partial<Session>): Session {
  const expiresIn = 900 // 15 minutes in seconds
  
  return {
    accessToken: 'mock-access-token',
    accessTokenExpiresIn: expiresIn,
    refreshToken: 'mock-refresh-token',
    refreshTokenId: 'mock-refresh-token-id',
    user: createMockUser(),
    decodedToken: {},
    ...overrides,
  }
}

/**
 * Create a mock Nhost client for testing
 */
export function createMockNhostClient(sessionState?: Session | null) {
  const session = sessionState === null ? null : sessionState || createMockSession()
  
  return {
    auth: {
      getSession: jest.fn(() => session),
      refreshSession: jest.fn(async () => ({
        session: session,
        error: null,
      })),
      signInEmailPassword: jest.fn(async () => ({
        session: session,
        error: null,
      })),
      signOut: jest.fn(async () => ({
        error: null,
      })),
      signUpEmailPassword: jest.fn(async () => ({
        session: session,
        error: null,
      })),
      isAuthenticated: jest.fn(() => session !== null),
      getUser: jest.fn(() => session?.user || null),
    },
  }
}

/**
 * Mock expired session for testing token refresh
 */
export function createExpiredSession(): Session {
  return createMockSession({
    accessTokenExpiresIn: -1, // Already expired
  })
}

/**
 * Simulate network delay for async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Mock localStorage for client-side tests
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {}
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    get length() {
      return Object.keys(store).length
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }),
  }
}

/**
 * Mock cookie storage for testing
 */
export function mockCookieStorage() {
  const cookies: Record<string, string> = {}
  
  return {
    getCookie: jest.fn((name: string) => cookies[name] || undefined),
    setCookie: jest.fn((name: string, value: string) => {
      cookies[name] = value
    }),
    deleteCookie: jest.fn((name: string) => {
      delete cookies[name]
    }),
    getAllCookies: jest.fn(() => ({ ...cookies })),
    clearAllCookies: jest.fn(() => {
      Object.keys(cookies).forEach(key => delete cookies[key])
    }),
  }
}

/**
 * Verify auth error structure
 */
export function isAuthError(error: unknown): error is { message: string; type: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'type' in error
  )
}

/**
 * Create auth error for testing error handling
 */
export function createAuthError(
  type: 'NETWORK_ERROR' | 'SESSION_EXPIRED' | 'INVALID_CREDENTIALS' | 'UNKNOWN',
  message?: string
) {
  return {
    type,
    message: message || `Test ${type} error`,
  }
}
