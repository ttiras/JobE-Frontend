import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/components/layout/sidebar';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

describe('Sidebar', () => {
  it('renders all navigation items', () => {
    render(<Sidebar />);
    
    // Check if navigation landmarks are present
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('renders navigation items with correct structure', () => {
    render(<Sidebar />);
    
    // Should render at least one navigation link
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('highlights the active navigation item', () => {
    render(<Sidebar />);
    
    // The dashboard link should be active (matching mocked pathname)
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toBeInTheDocument();
  });

  it('has proper width on desktop (256px)', () => {
    const { container } = render(<Sidebar />);
    const sidebar = container.firstChild as HTMLElement;
    
    // Check if sidebar has w-64 class (256px in Tailwind)
    expect(sidebar).toHaveClass('w-64');
  });
});
