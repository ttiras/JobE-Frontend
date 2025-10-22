import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavItem } from '@/components/layout/nav-item';
import { NavigationItem } from '@/lib/utils/navigation-filter';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('NavItem', () => {
  const mockItem: NavigationItem = {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'Home',
    href: '/dashboard',
    requiredRoles: ['Admin', 'HR Manager', 'Viewer'],
  };

  it('renders with icon and label', () => {
    render(<NavItem item={mockItem} isActive={false} label="Dashboard" />);
    
    expect(screen.getByRole('link')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('applies active styles when isActive is true', () => {
    render(<NavItem item={mockItem} isActive={true} label="Dashboard" />);
    
    const link = screen.getByRole('link');
    // Active state should have specific styling
    expect(link).toHaveClass('bg-accent');
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
    render(<NavItem item={mockItem} isActive={false} label="Dashboard" />);
    
    const link = screen.getByRole('link');
    await user.hover(link);
    
    // Link should have hover class
    expect(link).toHaveClass('hover:bg-accent');
  });
});
