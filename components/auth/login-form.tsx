'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { login } from '@/lib/nhost/auth'
import { useAuth } from '@/lib/contexts/auth-context'
import type { Session } from '@/lib/types/nhost'
import { Captcha } from './captcha'
import { 
  isRateLimited, 
  recordFailedAttempt, 
  recordSuccessfulAttempt,
  formatRemainingTime 
} from '@/lib/utils/rate-limit'
import { AuthErrorFactory } from '@/lib/utils/auth-errors'

interface LoginFormProps {
  onSuccess?: (session: Session) => void
  onError?: (error: Error) => void
}

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const tAuth = useTranslations('auth')
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname?.match(/^\/(en|tr)\b/)?.[1] || 'en'
  const { checkSession } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutTime, setLockoutTime] = useState<string>('')
  const [returnParam, setReturnParam] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // Check rate limiting on mount
  useEffect(() => {
    const { limited, remainingTime } = isRateLimited()
    if (limited && remainingTime) {
      setIsLocked(true)
      setLockoutTime(formatRemainingTime(remainingTime))
      setError(tAuth('login.rateLimit.message', { time: formatRemainingTime(remainingTime) }))
    }
  }, [tAuth])

  // Extract return URL from the browser location (avoids relying on useSearchParams in tests)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      const raw = sp.get('returnUrl') || sp.get('redirect')
      setReturnParam(raw)
    }
  }, [])

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)

  const validateForm = () => {
    // Client-side validation is shown inline; reserve `error` for server/rate-limit issues
    if (!email) return false
    if (!isValidEmail(email)) return false
    if (!password) return false
    if (showCaptcha && !captchaToken) return false
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setSubmitted(true)
    setError('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const result = await login(email, password)
      
      if (result && result.user) {
        recordSuccessfulAttempt()
        toast.success(tAuth('login.success'))
        // Force immediate session check to update AuthContext state
        // This ensures RedirectIfAuthenticated can immediately detect the authenticated state
        checkSession()
        
        onSuccess?.(result)
        // Support both 'returnUrl' (from SessionExpiredDialog) and 'redirect' (legacy)
  const rawReturn = returnParam
        // Decode if URL-encoded, but guard against double-decoding
        let normalized = rawReturn ?? ''
        if (normalized) {
          try {
            if (/%[0-9A-Fa-f]{2}/.test(normalized)) {
              normalized = decodeURIComponent(normalized)
            }
          } catch {}
        }
        if (normalized && normalized.startsWith('/')) {
          const target = /^\/(en|tr)\b/.test(normalized) ? normalized : `/${locale}${normalized}`
          router.replace(target)
        } else {
          router.replace(`/${locale}/dashboard`)
        }
      } else {
        throw new Error(tAuth('login.error'))
      }
    } catch (err) {
  const errorMessage = AuthErrorFactory.categorize(err).getMessage('en')
      
      // Record failed attempt and check rate limiting
      const rateLimitResult = recordFailedAttempt()
      
      if (rateLimitResult.isLocked && rateLimitResult.lockedUntil) {
        setIsLocked(true)
        const remaining = rateLimitResult.lockedUntil - Date.now()
        setLockoutTime(formatRemainingTime(remaining))
  setError(tAuth('login.rateLimit.lockedFor', { time: formatRemainingTime(remaining) }))
      } else {
        setError(errorMessage)
        if (rateLimitResult.showCaptcha) {
          setShowCaptcha(true)
        }
      }
      
      onError?.(err instanceof Error ? err : new Error(errorMessage))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token)
  }

  const handleCaptchaError = () => {
    setCaptchaToken(null)
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      {/* Rate Limit Warning */}
      {isLocked && (
        <div className="rounded-lg bg-destructive/10 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">{tAuth('login.rateLimit.title')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {tAuth('login.rateLimit.message', { time: lockoutTime })}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
    <Label htmlFor="email">{tAuth('login.email')}</Label>
        <Input
          id="email"
          type="email"
          placeholder={tAuth('fields.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          aria-invalid={submitted && (!email || !isValidEmail(email)) ? 'true' : 'false'}
          aria-describedby={submitted && (!email || !isValidEmail(email)) ? 'email-error' : error ? 'login-error' : undefined}
        />
        {submitted && !email && (
          <p id="email-error" className="text-sm text-destructive">{tAuth('validation.emailRequired')}</p>
        )}
        {submitted && email && !isValidEmail(email) && (
          <p id="email-error" className="text-sm text-destructive">{tAuth('validation.emailInvalid')}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{tAuth('login.password')}</Label>
          <Link 
            href={`/${locale}/reset-password`} 
            className="text-sm text-primary hover:underline"
          >
            {tAuth('login.forgotPassword')}
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={tAuth('fields.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            aria-invalid={submitted && !password ? 'true' : 'false'}
            aria-describedby={submitted && !password ? 'password-error' : error ? 'login-error' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? tAuth('a11y.hidePassword') : tAuth('a11y.showPassword')}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {submitted && !password && (
          <p id="password-error" className="text-sm text-destructive">{tAuth('validation.passwordRequired')}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="remember-me"
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(checked as boolean)}
          disabled={isLoading}
        />
        <Label
          htmlFor="remember-me"
          className="text-sm font-normal cursor-pointer"
        >
          {tAuth('login.rememberMe')}
        </Label>
      </div>

      {showCaptcha && (
        <Captcha
          action="login"
          onVerify={handleCaptchaVerify}
          onError={handleCaptchaError}
        />
      )}

      {error && (
        <div
          id="login-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || isLocked || (showCaptcha && !captchaToken)}
      >
  {isLoading ? tAuth('login.submitting') : tAuth('login.submit')}
      </Button>

      <div className="text-center text-sm">
  <span className="text-muted-foreground">{tAuth('login.noAccount')} </span>
        <Link href={`/${locale}/register`} className="text-primary hover:underline">
          {tAuth('login.signUp')}
        </Link>
      </div>
    </form>
  )
}
