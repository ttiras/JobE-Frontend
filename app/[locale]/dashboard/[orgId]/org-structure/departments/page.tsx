import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { DepartmentsContent } from '@/components/organizations/departments-content';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages.departments');
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

export default async function DepartmentsPage({ params }: PageProps) {
  // TODO: Fetch real departments data from database
  const departments: Array<{id: string; name: string; code: string; positions: number}> = [];

  return <DepartmentsContent initialDepartments={departments} />;
}
