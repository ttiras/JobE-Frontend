'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/contexts/auth-context'
import { useOrganization } from '@/lib/contexts/organization-context'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Loader2, Building2, Users, CreditCard } from 'lucide-react'

export default function OrganizationSettingsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const t = useTranslations('pages.settings')
  
  // Organization profile state
  const [orgName, setOrgName] = useState(currentOrganization?.name || '')
  // Note: industry, country, size, currency are not yet in the Organization type
  // These will be added when the organization profile is fully implemented
  const [industry, setIndustry] = useState('')
  const [country, setCountry] = useState('')
  const [orgSize, setOrgSize] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [isUpdatingOrg, setIsUpdatingOrg] = useState(false)

  // Update organization profile
  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    toast.info('Organization profile updates will be available soon')
    // TODO: Implement organization update via GraphQL mutation
  }

  const isLoading = authLoading || orgLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">{t('pleaseLogIn')}</p>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('managePreferences')}
        </p>
      </div>

      <Separator />

      {/* Organization Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('organizationProfile.titleShort')}
          </CardTitle>
          <CardDescription>
            {t('organizationProfile.updateInfo')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdateOrganization}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">{t('organizationProfile.name')}</Label>
              <Input
                id="orgName"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder={t('organizationProfile.namePlaceholder')}
                disabled={!currentOrganization}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">{t('organizationProfile.industry')}</Label>
                <Input
                  id="industry"
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  disabled={!currentOrganization}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">{t('organizationProfile.country')}</Label>
                <Input
                  id="country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={!currentOrganization}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orgSize">{t('organizationProfile.size')}</Label>
                <Input
                  id="orgSize"
                  type="text"
                  value={orgSize}
                  onChange={(e) => setOrgSize(e.target.value)}
                  disabled={!currentOrganization}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">{t('organizationProfile.currency')}</Label>
                <Input
                  id="currency"
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={!currentOrganization}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isUpdatingOrg || !currentOrganization}>
              {isUpdatingOrg && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('organizationProfile.updateButton')}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Team Members Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('members.titleShort')}
          </CardTitle>
          <CardDescription>
            {t('members.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Team member management will be available soon.
          </p>
        </CardContent>
      </Card>

      {/* Billing Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('billing.titleShort')}
          </CardTitle>
          <CardDescription>
            {t('billing.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('billing.comingSoon')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
