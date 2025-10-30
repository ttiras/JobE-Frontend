/**
 * ImportWizardStep4 Component
 * 
 * Step 4: Import Execution & Results
 * - Show import progress
 * - Display success message
 * - Show import statistics
 * - Navigation to view data or import more
 */

'use client'

import { useTranslations } from 'next-intl'
import { CheckCircle2, Upload, Eye, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ImportWorkflowContext, ImportWorkflowState } from '@/lib/types/import'
import { animations } from '@/lib/utils/animations'

interface ImportWizardStep4Props {
  context: ImportWorkflowContext
  onImportMore: () => void
  onViewData: () => void
}

export function ImportWizardStep4({
  context,
  onImportMore,
  onViewData,
}: ImportWizardStep4Props) {
  const t = useTranslations('import.wizard.step4')

  const result = context.result
  const isLoading = context.state === ImportWorkflowState.CONFIRMING

  if (!result && !isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">
            {t('noResultsError')}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className={animations.cardEnter}>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 border-4 border-primary border-t-transparent rounded-full ${animations.spin}`} />
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t('importing.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('importing.description')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success Header with animation */}
      <Card className={`border-green-200 bg-green-50 dark:bg-green-950/20 ${animations.successPulse}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-6 w-6" />
            {t('success.title')}
          </CardTitle>
          <CardDescription className="text-green-600 dark:text-green-400">
            {t('success.description')}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Import Results */}
      {result && (
        <Card className={animations.cardEnter}>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">{t('results.title')}</CardTitle>
            <CardDescription className="text-sm">{t('results.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6">
            {/* Departments Results */}
            <div>
              <h4 className="font-semibold text-sm md:text-base mb-3">{t('results.departments')}</h4>
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                <div className="space-y-1">
                  <p className="text-xs md:text-sm text-muted-foreground">{t('results.total')}</p>
                  <p className="text-xl md:text-2xl font-bold">{result.totalDepartments}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs md:text-sm text-muted-foreground">{t('results.created')}</p>
                  <p className="text-xl md:text-2xl font-bold text-green-600">{result.departmentsCreated}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs md:text-sm text-muted-foreground">{t('results.updated')}</p>
                  <p className="text-xl md:text-2xl font-bold text-blue-600">{result.departmentsUpdated}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Positions Results */}
            <div>
              <h4 className="font-semibold text-sm md:text-base mb-3">{t('results.positions')}</h4>
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                <div className="space-y-1">
                  <p className="text-xs md:text-sm text-muted-foreground">{t('results.total')}</p>
                  <p className="text-xl md:text-2xl font-bold">{result.totalPositions}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs md:text-sm text-muted-foreground">{t('results.created')}</p>
                  <p className="text-xl md:text-2xl font-bold text-green-600">{result.positionsCreated}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs md:text-sm text-muted-foreground">{t('results.updated')}</p>
                  <p className="text-xl md:text-2xl font-bold text-blue-600">{result.positionsUpdated}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">{t('nextSteps.title')}</CardTitle>
          <CardDescription className="text-sm">{t('nextSteps.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={onViewData}
            className="w-full justify-between"
            size="lg"
          >
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4 md:h-5 md:w-5" />
              <span className="text-sm md:text-base">{t('nextSteps.viewData')}</span>
            </span>
            <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <Button
            onClick={onImportMore}
            variant="outline"
            className="w-full justify-between"
            size="lg"
          >
            <span className="flex items-center gap-2">
              <Upload className="h-4 w-4 md:h-5 md:w-5" />
              <span className="text-sm md:text-base">{t('nextSteps.importMore')}</span>
            </span>
            <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-sm md:text-base mb-3">{t('tips.title')}</h4>
          <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('tips.tip1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('tips.tip2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{t('tips.tip3')}</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
