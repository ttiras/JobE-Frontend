import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  
  return {
    title: t('verifyEmail.title'),
    description: t('verifyEmail.description'),
  }
}

type VerifyEmailSearchParams = Promise<{
  type?: string
  redirectTo?: string
  refreshToken?: string
  error?: string
  errorDescription?: string
}>

/**
 * Email Verification Page
 * 
 * Handles email verification after user clicks link in verification email.
 * Nhost handles the verification automatically via the email link redirect.
 * This page displays the verification result based on URL parameters.
 * 
 * URL Parameters from Nhost:
 * - type: 'emailVerify' for email verification
 * - refreshToken: Present on successful verification
 * - error: Error code if verification failed
 * - errorDescription: Human-readable error message
 * - redirectTo: Optional redirect path after success
 */
export default async function VerifyEmailPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ locale: string }>
  searchParams: VerifyEmailSearchParams
}) {
  const { locale } = await params
  const { type, refreshToken, error, errorDescription } = await searchParams
  const t = await getTranslations({ locale, namespace: 'auth' })

  // Determine verification status from Nhost URL parameters
  const isEmailVerification = type === 'emailVerify'
  const isSuccess = isEmailVerification && refreshToken && !error
  const isError = isEmailVerification && error
  const isPending = !isEmailVerification

  // Get error details for display
  const errorMessage = errorDescription || (error ? 'Verification failed' : null)

  return (
    <div className="space-y-6">
      <div className="space-y-4 text-center">
        {isSuccess && (
          <>
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold">{t('verifyEmail.success.title')}</h1>
            <p className="text-muted-foreground">
              {t('verifyEmail.success.message')}
            </p>
          </>
        )}

        {isError && (
          <>
            <div className="flex justify-center">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold">{t('verifyEmail.error.title')}</h1>
            <p className="text-muted-foreground">
              {errorMessage || t('verifyEmail.error.message')}
            </p>
          </>
        )}

        {isPending && (
          <>
            <div className="flex justify-center">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            </div>
            <h1 className="text-3xl font-bold">{t('verifyEmail.pending.title')}</h1>
            <p className="text-muted-foreground">
              {t('verifyEmail.pending.message')}
            </p>
          </>
        )}
      </div>

      <div className="flex flex-col space-y-2">
        {isSuccess && (
          <Button asChild>
            <Link href={`/${locale}/login`}>
              {t('verifyEmail.success.continueToLogin')}
            </Link>
          </Button>
        )}

        {isError && (
          <Button asChild variant="outline">
            <Link href={`/${locale}/register`}>
              {t('verifyEmail.error.tryAgain')}
            </Link>
          </Button>
        )}

        {isPending && (
          <p className="text-sm text-center text-muted-foreground">
            {t('verifyEmail.pending.checkSpam')}
          </p>
        )}
      </div>
    </div>
  )
}
