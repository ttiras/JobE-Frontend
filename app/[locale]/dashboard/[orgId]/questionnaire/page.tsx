import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages.questionnaire');
  return {
    title: `${t('title')} | JobE`,
    description: t('description'),
  };
}

export default async function QuestionnairePage() {
  const t = await getTranslations('pages.questionnaire');
  
  return (
    <div className="container max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
      <p className="text-muted-foreground">
        {t('description')}
      </p>
    </div>
  );
}
