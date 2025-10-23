import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PasswordResetForm } from '@/components/auth/password-reset-form'

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.resetPassword' })
  
  return {
    title: t('title'),
    description: t('emailStep.description'),
  }
}

interface ResetPasswordPageProps {
  searchParams: { token?: string }
}

/**
 * Password Reset Page
 * 
 * Two-step password reset process:
 * 1. Email request (no token) - user enters email to receive reset link
 * 2. New password (with token) - user sets new password after clicking email link
 */
export default async function ResetPasswordPage({ searchParams, params }: ResetPasswordPageProps & { params: Promise<{ locale: string }> }) {
  const resetToken = searchParams.token
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.resetPassword' })

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">
          {resetToken ? t('passwordStep.title') : t('emailStep.title')}
        </h1>
        <p className="text-muted-foreground">
          {resetToken ? t('passwordStep.description') : t('emailStep.description')}
        </p>
      </div>
      
      <PasswordResetForm resetToken={resetToken} />
    </div>
  )
}
