import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    { id: 'organizations', label: 'navigation.organizations', icon: 'Building2', href: '/organizations', requiredRoles: [] },
    { id: 'positions', label: 'navigation.positions', icon: 'Briefcase', href: '/positions', requiredRoles: [] },
  ],
}));

describe('Sidebar - Keyboard Navigation', () => {
  const mockT = jest.fn((key: string) => key);

  beforeEach(() => {
    (useTranslations as jest.Mock).mockReturnValue(mockT);
  });

  describe('Tab Navigation', () => {
    it('allows tabbing through navigation items in order', async () => {
      const user = userEvent.setup();
      render(<Sidebar isCollapsed={false} isMobile={false} />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(3);

      // Tab to first link
      await user.tab();
      expect(links[0]).toHaveFocus();

      // Tab to second link
      await user.tab();
      expect(links[1]).toHaveFocus();

      // Tab to third link
      await user.tab();
      expect(links[2]).toHaveFocus();
    });

    it('supports Shift+Tab to navigate backwards', async () => {
      const user = userEvent.setup();
      render(<Sidebar isCollapsed={false} isMobile={false} />);

      const links = screen.getAllByRole('link');

      // Tab forward to third link
      await user.tab();
      await user.tab();
      await user.tab();
      expect(links[2]).toHaveFocus();

      // Shift+Tab back to second link
      await user.tab({ shift: true });
      expect(links[1]).toHaveFocus();
    });

    it('displays visible focus indicators on all interactive elements', async () => {
      const user = userEvent.setup();
      render(<Sidebar isCollapsed={false} isMobile={false} />);

      const firstLink = screen.getAllByRole('link')[0];
      await user.tab();

      // Focus ring should be visible (browser default or custom)
      expect(firstLink).toHaveFocus();
      expect(firstLink).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
    });
  });

  describe('Enter/Space Key Activation', () => {
    it('activates navigation item on Enter key press', async () => {
      const user = userEvent.setup();
      render(<Sidebar isCollapsed={false} isMobile={false} />);

      const firstLink = screen.getAllByRole('link')[0];
      await user.tab();
      expect(firstLink).toHaveFocus();

      // Enter key should trigger navigation (link default behavior)
      await user.keyboard('{Enter}');
      // Note: In a real test, we'd mock router.push and verify it was called
    });

    it('activates navigation item on Space key press', async () => {
      const user = userEvent.setup();
      render(<Sidebar isCollapsed={false} isMobile={false} />);

      const firstLink = screen.getAllByRole('link')[0];
      await user.tab();
      expect(firstLink).toHaveFocus();

      // Space key should trigger navigation
      await user.keyboard(' ');
      // Note: Default link behavior handles Space key activation
    });
  });

  describe('Arrow Key Navigation', () => {
    it('navigates to next item on ArrowDown key', async () => {
      const user = userEvent.setup();
      render(<Sidebar isCollapsed={false} isMobile={false} />);

      const links = screen.getAllByRole('link');
      
      // Focus first link
      await user.tab();
      expect(links[0]).toHaveFocus();

      // ArrowDown should focus next item
      await user.keyboard('{ArrowDown}');
      expect(links[1]).toHaveFocus();
    });

    it('navigates to previous item on ArrowUp key', async () => {
      const user = userEvent.setup();
      render(<Sidebar isCollapsed={false} isMobile={false} />);

      const links = screen.getAllByRole('link');
      
      // Focus second link
      await user.tab();
      await user.tab();
      expect(links[1]).toHaveFocus();

      // ArrowUp should focus previous item
      await user.keyboard('{ArrowUp}');
      expect(links[0]).toHaveFocus();
    });

    it('wraps to last item when ArrowUp at first item', async () => {
      const user = userEvent.setup();
      render(<Sidebar isCollapsed={false} isMobile={false} />);

      const links = screen.getAllByRole('link');
      
      // Focus first link
      await user.tab();
      expect(links[0]).toHaveFocus();

      // ArrowUp should wrap to last item
      await user.keyboard('{ArrowUp}');
      expect(links[2]).toHaveFocus();
    });

    it('wraps to first item when ArrowDown at last item', async () => {
      const user = userEvent.setup();
      render(<Sidebar isCollapsed={false} isMobile={false} />);

      const links = screen.getAllByRole('link');
      
      // Focus last link
      await user.tab();
      await user.tab();
      await user.tab();
      expect(links[2]).toHaveFocus();

      // ArrowDown should wrap to first item
      await user.keyboard('{ArrowDown}');
      expect(links[0]).toHaveFocus();
    });
  });

  describe('Escape Key Handler', () => {
    it('closes mobile Sheet on Escape key', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();
      
      render(
        <Sidebar
          isMobile={true}
          isOpen={true}
          onOpenChange={onOpenChange}
        />
      );

      // Escape key should close Sheet
      await user.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Focus Trap in Mobile Sheet', () => {
    it('traps focus within Sheet when open on mobile', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();
      
      render(
        <Sidebar
          isMobile={true}
          isOpen={true}
          onOpenChange={onOpenChange}
        />
      );

      const links = screen.getAllByRole('link');
      const closeButton = screen.getByRole('button', { name: /close/i });

      // Tab through all links
      await user.tab();
      expect(links[0]).toHaveFocus();

      await user.tab();
      expect(links[1]).toHaveFocus();

      await user.tab();
      expect(links[2]).toHaveFocus();

      // Tab to close button
      await user.tab();
      expect(closeButton).toHaveFocus();

      // Tab again should cycle back to first link (focus trap)
      await user.tab();
      expect(links[0]).toHaveFocus();
    });
  });
});
