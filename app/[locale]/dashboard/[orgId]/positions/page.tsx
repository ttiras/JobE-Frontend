import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages.positions');
  return {
    title: `${t('title')} | JobE`,
    description: t('description'),
  };
}

export default async function PositionsPage() {
  const t = await getTranslations('pages.positions');
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
      <p className="text-muted-foreground">
        {t('description')}
      </p>
    </div>
  );
}
