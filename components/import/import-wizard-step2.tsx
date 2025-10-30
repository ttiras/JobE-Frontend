/**
 * ImportWizardStep2 Component
 * 
 * Step 2: Data Preview & Validation
 * - Show parsed departments and positions
 * - Display validation errors
 * - Show statistics (new vs updates)
 * - Allow back to Step 1 or confirm to proceed with import
 */

'use client'

import { useTranslations } from 'next-intl'
import { AlertCircle, AlertTriangle, CheckCircle2, Building2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataPreviewTable } from '@/components/import/data-preview-table'
import { ValidationErrorList } from '@/components/import/validation-error-list'
import { ImportWorkflowContext } from '@/lib/types/import'

interface ImportWizardStep2Props {
  context: ImportWorkflowContext
  onBack: () => void
  onConfirm: () => void
  isLoading?: boolean
}

export function ImportWizardStep2({
  context,
  onBack,
  onConfirm,
  isLoading = false,
}: ImportWizardStep2Props) {
  const t = useTranslations('import.wizard.step2')
  const tCommon = useTranslations('common')

  const hasErrors = context.errors.filter(e => e.severity === 'ERROR').length > 0
  const warnings = context.errors.filter(e => e.severity === 'WARNING')
  const hasWarnings = warnings.length > 0
  
  const departmentStats = {
    total: context.preview?.departments.length || 0,
    creates: context.preview?.departments.filter(d => d.operation === 'CREATE').length || 0,
    updates: context.preview?.departments.filter(d => d.operation === 'UPDATE').length || 0,
  }

  const positionStats = {
    total: context.preview?.positions.length || 0,
    creates: context.preview?.positions.filter(p => p.operation === 'CREATE').length || 0,
    updates: context.preview?.positions.filter(p => p.operation === 'UPDATE').length || 0,
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header with Statistics */}
      <Card className="border-0 md:border">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">{t('title')}</CardTitle>
          <CardDescription className="text-sm">{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {/* Departments Stats */}
            <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 border rounded-lg">
              <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg shrink-0">
                <Building2 className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm md:text-base">{t('stats.departments')}</h4>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2">
                  <span className="text-xl md:text-2xl font-bold">{departmentStats.total}</span>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {departmentStats.creates} {t('stats.new')}
                    </Badge>
                    {departmentStats.updates > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {departmentStats.updates} {t('stats.updates')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Positions Stats */}
            <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 border rounded-lg">
              <div className="p-2 bg-green-100 dark:bg-green-950 rounded-lg shrink-0">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm md:text-base">{t('stats.positions')}</h4>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2">
                  <span className="text-xl md:text-2xl font-bold">{positionStats.total}</span>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {positionStats.creates} {t('stats.new')}
                    </Badge>
                    {positionStats.updates > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {positionStats.updates} {t('stats.updates')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Status */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('validation.errorsTitle')}</AlertTitle>
          <AlertDescription>
            {t('validation.errorsDescription', { count: context.errors.filter(e => e.severity === 'ERROR').length })}
          </AlertDescription>
        </Alert>
      )}

      {!hasErrors && hasWarnings && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('validation.warningsTitle')}</AlertTitle>
          <AlertDescription>
            {t('validation.warningsDescription', { count: warnings.length })}
          </AlertDescription>
        </Alert>
      )}

      {!hasErrors && !hasWarnings && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700 dark:text-green-400">
            {t('validation.successTitle')}
          </AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-400">
            {t('validation.successDescription')}
          </AlertDescription>
        </Alert>
      )}

      {/* Data Tables */}
      <Tabs defaultValue="departments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="departments">
            <Building2 className="mr-2 h-4 w-4" />
            {t('tabs.departments')} ({departmentStats.total})
          </TabsTrigger>
          <TabsTrigger value="positions">
            <Users className="mr-2 h-4 w-4" />
            {t('tabs.positions')} ({positionStats.total})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('preview.departmentsTitle')}</CardTitle>
              <CardDescription>{t('preview.departmentsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {context.preview?.departments && context.preview.departments.length > 0 ? (
                <DataPreviewTable
                  departments={context.preview.departments}
                  positions={[]}
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t('preview.noDepartments')}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('preview.positionsTitle')}</CardTitle>
              <CardDescription>{t('preview.positionsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {context.preview?.positions && context.preview.positions.length > 0 ? (
                <DataPreviewTable
                  departments={[]}
                  positions={context.preview.positions}
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t('preview.noPositions')}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Validation Errors */}
      {hasErrors && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-base text-red-600 dark:text-red-400">
              {t('errors.title')}
            </CardTitle>
            <CardDescription>{t('errors.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ValidationErrorList errors={context.errors.filter(e => e.severity === 'ERROR')} />
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {hasWarnings && (
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="text-base text-yellow-600 dark:text-yellow-400">
              {t('warnings.title')}
            </CardTitle>
            <CardDescription>{t('warnings.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ValidationErrorList errors={warnings} />
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          disabled={isLoading}
        >
          {t('backButton')}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={hasErrors || isLoading}
          size="lg"
          className="min-w-[160px]"
        >
          {isLoading ? tCommon('loading') : t('confirmButton')}
        </Button>
      </div>
    </div>
  )
}
