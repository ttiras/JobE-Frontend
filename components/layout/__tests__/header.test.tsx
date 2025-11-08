import { render, screen } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import Header from '../header';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(),
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/dashboard', // Default locale omitted - pathname without locale
}));

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock useAuth
jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { displayName: 'Test User' },
  }),
}));

// Mock useTheme
jest.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: jest.fn(),
    theme: 'light',
  }),
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock OrganizationSwitcher to avoid needing OrganizationProvider
jest.mock('@/components/layout/organization-switcher', () => ({
  OrganizationSwitcher: () => null,
}));

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
    // Header should use '/dashboard' for default locale (en), not '/en/dashboard'
    expect(logoLink).toHaveAttribute('href', '/dashboard');
  });

  it('applies correct styling classes', () => {
    render(<Header />);
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('border-b');
    expect(header).toHaveClass('bg-background/95');
    expect(header).toHaveClass('supports-[backdrop-filter]:bg-background/60');
  });

  it('has proper height for layout', () => {
    render(<Header />);
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('h-14');
  });

  it('logo text is visible', () => {
    render(<Header />);
    const logoText = screen.getByText('JobE');
    expect(logoText).toBeInTheDocument();
  });
});
