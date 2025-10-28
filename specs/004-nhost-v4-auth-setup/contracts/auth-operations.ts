/**
 * Auth Operations Contracts
 * 
 * Unified authentication operation interfaces for both client and server contexts.
 * Defines common patterns, error handling, and operation results.
 * 
 * @module contracts/auth-operations
 */

import type { Session, User, AuthError, AuthErrorType } from './client-session'

/**
 * Generic auth operation result
 * Standard response format for all auth operations
 */
export interface AuthOperationResult<T = void> {
  /** Operation success status */
  success: boolean
  
  /** Result data if successful */
  data?: T
  
  /** Error if operation failed */
  error?: AuthError
  
  /** Additional metadata */
  meta?: {
    /** Operation duration (ms) */
    duration?: number
    
    /** Number of retry attempts */
    retryCount?: number
    
    /** Timestamp of operation */
    timestamp: number
  }
}

/**
 * Login operation result
 */
export type LoginResult = AuthOperationResult<{
  session: Session
  user: User
  isNewUser: boolean
}>

/**
 * Registration operation result
 */
export type RegisterResult = AuthOperationResult<{
  session: Session | null
  user: User
  requiresEmailVerification: boolean
}>

/**
 * Logout operation result
 */
export type LogoutResult = AuthOperationResult<void>

/**
 * Password reset request result
 */
export type PasswordResetRequestResult = AuthOperationResult<{
  emailSent: boolean
  expiresAt: Date
}>

/**
 * Password change result
 */
export type PasswordChangeResult = AuthOperationResult<{
  session: Session
}>

/**
 * Session refresh result
 */
export type SessionRefreshResult = AuthOperationResult<{
  session: Session
  tokensRefreshed: boolean
}>

/**
 * Email verification result
 */
export type EmailVerificationResult = AuthOperationResult<{
  verified: boolean
  session: Session | null
}>

/**
 * Retry configuration for resilient operations
 */
export interface RetryConfiguration {
  /** Maximum number of attempts */
  maxAttempts: number
  
  /** Initial delay between retries (ms) */
  initialDelay: number
  
  /** Delay multiplier for exponential backoff */
  backoffMultiplier: number
  
  /** Maximum delay cap (ms) */
  maxDelay: number
  
  /** Errors that should trigger retry */
  retryableErrors: AuthErrorType[]
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfiguration = {
  maxAttempts: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 8000,
  retryableErrors: ['NETWORK_ERROR', 'UNKNOWN_ERROR']
}

/**
 * Auth operation metadata
 * Tracking information for monitoring and debugging
 */
export interface OperationMetadata {
  /** Operation unique ID */
  operationId: string
  
  /** Operation type */
  operation: AuthOperationType
  
  /** Execution context */
  context: 'client' | 'server'
  
  /** Start timestamp */
  startedAt: Date
  
  /** End timestamp */
  completedAt?: Date
  
  /** Total duration (ms) */
  duration?: number
  
  /** Number of retry attempts */
  retryCount: number
  
  /** Final status */
  status: 'success' | 'failed' | 'retrying'
}

/**
 * Auth operation types for tracking
 */
export type AuthOperationType =
  | 'LOGIN'
  | 'REGISTER'
  | 'LOGOUT'
  | 'REFRESH'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_CHANGE'
  | 'EMAIL_VERIFICATION'

/**
 * Auth event for monitoring/logging
 */
export interface AuthEvent {
  /** Event type */
  type: AuthEventType
  
  /** Event timestamp */
  timestamp: Date
  
  /** User ID if applicable */
  userId?: string
  
  /** Session ID if applicable */
  sessionId?: string
  
  /** Event payload */
  payload?: Record<string, unknown>
  
  /** Event severity */
  severity: 'info' | 'warning' | 'error'
}

/**
 * Auth event types for logging
 */
export type AuthEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'REGISTER_SUCCESS'
  | 'REGISTER_FAILED'
  | 'LOGOUT'
  | 'SESSION_REFRESHED'
  | 'SESSION_REFRESH_FAILED'
  | 'SESSION_EXPIRED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_CHANGED'
  | 'EMAIL_VERIFIED'
  | 'AUTH_ERROR'

/**
 * Error factory for creating consistent auth errors
 */
export class AuthErrorFactory {
  static invalidCredentials(message = 'Invalid email or password'): AuthError {
    return {
      type: 'INVALID_CREDENTIALS',
      message,
      status: 401
    }
  }
  
  static emailNotVerified(message = 'Please verify your email address'): AuthError {
    return {
      type: 'EMAIL_NOT_VERIFIED',
      message,
      status: 403
    }
  }
  
  static userDisabled(message = 'This account has been disabled'): AuthError {
    return {
      type: 'USER_DISABLED',
      message,
      status: 403
    }
  }
  
  static networkError(message = 'Network connection failed'): AuthError {
    return {
      type: 'NETWORK_ERROR',
      message
    }
  }
  
  static sessionExpired(message = 'Your session has expired. Please log in again.'): AuthError {
    return {
      type: 'SESSION_EXPIRED',
      message,
      status: 401
    }
  }
  
  static rateLimited(message = 'Too many requests. Please try again later.'): AuthError {
    return {
      type: 'RATE_LIMITED',
      message,
      status: 429
    }
  }
  
  static unknownError(message = 'An unexpected error occurred'): AuthError {
    return {
      type: 'UNKNOWN_ERROR',
      message,
      status: 500
    }
  }
  
