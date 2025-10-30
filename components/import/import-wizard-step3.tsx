/**
 * ImportWizardStep3 Component
 * 
 * Step 3: Review & Confirm
 * - Final review of import summary
 * - Show what will be created/updated
 * - Confirmation before import execution
 */

'use client'

import { useTranslations } from 'next-intl'
import { CheckCircle2, Building2, Users, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ImportWorkflowContext } from '@/lib/types/import'

interface ImportWizardStep3Props {
  context: ImportWorkflowContext
  onBack: () => void
  onConfirm: () => void
  isLoading?: boolean
}

export function ImportWizardStep3({
  context,
  onBack,
  onConfirm,
  isLoading = false,
}: ImportWizardStep3Props) {
  const t = useTranslations('import.wizard.step3')
  const tCommon = useTranslations('common')

  const summary = context.preview?.summary
  
  if (!summary) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{t('noDataError')}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">{t('title')}</CardTitle>
          <CardDescription className="text-sm md:text-base">{t('description')}</CardDescription>
        </CardHeader>
      </Card>

      {/* Import Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">{t('summary.title')}</CardTitle>
          <CardDescription className="text-sm">{t('summary.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          {/* Departments Summary */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
              <h4 className="font-semibold text-sm md:text-base">{t('summary.departments')}</h4>
            </div>
            <div className="grid grid-cols-3 gap-2 md:gap-4 ml-0 md:ml-7">
              <div className="space-y-1">
                <p className="text-xs md:text-sm text-muted-foreground">{t('summary.total')}</p>
                <p className="text-xl md:text-2xl font-bold">{summary.departments.total}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs md:text-sm text-muted-foreground">{t('summary.new')}</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">{summary.departments.creates}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs md:text-sm text-muted-foreground">{t('summary.updates')}</p>
                <p className="text-xl md:text-2xl font-bold text-blue-600">{summary.departments.updates}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Positions Summary */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
              <h4 className="font-semibold text-sm md:text-base">{t('summary.positions')}</h4>
            </div>
            <div className="grid grid-cols-3 gap-2 md:gap-4 ml-0 md:ml-7">
              <div className="space-y-1">
                <p className="text-xs md:text-sm text-muted-foreground">{t('summary.total')}</p>
                <p className="text-xl md:text-2xl font-bold">{summary.positions.total}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs md:text-sm text-muted-foreground">{t('summary.new')}</p>
                <p className="text-2xl font-bold text-green-600">{summary.positions.creates}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('summary.updates')}</p>
                <p className="text-2xl font-bold text-blue-600">{summary.positions.updates}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Total Records */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{t('summary.totalRecords')}</span>
              <span className="text-2xl font-bold">{summary.totalRows}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-semibold mb-2">{t('notes.title')}</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>{t('notes.note1')}</li>
            <li>{t('notes.note2')}</li>
            <li>{t('notes.note3')}</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Confirmation Card */}
      <Card className="border-primary">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="font-semibold mb-2">{t('confirm.title')}</h4>
              <p className="text-sm text-muted-foreground mb-4">
                {t('confirm.description')}
              </p>
              <p className="text-sm font-medium">{t('confirm.question')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
          disabled={isLoading}
          size="lg"
          className="min-w-[160px]"
        >
          {isLoading ? tCommon('loading') : t('confirmButton')}
        </Button>
      </div>
    </div>
  )
}
