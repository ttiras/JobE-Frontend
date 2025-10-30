import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  FileText,
  X,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  type ImportError,
  type ErrorSummary,
  formatErrorMessage,
  getErrorStyle,
  getCategoryLabel,
  groupErrorsByRow,
  groupErrorsByCategory,
} from '@/lib/utils/import-error-formatter'
import { cn } from '@/lib/utils'

interface ImportErrorDisplayProps {
  errors: ImportError[]
  summary: ErrorSummary
  onDismiss?: (errorId: string) => void
  onFixAction?: (error: ImportError) => void
  className?: string
  maxHeight?: string
}

export function ImportErrorDisplay({
  errors,
  summary,
  onDismiss,
  onFixAction,
  className,
  maxHeight = '500px',
}: ImportErrorDisplayProps) {
  const t = useTranslations('import.errorDisplay')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['required', 'reference']))
  const [viewMode, setViewMode] = useState<'row' | 'category'>('row')

  // Toggle row expansion
  const toggleRow = (key: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedRows(newExpanded)
  }

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  // Group errors based on view mode
  const groupedErrors = viewMode === 'row' 
    ? groupErrorsByRow(errors)
    : groupErrorsByCategory(errors)

  // Get icon for severity
  const getIcon = (severity: 'error' | 'warning' | 'info') => {
    const iconClass = 'h-5 w-5'
    switch (severity) {
      case 'error':
        return <AlertCircle className={iconClass} />
      case 'warning':
        return <AlertTriangle className={iconClass} />
      case 'info':
        return <Info className={iconClass} />
    }
  }

  return (
    <Card className={cn('border-2', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('title')}
            </CardTitle>
            <CardDescription>
              {summary.totalErrors > 0 && (
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {summary.totalErrors} {t('errorCount', { count: summary.totalErrors })}
                </span>
              )}
              {summary.totalWarnings > 0 && (
                <span className="ml-3 text-yellow-600 dark:text-yellow-400">
                  {summary.totalWarnings} {t('warningCount', { count: summary.totalWarnings })}
                </span>
              )}
            </CardDescription>
          </div>

          {/* View mode toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'row' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('row')}
            >
              {t('byRow')}
            </Button>
            <Button
              variant={viewMode === 'category' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('category')}
            >
              {t('byCategory')}
            </Button>
          </div>
        </div>

        {/* Summary stats */}
        {!summary.canProceed && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">
              {t('cannotProceed')}
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <ScrollArea style={{ maxHeight }} className="pr-4">
          <div className="space-y-2">
            {viewMode === 'row' ? (
              // Group by row
              Array.from(groupedErrors.entries()).map(([key, rowErrors]) => {
                const [sheet, rowNum] = key.split('-')
                const isExpanded = expandedRows.has(key)
                const criticalError = rowErrors.find(e => e.severity === 'error')
                const style = getErrorStyle(criticalError?.severity || 'warning')

                return (
                  <div
                    key={key}
                    className={cn(
                      'border rounded-lg overflow-hidden',
                      style.borderColor
                    )}
                  >
                    {/* Row header */}
                    <button
                      onClick={() => toggleRow(key)}
                      className={cn(
                        'w-full p-3 flex items-center justify-between hover:opacity-80 transition-opacity',
                        style.bgColor
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <div className={style.color}>
                          {getIcon(criticalError?.severity || 'warning')}
                        </div>
                        <div className="text-left">
                          <div className="font-medium">
                            {sheet === 'file' ? t('fileLevel') : `${sheet} - Row ${rowNum}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {rowErrors.length} {t('issueCount', { count: rowErrors.length })}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {rowErrors.map(err => (
                          <Badge
                            key={err.id}
                            variant={err.severity === 'error' ? 'destructive' : 'secondary'}
                          >
                            {getCategoryLabel(err.category)}
                          </Badge>
                        ))}
                      </div>
                    </button>

                    {/* Error details */}
                    {isExpanded && (
                      <div className="p-3 space-y-3 bg-background">
                        {rowErrors.map(error => (
                          <ErrorItem
                            key={error.id}
                            error={error}
                            onDismiss={onDismiss}
                            onFixAction={onFixAction}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              // Group by category
              Array.from(groupedErrors.entries()).map(([category, categoryErrors]) => {
                const isExpanded = expandedCategories.has(category)
                const hasErrors = categoryErrors.some(e => e.severity === 'error')
                const style = getErrorStyle(hasErrors ? 'error' : 'warning')

                return (
                  <div
                    key={category}
                    className={cn(
                      'border rounded-lg overflow-hidden',
                      style.borderColor
                    )}
                  >
                    {/* Category header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className={cn(
                        'w-full p-3 flex items-center justify-between hover:opacity-80 transition-opacity',
                        style.bgColor
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <div className={style.color}>
                          {getIcon(hasErrors ? 'error' : 'warning')}
                        </div>
                        <div className="text-left">
                          <div className="font-medium">
                            {getCategoryLabel(category as any)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {categoryErrors.length} {t('issueCount', { count: categoryErrors.length })}
                          </div>
                        </div>
                      </div>
                      <Badge variant={hasErrors ? 'destructive' : 'secondary'}>
                        {categoryErrors.filter(e => e.severity === 'error').length} errors
                      </Badge>
                    </button>

                    {/* Error details */}
                    {isExpanded && (
                      <div className="p-3 space-y-3 bg-background">
                        {categoryErrors.map(error => (
                          <ErrorItem
                            key={error.id}
                            error={error}
                            onDismiss={onDismiss}
                            onFixAction={onFixAction}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

/**
 * Individual error item display
 */
function ErrorItem({
  error,
  onDismiss,
  onFixAction,
}: {
  error: ImportError
  onDismiss?: (errorId: string) => void
  onFixAction?: (error: ImportError) => void
}) {
  const t = useTranslations('import.errorDisplay')
  const style = getErrorStyle(error.severity)

  return (
    <div className={cn('p-3 rounded-lg border', style.borderColor, style.bgColor)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          {/* Error message */}
          <div className="flex items-start gap-2">
            <div className={cn('mt-0.5', style.color)}>
              {error.severity === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : error.severity === 'warning' ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <Info className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1">
              <p className={cn('font-medium text-sm', style.color)}>
                {formatErrorMessage(error)}
              </p>
              {error.details && (
                <p className="text-xs text-muted-foreground mt-1">
                  {error.details}
                </p>
              )}
            </div>
          </div>

          {/* Suggestion */}
          {error.suggestion && (
            <div className="flex items-start gap-2 text-xs">
              <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600" />
              <p className="text-muted-foreground">{error.suggestion}</p>
            </div>
          )}

          {/* Fix action */}
          {error.fixAction && onFixAction && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFixAction(error)}
              className="mt-2"
            >
              {error.fixAction.label}
            </Button>
          )}
        </div>

        {/* Dismiss button */}
        {onDismiss && error.severity !== 'error' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDismiss(error.id)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Compact error summary badge
 */
export function ImportErrorSummaryBadge({
  summary,
  onClick,
}: {
  summary: ErrorSummary
  onClick?: () => void
}) {
  const t = useTranslations('import.errorDisplay')

  if (summary.totalErrors === 0 && summary.totalWarnings === 0) {
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        {t('noIssues')}
      </Badge>
    )
  }

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
      {summary.totalErrors > 0 && (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          {summary.totalErrors}
        </Badge>
      )}
      {summary.totalWarnings > 0 && (
        <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <AlertTriangle className="h-3 w-3" />
          {summary.totalWarnings}
        </Badge>
      )}
    </button>
  )
}
