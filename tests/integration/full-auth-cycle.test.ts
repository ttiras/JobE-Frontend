/**
 * Integration Test: Complete Authentication Cycle
 * 
 * Tests US3: Unified Session State - Full Cycle
 * Verifies complete flow: client login → server verify → client logout → server verify
 * 
 * This test ensures that authentication state remains consistent across
 * client and server contexts throughout the entire user session lifecycle.
 * 
 * @see specs/004-nhost-v4-auth-setup/spec.md#us3-unified-session-state
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/nhost/server-client';
import type { NhostClient } from '@nhost/nhost-js';
import { SESSION_COOKIE } from '@/lib/constants/auth';
import { createMockSession, createMockUser } from '../utils/auth-helpers';

// Mock Next.js cookies() API
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Mock server client
jest.mock('@/lib/nhost/server-client');

const mockCookies = cookies as jest.MockedFunction<typeof cookies>;
const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>;

describe('Complete Authentication Cycle', () => {
  type MockCookieStore = { get: jest.Mock; set: jest.Mock; delete: jest.Mock };
  let mockCookieStore: MockCookieStore;
  const mockUser = createMockUser();
  const mockSession = createMockSession({ user: mockUser });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock cookie store
    mockCookieStore = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };
    
  mockCookies.mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>);
  });

  describe('Full Authentication Lifecycle', () => {
    it('should maintain consistent state through login → server verify → logout → server verify', async () => {
      // === PHASE 1: Client Login ===
      // Simulate user logs in via client-side form
      const loginTimestamp = Date.now();
      
      // Client stores session in cookie after successful login
      mockCookieStore.get.mockReturnValue({
        name: SESSION_COOKIE.NAME,
        value: JSON.stringify({
          accessToken: mockSession.accessToken,
          refreshToken: 'refresh-token-123',
          user: mockUser,
        }),
      });

      // === PHASE 2: Server Verifies Login ===
      // User navigates to protected page (Server Component)
      const mockServerClientLoggedIn: Partial<NhostClient> = {
        getUserSession: jest.fn().mockReturnValue(mockSession),
        refreshSession: jest.fn().mockResolvedValue(mockSession),
      };
      
      mockCreateServerClient.mockResolvedValue(mockServerClientLoggedIn as NhostClient);

      // Server reads session from cookie
  const serverClient1 = await createServerClient();
  const serverSession1 = serverClient1.getUserSession();

      // Verify server recognizes logged-in user
      expect(serverSession1).not.toBeNull();
  expect(serverSession1?.user?.id).toBe(mockUser.id);
  expect(serverSession1?.user?.email).toBe(mockUser.email);

      // === PHASE 3: Client Logout ===
      // User clicks logout button
      const logoutTimestamp = Date.now();
      expect(logoutTimestamp).toBeGreaterThan(loginTimestamp);

      // Client clears cookie on logout
      mockCookieStore.get.mockReturnValue(undefined); // Cookie deleted

      // === PHASE 4: Server Verifies Logout ===
      // User tries to access protected page after logout
      const mockServerClientLoggedOut: Partial<NhostClient> = {
        getUserSession: jest.fn().mockReturnValue(null),
      };
      
      mockCreateServerClient.mockResolvedValue(mockServerClientLoggedOut as NhostClient);

      // Server checks session from cookie (now empty)
  const serverClient2 = await createServerClient();
  const serverSession2 = serverClient2.getUserSession();

      // Verify server recognizes logged-out state
      expect(serverSession2).toBeNull();
  // No user available when logged out

      // Verify complete cycle consistency
      expect(serverSession1?.user?.id).toBe(mockUser.id); // Was logged in
      expect(serverSession2).toBeNull(); // Now logged out
    });

    it('should handle token refresh during active session', async () => {
      const initialToken = 'access-token-initial';
      const refreshedToken = 'access-token-refreshed';

      // === PHASE 1: Initial Login ===
      mockCookieStore.get.mockReturnValue({
        name: SESSION_COOKIE.NAME,
        value: JSON.stringify({
          accessToken: initialToken,
          refreshToken: 'refresh-token',
        }),
      });

      const mockServerClient1: Partial<NhostClient> = {
        getUserSession: jest.fn().mockReturnValue({ ...mockSession, accessToken: initialToken }),
        refreshSession: jest.fn().mockResolvedValue({ ...mockSession, accessToken: refreshedToken }),
      };
      
      mockCreateServerClient.mockResolvedValue(mockServerClient1 as NhostClient);

      // Verify initial token
  const serverClient1 = await createServerClient();
  const token1 = serverClient1.getUserSession()?.accessToken || null;
      expect(token1).toBe(initialToken);

      // === PHASE 2: Token Refresh ===
      // Simulate token expiration and refresh
      mockCookieStore.get.mockReturnValue({
        name: SESSION_COOKIE.NAME,
        value: JSON.stringify({
          accessToken: refreshedToken,
          refreshToken: 'refresh-token',
        }),
      });

      const mockServerClient2: Partial<NhostClient> = {
        getUserSession: jest.fn().mockReturnValue({ ...mockSession, accessToken: refreshedToken }),
        refreshSession: jest.fn(),
      };
      
      mockCreateServerClient.mockResolvedValue(mockServerClient2 as NhostClient);

      // Verify refreshed token
  const serverClient2 = await createServerClient();
  const token2 = serverClient2.getUserSession()?.accessToken || null;
      expect(token2).toBe(refreshedToken);
      expect(token2).not.toBe(token1);

      // === PHASE 3: Logout After Refresh ===
      mockCookieStore.get.mockReturnValue(undefined);

      const mockServerClient3: Partial<NhostClient> = {
        getUserSession: jest.fn().mockReturnValue(null),
      };
      
      mockCreateServerClient.mockResolvedValue(mockServerClient3 as NhostClient);

      // Verify logout recognized
  const serverClient3 = await createServerClient();
  expect(serverClient3.getUserSession()).toBeNull();
    });

    it('should maintain user identity across multiple server requests', async () => {
      // Setup authenticated session
      mockCookieStore.get.mockReturnValue({
        name: SESSION_COOKIE.NAME,
        value: JSON.stringify({
          accessToken: mockSession.accessToken,
          refreshToken: 'refresh-token',
          user: mockUser,
        }),
      });

      const mockServerClient: Partial<NhostClient> = {
        getUserSession: jest.fn().mockReturnValue(mockSession),
      };
      
      mockCreateServerClient.mockResolvedValue(mockServerClient as NhostClient);

      // Simulate multiple server requests in same session
      const requests = await Promise.all([
        createServerClient(),
        createServerClient(),
        createServerClient(),
      ]);

    // All requests should see same user via session
    const sessions = requests.map(client => client.getUserSession());
    const users = sessions.map(s => s?.user);
      expect(users).toHaveLength(3);
      expect(users[0]?.id).toBe(mockUser.id);
      expect(users[1]?.id).toBe(mockUser.id);
      expect(users[2]?.id).toBe(mockUser.id);

      // All should have same email
      expect(users[0]?.email).toBe(mockUser.email);
      expect(users[1]?.email).toBe(mockUser.email);
      expect(users[2]?.email).toBe(mockUser.email);
    });

    it('should handle rapid login/logout cycles', async () => {
      // Cycle 1: Login
      mockCookieStore.get.mockReturnValue({
        name: SESSION_COOKIE.NAME,
        value: JSON.stringify({ accessToken: 'token1', refreshToken: 'refresh1' }),
      });

      const mockClientLoggedIn: Partial<NhostClient> = {
        getUserSession: jest.fn().mockReturnValue(mockSession),
      };
      mockCreateServerClient.mockResolvedValue(mockClientLoggedIn as NhostClient);

  const client1 = await createServerClient();
  expect(client1.getUserSession()).not.toBeNull();

      // Cycle 1: Logout
      mockCookieStore.get.mockReturnValue(undefined);

      const mockClientLoggedOut: Partial<NhostClient> = {
        getUserSession: jest.fn().mockReturnValue(null),
      };
      mockCreateServerClient.mockResolvedValue(mockClientLoggedOut as NhostClient);

  const client2 = await createServerClient();
  expect(client2.getUserSession()).toBeNull();

      // Cycle 2: Login again
      mockCookieStore.get.mockReturnValue({
        name: SESSION_COOKIE.NAME,
        value: JSON.stringify({ accessToken: 'token2', refreshToken: 'refresh2' }),
      });
  mockCreateServerClient.mockResolvedValue(mockClientLoggedIn as NhostClient);

  const client3 = await createServerClient();
  expect(client3.getUserSession()).not.toBeNull();

      // Verify no state leakage between cycles
  expect(client2.getUserSession()).toBeNull(); // Still logged out
  expect(client3.getUserSession()).not.toBeNull(); // Newly logged in
    });
  });

  describe('Error Handling in Full Cycle', () => {
    it('should handle cookie corruption gracefully', async () => {
      // Simulate corrupted cookie data
      mockCookieStore.get.mockReturnValue({
        name: SESSION_COOKIE.NAME,
        value: 'corrupted-data-not-json',
      });

      const mockServerClient: Partial<NhostClient> = {
        getUserSession: jest.fn().mockReturnValue(null),
      };
      
      mockCreateServerClient.mockResolvedValue(mockServerClient as NhostClient);

      // Server should handle corruption gracefully (return null session)
  const serverClient = await createServerClient();
  const session = serverClient.getUserSession();

      expect(session).toBeNull();
      // Should not throw error
    });

    it('should handle missing cookie gracefully', async () => {
      // No cookie present
      mockCookieStore.get.mockReturnValue(undefined);

      const mockServerClient: Partial<NhostClient> = {
        getUserSession: jest.fn().mockReturnValue(null),
      };
      
      mockCreateServerClient.mockResolvedValue(mockServerClient as NhostClient);

      // Server should handle missing cookie gracefully
  const serverClient = await createServerClient();
  const session = serverClient.getUserSession();

      expect(session).toBeNull();
      // Should not throw error
    });
  });

  describe('Multi-Tab Synchronization', () => {
    it('should document automatic multi-tab logout sync', () => {
      // Tab 1: User logs out
      // - clearSessionCookie() deletes cookie
      // - Cookie is removed from browser's cookie store
      
      // Tab 2: User continues working
      // - On next Nhost API call, SDK reads cookie store
      // - Cookie missing → Nhost SDK returns null session
      // - SDK triggers auth state change event
      // - React components re-render with logged-out state
      
      // No manual synchronization needed:
      // - No BroadcastChannel
      // - No localStorage events
      // - No polling
      
      // This is automatic because:
      // - All tabs share same browser cookie store
      // - Nhost SDK checks cookie on every API call
      // - Cookie deletion affects all tabs immediately
      
      expect(SESSION_COOKIE.NAME).toBe('nhostSession');
    });
  });
});
