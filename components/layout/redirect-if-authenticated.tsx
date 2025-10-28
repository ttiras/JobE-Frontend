'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'

/**
 * Redirects authenticated users away from auth pages (login/register/etc.).
 *
 * Honors returnUrl/redirect query params when present, and normalizes
 * locale prefixes so we don't end up on the wrong locale.
 */
export default function RedirectIfAuthenticated() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (isLoading || !isAuthenticated) return

    const locale = pathname?.match(/^\/(en|tr)\b/)?.[1] || 'en'

    // Prefer explicit returnUrl or legacy redirect param
    const raw = searchParams.get('returnUrl') || searchParams.get('redirect')

    // Try to decode if the value is URL-encoded
    let candidate = raw ?? ''
    if (candidate) {
      try {
        // Only decode if it looks encoded to avoid double-decoding
        if (/%[0-9A-Fa-f]{2}/.test(candidate)) {
          candidate = decodeURIComponent(candidate)
        }
      } catch {}
    }

    let target: string
    if (candidate && candidate.startsWith('/')) {
      target = /^\/(en|tr)\b/.test(candidate) ? candidate : `/${locale}${candidate}`
    } else {
      target = `/${locale}/dashboard`
    }

    // Avoid redundant navigation if we're already on the target
    if (pathname !== target) {
      router.replace(target)
    }
  }, [isAuthenticated, isLoading, pathname, router, searchParams])

  return null
}
