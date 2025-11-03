import { Metadata } from 'next';
import { EvaluationResultsClient } from './client';

interface PageProps {
  params: Promise<{
    locale: string;
    orgId: string;
    evaluationId: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Evaluation Results',
  description: 'View your position evaluation results and grade',
};

export default async function EvaluationResultsPage({ params }: PageProps) {
  const { evaluationId, orgId, locale } = await params;
  
  return (
    <EvaluationResultsClient
      evaluationId={evaluationId}
      orgId={orgId}
      locale={locale}
    />
  );
}
