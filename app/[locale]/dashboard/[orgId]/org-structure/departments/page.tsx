import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { DepartmentsPageClient } from './departments-page-client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages.departments');
  return {
    title: `${t('title')} | JobE`,
    description: t('description'),
  };
}

interface PageProps {
  params: Promise<{
    locale: string;
    orgId: string;
  }>;
}

export default async function DepartmentsPage({ params }: PageProps) {
  const { locale, orgId } = await params;

  return <DepartmentsPageClient locale={locale} orgId={orgId} />;
}
