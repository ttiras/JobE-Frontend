import { redirect } from 'next/navigation';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Redirect to organizations page (omit locale prefix for default locale)
  const organizationsPath = locale === 'en' 
    ? '/dashboard/organizations' 
    : `/${locale}/dashboard/organizations`
  redirect(organizationsPath);
}
