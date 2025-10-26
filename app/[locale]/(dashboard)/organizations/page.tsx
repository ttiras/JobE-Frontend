"use client"

import { useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/hooks/use-auth'
import { useQuery } from '@/lib/hooks/use-graphql'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreateOrganizationForm } from '@/components/organizations/create-organization-form'

type OrgsResult = {
  organizations: Array<{
    id: string
    name: string
    industry?: string | null
    country?: string | null
    size?: string | null
    is_active?: boolean | null
    currency?: string | null
    created_at?: string
    updated_at?: string
  }>
}

const GET_USER_ORGS = `
  query GetUserOrgs($userId: uuid!) {
    organizations(
      where: { created_by: { _eq: $userId }, deleted_at: { _is_null: true } }
      order_by: { created_at: desc }
    ) {
      id
      name
      industry
      country
      size
      is_active
      currency
      created_at
      updated_at
    }
  }
`

export default function OrganizationsPage() {
  const t = useTranslations('pages.organizations')
  const { user, isAuthenticated } = useAuth()

  const userId = user?.id
  const { data, loading, error, refetch } = useQuery<OrgsResult>(
    GET_USER_ORGS,
    { userId },
    { skip: !isAuthenticated || !userId }
  )

  const hasOrgs = useMemo(() => (data?.organizations?.length || 0) > 0, [data])

  const handleCreated = useCallback(() => {
    // Refresh the list after creating a new organization
    refetch()
  }, [refetch])

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {loading && (
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-1/3 bg-muted rounded" />
            <div className="h-20 w-full bg-muted rounded" />
          </div>
        </Card>
      )}

      {error && (
        <Card className="p-6">
          <p className="text-destructive">{error.message}</p>
        </Card>
      )}

      {!loading && !error && !hasOrgs && (
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-2">{t('create.title')}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Create your organization to get started. You can add positions and invite teammates afterwards.
            </p>
            <CreateOrganizationForm onCreated={handleCreated} />
          </Card>
        </div>
      )}

      {!loading && !error && hasOrgs && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your organizations</h2>
            <Button onClick={() => refetch()} variant="default">Refresh</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data!.organizations.map((org) => (
              <Card key={org.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-lg truncate" title={org.name}>{org.name}</h3>
                  {org.is_active ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                <Separator />
                <div className="text-sm grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">Industry</div>
                  <div>{org.industry || '-'}</div>
                  <div className="text-muted-foreground">Country</div>
                  <div>{org.country || '-'}</div>
                  <div className="text-muted-foreground">Size</div>
                  <div>{org.size || '-'}</div>
                  <div className="text-muted-foreground">Currency</div>
                  <div>{org.currency || '-'}</div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-medium mb-3">Create another organization</h3>
            <CreateOrganizationForm onCreated={handleCreated} />
          </Card>
        </div>
      )}
    </div>
  )
}
