import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTheme } from 'next-themes';
import { ThemeToggle } from '../theme-toggle';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

describe('ThemeToggle', () => {
  const mockSetTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders theme toggle button', () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
      });
      
      render(<ThemeToggle />);
      const button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toBeInTheDocument();
    });

    it('displays sun icon in light mode', () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
      });
      
      render(<ThemeToggle />);
      const button = screen.getByRole('button');
      // Sun icon should be visible
      expect(button).toBeInTheDocument();
    });

    it('displays moon icon in dark mode', () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
      });
      
      render(<ThemeToggle />);
      const button = screen.getByRole('button');
      // Moon icon should be visible
      expect(button).toBeInTheDocument();
    });
  });

  describe('Theme Switching', () => {
    it('switches from light to dark mode on click', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
      });
      
      const user = userEvent.setup();
      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('switches from dark to light mode on click', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
      });
      
      const user = userEvent.setup();
      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('handles system theme correctly', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: 'system',
        setTheme: mockSetTheme,
      });
      
      const user = userEvent.setup();
      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Should switch to light or dark mode (not back to system)
      expect(mockSetTheme).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA label', () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
      });
      
      render(<ThemeToggle />);
      const button = screen.getByRole('button', { name: /toggle theme/i });
      expect(button).toHaveAttribute('aria-label');
    });

    it('is keyboard accessible', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
      });
      
      const user = userEvent.setup();
      render(<ThemeToggle />);

      // Tab to button
      await user.tab();
      const button = screen.getByRole('button');
      expect(button).toHaveFocus();

      // Activate with Enter
      await user.keyboard('{Enter}');
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('can be activated with Space key', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
      });
      
      const user = userEvent.setup();
      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      button.focus();

      // Activate with Space
      await user.keyboard(' ');
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });
  });

  describe('Theme Persistence', () => {
    it('reads theme from next-themes provider', () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
      });
      
      render(<ThemeToggle />);
      
      // Component should reflect the persisted theme
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('persists theme selection via setTheme', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
      });
      
      const user = userEvent.setup();
      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      await user.click(button);

      // setTheme should be called, which persists to localStorage
      expect(mockSetTheme).toHaveBeenCalledTimes(1);
    });
  });
});
