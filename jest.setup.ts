import '@testing-library/jest-dom'
import enMessages from './messages/en.json'

// Set required environment variables for tests
process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN = 'test'
process.env.NEXT_PUBLIC_NHOST_REGION = 'us-east-1'
process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'test-site-key'

// Helpers to read messages with dot-notation (e.g., auth.register.title)
function getByPath(obj: any, path: string): any {
  return path.split('.').reduce((acc: any, part: string) => (acc ? acc[part] : undefined), obj)
}

function formatMessage(template: string, values?: Record<string, any>): string {
  if (!values) return template
  return Object.keys(values).reduce(
    (msg, k) => msg.replace(new RegExp(`\\{${k}\\}`, 'g'), String(values[k])),
    template
  )
}

// Mock next-intl to return real English strings from messages/en.json during tests
jest.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string, values?: Record<string, any>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key
    const msg = getByPath(enMessages as any, fullKey)
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
    return (key: string, values?: Record<string, any>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key
      const msg = getByPath(enMessages as any, fullKey)
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
