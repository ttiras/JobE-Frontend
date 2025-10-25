import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { LanguageSwitcher } from '../language-switcher';

// Mock next-intl
jest.mock('next-intl', () => ({
  useLocale: jest.fn(),
  useTranslations: jest.fn(() => (key: string) => key),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

describe('LanguageSwitcher', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
  });

  describe('Rendering', () => {
    it('renders language switcher button', () => {
      (useLocale as jest.Mock).mockReturnValue('en');
      render(<LanguageSwitcher />);
      
      const button = screen.getByRole('button', { name: /language/i });
      expect(button).toBeInTheDocument();
    });

    it('displays current locale with flag', () => {
      (useLocale as jest.Mock).mockReturnValue('en');
      render(<LanguageSwitcher />);
      
  expect(screen.getAllByText(/🇬🇧/).length).toBeGreaterThan(0);
    });

    it('displays Turkish flag when locale is Turkish', () => {
      (useLocale as jest.Mock).mockReturnValue('tr');
      render(<LanguageSwitcher />);
      
  expect(screen.getAllByText(/🇹🇷/).length).toBeGreaterThan(0);
    });
  });

  describe('Language Options', () => {
    it('shows both English and Turkish options when opened', async () => {
      (useLocale as jest.Mock).mockReturnValue('en');
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button', { name: /language/i });
      await user.click(button);

  expect(screen.getByRole('menuitem', { name: /English/i })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: /Türkçe/i })).toBeInTheDocument();
    });

    it('displays flag emojis for both languages', async () => {
      (useLocale as jest.Mock).mockReturnValue('en');
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button', { name: /language/i });
      await user.click(button);

  const englishOption = screen.getByRole('menuitem', { name: /English/i });
  const turkishOption = screen.getByRole('menuitem', { name: /Türkçe/i });
      
      expect(englishOption.textContent).toContain('🇬🇧');
      expect(turkishOption.textContent).toContain('🇹🇷');
    });
  });

  describe('Language Switching', () => {
    it('switches from English to Turkish on click', async () => {
      (useLocale as jest.Mock).mockReturnValue('en');
      (usePathname as jest.Mock).mockReturnValue('/dashboard');
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button', { name: /language/i });
      await user.click(button);

  const turkishOption = screen.getByRole('menuitem', { name: /Türkçe/i });
      await user.click(turkishOption);

      // Should navigate to /tr/dashboard
      expect(mockReplace).toHaveBeenCalledWith('/tr/dashboard');
    });

    it('switches from Turkish to English on click', async () => {
      (useLocale as jest.Mock).mockReturnValue('tr');
      (usePathname as jest.Mock).mockReturnValue('/tr/dashboard');
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button', { name: /language/i });
      await user.click(button);

  const englishOption = screen.getByRole('menuitem', { name: /English/i });
      await user.click(englishOption);

      // Should navigate to /dashboard (no locale prefix for English)
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });

    it('preserves current page path when switching language', async () => {
      (useLocale as jest.Mock).mockReturnValue('en');
      (usePathname as jest.Mock).mockReturnValue('/organizations');
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button', { name: /language/i });
      await user.click(button);

  const turkishOption = screen.getByRole('menuitem', { name: /Türkçe/i });
      await user.click(turkishOption);

      // Should preserve path: /organizations → /tr/organizations
      expect(mockReplace).toHaveBeenCalledWith('/tr/organizations');
    });

    it('handles nested paths correctly', async () => {
      (useLocale as jest.Mock).mockReturnValue('tr');
      (usePathname as jest.Mock).mockReturnValue('/tr/organizations/123');
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button', { name: /language/i });
      await user.click(button);

  const englishOption = screen.getByRole('menuitem', { name: /English/i });
      await user.click(englishOption);

      // Should preserve nested path: /tr/organizations/123 → /organizations/123
      expect(mockReplace).toHaveBeenCalledWith('/organizations/123');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA label', () => {
      (useLocale as jest.Mock).mockReturnValue('en');
      render(<LanguageSwitcher />);
      
      const button = screen.getByRole('button', { name: /language/i });
      expect(button).toHaveAttribute('aria-label');
    });

    it('is keyboard accessible', async () => {
      (useLocale as jest.Mock).mockReturnValue('en');
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      // Tab to button
      await user.tab();
      const button = screen.getByRole('button', { name: /language/i });
      expect(button).toHaveFocus();

      // Open with Enter
  await user.keyboard('{Enter}');
  expect(screen.getByRole('menuitem', { name: /English/i })).toBeInTheDocument();
    });
  });
});
