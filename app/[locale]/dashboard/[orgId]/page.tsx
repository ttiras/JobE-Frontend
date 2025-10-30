'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useOrganization } from '@/lib/contexts/organization-context'
import { OrgSetupEmptyState } from '@/components/organizations/org-setup-empty-state'
import { OrgStructureProgress } from '@/components/organizations/org-structure-progress'
import { executeQuery } from '@/lib/nhost/graphql/client'
import { GET_ORG_STRUCTURE_STATS, type OrgStructureStats, extractOrgStructureCounts } from '@/lib/nhost/graphql/queries'

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const pathname = usePathname()
  const locale = pathname?.match(/^\/(en|tr)\b/)?.[1] || 'en'
  const t = useTranslations('pages.dashboard')
  const { currentOrganization, organizations, isLoading } = useOrganization()
  
  const [orgStats, setOrgStats] = useState<{
    departmentCount: number
    positionCount: number
    evaluatedCount: number
  } | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Fetch organization structure statistics
  useEffect(() => {
    async function fetchOrgStats() {
      if (!currentOrganization?.id) {
        setStatsLoading(false)
        return
      }

      try {
        const data = await executeQuery<OrgStructureStats>(
          GET_ORG_STRUCTURE_STATS,
          { organizationId: currentOrganization.id }
        )

        if (data) {
          setOrgStats(extractOrgStructureCounts(data))
        }
      } catch (err) {
        console.error('Error fetching org stats:', err)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchOrgStats()
  }, [currentOrganization?.id])

  useEffect(() => {
    if (error === 'insufficient_permissions') {
      toast.error('Insufficient Permissions', {
        description: 'You do not have access to the requested page.',
        icon: <AlertCircle className="h-4 w-4" />,
      })
    }
  }, [error])

  // Check if organization is empty (no departments or positions)
  const isEmptyOrg = orgStats && 
    orgStats.departmentCount === 0 && 
    orgStats.positionCount === 0

  // Show loading state
  if (isLoading || statsLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* No organization case */}
      {!currentOrganization && organizations.length === 0 && (
        <>
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
            <p className="text-muted-foreground">{t('description')}</p>
          </div>
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
        </>
      )}

      {/* Empty organization - show onboarding */}
      {currentOrganization && isEmptyOrg && (
        <OrgSetupEmptyState organizationId={currentOrganization.id} />
      )}

      {/* Organization with data - show dashboard with progress */}
      {currentOrganization && !isEmptyOrg && orgStats && (
        <>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
              <p className="text-muted-foreground">{t('description')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Progress Card */}
            <Card className="p-6 lg:col-span-1">
              <h3 className="text-lg font-semibold mb-4">{t('progress.title')}</h3>
              <OrgStructureProgress
                departmentCount={orgStats.departmentCount}
                positionCount={orgStats.positionCount}
                evaluatedCount={orgStats.evaluatedCount}
              />
            </Card>

            {/* Main content area - placeholder for future dashboard widgets */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-2">{t('welcome')}</h3>
                <p className="text-muted-foreground">{t('welcomeDescription')}</p>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

