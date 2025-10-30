import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Upload,
  FileText,
  CheckCircle2,
  Settings,
  Database,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  type ProgressState,
  type ProgressStage,
  formatTimeRemaining,
  formatSpeed,
  formatBytes,
} from '@/lib/utils/import-progress-tracker'
import { cn } from '@/lib/utils'

interface ImportProgressIndicatorProps {
  progressState: ProgressState
  className?: string
  showDetails?: boolean
}

/**
 * Get icon for each stage
 */
function getStageIcon(stage: ProgressStage): React.ReactNode {
  const iconClass = 'h-5 w-5'
  
  switch (stage) {
    case 'uploading':
      return <Upload className={iconClass} />
    case 'parsing':
      return <FileText className={iconClass} />
    case 'validating':
      return <CheckCircle2 className={iconClass} />
    case 'processing':
      return <Settings className={iconClass} />
    case 'importing':
      return <Database className={iconClass} />
    case 'complete':
      return <Check className={iconClass} />
    case 'error':
      return <AlertCircle className={iconClass} />
    default:
      return <Loader2 className={cn(iconClass, 'animate-spin')} />
  }
}

/**
 * Get color classes for each stage
 */
function getStageColor(stage: ProgressStage): {
  bg: string
  text: string
  border: string
} {
  switch (stage) {
    case 'uploading':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
      }
    case 'parsing':
      return {
        bg: 'bg-indigo-50 dark:bg-indigo-950',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-800',
      }
    case 'validating':
      return {
        bg: 'bg-purple-50 dark:bg-purple-950',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800',
      }
    case 'processing':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950',
        text: 'text-yellow-700 dark:text-yellow-300',
        border: 'border-yellow-200 dark:border-yellow-800',
      }
    case 'importing':
      return {
        bg: 'bg-green-50 dark:bg-green-950',
        text: 'text-green-700 dark:text-green-300',
        border: 'border-green-200 dark:border-green-800',
      }
    case 'complete':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
      }
    case 'error':
      return {
        bg: 'bg-red-50 dark:bg-red-950',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800',
      }
    default:
      return {
        bg: 'bg-gray-50 dark:bg-gray-950',
        text: 'text-gray-700 dark:text-gray-300',
        border: 'border-gray-200 dark:border-gray-800',
      }
  }
}

/**
 * Get stage label
 */
function getStageLabel(stage: ProgressStage, t: (key: string) => string): string {
  switch (stage) {
    case 'idle':
      return t('stages.idle')
    case 'uploading':
      return t('stages.uploading')
    case 'parsing':
      return t('stages.parsing')
    case 'validating':
      return t('stages.validating')
    case 'processing':
      return t('stages.processing')
    case 'importing':
      return t('stages.importing')
    case 'complete':
      return t('stages.complete')
    case 'error':
      return t('stages.error')
  }
}

export function ImportProgressIndicator({
  progressState,
  className,
  showDetails = true,
}: ImportProgressIndicatorProps) {
  const t = useTranslations('import.progress')
  const [animatedProgress, setAnimatedProgress] = useState(0)

  // Animate progress changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progressState.progress)
    }, 50)
    return () => clearTimeout(timer)
  }, [progressState.progress])

  const colors = getStageColor(progressState.stage)
  const isActive = progressState.stage !== 'idle' && progressState.stage !== 'complete' && progressState.stage !== 'error'

  return (
    <Card className={cn('border-2', colors.border, className)}>
      <CardContent className={cn('p-6', colors.bg)}>
        {/* Stage Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', colors.text)}>
              {getStageIcon(progressState.stage)}
            </div>
            <div>
              <h3 className={cn('font-semibold text-lg', colors.text)}>
                {getStageLabel(progressState.stage, t)}
              </h3>
              {progressState.message && (
                <p className="text-sm text-muted-foreground">
                  {progressState.message}
                </p>
              )}
            </div>
          </div>

          {/* Progress Badge */}
          {isActive && (
            <Badge variant="secondary" className="font-mono">
              {progressState.progress}%
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        {isActive && (
          <div className="space-y-2">
            <Progress 
              value={animatedProgress} 
              className="h-3"
            />
            
            {/* Details */}
            {showDetails && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  {/* Items count */}
                  {progressState.currentItem !== undefined && progressState.totalItems !== undefined && (
                    <span>
                      {progressState.stage === 'uploading' 
                        ? `${formatBytes(progressState.currentItem)} / ${formatBytes(progressState.totalItems)}`
                        : `${progressState.currentItem.toLocaleString()} / ${progressState.totalItems.toLocaleString()}`
                      }
                    </span>
                  )}

                  {/* Speed */}
                  {progressState.speed !== undefined && progressState.speed > 0 && (
                    <span className="text-muted-foreground">
                      {progressState.stage === 'uploading'
                        ? formatSpeed(progressState.speed, 'KB')
                        : formatSpeed(progressState.speed, t('items'))}
                    </span>
                  )}
                </div>

                {/* ETA */}
                {progressState.estimatedTimeRemaining !== undefined && (
                  <span className="font-medium">
                    {formatTimeRemaining(progressState.estimatedTimeRemaining)}
                  </span>
                )}
              </div>
            )}

            {/* Errors and Warnings */}
            {showDetails && (progressState.errors !== undefined || progressState.warnings !== undefined) && (
              <div className="flex items-center gap-4 pt-2 text-xs">
                {progressState.errors !== undefined && progressState.errors > 0 && (
                  <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-3 w-3" />
                    <span>{progressState.errors} {t('errors')}</span>
                  </div>
                )}
                {progressState.warnings !== undefined && progressState.warnings > 0 && (
                  <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                    <AlertCircle className="h-3 w-3" />
                    <span>{progressState.warnings} {t('warnings')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Complete/Error state */}
        {progressState.stage === 'complete' && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <Check className="h-4 w-4" />
            <span>{t('successMessage')}</span>
          </div>
        )}

        {progressState.stage === 'error' && (
          <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="h-4 w-4" />
            <span>{progressState.message || t('errorMessage')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Compact version for inline display
 */
export function ImportProgressCompact({
  progressState,
  className,
}: Omit<ImportProgressIndicatorProps, 'showDetails'>) {
  const t = useTranslations('import.progress')
  const colors = getStageColor(progressState.stage)
  const isActive = progressState.stage !== 'idle' && progressState.stage !== 'complete' && progressState.stage !== 'error'

  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-lg border', colors.border, colors.bg, className)}>
      <div className={colors.text}>
        {getStageIcon(progressState.stage)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={cn('text-sm font-medium truncate', colors.text)}>
            {getStageLabel(progressState.stage, t)}
          </span>
          {isActive && (
            <span className="text-xs font-mono ml-2">
              {progressState.progress}%
            </span>
          )}
        </div>
        {isActive && (
          <Progress value={progressState.progress} className="h-1.5" />
        )}
        {progressState.message && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {progressState.message}
          </p>
        )}
      </div>
    </div>
  )
}
