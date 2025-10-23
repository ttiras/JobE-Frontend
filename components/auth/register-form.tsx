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

interface RegisterFormProps {
  onSuccess?: (session: any) => void
  onError?: (error: Error) => void
}

type PasswordStrength = 'weak' | 'medium' | 'strong'

export function RegisterForm({ onSuccess, onError }: RegisterFormProps) {
  const t = useTranslations('auth.register')
  const tValidation = useTranslations('auth.validation')
  const tA11y = useTranslations('auth.a11y')
  const tStrength = useTranslations('auth.register.strength')
  const tRequirements = useTranslations('auth.register.requirements')
  const tFields = useTranslations('auth.fields')
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
      setError(tValidation('displayNameRequired'))
      return false
    }
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
    if (password.length < 8) {
      setError(tValidation('passwordMinLength'))
      return false
    }
    if (password !== confirmPassword) {
      setError(tValidation('passwordMismatch'))
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
      const result = await register(email, password, displayName)
      
      if (result?.user) {
        onSuccess?.(result)
  // Redirect to verify email page (localized)
  router.push(`/${locale}/verify-email`)
      } else {
        throw new Error(t('error'))
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('error')
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
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
        return tStrength('weak')
      case 'medium':
        return tStrength('medium')
      case 'strong':
        return tStrength('strong')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">{t('displayName')}</Label>
        <Input
          id="displayName"
          type="text"
          placeholder={tFields('displayNamePlaceholder')}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={isLoading}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'register-error' : undefined}
        />
      </div>

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
          aria-describedby={error ? 'register-error' : undefined}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t('password')}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={tFields('passwordPlaceholder')}
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
            aria-label={showPassword ? tA11y('hidePassword') : tA11y('showPassword')}
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
                <span>{tRequirements('minLength')}</span>
              </div>
              <div className={`flex items-center gap-1 ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                {/[A-Z]/.test(password) && /[a-z]/.test(password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                <span>{tRequirements('case')}</span>
              </div>
              <div className={`flex items-center gap-1 ${/\d/.test(password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                {/\d/.test(password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                <span>{tRequirements('number')}</span>
              </div>
              <div className={`flex items-center gap-1 ${/[^a-zA-Z0-9]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                {/[^a-zA-Z0-9]/.test(password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                <span>{tRequirements('special')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder={tFields('passwordPlaceholder')}
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
            aria-label={showConfirmPassword ? tA11y('hidePassword') : tA11y('showPassword')}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-muted p-3 text-sm">
        <p className="text-muted-foreground">
          {t('emailVerificationNotice')}
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
        {isLoading ? t('submitting') : t('submit')}
      </Button>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">{t('hasAccount')} </span>
        <Link href={`/${locale}/login`} className="text-primary hover:underline">
          {t('signIn')}
        </Link>
      </div>
    </form>
  )
}
