/**
 * SessionExpiredDialog Component Unit Tests
 * 
 * Tests:
 * - Component rendering
 * - User interactions (buttons)
 * - ReturnUrl preservation
 * - Localization (EN/TR)
 * - Accessibility
 * 
 * @see components/auth/session-expired-dialog.tsx
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { SessionExpiredDialog } from '../session-expired-dialog';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useLocale: jest.fn(),
  useTranslations: jest.fn(),
}));

describe('SessionExpiredDialog', () => {
  let mockRouter: {
    push: jest.Mock;
  };

  beforeEach(() => {
    mockRouter = {
      push: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePathname as jest.Mock).mockReturnValue('/en/dashboard/profile');
    (useLocale as jest.Mock).mockReturnValue('en');

    // Mock translations
    const mockT = (key: string) => {
      const translations: Record<string, string> = {
        'title': 'Session Expired',
        'defaultMessage': 'Your session has expired. Please log in again to continue.',
        'loginButton': 'Log In Again',
        'cancelButton': 'Cancel',
      };
      return translations[key] || key;
    };
    (useTranslations as jest.Mock).mockReturnValue(mockT);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage="Your session has expired"
        />
      );

      expect(screen.getByTestId('session-expired-dialog')).toBeInTheDocument();
      expect(screen.getByText('Session Expired')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(
        <SessionExpiredDialog
          isOpen={false}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage="Your session has expired"
        />
      );

      expect(screen.queryByTestId('session-expired-dialog')).not.toBeInTheDocument();
    });

    it('should display error message', () => {
      const errorMessage = 'Your session has expired. Please log in again.';
      
      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage={errorMessage}
        />
      );

      expect(screen.getByTestId('error-message')).toHaveTextContent(errorMessage);
    });

    it('should display default message when errorMessage is empty', () => {
      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage=""
        />
      );

      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Your session has expired. Please log in again to continue.'
      );
    });

    it('should display action buttons', () => {
      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage="Test message"
        />
      );

      expect(screen.getByTestId('reauth-button')).toBeInTheDocument();
      expect(screen.getByTestId('close-button')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onReAuthenticate when login button is clicked', async () => {
      const user = userEvent.setup();
      const handleReAuth = jest.fn();

      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={handleReAuth}
          errorMessage="Test message"
        />
      );

      const loginButton = screen.getByTestId('reauth-button');
      await user.click(loginButton);

      expect(handleReAuth).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = jest.fn();

      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={handleClose}
          onReAuthenticate={jest.fn()}
          errorMessage="Test message"
        />
      );

      const cancelButton = screen.getByTestId('close-button');
      await user.click(cancelButton);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should navigate to login with returnUrl when re-authenticating', async () => {
      const user = userEvent.setup();
      (usePathname as jest.Mock).mockReturnValue('/en/dashboard/settings');

      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage="Test message"
        />
      );

      const loginButton = screen.getByTestId('reauth-button');
      await user.click(loginButton);

      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.stringContaining('/en/login?returnUrl=')
      );
      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('/en/dashboard/settings'))
      );
    });

    it('should handle missing pathname gracefully', async () => {
      const user = userEvent.setup();
      (usePathname as jest.Mock).mockReturnValue(null);

      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage="Test message"
        />
      );

      const loginButton = screen.getByTestId('reauth-button');
      await user.click(loginButton);

      // Should use default dashboard path as fallback
      expect(mockRouter.push).toHaveBeenCalledWith(
        '/en/login?returnUrl=%2Fen%2Fdashboard'
      );
    });
  });

  describe('Localization', () => {
    it('should use English locale', () => {
      (useLocale as jest.Mock).mockReturnValue('en');

      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage="Your session has expired"
        />
      );

      expect(screen.getByText('Session Expired')).toBeInTheDocument();
      expect(screen.getByText('Log In Again')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should use Turkish locale', () => {
      (useLocale as jest.Mock).mockReturnValue('tr');

      const mockT = (key: string) => {
        const translations: Record<string, string> = {
          'title': 'Oturum Süresi Doldu',
          'defaultMessage': 'Oturumunuzun süresi doldu. Devam etmek için lütfen tekrar giriş yapın.',
          'loginButton': 'Tekrar Giriş Yap',
          'cancelButton': 'İptal',
        };
        return translations[key] || key;
      };
      (useTranslations as jest.Mock).mockReturnValue(mockT);

      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage="Oturumunuzun süresi doldu"
        />
      );

      expect(screen.getByText('Oturum Süresi Doldu')).toBeInTheDocument();
      expect(screen.getByText('Tekrar Giriş Yap')).toBeInTheDocument();
      expect(screen.getByText('İptal')).toBeInTheDocument();
    });

    it('should construct correct returnUrl for different locales', async () => {
      const user = userEvent.setup();
      (useLocale as jest.Mock).mockReturnValue('tr');
      (usePathname as jest.Mock).mockReturnValue('/tr/dashboard/profile');

      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage="Test message"
        />
      );

      const loginButton = screen.getByTestId('reauth-button');
      await user.click(loginButton);

      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.stringContaining('/tr/login?returnUrl=')
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage="Test message"
        />
      );

      const dialog = screen.getByTestId('session-expired-dialog');
      expect(dialog).toHaveAttribute('aria-describedby', 'session-expired-description');

      const description = screen.getByTestId('error-message');
      expect(description).toHaveAttribute('id', 'session-expired-description');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const handleReAuth = jest.fn();

      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={handleReAuth}
          errorMessage="Test message"
        />
      );

      const loginButton = screen.getByTestId('reauth-button');
      loginButton.focus();

      await user.keyboard('{Enter}');

      expect(handleReAuth).toHaveBeenCalledTimes(1);
    });

    it('should have visible alert icon', () => {
      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage="Test message"
        />
      );

      // Alert icon should be present (aria-hidden for screen readers)
      const icon = screen.getByTestId('session-expired-dialog').querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid button clicks', async () => {
      const user = userEvent.setup();
      const handleReAuth = jest.fn();

      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={handleReAuth}
          errorMessage="Test message"
        />
      );

      const loginButton = screen.getByTestId('reauth-button');

      // Rapid clicks
      await user.click(loginButton);
      await user.click(loginButton);
      await user.click(loginButton);

      // Component should handle multiple calls
      expect(handleReAuth).toHaveBeenCalledTimes(3);
    });

    it('should handle very long error messages', () => {
      const longMessage = 'Your session has expired. '.repeat(50);

      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage={longMessage}
        />
      );

      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      // Just check that it contains the message, not exact match due to whitespace differences
      expect(screen.getByTestId('error-message').textContent).toContain('Your session has expired.');
    });

    it('should handle special characters in error message', () => {
      const specialMessage = 'Error: <script>alert("xss")</script>';

      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage={specialMessage}
        />
      );

      // React automatically escapes HTML, so script tags should be displayed as text
      expect(screen.getByTestId('error-message')).toHaveTextContent(specialMessage);
    });

    it('should preserve returnUrl with special characters', async () => {
      const user = userEvent.setup();
      (usePathname as jest.Mock).mockReturnValue('/en/dashboard/search?q=test&filter=active');

      render(
        <SessionExpiredDialog
          isOpen={true}
          onClose={jest.fn()}
          onReAuthenticate={jest.fn()}
          errorMessage="Test message"
        />
      );

      const loginButton = screen.getByTestId('reauth-button');
      await user.click(loginButton);

      // ReturnUrl should be properly encoded
      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('/en/dashboard/search?q=test&filter=active'))
      );
    });
  });
});
