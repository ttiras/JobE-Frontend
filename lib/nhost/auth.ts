/**
 * Authentication Utilities
 * 
 * Helper functions for authentication operations using Nhost SDK v4.
 * Provides a clean interface for login, logout, registration,
 * password reset, and email verification.
 * 
 * Features:
 * - Email/password authentication
 * - User registration with email verification
 * - Password reset flow
 * - Email verification
 * - Error handling and validation
 * 
 * @see https://docs.nhost.io/reference/javascript/auth
 */

import { nhost, getVerifyEmailRedirectUrl, getResetPasswordRedirectUrl } from './client'
import { AuthErrorType, type AuthError, type Session } from '@/lib/types/nhost'

/**
 * Login with email and password
 * 
 * @param email - User email address
 * @param password - User password
 * @returns Session object on success
 * @throws AuthError on failure
 */
export async function login(email: string, password: string): Promise<Session | null> {
  const response = await nhost.auth.signInEmailPassword({
    email,
    password,
  })

  if (response.status !== 200) {
    throw createAuthError(response.body, response.status)
  }

  // Important: After successful sign-in, the Nhost client updates its internal session.
  // We return the canonical session from the client, which includes decodedToken
  // and matches our app-wide Session type.
  return nhost.getUserSession()
}

/**
 * Register a new user with email and password
 * 
 * @param email - User email address
 * @param password - User password
 * @param displayName - User display name (optional)
 * @param metadata - Additional user metadata (optional)
 * @returns Session object on success (auto-login after registration)
 * @throws AuthError on failure
 */
export async function register(
  email: string,
  password: string,
  displayName?: string,
  metadata?: Record<string, unknown>
) {
  const response = await nhost.auth.signUpEmailPassword({
    email,
    password,
    options: {
      displayName,
      metadata,
      defaultRole: 'user',
      allowedRoles: ['user'],
    },
  })

  if (response.status !== 200) {
    throw createAuthError(response.body, response.status)
  }

  // Return full response body so callers can distinguish between
  // immediate session (auto-login) and "email verification required"
  // scenarios. For email verification flows, session will be null
  // but user will be present, which should be treated as success.
  return response.body
}

/**
 * Logout the current user
 * 
 * Clears session storage and invalidates refresh token on server.
 * 
 * @returns True on success
 * @throws AuthError on failure
 */
export async function logout() {
  const session = nhost.getUserSession()
  
  if (session) {
    const response = await nhost.auth.signOut({
      refreshToken: session.refreshTokenId,
    })

    if (response.status !== 200) {
      throw createAuthError(response.body, response.status)
    }
  }

  // Clear local session
  nhost.clearSession()
  
  return true
}

/**
 * Send password reset email
 * 
 * @param email - User email address
 * @param locale - User's locale for the reset page (default: 'en')
 * @returns True on success
 * @throws AuthError on failure
 */
export async function sendPasswordResetEmail(email: string, locale: string = 'en') {
  const response = await nhost.auth.sendPasswordResetEmail({
    email,
    options: {
      redirectTo: getResetPasswordRedirectUrl(locale),
    },
  })

  if (response.status !== 200) {
    throw createAuthError(response.body, response.status)
  }

  return true
}

/**
 * Reset password with token from email
 * 
 * Note: Nhost v4 separates sendPasswordResetEmail and the actual password change
 * The ticket-based reset is handled through the email link flow
 * 
 * @param newPassword - New password
 * @returns True on success
 * @throws AuthError on failure
 */
export async function resetPassword(newPassword: string) {
  const response = await nhost.auth.changeUserPassword({
    newPassword,
  })

  if (response.status !== 200) {
    throw createAuthError(response.body, response.status)
  }

  return true
}

/**
 * Send verification email
 * 
 * @param email - User email address
 * @param locale - User's locale for the verification page (default: 'en')
 * @returns True on success
 * @throws AuthError on failure
 */
export async function sendVerificationEmail(email: string, locale: string = 'en') {
  const response = await nhost.auth.sendVerificationEmail({
    email,
    options: {
      redirectTo: getVerifyEmailRedirectUrl(locale),
    },
  })

  if (response.status !== 200) {
    throw createAuthError(response.body, response.status)
  }

  return true
}

/**
 * Change user email
 * 
 * @param newEmail - New email address
 * @returns True on success (verification email will be sent)
 * @throws AuthError on failure
 */
export async function changeEmail(newEmail: string) {
  const response = await nhost.auth.changeUserEmail({
    newEmail,
  })

  if (response.status !== 200) {
    throw createAuthError(response.body, response.status)
  }

  return true
}

/**
 * Change user password
 * 
 * @param newPassword - New password
 * @returns True on success
 * @throws AuthError on failure
 */
export async function changePassword(newPassword: string) {
  const response = await nhost.auth.changeUserPassword({
    newPassword,
  })

  if (response.status !== 200) {
    throw createAuthError(response.body, response.status)
  }

  return true
}

/**
 * Refresh the current session
 * 
 * Forces a token refresh regardless of expiration time.
 * Nhost automatically refreshes tokens every 15 minutes.
 * 
 * @returns New session on success
 * @throws AuthError on failure
 */
export async function refreshSession() {
  const session = await nhost.refreshSession(0) // Force refresh

  if (!session) {
    throw createAuthError(
      { message: 'Failed to refresh session' },
      401
    )
  }

  // Note: Nhost's CookieStorage automatically handles cookie persistence
  return session
}

/**
 * Convert Nhost error response to typed AuthError
 * 
 * @param errorBody - Error response body from Nhost API
 * @param status - HTTP status code
 * @returns Typed AuthError
 */
function createAuthError(errorBody: unknown, status: number): AuthError {
  let message = 'Unknown authentication error'
  if (typeof errorBody === 'object' && errorBody !== null) {
    const obj = errorBody as Record<string, unknown>
    if (typeof obj.message === 'string') {
      message = obj.message
    } else if (typeof obj.error === 'string') {
      message = obj.error
    }
  }
  
  let type: AuthErrorType

  // Map Nhost error messages/status to error types
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('invalid') && lowerMessage.includes('email')) {
    type = AuthErrorType.INVALID_EMAIL
  } else if (lowerMessage.includes('invalid') || lowerMessage.includes('incorrect')) {
    type = AuthErrorType.INVALID_CREDENTIALS
  } else if (lowerMessage.includes('already') || lowerMessage.includes('exists')) {
    type = AuthErrorType.EMAIL_ALREADY_IN_USE
  } else if (lowerMessage.includes('weak') || lowerMessage.includes('short')) {
    type = AuthErrorType.WEAK_PASSWORD
  } else if (lowerMessage.includes('not verified')) {
    type = AuthErrorType.EMAIL_NOT_VERIFIED
  } else if (lowerMessage.includes('not found')) {
    type = AuthErrorType.USER_NOT_FOUND
  } else if (status === 401) {
    type = AuthErrorType.SESSION_EXPIRED
  } else if (status === 429) {
    type = AuthErrorType.RATE_LIMIT_EXCEEDED
  } else if (status >= 500) {
    type = AuthErrorType.NETWORK_ERROR
  } else {
    type = AuthErrorType.UNKNOWN
  }

  const authError = new Error(message) as AuthError
  authError.type = type
  if (errorBody instanceof Error) {
    authError.originalError = errorBody
  }

  return authError
}
