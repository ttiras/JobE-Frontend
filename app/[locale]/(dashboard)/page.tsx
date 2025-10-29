"use client";

import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('pages.dashboard');
  
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
      <p className="text-muted-foreground">
        {t('welcomeMessage')}
      </p>
    </div>
  );
}
