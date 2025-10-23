import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { RegisterForm } from '@/components/auth/register-form'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  
  return {
    title: t('register.title'),
    description: t('register.description'),
  }
}

/**
 * Register Page
 * 
 * User registration page with:
 * - Email, password, display name fields
 * - Password strength indicator
 * - Password confirmation
 * - Email verification notice
 * - Link to login
 */
export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">{t('register.title')}</h1>
        <p className="text-muted-foreground">
          {t('register.description')}
        </p>
      </div>
      
      <RegisterForm />
    </div>
  )
}
