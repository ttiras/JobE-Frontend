import { Metadata } from 'next'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import LoginHeader from '@/components/auth/login-header'
import { LoginForm } from '@/components/auth/login-form'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  try {
    const t = await getTranslations({ locale, namespace: 'auth' })
    return {
      title: t('login.title'),
      description: t('login.description'),
    }
  } catch {
    // Fallback metadata if translations are missing
    return {
      title: 'Login',
      description: 'Sign in to your account',
    }
  }
}

/**
 * Login Page
 * 
 * User authentication page with:
 * - Email/password login form
 * - Remember me option
 * - Password visibility toggle
 * - CAPTCHA after 3 failed attempts
 * - Links to register and password reset
 */
export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return (
    <div className="space-y-6">
      <Suspense fallback={
        <div className="space-y-2 text-center">
          <div className="h-8 w-40 mx-auto rounded bg-muted animate-pulse" />
          <div className="h-4 w-64 mx-auto rounded bg-muted animate-pulse" />
        </div>
      }>
        {/* Server component that fetches translations in a non-blocking way */}
        <LoginHeader locale={locale} />
      </Suspense>
      
      <Suspense fallback={<div className="h-[300px] rounded-md bg-muted animate-pulse" aria-hidden />}> 
        <LoginForm />
      </Suspense>
    </div>
  )
}
