'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { login } from '@/lib/nhost/auth'
import { Captcha } from './captcha'
import { 
  isRateLimited, 
  recordFailedAttempt, 
  recordSuccessfulAttempt,
  formatRemainingTime 
} from '@/lib/utils/rate-limit'

interface LoginFormProps {
  onSuccess?: (session: any) => void
  onError?: (error: Error) => void
}

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const t = useTranslations('auth.login')
  const tValidation = useTranslations('auth.validation')
  const tFields = useTranslations('auth.fields')
  const tA11y = useTranslations('auth.a11y')
  const tRate = useTranslations('auth.login.rateLimit')
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const locale = pathname?.match(/^\/(en|tr)\b/)?.[1] || 'en'

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

  // Check rate limiting on mount
  useEffect(() => {
    const { limited, remainingTime } = isRateLimited()
    if (limited && remainingTime) {
      setIsLocked(true)
      setLockoutTime(formatRemainingTime(remainingTime))
      setError(tRate('message', { time: formatRemainingTime(remainingTime) }))
    }
  }, [])

  const validateForm = () => {
    if (!email) {
      setError(tValidation('emailRequired'))
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(tValidation('emailInvalid'))
      return false
    }
    if (!password) {
      setError(tValidation('passwordRequired'))
      return false
    }
    if (showCaptcha && !captchaToken) {
      setError(t('error'))
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const result = await login(email, password)
      
      if (result?.user) {
        recordSuccessfulAttempt()
        toast.success(t('success'))
        onSuccess?.(result)
        const redirect = searchParams.get('redirect')
        if (redirect && redirect.startsWith('/')) {
          const target = /^\/(en|tr)\b/.test(redirect) ? redirect : `/${locale}${redirect}`
          router.push(target)
        } else {
          router.push(`/${locale}/dashboard`)
        }
      } else {
        throw new Error(t('error'))
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('error')
      
      // Record failed attempt and check rate limiting
      const rateLimitResult = recordFailedAttempt()
      
      if (rateLimitResult.isLocked && rateLimitResult.lockedUntil) {
        setIsLocked(true)
        const remaining = rateLimitResult.lockedUntil - Date.now()
        setLockoutTime(formatRemainingTime(remaining))
        setError(tRate('lockedFor', { time: formatRemainingTime(remaining) }))
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Rate Limit Warning */}
      {isLocked && (
        <div className="rounded-lg bg-destructive/10 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">{tRate('title')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {tRate('message', { time: lockoutTime })}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input
          id="email"
          type="email"
          placeholder={tFields('emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'login-error' : undefined}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t('password')}</Label>
          <Link 
            href={`/${locale}/reset-password`} 
            className="text-sm text-primary hover:underline"
          >
            {t('forgotPassword')}
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={tFields('passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'login-error' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? tA11y('hidePassword') : tA11y('showPassword')}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
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
          {t('rememberMe')}
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
        {isLoading ? t('submitting') : isLocked ? tRate('lockedButton') : t('submit')}
      </Button>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">{t('noAccount')} </span>
        <Link href={`/${locale}/register`} className="text-primary hover:underline">
          {t('signUp')}
        </Link>
      </div>
    </form>
  )
}
