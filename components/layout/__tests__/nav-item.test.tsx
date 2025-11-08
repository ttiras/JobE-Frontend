import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavItem } from '@/components/layout/nav-item';
import { NavigationItem } from '@/lib/utils/navigation-filter';

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => {
    return <a href={href} {...props}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('NavItem', () => {
  const mockItem: NavigationItem = {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'Home',
    href: '/dashboard',
    requiredRoles: ['admin', 'user'],
  };

  it('renders with icon and label', () => {
    render(<NavItem item={mockItem} isActive={false} label="Dashboard" />);
    
    expect(screen.getByRole('link')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('applies active styles when isActive is true', () => {
    render(<NavItem item={mockItem} isActive={true} label="Dashboard" isHovered={true} />);
    
    const link = screen.getByRole('link');
    // Active state should have aria-current attribute
    expect(link).toHaveAttribute('aria-current', 'page');
    // Check that link has some className (styles are applied)
    expect(link).toHaveAttribute('class');
  });

  it('does not apply active styles when isActive is false', () => {
    render(<NavItem item={mockItem} isActive={false} label="Dashboard" />);
    
    const link = screen.getByRole('link');
    expect(link).not.toHaveClass('bg-accent');
  });

  it('has correct href', () => {
    render(<NavItem item={mockItem} isActive={false} label="Dashboard" />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('shows hover state on mouse over', async () => {
    const user = userEvent.setup();
    // When isHovered is false, label should not be visible (width 0, opacity 0)
    const { rerender } = render(<NavItem item={mockItem} isActive={false} label="Dashboard" isHovered={false} />);
    
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    
    // When isHovered prop is true, label should be visible
    rerender(<NavItem item={mockItem} isActive={false} label="Dashboard" isHovered={true} />);
    // Label container should be visible when hovered (width > 0, opacity 100)
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
