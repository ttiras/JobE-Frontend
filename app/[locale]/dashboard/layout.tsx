import { AuthGuard } from '@/components/layout/auth-guard';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  await params;
  
  return (
    <AuthGuard>{children}</AuthGuard>
  );
}
