'use client'

/**
 * Session Clear Page
 * 
 * Utility page to forcefully clear session cookies and storage.
 * Useful for fixing session synchronization issues.
 * 
 * Usage: Navigate to /en/clear-session or /tr/clear-session
 */

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { nhost } from '@/lib/nhost/client'

export default function ClearSessionPage() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname?.match(/^\/(en|tr)\b/)?.[1] || 'en'

  useEffect(() => {
  // Clear all session data via Nhost client (also clears CookieStorage)
  try { nhost.clearSession() } catch {}
    
    // Clear localStorage and sessionStorage
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
      
      // Also try to clear cookie with different variations (best-effort)
      const variations = [
        'nhostSession=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'nhostSession=; Path=/; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'nhostSession=; Path=/; SameSite=Lax; Secure; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      ]
      
      variations.forEach(cookieString => {
        document.cookie = cookieString
      })
    }

    // Redirect to login after a short delay
    const timer = setTimeout(() => {
      router.push(`/${locale}/login`)
    }, 1500)

    return () => clearTimeout(timer)
  }, [router, locale])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <h1 className="text-2xl font-bold">Clearing Session...</h1>
        <p className="text-muted-foreground">
          Removing old session data and redirecting to login...
        </p>
      </div>
    </div>
  )
}
