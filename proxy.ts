import createIntlMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale } from './lib/i18n'

// Keep Proxy lightweight: i18n handling and simple redirects only.
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
})

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const localeMatch = pathname.match(/^\/(en|tr)/)
  const locale = localeMatch?.[1] || defaultLocale
  const pathnameWithoutLocale = pathname.replace(/^\/(en|tr)/, '') || '/'

  // Redirect root to localized dashboard
  if (pathnameWithoutLocale === '/') {
    const target = new URL(`/${locale}/dashboard`, request.url)
    return NextResponse.redirect(target)
  }

  // Defer auth/session to server components (Cache Components best practice)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return intlMiddleware(request as unknown as any)
}

export const config = {
  matcher: ['/((?!api|_next|static|.*\\..*).*)'],
}
