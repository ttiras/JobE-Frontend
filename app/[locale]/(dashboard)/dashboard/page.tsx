'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useOrganization } from '@/lib/contexts/organization-context'

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const pathname = usePathname()
  const locale = pathname?.match(/^\/(en|tr)\b/)?.[1] || 'en'
  const t = useTranslations('pages.dashboard')
  const { currentOrganization, organizations, isLoading } = useOrganization()

  useEffect(() => {
    if (error === 'insufficient_permissions') {
      toast.error('Insufficient Permissions', {
        description: 'You do not have access to the requested page.',
        icon: <AlertCircle className="h-4 w-4" />,
      })
    }
  }, [error])

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {!isLoading && !currentOrganization && organizations.length === 0 && (
        <Card className="p-6 border-dashed">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{t('noOrg.title')}</h2>
              <p className="text-muted-foreground mt-1">{t('noOrg.description')}</p>
            </div>
            <Button asChild>
              <Link href={`/${locale}/organizations`}>{t('noOrg.createButton')}</Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

