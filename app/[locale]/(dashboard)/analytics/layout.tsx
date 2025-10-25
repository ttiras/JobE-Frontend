import type { ReactNode } from 'react'
import ServerAuthGuard from '@/components/layout/server-auth-guard'

export default async function AnalyticsLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return (
    <ServerAuthGuard locale={locale} allowedRoles={["admin"]}>
      {children}
    </ServerAuthGuard>
  )
}
