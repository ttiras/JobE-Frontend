'use client'

/**
 * Departments Page Content (Client Component)
 * 
 * Contains the main departments list view with:
 * - Search and filtering
 * - Import drawer integration
 * - Department cards
 * - Empty state with quick actions
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FolderKanban, Plus, Search, FileSpreadsheet } from 'lucide-react'
import Link from 'next/link'

interface Department {
  id: string
  name: string
  code: string
  positions: number
}

interface DepartmentsContentProps {
  initialDepartments?: Department[]
}

export function DepartmentsContent({ initialDepartments = [] }: DepartmentsContentProps) {
  const t = useTranslations('pages.departments')
  const params = useParams()
  const router = useRouter()
  const { locale, orgId } = params as { locale: string; orgId: string }
  
  const [departments] = useState<Department[]>(initialDepartments)

  return (
    <>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <FolderKanban className="h-8 w-8 text-primary" />
              {t('title')}
            </h1>
            <p className="text-muted-foreground">{t('description')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/${locale}/dashboard/${orgId}/org-structure/departments/import`}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {t('actions.import')}
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/${locale}/dashboard/${orgId}/org-structure/departments/new`}>
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
          <Button variant="outline">{t('actions.filter')}</Button>
        </div>

        {/* Departments List */}
        {departments.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="pt-6">
              <div className="text-center space-y-4 py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <FolderKanban className="h-8 w-8 text-muted-foreground" />
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
                    <Link href={`/${locale}/dashboard/${orgId}/org-structure/departments/import`}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      {t('emptyState.import')}
                    </Link>
                  </Button>
                  <Button asChild size="lg">
                    <Link href={`/${locale}/dashboard/${orgId}/org-structure/departments/new`}>
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
            {departments.map((dept) => (
              <Card key={dept.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <FolderKanban className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{dept.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {dept.code} • {dept.positions} positions
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">{t('actions.edit')}</Button>
                      <Button variant="outline" size="sm">{t('actions.viewPositions')}</Button>
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
