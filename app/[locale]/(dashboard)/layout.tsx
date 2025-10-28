import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AuthGuard } from '@/components/layout/auth-guard';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  await params
  return (
    <DashboardShell>
      {/* Client-side guard: client owns session; server validates only at data-access boundaries */}
      <AuthGuard>{children}</AuthGuard>
    </DashboardShell>
  );
}
