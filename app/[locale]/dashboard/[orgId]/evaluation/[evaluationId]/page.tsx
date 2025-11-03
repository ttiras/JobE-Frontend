import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EvaluationPageClient } from './client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages.evaluation');
  return {
    title: `${t('title')} | JobE`,
    description: t('description'),
  };
}

interface PageProps {
  params: Promise<{
    locale: string;
    orgId: string;
    evaluationId: string;
  }>;
}

export default async function EvaluationPage({ params }: PageProps) {
  const { locale, orgId, evaluationId } = await params;
  
  return (
    <EvaluationPageClient
      locale={locale}
      orgId={orgId}
      evaluationId={evaluationId}
    />
  );
}
