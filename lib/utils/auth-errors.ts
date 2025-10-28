/**
 * Authentication Error Handling
 * 
 * Provides error categorization, user-friendly messaging, and retry logic
 * for authentication-related errors.
 * 
 * Features:
 * - Error type classification (network, session, credentials, unknown)
 * - User-friendly messages in English and Turkish
 * - Retry logic determination
 * - Original error preservation for debugging
 * 
 * @see tests/unit/auth-errors.test.ts
 */

/**
 * Authentication error types
 */
export enum AuthErrorType {
  /** Network connectivity issues (fetch failed, timeout, etc.) */
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  /** Session or token expired */
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  /** Invalid email, password, or credentials */
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  /** Unknown or unclassified error */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Categorized authentication error with metadata
 */
export interface CategorizedError {
  /** Error type classification */
  type: AuthErrorType;
  
  /** Get user-friendly message in specified locale */
  getMessage: (locale: 'en' | 'tr') => string;
  
  /** Original error object */
  originalError: unknown;
  
  /** Timestamp when error was categorized */
  timestamp: number;
  
  /** Error code if available */
  code?: string;
}

/**
 * User-friendly error messages by type and locale
 */
const ERROR_MESSAGES: Record<AuthErrorType, Record<'en' | 'tr', string>> = {
  [AuthErrorType.NETWORK_ERROR]: {
    en: 'Unable to connect to the network. Please check your internet connection and try again.',
    tr: 'Ağa bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.',
  },
  [AuthErrorType.SESSION_EXPIRED]: {
    en: 'Your session has expired. Please log in again to continue.',
    tr: 'Oturumunuzun süresi doldu. Devam etmek için lütfen tekrar giriş yapın.',
  },
  [AuthErrorType.INVALID_CREDENTIALS]: {
    en: 'Invalid email or password. Please check your credentials and try again.',
    tr: 'Geçersiz e-posta veya şifre. Lütfen bilgilerinizi kontrol edin ve tekrar deneyin.',
  },
  [AuthErrorType.UNKNOWN]: {
    en: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    tr: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin veya sorun devam ederse destek ekibiyle iletişime geçin.',
  },
};

/**
 * Authentication Error Factory
 * 
 * Analyzes errors and categorizes them into user-friendly types
 * with appropriate messaging and retry logic.
 */
export class AuthErrorFactory {
  /**
   * Categorize an error and return structured error information
   * 
   * @param error - Error to categorize (can be Error, object, or unknown)
   * @returns Categorized error with user-friendly messaging
   * 
   * @example
   * ```typescript
   * try {
   *   await nhost.auth.signIn(...)
   * } catch (error) {
   *   const categorized = AuthErrorFactory.categorize(error);
   *   console.log(categorized.getMessage('en'));
   *   if (isRetryableError(categorized.type)) {
   *     // Retry logic
   *   }
   * }
   * ```
   */
  static categorize(error: unknown): CategorizedError {
    const type = this.classifyError(error);
    const code = this.extractCode(error);
    
    return {
      type,
      getMessage: (locale: 'en' | 'tr') => ERROR_MESSAGES[type][locale],
      originalError: error,
      timestamp: Date.now(),
      code,
    };
  }

  /**
   * Classify error into one of the AuthErrorType categories
   */
  private static classifyError(error: unknown): AuthErrorType {
    if (!error) {
      return AuthErrorType.UNKNOWN;
    }

    const errorMessage = this.getErrorMessage(error);
    const errorMessageLower = errorMessage.toLowerCase();

    // Check for network errors
    if (this.isNetworkError(errorMessageLower)) {
      return AuthErrorType.NETWORK_ERROR;
    }

    // Check for session/token expiration
    if (this.isSessionExpired(errorMessageLower)) {
      return AuthErrorType.SESSION_EXPIRED;
    }

    // Check for invalid credentials
    if (this.isInvalidCredentials(errorMessageLower)) {
      return AuthErrorType.INVALID_CREDENTIALS;
    }

    // Default to unknown
    return AuthErrorType.UNKNOWN;
  }

  /**
   * Extract error message from various error formats
   */
  private static getErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'object' && error !== null) {
      // Handle Nhost error format: { error: { message: '...' } }
      if ('error' in error && typeof error.error === 'object' && error.error !== null) {
        const nhostError = error.error as Record<string, unknown>;
        if ('message' in nhostError) {
          return String(nhostError.message);
        }
      }

      // Handle standard format: { message: '...' }
      if ('message' in error) {
        const errorObj = error as Record<string, unknown>;
        return String(errorObj.message);
      }
    }

    return '';
  }

  /**
   * Check if error is a network connectivity issue
   */
  private static isNetworkError(message: string): boolean {
    const networkKeywords = [
      'fetch failed',
      'network',
      'timeout',
      'econnrefused',
      'failed to fetch',
      'connection refused',
      'net::err',
    ];

    return networkKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if error is session/token expiration
   */
  private static isSessionExpired(message: string): boolean {
    const expiredKeywords = [
      'expired',
      'invalid-jwt',
      'jwt expired',
      'token expired',
      'session expired',
      'expired_session',
    ];

    return expiredKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if error is invalid credentials
   */
  private static isInvalidCredentials(message: string): boolean {
    const credentialKeywords = [
      'invalid email',
      'invalid password',
      'wrong password',
      'invalid credentials',
      'incorrect password',
      'incorrect-password',
      'user not found',
      'invalid-email-password',
      'invalid-credentials',
    ];

    return credentialKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Extract error code if available
   */
  private static extractCode(error: unknown): string | undefined {
    if (typeof error === 'object' && error !== null) {
      if ('code' in error) {
        const errorObj = error as Record<string, unknown>;
        return String(errorObj.code);
      }
      if ('error' in error && typeof error.error === 'object' && error.error !== null) {
        const nhostError = error.error as Record<string, unknown>;
        if ('code' in nhostError) {
          return String(nhostError.code);
        }
      }
    }
    return undefined;
  }
}

/**
 * Determine if an error type should be retried
 * 
 * @param errorType - Type of authentication error
 * @returns true if error is retryable, false otherwise
 * 
 * Retryable errors:
 * - Network errors (connection might be restored)
 * - Session expired (user can re-authenticate)
 * - Unknown errors (fail-safe: allow retry)
 * 
 * Non-retryable errors:
 * - Invalid credentials (retry won't help without changing input)
 * 
 * @example
 * ```typescript
 * const error = AuthErrorFactory.categorize(err);
 * if (isRetryableError(error.type)) {
 *   showRetryButton();
 * } else {
 *   showFixInputPrompt();
 * }
 * ```
 */
export function isRetryableError(errorType: AuthErrorType): boolean {
  switch (errorType) {
    case AuthErrorType.NETWORK_ERROR:
      return true; // Connection might be restored
      
    case AuthErrorType.SESSION_EXPIRED:
      return true; // User can re-authenticate
      
    case AuthErrorType.INVALID_CREDENTIALS:
      return false; // Retry won't help without changing input
      
    case AuthErrorType.UNKNOWN:
      return true; // Fail-safe: allow retry for unknown errors
      
    default:
      return true; // Default to retryable
  }
}
