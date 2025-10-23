import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
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
  const t = await getTranslations({ locale, namespace: 'auth' })
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">{t('login.title')}</h1>
        <p className="text-muted-foreground">
          {t('login.description')}
        </p>
      </div>
      
      <LoginForm />
    </div>
  )
}
