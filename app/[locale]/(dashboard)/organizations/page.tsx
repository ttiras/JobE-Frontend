"use client"

import { useCallback, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/hooks/use-auth'
import { useQuery } from '@/lib/hooks/use-graphql'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CreateOrganizationForm } from '@/components/organizations/create-organization-form'
import { Building2, Users, Coins, MapPin, Plus, Briefcase } from 'lucide-react'

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
    org_size?: {
      comment?: string | null
    } | null
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
      org_size {
        comment
      }
    }
  }
`

export default function OrganizationsPage() {
  const t = useTranslations('pages.organizations')
  const { user, isAuthenticated } = useAuth()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

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
    setIsDialogOpen(false)
  }, [refetch])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {t('title')}
              </h1>
              <p className="text-lg text-muted-foreground">{t('description')}</p>
            </div>
            
            {hasOrgs && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
                    <Plus className="h-5 w-5" />
                    Add Organization
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">{t('create.title')}</DialogTitle>
                    <DialogDescription>
                      Create a new organization to manage positions, teams, and workflows.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    <CreateOrganizationForm onCreated={handleCreated} />
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <Separator className="bg-gradient-to-r from-primary/50 via-primary/20 to-transparent" />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 border-2">
                <div className="animate-pulse space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-32 bg-muted rounded" />
                    <div className="h-5 w-16 bg-muted rounded-full" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-4 w-3/4 bg-muted rounded" />
                    <div className="h-4 w-5/6 bg-muted rounded" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-8 border-2 border-destructive/50 bg-destructive/5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="text-destructive text-xl">⚠</span>
              </div>
              <div>
                <h3 className="font-semibold text-destructive">Error loading organizations</h3>
                <p className="text-sm text-muted-foreground">{error.message}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && !hasOrgs && (
          <div className="flex items-center justify-center min-h-[500px]">
            <Card className="p-12 max-w-2xl w-full border-2 shadow-xl">
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
                    <Building2 className="h-12 w-12 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">{t('create.title')}</h2>
                    <p className="text-muted-foreground text-lg max-w-md mx-auto">
                      Create your first organization to start managing positions, building teams, and tracking applications.
                    </p>
                  </div>
                </div>
                <div className="pt-4">
                  <CreateOrganizationForm onCreated={handleCreated} />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Organizations Grid */}
        {!loading && !error && hasOrgs && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data!.organizations.map((org) => (
              <Card 
                key={org.id} 
                className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
              >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Building2 className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <h3 className="font-semibold text-xl truncate group-hover:text-primary transition-colors" title={org.name}>
                        {org.name}
                      </h3>
                    </div>
                    {org.is_active ? (
                      <Badge className="shadow-sm bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="shadow-sm">
                        Inactive
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  {/* Details Grid */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
                      <Briefcase className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium min-w-[70px]">Industry</span>
                      <span className="text-foreground font-medium">{org.industry || 'Not set'}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium min-w-[70px]">Location</span>
                      <span className="text-foreground font-medium">{org.country || 'Not set'}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
                      <Users className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium min-w-[70px]">Size</span>
                      <span className="text-foreground font-medium">{org.org_size?.comment || org.size || 'Not set'}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
                      <Coins className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium min-w-[70px]">Currency</span>
                      <span className="text-foreground font-medium">{org.currency || 'Not set'}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t">
                    <Button 
                      variant="ghost" 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
