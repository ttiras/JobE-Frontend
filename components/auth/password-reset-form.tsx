'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sendPasswordResetEmail, resetPassword } from '@/lib/nhost/auth'

interface PasswordResetFormProps {
  resetToken?: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function PasswordResetForm({ resetToken, onSuccess, onError }: PasswordResetFormProps) {
  const t = useTranslations('auth.resetPassword')
  const tValidation = useTranslations('auth.validation')
  const tA11y = useTranslations('auth.a11y')
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname?.match(/^\/(en|tr)\b/)?.[1] || 'en'
  const tFields = useTranslations('auth.fields')

  // Email step state
  const [email, setEmail] = useState('')
  
  // Password step state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Common state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const validateEmailForm = () => {
    if (!email) {
      setError(tValidation('emailRequired'))
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(tValidation('emailInvalid'))
      return false
    }
    return true
  }

  const validatePasswordForm = () => {
    if (!newPassword) {
      setError(tValidation('passwordRequired'))
      return false
    }
    if (newPassword.length < 8) {
      setError(tValidation('passwordMinLength'))
      return false
    }
    if (newPassword !== confirmPassword) {
      setError(tValidation('passwordMismatch'))
      return false
    }
    return true
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateEmailForm()) {
      return
    }

    setIsLoading(true)

    try {
      await sendPasswordResetEmail(email)
      setSuccess(true)
      onSuccess?.()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validatePasswordForm()) {
      return
    }

    setIsLoading(true)

    try {
      await resetPassword(newPassword)
      setSuccess(true)
      onSuccess?.()
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push(`/${locale}/login`)
      }, 2000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
    } finally {
      setIsLoading(false)
    }
  }

  // Render email request form (step 1)
  if (!resetToken) {
    return (
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('emailStep.email')}</Label>
          <Input
            id="email"
            type="email"
            placeholder={tFields('emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading || success}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'reset-error' : undefined}
          />
        </div>

        {success && (
          <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 text-sm text-green-900 dark:text-green-100">
            {t('emailStep.success')}
          </div>
        )}

        {error && (
          <div
            id="reset-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || success}
        >
          {isLoading ? t('emailStep.submitting') : t('emailStep.submit')}
        </Button>

        <div className="text-center text-sm">
          <Link href={`/${locale}/login`} className="text-primary hover:underline">
            {t('backToLogin')}
          </Link>
        </div>
      </form>
    )
  }

  // Render new password form (step 2)
  return (
    <form onSubmit={handlePasswordSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newPassword">{t('passwordStep.newPassword')}</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder={tFields('passwordPlaceholder')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isLoading || success}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'reset-error' : undefined}
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

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('passwordStep.confirmPassword')}</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder={tFields('passwordPlaceholder')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading || success}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'reset-error' : undefined}
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

      {success && (
        <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 text-sm text-green-900 dark:text-green-100">
          {t('passwordStep.success')}
        </div>
      )}

      {error && (
        <div
          id="reset-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || success}
      >
        {isLoading ? t('passwordStep.submitting') : t('passwordStep.submit')}
      </Button>

      <div className="text-center text-sm">
        <Link href={`/${locale}/login`} className="text-primary hover:underline">
          {t('backToLogin')}
        </Link>
      </div>
    </form>
  )
}
