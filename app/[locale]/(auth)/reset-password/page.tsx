import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PasswordResetForm } from '@/components/auth/password-reset-form'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  
  return {
    title: t('resetPassword.title'),
    description: t('resetPassword.emailStep.description'),
  }
}

type ResetPasswordSearchParams = Promise<{ token?: string }>

/**
 * Password Reset Page
 * 
 * Two-step password reset process:
 * 1. Email request (no token) - user enters email to receive reset link
 * 2. New password (with token) - user sets new password after clicking email link
 */
export default async function ResetPasswordPage({ searchParams, params }: { searchParams: ResetPasswordSearchParams; params: Promise<{ locale: string }> }) {
  const { token: resetToken } = await searchParams
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">
          {resetToken ? t('resetPassword.passwordStep.title') : t('resetPassword.emailStep.title')}
        </h1>
        <p className="text-muted-foreground">
          {resetToken ? t('resetPassword.passwordStep.description') : t('resetPassword.emailStep.description')}
        </p>
      </div>
      
      <PasswordResetForm resetToken={resetToken} />
    </div>
  )
}
