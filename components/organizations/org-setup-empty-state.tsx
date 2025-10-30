/**
 * OrgSetupEmptyState Component
 * 
 * Onboarding component for new organizations with no data yet.
 * Guides users through the setup process with step-by-step instructions.
 */

'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Building2, Users, FileSpreadsheet, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface OrgSetupEmptyStateProps {
  organizationId: string
}

interface SetupStep {
  icon: React.ReactNode
  titleKey: string
  descriptionKey: string
  actionKey: string
  href: string
  completed: boolean
}

export function OrgSetupEmptyState({ organizationId }: OrgSetupEmptyStateProps) {
  const t = useTranslations('pages.dashboard.onboarding')
  const router = useRouter()

  const steps: SetupStep[] = [
    {
      icon: <FileSpreadsheet className="w-6 h-6" />,
      titleKey: 'steps.import.title',
      descriptionKey: 'steps.import.description',
      actionKey: 'steps.import.action',
      href: `/dashboard/${organizationId}/org-structure/import`,
      completed: false,
    },
    {
      icon: <Building2 className="w-6 h-6" />,
      titleKey: 'steps.departments.title',
      descriptionKey: 'steps.departments.description',
      actionKey: 'steps.departments.action',
      href: `/dashboard/${organizationId}/org-structure/departments`,
      completed: false,
    },
    {
      icon: <Users className="w-6 h-6" />,
      titleKey: 'steps.positions.title',
      descriptionKey: 'steps.positions.description',
      actionKey: 'steps.positions.action',
      href: `/dashboard/${organizationId}/org-structure/positions`,
      completed: false,
    },
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
          <Building2 className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-3">{t('title')}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {t('description')}
        </p>
      </div>

      {/* Setup Steps */}
      <div className="grid gap-6 w-full max-w-4xl">
        {steps.map((step, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-6">
              {/* Step Number/Icon */}
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                  {step.completed ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    step.icon
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-muted-foreground">
                        {t('stepNumber', { number: index + 1 })}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {t(step.titleKey)}
                    </h3>
                    <p className="text-muted-foreground">
                      {t(step.descriptionKey)}
                    </p>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => router.push(step.href)}
                    disabled={step.completed}
                    className="flex-shrink-0"
                  >
                    {step.completed ? t('completed') : t(step.actionKey)}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Help Text */}
      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          {t('helpText')}{' '}
          <Button variant="link" className="p-0 h-auto">
            {t('helpLink')}
          </Button>
        </p>
      </div>
    </div>
  )
}
