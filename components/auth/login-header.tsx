import { getTranslations } from 'next-intl/server'

interface LoginHeaderProps {
  locale: string
}

export default async function LoginHeader({ locale }: LoginHeaderProps) {
  const t = await getTranslations({ locale, namespace: 'auth' })
  return (
    <div className="space-y-2 text-center">
      <h1 className="text-3xl font-bold">{t('login.title')}</h1>
      <p className="text-muted-foreground">{t('login.description')}</p>
    </div>
  )
}
