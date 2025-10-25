"use client";

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useMutation } from '@/lib/hooks/use-graphql'
import { CREATE_ORGANIZATION } from '@/lib/nhost/graphql/mutations'
import { useOrganization } from '@/lib/contexts/organization-context'

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function CreateOrganizationForm() {
  const t = useTranslations('pages.organizations.create')
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname?.match(/^\/(en|tr)\b/)?.[1] || 'en'

  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Types for the create organization mutation
  type CreateOrganizationInput = {
    name: string
    slug: string
    website: string | null
  }

  type CreateOrganizationResult = {
    insert_organizations_one: {
      id: string
      name: string
      slug: string
      website: string | null
      industry?: string | null
      employeeCount?: number | null
      country?: string | null
      city?: string | null
      description?: string | null
      createdAt: string
    }
  }

  const { addOrganization, switchOrganization } = useOrganization()
  const [createOrg, { error }] = useMutation<CreateOrganizationResult>(CREATE_ORGANIZATION)

  const validate = () => {
    if (!name.trim()) {
      setFormError(t('errors.nameRequired'))
      return false
    }
    setFormError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const input: CreateOrganizationInput = {
        name: name.trim(),
        slug: slugify(name),
        website: website.trim() || null,
      }
      const data = await createOrg({ input })
      const created = data.insert_organizations_one
      if (!created) throw new Error('Failed to create organization')

      // Update local org state and redirect to dashboard
      addOrganization(created)
      switchOrganization(created)
      router.push(`/${locale}/dashboard`)
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : t('errors.generic')
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t('fields.name')}</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('placeholders.name')}
            aria-invalid={!!formError}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">{t('fields.website')}</Label>
          <Input
            id="website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder={t('placeholders.website')}
          />
        </div>

        {formError && (
          <div role="alert" className="text-sm text-destructive">{formError}</div>
        )}
        {error && !formError && (
          <div role="alert" className="text-sm text-destructive">{error.message}</div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('submitting') : t('submit')}
          </Button>
        </div>
      </form>
    </Card>
  )
}