  /**
   * Create error from HTTP response
   */
  static fromResponse(status: number, body: { message?: string; error?: string }): AuthError {
    const message = body.message || body.error || 'Request failed'
    
    switch (status) {
      case 401:
        return this.invalidCredentials(message)
      case 403:
        return message.toLowerCase().includes('email')
          ? this.emailNotVerified(message)
          : this.userDisabled(message)
      case 429:
        return this.rateLimited(message)
      case 500:
      case 502:
      case 503:
      case 504:
        return this.unknownError(message)
      default:
        return this.unknownError(message)
    }
  }
}

/**
 * Retry helper for resilient auth operations
 */
export class RetryHelper {
  /**
   * Execute operation with retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfiguration = DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    let lastError: Error | undefined
    
    for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        // Don't retry on last attempt
        if (attempt === config.maxAttempts - 1) {
          break
        }
        
        // Calculate exponential backoff delay
        const delay = Math.min(
          config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        )
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError
  }
  
  /**
   * Check if error is retryable
   */
  static isRetryable(error: AuthError, config: RetryConfiguration): boolean {
    return config.retryableErrors.includes(error.type)
  }
}

/**
 * Session validator utility
 */
export class SessionValidator {
  /**
   * Check if session is valid and not expired
   */
  static isValid(session: Session | null): boolean {
    if (!session) return false
    
    // Check if access token exists
    if (!session.accessToken || !session.refreshToken) {
      return false
    }
    
    // Check if user exists
    if (!session.user || !session.user.id) {
      return false
    }
    
    return true
  }
  
  /**
   * Check if access token is expired or expiring soon
   */
  static needsRefresh(session: Session, windowSeconds: number = 300): boolean {
    return session.accessTokenExpiresIn <= windowSeconds
  }
  
  /**
   * Estimate refresh token expiration
   * Note: Nhost doesn't expose refresh token expiry in session object
   */
  static estimateRefreshExpiry(session: Session, slidingWindowDays: number = 30): Date {
    const now = new Date()
    return new Date(now.getTime() + slidingWindowDays * 24 * 60 * 60 * 1000)
  }
}

/**
 * User-friendly error messages
 * Maps error types to localized messages
 */
export const ERROR_MESSAGES: Record<AuthErrorType, { en: string; tr: string }> = {
  INVALID_CREDENTIALS: {
    en: 'Invalid email or password. Please try again.',
    tr: 'Geçersiz e-posta veya şifre. Lütfen tekrar deneyin.'
  },
  EMAIL_NOT_VERIFIED: {
    en: 'Please verify your email address to continue.',
    tr: 'Devam etmek için lütfen e-posta adresinizi doğrulayın.'
  },
  USER_DISABLED: {
    en: 'This account has been disabled. Please contact support.',
    tr: 'Bu hesap devre dışı bırakıldı. Lütfen destek ekibiyle iletişime geçin.'
  },
  NETWORK_ERROR: {
    en: 'Connection failed. Please check your internet and try again.',
    tr: 'Bağlantı başarısız. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.'
  },
  SESSION_EXPIRED: {
    en: 'Your session has expired. Please log in again.',
    tr: 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.'
  },
  RATE_LIMITED: {
    en: 'Too many requests. Please wait a moment and try again.',
    tr: 'Çok fazla istek. Lütfen bir süre bekleyin ve tekrar deneyin.'
  },
  UNKNOWN_ERROR: {
    en: 'An unexpected error occurred. Please try again.',
    tr: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'
  }
}

/**
 * Get localized error message
 */
export function getErrorMessage(
  errorType: AuthErrorType,
  locale: 'en' | 'tr' = 'en'
): string {
  return ERROR_MESSAGES[errorType][locale]
}

/**
 * Operation timing tracker
 */
export class OperationTimer {
  private startTime: number
  
  constructor() {
    this.startTime = Date.now()
  }
  
  /**
   * Get elapsed time in milliseconds
   */
  elapsed(): number {
    return Date.now() - this.startTime
  }
  
  /**
   * Create operation metadata
   */
  createMetadata(
    operation: AuthOperationType,
    context: 'client' | 'server',
    status: 'success' | 'failed',
    retryCount: number = 0
  ): OperationMetadata {
    const now = new Date()
    return {
      operationId: crypto.randomUUID(),
      operation,
      context,
      startedAt: new Date(this.startTime),
      completedAt: now,
      duration: this.elapsed(),
      retryCount,
      status
    }
  }
}

/**
 * Auth event logger interface
 */
export interface AuthEventLogger {
  log(event: AuthEvent): void
  logSuccess(operation: AuthOperationType, userId?: string): void
  logFailure(operation: AuthOperationType, error: AuthError, userId?: string): void
}

/**
 * Console logger implementation (for development)
 */
export class ConsoleAuthLogger implements AuthEventLogger {
  log(event: AuthEvent): void {
    const level = event.severity === 'error' ? 'error' : 'info'
    console[level]('[Auth Event]', {
      type: event.type,
      timestamp: event.timestamp,
      userId: event.userId,
      payload: event.payload
    })
  }
  
  logSuccess(operation: AuthOperationType, userId?: string): void {
    this.log({
      type: `${operation}_SUCCESS` as AuthEventType,
      timestamp: new Date(),
      userId,
      severity: 'info'
    })
  }
  
  logFailure(operation: AuthOperationType, error: AuthError, userId?: string): void {
    this.log({
      type: 'AUTH_ERROR',
      timestamp: new Date(),
      userId,
      payload: { operation, error },
      severity: 'error'
    })
  }
}
