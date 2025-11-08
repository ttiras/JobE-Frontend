import '@testing-library/jest-dom'
import enMessages from './messages/en.json'

// Set required environment variables for tests
process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN = 'test'
process.env.NEXT_PUBLIC_NHOST_REGION = 'us-east-1'
process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'test-site-key'

// Polyfill ResizeObserver for jsdom (used by Radix UI primitives)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof (global as any).ResizeObserver === 'undefined') {
  class ResizeObserver {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_callback: ResizeObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(global as any).ResizeObserver = ResizeObserver
}

// Ensure a clean slate for localStorage-backed utilities (e.g., rate limiting)
beforeEach(() => {
  try {
    localStorage.clear()
  } catch {
    // ignore if not available
  }
})

// Helpers to read messages with dot-notation (e.g., auth.register.title)
type Messages = Record<string, unknown>
function getByPath(obj: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((acc, part) => {
      if (acc && typeof acc === 'object' && acc !== null) {
        const rec = acc as Record<string, unknown>
        return part in rec ? rec[part] : undefined
      }
      return undefined
    }, obj)
}

function formatMessage(template: string, values?: Record<string, unknown>): string {
  if (!values) return template
  return Object.keys(values).reduce(
    (msg, k) => msg.replace(new RegExp(`\\{${k}\\}`, 'g'), String(values[k])),
    template
  )
}

// Mock next-intl to return real English strings from messages/en.json during tests
jest.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string, values?: Record<string, unknown>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key
    const msg = getByPath(enMessages as Messages, fullKey)
    if (typeof msg === 'string') return formatMessage(msg, values)
    return fullKey // Fallback to key path when missing
  },
  useLocale: () => 'en',
  useFormatter: () => ({
    dateTime: (date: Date) => date.toISOString(),
    number: (num: number) => num.toString(),
  }),
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Also mock next-intl/server getTranslations for any server-side calls in tests
jest.mock('next-intl/server', () => ({
  getTranslations: async ({ namespace }: { locale?: string; namespace?: string }) => {
    return (key: string, values?: Record<string, unknown>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key
      const msg = getByPath(enMessages as Messages, fullKey)
      if (typeof msg === 'string') return formatMessage(msg, values)
      return fullKey
    }
  },
  getMessages: async () => enMessages,
}))

// Mock Nhost client
jest.mock('@nhost/nhost-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInEmailPassword: jest.fn(),
      signUpEmailPassword: jest.fn(),
      signOut: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
      sendVerificationEmail: jest.fn(),
      changeUserEmail: jest.fn(),
      changeUserPassword: jest.fn(),
    },
    graphql: {
      request: jest.fn(),
    },
  })),
}))

// Mock next/navigation globally for tests to avoid App Router invariant errors
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/en/dashboard',
  useParams: () => ({ locale: 'en' }),
  useSearchParams: () => new URLSearchParams(),
}))

// Provide a default mock for useAuth to satisfy components that require AuthProvider
jest.mock('@/lib/contexts/auth-context', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    isLoading: false,
    isAuthenticated: false,
    error: null,
    isRefreshing: false,
    checkSession: jest.fn(() => undefined),
    refreshSession: jest.fn(async () => true),
    hasRole: jest.fn(() => false),
    hasAnyRole: jest.fn(() => false),
    hasAllRoles: jest.fn(() => false),
  }),
}))

// And mock the higher-level hook wrapper to keep Header and others happy
jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    isLoading: false,
    isAuthenticated: false,
    error: null,
    isRefreshing: false,
    refreshSession: jest.fn(async () => true),
    hasRole: jest.fn(() => false),
    hasAnyRole: jest.fn(() => false),
    hasAllRoles: jest.fn(() => false),
    // auth operations
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    resetPassword: jest.fn(),
    sendVerificationEmail: jest.fn(),
    changeEmail: jest.fn(),
    changePassword: jest.fn(),
  }),
}))
