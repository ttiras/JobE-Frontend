import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AuthGuard } from '@/components/layout/auth-guard';

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; orgId: string }>;
}) {
  await params;
  
  return (
    <DashboardShell>
      <AuthGuard>{children}</AuthGuard>
    </DashboardShell>
  );
}
