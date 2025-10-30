/**
 * Organization Chart Page
 * 
 * Displays the complete organizational hierarchy with interactive visualization
 */

import { Metadata } from 'next';
import { HierarchyPageClient } from './hierarchy-page-client';

export const metadata: Metadata = {
  title: 'Organization Chart',
  description: 'View your organization structure as an interactive chart',
};

interface HierarchyPageProps {
  params: Promise<{
    locale: string;
    orgId: string;
  }>;
}

export default async function HierarchyPage({ params }: HierarchyPageProps) {
  const { locale, orgId } = await params;

  return <HierarchyPageClient locale={locale} orgId={orgId} />;
}
