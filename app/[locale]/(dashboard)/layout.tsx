import { DashboardShell } from '@/components/layout/dashboard-shell';
import ServerAuthGuard from '@/components/layout/server-auth-guard';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params
  return (
    <ServerAuthGuard locale={locale} allowedRoles={["user", "admin"]}>
      <DashboardShell>{children}</DashboardShell>
    </ServerAuthGuard>
  );
}
