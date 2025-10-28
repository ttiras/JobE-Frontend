/**
 * Unit Tests: Authentication Error Categorization
 * 
 * Tests US4: Graceful Session Expiration Handling - Error Classification
 * Verifies error type detection, user-friendly messaging, and bilingual support
 * 
 * @see specs/004-nhost-v4-auth-setup/spec.md#us4-graceful-session-expiration
 */

import { AuthErrorFactory, AuthErrorType, isRetryableError } from '@/lib/utils/auth-errors';

describe('Authentication Error Categorization', () => {
  describe('AuthErrorFactory', () => {
    describe('Error Type Classification', () => {
      it('should classify network errors correctly', () => {
        const networkErrors = [
          new Error('fetch failed'),
          new Error('Network request failed'),
          new Error('Failed to fetch'),
          { message: 'timeout' },
          { message: 'ECONNREFUSED' },
        ];

        networkErrors.forEach(error => {
          const result = AuthErrorFactory.categorize(error);
          expect(result.type).toBe(AuthErrorType.NETWORK_ERROR);
        });
      });

      it('should classify session expired errors correctly', () => {
        const expiredErrors = [
          new Error('Session expired'),
          new Error('Token expired'),
          new Error('jwt expired'),
          { message: 'invalid-jwt' },
          { message: 'EXPIRED_SESSION' },
        ];

        expiredErrors.forEach(error => {
          const result = AuthErrorFactory.categorize(error);
          expect(result.type).toBe(AuthErrorType.SESSION_EXPIRED);
        });
      });

      it('should classify invalid credentials errors correctly', () => {
        const credentialErrors = [
          new Error('Invalid email or password'),
          new Error('Wrong password'),
          new Error('User not found'),
          { message: 'invalid-credentials' },
          { message: 'incorrect-password' },
        ];

        credentialErrors.forEach(error => {
          const result = AuthErrorFactory.categorize(error);
          expect(result.type).toBe(AuthErrorType.INVALID_CREDENTIALS);
        });
      });

      it('should classify unknown errors as UNKNOWN type', () => {
        const unknownErrors = [
          new Error('Something went wrong'),
          new Error('Unexpected error'),
          { message: 'random error' },
          null,
          undefined,
        ];

        unknownErrors.forEach(error => {
          const result = AuthErrorFactory.categorize(error);
          expect(result.type).toBe(AuthErrorType.UNKNOWN);
        });
      });

      it('should handle Nhost-specific error codes', () => {
        const nhostErrors = [
          { error: { message: 'invalid-email-password' } },
          { error: { message: 'user-already-exists' } },
          { error: { message: 'email-already-in-use' } },
        ];

        nhostErrors.forEach(error => {
          const result = AuthErrorFactory.categorize(error);
          expect([AuthErrorType.INVALID_CREDENTIALS, AuthErrorType.UNKNOWN]).toContain(result.type);
        });
      });
    });

    describe('User-Friendly Messages (English)', () => {
      it('should generate helpful message for network errors', () => {
        const error = new Error('fetch failed');
        const result = AuthErrorFactory.categorize(error);
        const message = result.getMessage('en');

        expect(message).toContain('network');
        expect(message).toContain('connection');
        expect(message.length).toBeGreaterThan(20);
      });

      it('should generate helpful message for session expired errors', () => {
        const error = new Error('Session expired');
        const result = AuthErrorFactory.categorize(error);
        const message = result.getMessage('en');

        expect(message).toContain('session');
        expect(message).toContain('log in');
        expect(message.length).toBeGreaterThan(20);
      });

      it('should generate helpful message for invalid credentials', () => {
        const error = new Error('Invalid email or password');
        const result = AuthErrorFactory.categorize(error);
        const message = result.getMessage('en');

        expect(message).toContain('email');
        expect(message).toContain('password');
        expect(message.length).toBeGreaterThan(20);
      });

      it('should generate helpful message for unknown errors', () => {
        const error = new Error('Something went wrong');
        const result = AuthErrorFactory.categorize(error);
        const message = result.getMessage('en');

        expect(message).toContain('error');
        expect(message.length).toBeGreaterThan(20);
      });
    });

    describe('User-Friendly Messages (Turkish)', () => {
      it('should generate helpful message for network errors in Turkish', () => {
        const error = new Error('fetch failed');
        const result = AuthErrorFactory.categorize(error);
        const message = result.getMessage('tr');

        expect(message).toBeTruthy();
        expect(message.length).toBeGreaterThan(20);
        // Should be different from English
        expect(message).not.toBe(result.getMessage('en'));
      });

      it('should generate helpful message for session expired errors in Turkish', () => {
        const error = new Error('Session expired');
        const result = AuthErrorFactory.categorize(error);
        const message = result.getMessage('tr');

        expect(message).toBeTruthy();
        expect(message.length).toBeGreaterThan(20);
        expect(message).not.toBe(result.getMessage('en'));
      });

      it('should generate helpful message for invalid credentials in Turkish', () => {
        const error = new Error('Invalid email or password');
        const result = AuthErrorFactory.categorize(error);
        const message = result.getMessage('tr');

        expect(message).toBeTruthy();
        expect(message.length).toBeGreaterThan(20);
        expect(message).not.toBe(result.getMessage('en'));
      });

      it('should fallback to English if Turkish not available', () => {
        const error = new Error('Test error');
        const result = AuthErrorFactory.categorize(error);
        
        // If TR message not available, should return EN
        const enMessage = result.getMessage('en');
        const trMessage = result.getMessage('tr');
        
        expect(enMessage).toBeTruthy();
        expect(trMessage).toBeTruthy();
      });
    });

    describe('Error Metadata', () => {
      it('should include original error in metadata', () => {
        const originalError = new Error('Original error message');
        const result = AuthErrorFactory.categorize(originalError);

        expect(result.originalError).toBe(originalError);
      });

      it('should include timestamp in metadata', () => {
        const error = new Error('Test error');
        const before = Date.now();
        const result = AuthErrorFactory.categorize(error);
        const after = Date.now();

        expect(result.timestamp).toBeGreaterThanOrEqual(before);
        expect(result.timestamp).toBeLessThanOrEqual(after);
      });

      it('should extract error code if available', () => {
        const error = { code: 'AUTH_001', message: 'Test error' };
        const result = AuthErrorFactory.categorize(error);

        expect(result.code).toBe('AUTH_001');
      });
    });
  });

  describe('Error Retry Logic', () => {
    it('should identify network errors as retryable', () => {
      const error = new Error('fetch failed');
      const result = AuthErrorFactory.categorize(error);
      
      expect(isRetryableError(result.type)).toBe(true);
    });

    it('should identify session expired errors as retryable', () => {
      const error = new Error('Session expired');
      const result = AuthErrorFactory.categorize(error);
      
      expect(isRetryableError(result.type)).toBe(true);
    });

    it('should identify invalid credentials as not retryable', () => {
      const error = new Error('Invalid email or password');
      const result = AuthErrorFactory.categorize(error);
      
      expect(isRetryableError(result.type)).toBe(false);
    });

    it('should identify unknown errors as retryable (safe default)', () => {
      const error = new Error('Unknown error');
      const result = AuthErrorFactory.categorize(error);
      
      // Unknown errors should be retryable by default (fail safe)
      expect(isRetryableError(result.type)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null error gracefully', () => {
      const result = AuthErrorFactory.categorize(null);
      
      expect(result.type).toBe(AuthErrorType.UNKNOWN);
      expect(result.getMessage('en')).toBeTruthy();
    });

    it('should handle undefined error gracefully', () => {
      const result = AuthErrorFactory.categorize(undefined);
      
      expect(result.type).toBe(AuthErrorType.UNKNOWN);
      expect(result.getMessage('en')).toBeTruthy();
    });

    it('should handle empty error object', () => {
      const result = AuthErrorFactory.categorize({});
      
      expect(result.type).toBe(AuthErrorType.UNKNOWN);
      expect(result.getMessage('en')).toBeTruthy();
    });

    it('should handle error with no message', () => {
      const error = new Error();
      const result = AuthErrorFactory.categorize(error);
      
      expect(result.type).toBe(AuthErrorType.UNKNOWN);
      expect(result.getMessage('en')).toBeTruthy();
    });

    it('should handle non-Error objects', () => {
  const error = { someProp: 'value' };
  const result = AuthErrorFactory.categorize(error);
      
      expect(result.type).toBe(AuthErrorType.UNKNOWN);
      expect(result.getMessage('en')).toBeTruthy();
    });
  });

  describe('Message Quality', () => {
    it('should generate messages without technical jargon', () => {
      const errors = [
        new Error('fetch failed'),
        new Error('Session expired'),
        new Error('Invalid email or password'),
      ];

      errors.forEach(error => {
        const result = AuthErrorFactory.categorize(error);
        const message = result.getMessage('en');

        // Should not contain technical terms
        expect(message.toLowerCase()).not.toContain('jwt');
        expect(message.toLowerCase()).not.toContain('token');
        expect(message.toLowerCase()).not.toContain('fetch');
        expect(message.toLowerCase()).not.toContain('api');
      });
    });

    it('should generate actionable messages', () => {
      const error = new Error('Session expired');
      const result = AuthErrorFactory.categorize(error);
      const message = result.getMessage('en');

      // Should suggest action
      expect(
        message.toLowerCase().includes('log in') ||
        message.toLowerCase().includes('try again') ||
        message.toLowerCase().includes('refresh')
      ).toBe(true);
    });

    it('should keep messages concise', () => {
      const errors = [
        new Error('fetch failed'),
        new Error('Session expired'),
        new Error('Invalid email or password'),
        new Error('Unknown error'),
      ];

      errors.forEach(error => {
        const result = AuthErrorFactory.categorize(error);
        const message = result.getMessage('en');

        // Messages should be concise (< 200 chars is good UX)
        expect(message.length).toBeLessThan(200);
      });
    });
  });

  describe('Consistency', () => {
    it('should return same result for same error', () => {
      const error = new Error('Session expired');
      const result1 = AuthErrorFactory.categorize(error);
      const result2 = AuthErrorFactory.categorize(error);

      expect(result1.type).toBe(result2.type);
      expect(result1.getMessage('en')).toBe(result2.getMessage('en'));
    });

    it('should classify similar errors consistently', () => {
      const expiredErrors = [
        new Error('Session expired'),
        new Error('session expired'),
        new Error('SESSION EXPIRED'),
        new Error('Your session has expired'),
      ];

      const types = expiredErrors.map(error => 
        AuthErrorFactory.categorize(error).type
      );

      // All should be classified as SESSION_EXPIRED
      const uniqueTypes = new Set(types);
      expect(uniqueTypes.size).toBe(1);
      expect(uniqueTypes.has(AuthErrorType.SESSION_EXPIRED)).toBe(true);
    });
  });
});
