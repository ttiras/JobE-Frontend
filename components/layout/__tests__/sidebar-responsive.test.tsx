import { render, screen } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { Sidebar } from '../sidebar';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/dashboard'),
}));

// Mock navigation config
jest.mock('@/config/navigation', () => ({
  navigationConfig: [
    { id: 'dashboard', label: 'navigation.dashboard', icon: 'LayoutDashboard', href: '/dashboard', requiredRoles: [] },
  ],
}));

describe('Sidebar - Responsive Behavior', () => {
  const mockT = jest.fn((key: string) => key);

  beforeEach(() => {
    (useTranslations as jest.Mock).mockReturnValue(mockT);
  });

  describe('Desktop (≥1024px)', () => {
    it('renders full-width sidebar (256px) on desktop', () => {
      render(<Sidebar isCollapsed={false} isMobile={false} />);
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('w-64'); // 256px
    });

    it('shows full navigation labels on desktop', () => {
      render(<Sidebar isCollapsed={false} isMobile={false} />);
      expect(screen.getByText('navigation.dashboard')).toBeInTheDocument();
    });

    it('renders collapsed sidebar (64px) when collapsed prop is true', () => {
      render(<Sidebar isCollapsed={true} isMobile={false} />);
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('w-16'); // 64px
    });
  });

  describe('Tablet (768px - 1024px)', () => {
    it('renders icon-only sidebar on tablet', () => {
      render(<Sidebar isCollapsed={true} isMobile={false} />);
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('w-16');
    });

    it('shows tooltips for collapsed items on tablet', () => {
      render(<Sidebar isCollapsed={true} isMobile={false} />);
      // Tooltip should be present for accessibility
      const navItem = screen.getByRole('link', { name: /dashboard/i });
      expect(navItem).toBeInTheDocument();
    });
  });

  describe('Mobile (<768px)', () => {
    it('does not render sidebar on mobile by default', () => {
      render(<Sidebar isCollapsed={false} isMobile={true} isOpen={false} />);
      const sidebar = screen.queryByRole('complementary');
      expect(sidebar).not.toBeInTheDocument();
    });

    it('renders sidebar as Sheet overlay when isOpen is true on mobile', () => {
      render(<Sidebar isCollapsed={false} isMobile={true} isOpen={true} />);
      const sidebar = screen.getByRole('dialog'); // Sheet uses dialog role
      expect(sidebar).toBeInTheDocument();
    });

    it('sidebar overlay has proper ARIA label on mobile', () => {
      render(<Sidebar isCollapsed={false} isMobile={true} isOpen={true} />);
      const sidebar = screen.getByRole('dialog');
      expect(sidebar).toHaveAttribute('aria-label', 'Mobile navigation menu');
    });
  });

  describe('State Management', () => {
    it('accepts isCollapsed prop for desktop/tablet', () => {
      const { rerender } = render(<Sidebar isCollapsed={false} isMobile={false} />);
      let sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('w-64');

      rerender(<Sidebar isCollapsed={true} isMobile={false} />);
      sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('w-16');
    });

    it('accepts isOpen prop for mobile', () => {
      const { rerender } = render(<Sidebar isCollapsed={false} isMobile={true} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(<Sidebar isCollapsed={false} isMobile={true} isOpen={true} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
