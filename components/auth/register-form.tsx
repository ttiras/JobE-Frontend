'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { register } from '@/lib/nhost/auth'
import { AuthErrorType } from '@/lib/types/nhost'

interface RegisterFormProps {
  onSuccess?: (session: unknown) => void
  onError?: (error: Error) => void
}

type PasswordStrength = 'weak' | 'medium' | 'strong'

export function RegisterForm({ onSuccess, onError }: RegisterFormProps) {
  // Use top-level 'auth' namespace; reference nested keys explicitly
  const tAuth = useTranslations('auth')
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname?.match(/^\/(en|tr)\b/)?.[1] || 'en'

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  // Track if form was attempted to submit (currently not needed for email inline validation)
  // const [submitted, setSubmitted] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>('weak')

  const calculatePasswordStrength = (pwd: string): PasswordStrength => {
    if (pwd.length < 8) return 'weak'
    
    let strength = 0
    // Has lowercase
    if (/[a-z]/.test(pwd)) strength++
    // Has uppercase
    if (/[A-Z]/.test(pwd)) strength++
    // Has number
    if (/\d/.test(pwd)) strength++
    // Has special char
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++
    // Length > 12
    if (pwd.length > 12) strength++

    if (strength <= 2) return 'medium'
    return 'strong'
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setPasswordStrength(calculatePasswordStrength(value))
  }

  const validateForm = () => {
    if (!displayName) {
  {
        const text = tAuth('validation.displayNameRequired')
        setError(text.includes('.') ? 'Full name is required' : text)
      }
      return false
    }
    if (!email) {
  {
        const text = tAuth('validation.emailRequired')
        setError(text.includes('.') ? 'Email is required' : text)
      }
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  {
        const text = tAuth('validation.emailInvalid')
        setError(text.includes('.') ? 'Please enter a valid email address' : text)
      }
      return false
    }
    if (!password) {
  {
        const text = tAuth('validation.passwordRequired')
        setError(text.includes('.') ? 'Password is required' : text)
      }
      return false
    }
    if (password.length < 8) {
  {
        const text = tAuth('validation.passwordMinLength')
        setError(text.includes('.') ? 'Password must be at least 8 characters' : text)
      }
      return false
    }
    if (password !== confirmPassword) {
  {
        const text = tAuth('validation.passwordMismatch')
        setError(text.includes('.') ? 'Passwords do not match' : text)
      }
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
  // setSubmitted(true)
    setError('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const result = await register(email, password, displayName)

      // Registration succeeded if no error was thrown. Nhost may require
      // email verification, in which case session will be null but the
      // account is created. Treat this as success and guide the user.
      onSuccess?.(result)
      // Redirect to verify email page (omit locale prefix for default locale)
      const verifyEmailPath = locale === 'en' ? '/verify-email' : `/${locale}/verify-email`
      router.push(verifyEmailPath)
    } catch (err) {
      type TypedAuthError = {
        type?: AuthErrorType
        message?: string
      }
      // Map known auth error types to friendly, translated messages
      let errorMessage = tAuth('register.error')
      if (err && typeof err === 'object' && 'type' in (err as TypedAuthError)) {
        const rawType = (err as TypedAuthError).type
        const code = typeof rawType === 'string' ? rawType.toLowerCase() : ''
        // Support both our enum values and common Nhost string codes
        if (rawType === AuthErrorType.EMAIL_ALREADY_IN_USE || code === 'email-already-in-use') {
          errorMessage = tAuth('errors.emailAlreadyInUse')
        } else if (rawType === AuthErrorType.INVALID_EMAIL || code === 'invalid-email') {
          errorMessage = tAuth('validation.emailInvalid')
        } else if (rawType === AuthErrorType.WEAK_PASSWORD || code === 'weak-password') {
          errorMessage = tAuth('validation.passwordMinLength')
        } else {
          errorMessage = err instanceof Error && err.message ? err.message : tAuth('register.error')
        }
      } else if (err instanceof Error && err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      // Forward the original error to the callback for observability
      onError?.(err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStrengthColor = (strength: PasswordStrength) => {
    switch (strength) {
      case 'weak':
        return 'bg-red-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'strong':
        return 'bg-green-500'
    }
  }

  const getStrengthText = (strength: PasswordStrength) => {
    switch (strength) {
      case 'weak':
        return tAuth('register.strength.weak')
      case 'medium':
        return tAuth('register.strength.medium')
      case 'strong':
        return tAuth('register.strength.strong')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
  <Label htmlFor="displayName">{tAuth('register.displayName')}</Label>
        <Input
          id="displayName"
          type="text"
          placeholder={tAuth('fields.displayNamePlaceholder')}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={isLoading}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'register-error' : undefined}
        />
      </div>

      <div className="space-y-2">
  <Label htmlFor="email">{tAuth('register.email')}</Label>
        <Input
          id="email"
          type="email"
          placeholder={tAuth('fields.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'register-error' : undefined}
        />
        {email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
          <div className="text-sm text-destructive" role="alert">
            {(() => {
              const text = tAuth('validation.emailInvalid')
              return text.includes('.') ? 'Please enter a valid email address' : text
            })()}
          </div>
        )}
      </div>

      <div className="space-y-2">
  <Label htmlFor="password">{tAuth('register.password')}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={tAuth('fields.passwordPlaceholder')}
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            disabled={isLoading}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'register-error' : undefined}
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
        
        {password && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${getStrengthColor(passwordStrength)}`}
                  style={{
                    width:
                      passwordStrength === 'weak'
                        ? '33%'
                        : passwordStrength === 'medium'
                        ? '66%'
                        : '100%',
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {getStrengthText(passwordStrength)}
              </span>
            </div>
            
            <div className="text-xs space-y-1">
              <div className={`flex items-center gap-1 ${password.length >= 8 ? 'text-green-600' : 'text-muted-foreground'}`}>
                {password.length >= 8 ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                <span>{tAuth('register.requirements.minLength')}</span>
              </div>
              <div className={`flex items-center gap-1 ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                {/[A-Z]/.test(password) && /[a-z]/.test(password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                <span>{tAuth('register.requirements.case')}</span>
              </div>
              <div className={`flex items-center gap-1 ${/\d/.test(password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                {/\d/.test(password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                <span>{tAuth('register.requirements.number')}</span>
              </div>
              <div className={`flex items-center gap-1 ${/[^a-zA-Z0-9]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                {/[^a-zA-Z0-9]/.test(password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                <span>{tAuth('register.requirements.special')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
  <Label htmlFor="confirmPassword">{tAuth('register.confirmPassword')}</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder={tAuth('fields.passwordPlaceholder')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'register-error' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showConfirmPassword ? tAuth('a11y.hidePassword') : tAuth('a11y.showPassword')}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-muted p-3 text-sm">
        <p className="text-muted-foreground">
          {tAuth('register.emailVerificationNotice').replace(/sign in/gi, 'log in')}
        </p>
      </div>

      {error && (
        <div
          id="register-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Loading…' : tAuth('register.submit')}
      </Button>

      <div className="text-center text-sm">
  <span className="text-muted-foreground">{tAuth('register.hasAccount')} </span>
        <Link href={locale === 'en' ? '/login' : `/${locale}/login`} className="text-primary hover:underline">
          {tAuth('register.signIn')}
        </Link>
      </div>
    </form>
  )
}
