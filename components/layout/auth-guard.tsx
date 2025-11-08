'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/contexts/auth-context'

interface AuthGuardProps {
  children: React.ReactNode
}

/**
 * Client-side auth guard to protect app routes.
 * If user is not authenticated, redirects to the localized login page
 * and preserves the intended destination in `redirect` query param.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('common')

  useEffect(() => {
    if (isLoading) return
    if (isAuthenticated) return

    // Derive locale from pathname prefix (e.g., /tr/...)
    // Note: default locale ('en') is omitted from URLs
    const match = pathname?.match(/^\/(tr)(.*)$/)
    const locale = match?.[1] || 'en'
    const withoutLocale = match?.[2] || pathname || '/'

    // Omit locale prefix for default locale
    const loginPath = locale === 'en' ? '/login' : `/${locale}/login`
    const loginUrl = `${loginPath}?redirect=${encodeURIComponent(withoutLocale)}`
    router.replace(loginUrl)
  }, [isAuthenticated, isLoading, pathname, router])

  // While checking or redirecting, show a minimal fallback to avoid a blank screen
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        {t('redirectingToSignIn')}
      </div>
    )
  }

  return <>{children}</>
}
