import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PositionsContent } from '@/components/organizations/positions-content';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages.positions');
  return {
    title: `${t('title')} | JobE`,
    description: t('description'),
  };
}

interface PageProps {
  params: {
    locale: string;
    orgId: string;
  };
}

export default async function PositionsPage({ params }: PageProps) {
  // TODO: Fetch real positions data from database
  const positions: Array<{
    id: string;
    code: string;
    title: string;
    department: string;
    isManager: boolean;
    isEvaluated: boolean;
  }> = [];

  return <PositionsContent initialPositions={positions} />;
}
