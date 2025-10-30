import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PositionsPageClient } from './positions-page-client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages.positions');
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

export default async function PositionsPage({ params }: PageProps) {
  const { locale, orgId } = await params;
  
  return <PositionsPageClient locale={locale} orgId={orgId} />;
}
