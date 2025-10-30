import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Copy,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Merge,
  Trash2,
  FileCheck,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  type DuplicateDetectionResult,
  type DuplicateEntry,
  type DuplicateResolutionStrategy,
  type DuplicateResolution,
  resolveDuplicate,
  autoResolveAll,
  getStrategyLabel,
  getStrategyDescription,
} from '@/lib/utils/duplicate-detector'
import { cn } from '@/lib/utils'

interface DuplicateDetectionDisplayProps {
  detectionResult: DuplicateDetectionResult
  onResolve?: (resolutions: DuplicateResolution[]) => void
  onAutoResolve?: () => void
  className?: string
}

export function DuplicateDetectionDisplay({
  detectionResult,
  onResolve,
  onAutoResolve,
  className,
}: DuplicateDetectionDisplayProps) {
  const t = useTranslations('import.duplicates')
  const [expandedDuplicates, setExpandedDuplicates] = useState<Set<string>>(new Set())
  const [selectedStrategies, setSelectedStrategies] = useState<
    Map<string, DuplicateResolutionStrategy>
  >(new Map())
  const [viewSheet, setViewSheet] = useState<'all' | 'departments' | 'positions'>('all')

  // Initialize selected strategies with recommended ones
  if (selectedStrategies.size === 0 && detectionResult.hasDuplicates) {
    const initial = new Map<string, DuplicateResolutionStrategy>()
    detectionResult.departments.duplicates.forEach((dup) => {
      initial.set(`dept-${dup.value}`, dup.recommendedStrategy)
    })
    detectionResult.positions.duplicates.forEach((dup) => {
      initial.set(`pos-${dup.value}`, dup.recommendedStrategy)
    })
    setSelectedStrategies(initial)
  }

  const toggleDuplicate = (key: string) => {
    const newExpanded = new Set(expandedDuplicates)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedDuplicates(newExpanded)
  }

  const handleStrategyChange = (key: string, strategy: DuplicateResolutionStrategy) => {
    const newStrategies = new Map(selectedStrategies)
    newStrategies.set(key, strategy)
    setSelectedStrategies(newStrategies)
  }

  const handleResolveAll = () => {
    const resolutions: DuplicateResolution[] = []

    // Resolve departments
    detectionResult.departments.duplicates.forEach((dup) => {
      const key = `dept-${dup.value}`
      const strategy = selectedStrategies.get(key) || dup.recommendedStrategy
      resolutions.push(resolveDuplicate(dup, strategy))
    })

    // Resolve positions
    detectionResult.positions.duplicates.forEach((dup) => {
      const key = `pos-${dup.value}`
      const strategy = selectedStrategies.get(key) || dup.recommendedStrategy
      resolutions.push(resolveDuplicate(dup, strategy))
    })

    onResolve?.(resolutions)
  }

  const handleAutoResolve = () => {
    const resolutions = autoResolveAll(detectionResult)
    onResolve?.(resolutions)
    onAutoResolve?.()
  }

  if (!detectionResult.hasDuplicates) {
    return (
      <Card className={cn('border-2 border-green-200 dark:border-green-800', className)}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-green-700 dark:text-green-300">
            <CheckCircle2 className="h-6 w-6" />
            <div>
              <p className="font-semibold">{t('noDuplicates')}</p>
              <p className="text-sm text-muted-foreground">{t('noDuplicatesDesc')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const visibleDuplicates = {
    departments:
      viewSheet === 'all' || viewSheet === 'departments'
        ? detectionResult.departments.duplicates
        : [],
    positions:
      viewSheet === 'all' || viewSheet === 'positions'
        ? detectionResult.positions.duplicates
        : [],
  }

  return (
    <Card className={cn('border-2 border-yellow-200 dark:border-yellow-800', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              {t('title')}
            </CardTitle>
            <CardDescription>
              <span className="text-yellow-700 dark:text-yellow-300 font-medium">
                {detectionResult.totalDuplicates} {t('duplicateCount')}
              </span>
              {' • '}
              <span>{detectionResult.totalAffectedRows} {t('affectedRows')}</span>
              {detectionResult.autoResolvable > 0 && (
                <>
                  {' • '}
                  <span className="text-green-600">
                    {detectionResult.autoResolvable} {t('autoResolvable')}
                  </span>
                </>
              )}
            </CardDescription>
          </div>

          {/* View filter */}
          <div className="flex gap-2">
            <Button
              variant={viewSheet === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewSheet('all')}
            >
              {t('all')}
            </Button>
            {detectionResult.departments.totalDuplicates > 0 && (
              <Button
                variant={viewSheet === 'departments' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewSheet('departments')}
              >
                {t('departments')} ({detectionResult.departments.totalDuplicates})
              </Button>
            )}
            {detectionResult.positions.totalDuplicates > 0 && (
              <Button
                variant={viewSheet === 'positions' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewSheet('positions')}
              >
                {t('positions')} ({detectionResult.positions.totalDuplicates})
              </Button>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          {detectionResult.autoResolvable > 0 && (
            <Button onClick={handleAutoResolve} variant="default" size="sm">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {t('autoResolve')}
            </Button>
          )}
          <Button onClick={handleResolveAll} variant="outline" size="sm">
            <FileCheck className="h-4 w-4 mr-2" />
            {t('resolveAll')}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea style={{ maxHeight: '600px' }} className="pr-4">
          <div className="space-y-4">
            {/* Department duplicates */}
            {visibleDuplicates.departments.length > 0 && (
              <div className="space-y-2">
                {viewSheet === 'all' && (
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    {t('departments')}
                  </h3>
                )}
                {visibleDuplicates.departments.map((duplicate) => (
                  <DuplicateItem
                    key={`dept-${duplicate.value}`}
                    duplicate={duplicate}
                    sheet="departments"
                    expanded={expandedDuplicates.has(`dept-${duplicate.value}`)}
                    onToggle={() => toggleDuplicate(`dept-${duplicate.value}`)}
                    selectedStrategy={
                      selectedStrategies.get(`dept-${duplicate.value}`) ||
                      duplicate.recommendedStrategy
                    }
                    onStrategyChange={(strategy) =>
                      handleStrategyChange(`dept-${duplicate.value}`, strategy)
                    }
                  />
                ))}
              </div>
            )}

            {/* Separator */}
            {visibleDuplicates.departments.length > 0 &&
              visibleDuplicates.positions.length > 0 &&
              viewSheet === 'all' && <Separator />}

            {/* Position duplicates */}
            {visibleDuplicates.positions.length > 0 && (
              <div className="space-y-2">
                {viewSheet === 'all' && (
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    {t('positions')}
                  </h3>
                )}
                {visibleDuplicates.positions.map((duplicate) => (
                  <DuplicateItem
                    key={`pos-${duplicate.value}`}
                    duplicate={duplicate}
                    sheet="positions"
                    expanded={expandedDuplicates.has(`pos-${duplicate.value}`)}
                    onToggle={() => toggleDuplicate(`pos-${duplicate.value}`)}
                    selectedStrategy={
                      selectedStrategies.get(`pos-${duplicate.value}`) ||
                      duplicate.recommendedStrategy
                    }
                    onStrategyChange={(strategy) =>
                      handleStrategyChange(`pos-${duplicate.value}`, strategy)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

/**
 * Individual duplicate item
 */
function DuplicateItem({
  duplicate,
  sheet,
  expanded,
  onToggle,
  selectedStrategy,
  onStrategyChange,
}: {
  duplicate: DuplicateEntry
  sheet: 'departments' | 'positions'
  expanded: boolean
  onToggle: () => void
  selectedStrategy: DuplicateResolutionStrategy
  onStrategyChange: (strategy: DuplicateResolutionStrategy) => void
}) {
  const t = useTranslations('import.duplicates')

  const strategies: DuplicateResolutionStrategy[] = [
    'keep-first',
    'keep-last',
    'merge',
    'keep-all',
  ]

  return (
    <div className="border rounded-lg overflow-hidden border-yellow-200 dark:border-yellow-800">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between bg-yellow-50 dark:bg-yellow-950 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <Copy className="h-5 w-5 text-yellow-700 dark:text-yellow-300" />
          <div className="text-left">
            <div className="font-medium">
              {sheet === 'departments' ? t('departmentCode') : t('positionCode')}: {duplicate.value}
            </div>
            <div className="text-sm text-muted-foreground">
              {duplicate.rows.length} {t('occurrences')}
              {duplicate.reason && ` • ${duplicate.reason}`}
            </div>
          </div>
        </div>
        <Badge variant={duplicate.recommendedStrategy === 'merge' ? 'default' : 'secondary'}>
          {getStrategyLabel(duplicate.recommendedStrategy)}
        </Badge>
      </button>

      {/* Details */}
      {expanded && (
        <div className="p-4 space-y-4 bg-background">
          {/* Strategy selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t('resolutionStrategy')}:</label>
            <div className="grid grid-cols-2 gap-2">
              {strategies.map((strategy) => (
                <button
                  key={strategy}
                  onClick={() => onStrategyChange(strategy)}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all',
                    selectedStrategy === strategy
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {strategy === 'merge' && <Merge className="h-4 w-4" />}
                    {strategy === 'keep-first' && <CheckCircle2 className="h-4 w-4" />}
                    {strategy === 'keep-last' && <CheckCircle2 className="h-4 w-4" />}
                    {strategy === 'keep-all' && <Copy className="h-4 w-4" />}
                    <span className="font-medium text-sm">{getStrategyLabel(strategy)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getStrategyDescription(strategy)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Row comparison */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t('compareEntries')}:</label>
            <div className="space-y-2">
              {duplicate.rows.map((row, index) => (
                <div
                  key={row.rowNumber}
                  className={cn(
                    'p-3 rounded-lg border',
                    row.isComplete
                      ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950'
                      : 'border-border bg-muted/50'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Row {row.rowNumber}</Badge>
                      {index === 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {t('mostComplete')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{row.completeness}% {t('complete')}</span>
                      {row.isComplete && (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                  </div>

                  {/* Data fields */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(row.data)
                      .filter(([key]) => key !== 'row')
                      .map(([key, value]) => (
                        <div key={key}>
                          <span className="text-muted-foreground">{key}:</span>{' '}
                          <span className={cn(
                            row.differences?.includes(key) && 'font-semibold text-yellow-700 dark:text-yellow-300'
                          )}>
                            {value || '-'}
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* Differences highlight */}
                  {row.differences && row.differences.length > 0 && (
                    <div className="mt-2 text-xs text-yellow-700 dark:text-yellow-300">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />
                      {t('differentFields')}: {row.differences.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Compact summary badge
 */
export function DuplicateSummaryBadge({
  detectionResult,
  onClick,
}: {
  detectionResult: DuplicateDetectionResult
  onClick?: () => void
}) {
  const t = useTranslations('import.duplicates')

  if (!detectionResult.hasDuplicates) {
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        {t('noDuplicates')}
      </Badge>
    )
  }

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
      <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        <Copy className="h-3 w-3" />
        {detectionResult.totalDuplicates} {t('duplicates')}
      </Badge>
    </button>
  )
}
