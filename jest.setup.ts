import '@testing-library/jest-dom'

// Set required environment variables for tests
process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN = 'test'
process.env.NEXT_PUBLIC_NHOST_REGION = 'us-east-1'
process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'test-site-key'

// Mock next-intl to avoid ESM issues
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
  useFormatter: () => ({
    dateTime: (date: Date) => date.toISOString(),
    number: (num: number) => num.toString(),
  }),
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
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
