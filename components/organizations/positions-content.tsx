'use client'

/**
 * Positions Page Content (Client Component)
 * 
 * Contains the main positions list view with:
 * - Search and filtering
 * - Import drawer integration
 * - Position cards with evaluation status
 * - Empty state with quick actions
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Briefcase, Plus, Search, AlertCircle, CheckCircle2, FileSpreadsheet } from 'lucide-react'
import Link from 'next/link'

interface Position {
  id: string
  code: string
  title: string
  department: string
  isManager: boolean
  isEvaluated: boolean
}

interface PositionsContentProps {
  initialPositions?: Position[]
}

export function PositionsContent({ initialPositions = [] }: PositionsContentProps) {
  const t = useTranslations('pages.positions')
  const params = useParams()
  const router = useRouter()
  const { locale, orgId } = params as { locale: string; orgId: string }
  
  const [positions] = useState<Position[]>(initialPositions)

  return (
    <>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-primary" />
              {t('title')}
            </h1>
            <p className="text-muted-foreground">{t('description')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/${locale}/dashboard/${orgId}/org-structure/positions/import`}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {t('actions.import')}
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/${locale}/dashboard/${orgId}/org-structure/positions/new`}>
                <Plus className="h-4 w-4 mr-2" />
                {t('actions.new')}
              </Link>
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search.placeholder')}
              className="pl-10"
            />
          </div>
          <Button variant="outline">{t('actions.filterDept')}</Button>
          <Button variant="outline">{t('actions.filterStatus')}</Button>
        </div>

        {/* Positions List */}
        {positions.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="pt-6">
              <div className="text-center space-y-4 py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Briefcase className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('emptyState.title')}</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {t('emptyState.description')}
                  </p>
                </div>
                <div className="pt-4 flex gap-3 justify-center">
                  <Button 
                    size="lg" 
                    variant="outline"
                    asChild
                  >
                    <Link href={`/${locale}/dashboard/${orgId}/org-structure/positions/import`}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      {t('emptyState.import')}
                    </Link>
                  </Button>
                  <Button asChild size="lg">
                    <Link href={`/${locale}/dashboard/${orgId}/org-structure/positions/new`}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('emptyState.create')}
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {positions.map((position) => (
              <Card key={position.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-green-100">
                        <Briefcase className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{position.title}</h3>
                          {position.isManager && (
                            <Badge variant="secondary" className="text-xs">Manager</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {position.code} • {position.department}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {position.isEvaluated ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm font-medium">Evaluated</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-yellow-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Not Evaluated</span>
                        </div>
                      )}
                      <Button variant="outline" size="sm">{t('actions.edit')}</Button>
                      <Button size="sm">
                        {position.isEvaluated ? t('actions.viewEvaluation') : t('actions.evaluate')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
