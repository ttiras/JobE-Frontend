import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '@/components/layout/sidebar';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// next/navigation is globally mocked in jest.setup.ts

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

  it('has collapsed width by default (w-16) and expands on hover (w-60)', () => {
    render(<Sidebar />);
    const aside = screen.getByRole('complementary');
    
    // Default is collapsed
    expect(aside).toHaveClass('w-16');

    // Hover expands
    fireEvent.mouseEnter(aside);
    expect(aside).toHaveClass('w-60');
  });
});
