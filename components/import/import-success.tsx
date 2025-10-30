'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, FolderKanban, Briefcase, LayoutDashboard, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImportSuccessProps {
  /** Import statistics */
  stats: {
    departments?: number
    positions?: number
  }
  /** Organization ID for navigation */
  orgId: string
  /** Locale for navigation */
  locale: string
}

export function ImportSuccess({ stats, orgId, locale }: ImportSuccessProps) {
  const t = useTranslations('import.success')

  const actionCards = [
    {
      icon: FolderKanban,
      title: t('viewDepartments'),
      description: t('viewDepartmentsDescription'),
      href: `/${locale}/dashboard/${orgId}/org-structure/departments`,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      show: (stats.departments ?? 0) > 0
    },
    {
      icon: Briefcase,
      title: t('viewPositions'),
      description: t('viewPositionsDescription'),
      href: `/${locale}/dashboard/${orgId}/org-structure/positions`,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      show: (stats.positions ?? 0) > 0
    },
    {
      icon: LayoutDashboard,
      title: t('backToDashboard'),
      description: t('backToDashboardDescription'),
      href: `/${locale}/dashboard/${orgId}`,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-950/20',
      show: true
    }
  ].filter(card => card.show)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Main Content */}
      <div className="container max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center space-y-6 mb-12">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/30 ring-4 ring-green-500/20 mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>

          {/* Success Message */}
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              {t('title')}
            </h1>
            
            {/* Statistics */}
            <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
              {stats.departments && stats.departments > 0 && (
                <span>
                  {t('importedDepartments', { count: stats.departments })}
                </span>
              )}
              {stats.departments && stats.departments > 0 && stats.positions && stats.positions > 0 && (
                <span className="text-muted-foreground/50">•</span>
              )}
              {stats.positions && stats.positions > 0 && (
                <span>
                  {t('importedPositions', { count: stats.positions })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* What's Next Section */}
        <div className="space-y-6">
          <h2 className="text-xl md:text-2xl font-semibold text-center">
            {t('whatsNext')}
          </h2>

          {/* Action Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {actionCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="block transition-transform hover:scale-105"
              >
                <Card className="h-full border-2 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer">
                  <CardContent className="p-6 space-y-4">
                    {/* Icon */}
                    <div className={cn(
                      'inline-flex items-center justify-center w-12 h-12 rounded-xl ring-1',
                      card.bgColor,
                      card.color
                    )}>
                      <card.icon className="h-6 w-6" />
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {card.title}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Additional Help */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            {t('needHelp')}
          </p>
          <Button variant="outline" asChild>
            <Link href={`/${locale}/dashboard/${orgId}/org-structure/import/departments`}>
              {t('importMore')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
