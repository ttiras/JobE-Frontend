import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ImportSuccess } from '@/components/import/import-success'

interface PageProps {
  params: Promise<{
    locale: string
    orgId: string
  }>
  searchParams: Promise<{
    count?: string
  }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('import.success')
  
  return {
    title: `${t('title')} | JobE`,
    description: t('whatsNext'),
  }
}

export default async function DepartmentsImportSuccessPage({ params, searchParams }: PageProps) {
  const { locale, orgId } = await params
  const search = await searchParams
  
  // Parse import statistics from query params
  const count = search.count ? parseInt(search.count, 10) : 0

  return (
    <ImportSuccess
      stats={{ departments: count }}
      orgId={orgId}
      locale={locale}
    />
  )
}
