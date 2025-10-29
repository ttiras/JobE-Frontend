import type { ReactNode } from 'react'
import { AuthGuard } from '@/components/layout/auth-guard'

export default async function AnalyticsLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  await params
  return (
    <AuthGuard>{children}</AuthGuard>
  )
}
