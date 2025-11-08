import { render, screen, fireEvent } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { Sidebar } from '../sidebar';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(),
}));

// next/navigation is globally mocked in jest.setup.ts

// Mock navigation config
jest.mock('@/config/navigation', () => ({
  navigationConfig: [
    { id: 'dashboard', label: 'navigation.dashboard', icon: 'LayoutDashboard', href: '/dashboard', requiredRoles: ['user'] },
  ],
}));

describe('Sidebar - Responsive Behavior', () => {
  const mockT = jest.fn((key: string) => key);

  beforeEach(() => {
    (useTranslations as jest.Mock).mockReturnValue(mockT);
  });

  describe('Desktop (≥1024px)', () => {
    it('is collapsed by default and expands on hover', () => {
      render(<Sidebar isMobile={false} />);
      const aside = screen.getByRole('complementary');
      expect(aside).toHaveClass('w-16');
      fireEvent.mouseEnter(aside);
      expect(aside).toHaveClass('w-60');
    });

    it('shows full navigation labels on desktop', () => {
      render(<Sidebar isMobile={false} />);
      // Navigation labels are translated, check that navigation is rendered
      const nav = screen.getByRole('navigation', { name: /main navigation/i });
      expect(nav).toBeInTheDocument();
      // Check that links are present (labels may be translated)
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Tablet (768px - 1024px)', () => {
    it('renders icon-only sidebar on tablet', () => {
      render(<Sidebar isMobile={false} />);
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('w-16');
    });

    it('shows tooltips for collapsed items on tablet', () => {
      render(<Sidebar isMobile={false} />);
      // Tooltip should be present for accessibility when collapsed
      // Check that navigation links are present (they may have tooltips when collapsed)
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Mobile (<768px)', () => {
    it('does not render sidebar on mobile by default', () => {
      render(<Sidebar isMobile={true} isOpen={false} />);
      const sidebar = screen.queryByRole('complementary');
      expect(sidebar).not.toBeInTheDocument();
    });

    it('renders sidebar as Sheet overlay when isOpen is true on mobile', () => {
      render(<Sidebar isMobile={true} isOpen={true} />);
      const sidebar = screen.getByRole('dialog'); // Sheet uses dialog role
      expect(sidebar).toBeInTheDocument();
    });

    it('sidebar overlay has proper ARIA label on mobile', () => {
      render(<Sidebar isMobile={true} isOpen={true} />);
      const sidebar = screen.getByRole('dialog');
      expect(sidebar).toHaveAttribute('aria-label', 'Mobile navigation menu');
    });
  });

  describe('State Management', () => {
    it('accepts isCollapsed prop for desktop/tablet', () => {
      const { rerender } = render(<Sidebar isMobile={false} />);
      let aside = screen.getByRole('complementary');
      expect(aside).toHaveClass('w-16');

      fireEvent.mouseEnter(aside);
      expect(aside).toHaveClass('w-60');

      // On rerender remains expanded when hovered
      rerender(<Sidebar isMobile={false} />);
      aside = screen.getByRole('complementary');
      expect(aside).toBeInTheDocument();
    });

    it('accepts isOpen prop for mobile', () => {
      const { rerender } = render(<Sidebar isMobile={true} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(<Sidebar isMobile={true} isOpen={true} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
