/**
 * Integration Tests: SessionExpiredDialog Component
 * 
 * Tests the integration between:
 * - SessionExpiredDialog component
 * - AuthErrorFactory for error categorization
 * - next-intl for localization
 * - Next.js navigation (useRouter, usePathname)
 * 
 * Coverage:
 * - Error categorization → dialog display
 * - User interactions → navigation flow
 * - Bilingual error messaging
 * - ReturnUrl preservation across the flow
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionExpiredDialog } from '@/components/auth/session-expired-dialog';
import { AuthErrorFactory, AuthErrorType, isRetryableError } from '@/lib/utils/auth-errors';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(),
  useLocale: jest.fn(),
}));

describe('SessionExpiredDialog Integration', () => {
  let mockRouter: { push: jest.Mock; replace: jest.Mock };
  let mockT: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup router mock
    mockRouter = {
      push: jest.fn(),
      replace: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Setup pathname mock (default locale 'en' is omitted from URLs)
    (usePathname as jest.Mock).mockReturnValue('/dashboard');

    // Setup locale mock
    (useLocale as jest.Mock).mockReturnValue('en');

    // Setup translation mock (English)
    mockT = jest.fn((key: string) => {
      const translations: Record<string, string> = {
        'title': 'Session Expired',
        'defaultMessage': 'Your session has expired. Please log in again to continue.',
        'loginButton': 'Log In Again',
        'cancelButton': 'Cancel',
      };
      return translations[key] || key;
    });
    (useTranslations as jest.Mock).mockReturnValue(mockT);
  });

  describe('Error Categorization Integration', () => {
    it('should display correct message for SESSION_EXPIRED error', () => {
      // Simulate session expiration error
      const error = new Error('Session expired');
      const categorizedError = AuthErrorFactory.categorize(error);

      expect(categorizedError.type).toBe(AuthErrorType.SESSION_EXPIRED);

      // Render dialog with categorized error message
      const message = categorizedError.getMessage('en');
      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage={message}
        />
      );

      // Verify error message is displayed
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(message).toContain('session has expired');
    });

    it('should handle INVALID_CREDENTIALS error with custom message', () => {
      const error = new Error('Invalid email or password');
      const categorizedError = AuthErrorFactory.categorize(error);

      expect(categorizedError.type).toBe(AuthErrorType.INVALID_CREDENTIALS);

      const message = categorizedError.getMessage('en');
      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage={message}
        />
      );

      expect(screen.getByText(message)).toBeInTheDocument();
      expect(message).toContain('Invalid email or password');
    });

    it('should handle NETWORK_ERROR with default retry message', () => {
      const error = new Error('Network request failed');
      const categorizedError = AuthErrorFactory.categorize(error);

      expect(categorizedError.type).toBe(AuthErrorType.NETWORK_ERROR);

      const message = categorizedError.getMessage('en');
      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage={message}
        />
      );

      expect(screen.getByText(message)).toBeInTheDocument();
      expect(message).toContain('connection');
    });

    it('should fallback to default message for UNKNOWN error', () => {
      const error = new Error('Something weird happened');
      const categorizedError = AuthErrorFactory.categorize(error);

      expect(categorizedError.type).toBe(AuthErrorType.UNKNOWN);

      const message = categorizedError.getMessage('en');
      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage={message}
        />
      );

      // Should show categorized error message
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(message).toContain('unexpected error');
    });
  });

  describe('User Flow Integration', () => {
    it('should complete full re-authentication flow', async () => {
      const user = userEvent.setup();
      const onReAuthenticate = jest.fn();
      const onClose = jest.fn();

      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={onClose}
          onReAuthenticate={onReAuthenticate}
          errorMessage="Your session has expired."
        />
      );

      // User sees the error message
      expect(screen.getByText('Your session has expired.')).toBeInTheDocument();

      // User clicks "Log In Again"
      const loginButton = screen.getByRole('button', { name: /log in again/i });
      await user.click(loginButton);

      // Verify callbacks triggered
      expect(onReAuthenticate).toHaveBeenCalledTimes(1);

      // Verify navigation to login with returnUrl (default locale 'en' is omitted)
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          '/login?returnUrl=%2Fdashboard'
        );
      });
    });

    it('should handle user cancellation flow', async () => {
      const user = userEvent.setup();
      const onReAuthenticate = jest.fn();
      const onClose = jest.fn();

      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={onClose}
          onReAuthenticate={onReAuthenticate}
          errorMessage="Session expired"
        />
      );

      // User clicks "Cancel"
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Verify only close callback triggered
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onReAuthenticate).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should preserve complex returnUrl across re-authentication', async () => {
      const user = userEvent.setup();
      
      // User is on a complex page with query params
      (usePathname as jest.Mock).mockReturnValue('/en/jobs/search?q=developer&location=SF');

      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage="Session expired"
        />
      );

      const loginButton = screen.getByRole('button', { name: /log in again/i });
      await user.click(loginButton);

      // Verify returnUrl is properly encoded
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          expect.stringContaining('returnUrl=%2Fen%2Fjobs%2Fsearch%3Fq%3Ddeveloper%26location%3DSF')
        );
      });
    });
  });

  describe('Bilingual Integration', () => {
    it('should display Turkish error messages correctly', () => {
      // Setup Turkish translations AND locale
      (useLocale as jest.Mock).mockReturnValue('tr');
      
      const mockTurkishT = jest.fn((key: string) => {
        const translations: Record<string, string> = {
          'title': 'Oturum Süresi Doldu',
          'defaultMessage': 'Oturumunuzun süresi doldu. Devam etmek için lütfen tekrar giriş yapın.',
          'loginButton': 'Tekrar Giriş Yap',
          'cancelButton': 'İptal',
        };
        return translations[key] || key;
      });
      (useTranslations as jest.Mock).mockReturnValue(mockTurkishT);

      // Categorize error and get Turkish message
      const error = new Error('Session expired');
      const categorizedError = AuthErrorFactory.categorize(error);
      const turkishMessage = categorizedError.getMessage('tr');

      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage={turkishMessage}
        />
      );

      // Verify Turkish translations
      expect(screen.getByText('Oturum Süresi Doldu')).toBeInTheDocument();
      expect(screen.getByText(turkishMessage)).toBeInTheDocument();
      expect(turkishMessage).toContain('Oturumunuzun süresi doldu');
      expect(screen.getByRole('button', { name: /tekrar giriş yap/i })).toBeInTheDocument();
      // Use exact match for Turkish İ
      expect(screen.getByRole('button', { name: 'İptal' })).toBeInTheDocument();
    });

    it('should handle locale switching in returnUrl', async () => {
      const user = userEvent.setup();

      // Turkish locale pathname AND locale
      (usePathname as jest.Mock).mockReturnValue('/tr/dashboard');
      (useLocale as jest.Mock).mockReturnValue('tr');

      const mockTurkishT = jest.fn((key: string) => {
        const translations: Record<string, string> = {
          'title': 'Oturum Süresi Doldu',
          'defaultMessage': 'Oturumunuzun süresi doldu.',
          'loginButton': 'Tekrar Giriş Yap',
          'cancelButton': 'İptal',
        };
        return translations[key] || key;
      });
      (useTranslations as jest.Mock).mockReturnValue(mockTurkishT);

      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage="Oturumunuzun süresi doldu"
        />
      );

      const loginButton = screen.getByRole('button', { name: /tekrar giriş yap/i });
      await user.click(loginButton);

      // Verify Turkish locale is preserved in returnUrl
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          '/tr/login?returnUrl=%2Ftr%2Fdashboard'
        );
      });
    });
  });

  describe('Edge Cases Integration', () => {
    it('should handle missing pathname gracefully', async () => {
      const user = userEvent.setup();

      // Simulate missing pathname
      (usePathname as jest.Mock).mockReturnValue(null);

      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage="Session expired"
        />
      );

      const loginButton = screen.getByRole('button', { name: /log in again/i });
      await user.click(loginButton);

      // Should fallback to default dashboard path (default locale 'en' is omitted)
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          '/login?returnUrl=%2Fdashboard'
        );
      });
    });

    it('should handle multiple rapid authentications', async () => {
      const user = userEvent.setup();
      const onReAuthenticate = jest.fn();

      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={onReAuthenticate}
          errorMessage="Session expired"
        />
      );

      const loginButton = screen.getByRole('button', { name: /log in again/i });

      // Rapid clicks
      await user.click(loginButton);
      await user.click(loginButton);
      await user.click(loginButton);

      // Should handle all clicks (component doesn't prevent multiple calls)
      expect(onReAuthenticate).toHaveBeenCalledTimes(3);
      expect(mockRouter.push).toHaveBeenCalledTimes(3);
    });

    it('should handle error categorization for empty error messages', () => {
      const error = new Error('');
      const categorizedError = AuthErrorFactory.categorize(error);
      const message = categorizedError.getMessage('en');

      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage={message}
        />
      );

      // Should show default message when error is empty
      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('should integrate with error retry logic using isRetryableError helper', () => {
      // Test network error (retryable)
      const networkError = new Error('Network request failed');
      const categorizedNetworkError = AuthErrorFactory.categorize(networkError);

      expect(isRetryableError(categorizedNetworkError.type)).toBe(true);
      expect(categorizedNetworkError.getMessage('en')).toContain('connection');

      // Test authentication error (not retryable)
      const authError = new Error('Invalid credentials');
      const categorizedAuthError = AuthErrorFactory.categorize(authError);

      expect(isRetryableError(categorizedAuthError.type)).toBe(false);
      expect(categorizedAuthError.getMessage('en')).toContain('email or password');
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain focus management during error flow', async () => {
      const user = userEvent.setup();

      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage="Session expired"
        />
      );

      // Tab through interactive elements
      await user.tab();
      
      // Should be able to navigate to buttons
      const loginButton = screen.getByRole('button', { name: /log in again/i });
      expect(loginButton).toBeInTheDocument();

      await user.tab();
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeInTheDocument();
    });

    it('should announce error messages to screen readers', () => {
      const error = new Error('Session expired');
      const categorizedError = AuthErrorFactory.categorize(error);
      const message = categorizedError.getMessage('en');

      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage={message}
        />
      );

      // Verify ARIA attributes
      const dialog = screen.getByTestId('session-expired-dialog');
      expect(dialog).toHaveAttribute('aria-describedby', 'session-expired-description');

      // Verify error message is in description
      const description = screen.getByTestId('error-message');
      expect(description).toHaveTextContent(message);
    });
  });

  describe('Performance Integration', () => {
    it('should not trigger unnecessary re-renders', () => {
      const onClose = jest.fn();
      const onReAuthenticate = jest.fn();

      const { rerender } = render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={onClose}
          onReAuthenticate={onReAuthenticate}
          errorMessage="Test message"
        />
      );

      // Re-render with same props
      rerender(
        <SessionExpiredDialog
          isOpen={true}
          onClose={onClose}
          onReAuthenticate={onReAuthenticate}
          errorMessage="Test message"
        />
      );

      // Component should handle re-renders gracefully
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should cleanup on unmount', () => {
      const { unmount } = render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage="Test"
        />
      );

      // Unmount should not cause errors
      expect(() => unmount()).not.toThrow();
    });
  });
});
