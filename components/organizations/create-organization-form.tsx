"use client";

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useMutation, useQuery } from '@/lib/hooks/use-graphql'
import { useOrganization } from '@/lib/contexts/organization-context'

type CreatedOrg = {
  id: string
  name: string
  industry?: string | null
  country?: string | null
  size?: string | null
  created_at?: string
}

type Props = {
  onCreated?: (org: CreatedOrg) => void
}

const CREATE_ORG_MUTATION = `
  mutation CreateOrganization($input: organizations_insert_input!) {
    insert_organizations_one(object: $input) {
      id
      name
      industry
      country
      size
      created_at
    }
  }
`

// Enum reference tables using `comment` for UI labels
const GET_INDUSTRIES = `
  query GetIndustriesEnum {
    industries_enum(order_by: { comment: asc }) {
      value
      comment
    }
  }
`

const GET_COUNTRIES = `
  query GetCountriesEnum {
    countries_enum(order_by: { comment: asc }) {
      code
      comment
    }
  }
`

const GET_ORG_SIZES = `
  query GetOrgSizes {
    org_size {
      value
      comment
    }
  }
`

export function CreateOrganizationForm({ onCreated }: Props) {
  const t = useTranslations('pages.organizations.create')
  // locale hook retained for future localization needs (not used when using enum comment field)
  // const locale = useLocale()

  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [country, setCountry] = useState('')
  const [size, setSize] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Load enum reference data
  type IndustriesResult = { industries_enum: Array<{ value: string; comment?: string | null }> }
  type CountriesResult = { countries_enum: Array<{ code: string; comment?: string | null }> }
  type OrgSizesResult = { org_size: Array<{ value: string; comment?: string | null }> }

  const { data: industriesData } = useQuery<IndustriesResult>(GET_INDUSTRIES)
  const { data: countriesData } = useQuery<CountriesResult>(GET_COUNTRIES)
  const { data: orgSizesData } = useQuery<OrgSizesResult>(GET_ORG_SIZES)

  // Normalize to { value, label }
  const industryOptions = useMemo(() => {
    const rows = industriesData?.industries_enum ?? []
    return rows.map((i) => ({ value: i.value, label: i.comment || i.value }))
  }, [industriesData])

  const countryOptions = useMemo(() => {
    const rows = countriesData?.countries_enum ?? []
    return rows.map((c) => ({ value: c.code, label: c.comment || c.code }))
  }, [countriesData])

  const sizeOptions = useMemo(() => {
    const rows = orgSizesData?.org_size ?? []
    const mapped = rows.map((s) => ({ value: s.value, label: s.comment || s.value }))
    
    // Custom sort function that extracts the starting number from size ranges
    return mapped.sort((a, b) => {
      // Extract the first number from the display label (what user sees)
      // Remove commas first (e.g., "1,001" -> "1001")
      const extractNumber = (str: string): number => {
        const cleaned = str.replace(/,/g, '')
        const match = cleaned.match(/^(\d+)/)
        return match ? parseInt(match[1], 10) : 0
      }
      
      // Sort by the label (comment field), not the value
      const numA = extractNumber(a.label)
      const numB = extractNumber(b.label)
      
      return numA - numB
    })
  }, [orgSizesData])

  type CreateOrganizationResult = {
    insert_organizations_one: CreatedOrg | null
  }

  const { addOrganization, switchOrganization } = useOrganization()
  const [createOrg, { error }] = useMutation<CreateOrganizationResult>(CREATE_ORG_MUTATION)

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
      const input = {
        name: name.trim(),
        industry: industry.trim() || null,
        country: country.trim() || null,
        size: size.trim() || null,
      }

      const data = await createOrg({ input })
      const created = data.insert_organizations_one
      if (!created) throw new Error('Failed to create organization')

      // Update local org state (id/name mapping only) and notify parent
      addOrganization({ id: created.id, name: created.name })
      switchOrganization({ id: created.id, name: created.name })
      onCreated?.(created)
      // reset form
      setName('')
      setIndustry('')
      setCountry('')
      setSize('')
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
          <Label htmlFor="industry">Industry</Label>
          <select
            id="industry"
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          >
            <option value="">Select industry</option>
            {industryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <select
              id="country"
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="">Select country</option>
              {countryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="size">Size</Label>
            <select
              id="size"
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            >
              <option value="">Select size</option>
              {sizeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
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
