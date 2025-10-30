import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ImportPageClient } from './import-page-client'

interface PageProps {
  params: Promise<{
    locale: string
    orgId: string
  }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('import.hero')
  
  return {
    title: `${t('titleDepartments')} | JobE`,
    description: t('descriptionDepartments'),
  }
}

export default async function DepartmentsImportPage({ params }: PageProps) {
  const { locale, orgId } = await params

  return (
    <ImportPageClient
      locale={locale}
      orgId={orgId}
      type="departments"
    />
  )
}
