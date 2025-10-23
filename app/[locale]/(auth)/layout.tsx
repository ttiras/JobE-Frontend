import { ReactNode } from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
// import { LanguageSwitcher } from '@/components/layout/language-switcher'

interface AuthLayoutProps {
  children: ReactNode
  params: Promise<{ locale: string }>
}

/**
 * Auth Layout
 * 
 * Centered layout for authentication pages (login, register, reset password, verify email)
 * Features:
 * - Centered card design
 * - Logo/branding at top
 * - Language switcher in header (temporarily removed; will move to Settings)
 * - Footer with links
 */
export default async function AuthLayout({ children, params }: AuthLayoutProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'common' })
  const safe = <T,>(fn: () => T, fallback: T): T => {
    try { return fn() } catch { return fallback }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header with language switcher */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              J
            </div>
            <span className="text-xl font-bold">JobE</span>
          </Link>
          {/* Language switcher removed; will be added in Settings later */}
        </div>
      </header>

      {/* Main content - centered */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container px-4">
          <div className="flex flex-col items-center justify-center space-y-4 text-sm text-muted-foreground">
            <div className="flex space-x-4">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                {safe(() => t('privacy'), 'Privacy')}
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                {safe(() => t('terms'), 'Terms')}
              </Link>
              <Link href="/help" className="hover:text-foreground transition-colors">
                {safe(() => t('help'), 'Help')}
              </Link>
            </div>
            <p>&copy; {new Date().getFullYear()} JobE. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
