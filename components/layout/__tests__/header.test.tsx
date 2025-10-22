import { render, screen } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import Header from '../header';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('Header', () => {
  const mockT = jest.fn((key: string) => key);

  beforeEach(() => {
    (useTranslations as jest.Mock).mockReturnValue(mockT);
  });

  it('renders header with navigation role', () => {
    render(<Header />);
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });

  it('renders logo with link to dashboard home', () => {
    render(<Header />);
    const logoLink = screen.getByRole('link', { name: /JobE/i });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/dashboard');
  });

  it('applies correct styling classes', () => {
    render(<Header />);
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('border-b');
    expect(header).toHaveClass('bg-background');
  });

  it('has proper height for layout', () => {
    render(<Header />);
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('h-16');
  });

  it('logo text is visible', () => {
    render(<Header />);
    const logoText = screen.getByText('JobE');
    expect(logoText).toBeInTheDocument();
  });
});
