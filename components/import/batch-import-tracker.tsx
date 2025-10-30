import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Play,
  Pause,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Zap,
  Package,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  type BatchImportStatus,
  formatElapsedTime,
  formatETA,
} from '@/lib/utils/batch-import-manager'
import { cn } from '@/lib/utils'

interface BatchImportTrackerProps {
  status: BatchImportStatus
  onPause?: () => void
  onResume?: () => void
  onCancel?: () => void
  className?: string
  showDetails?: boolean
}

export function BatchImportTracker({
  status,
  onPause,
  onResume,
  onCancel,
  className,
  showDetails = true,
}: BatchImportTrackerProps) {
  const t = useTranslations('import.batch')
  const [animatedProgress, setAnimatedProgress] = useState(0)

  // Animate progress changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(status.progress)
    }, 50)
    return () => clearTimeout(timer)
  }, [status.progress])

  const isActive = !status.isPaused && !status.isCancelled && !status.isComplete
  const canPause = isActive && onPause
  const canResume = status.isPaused && !status.isCancelled && !status.isComplete && onResume
  const canCancel = !status.isComplete && !status.isCancelled && onCancel

  return (
    <Card className={cn('border-2', getStatusBorderColor(status), className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', getStatusTextColor(status))}>
              {getStatusIcon(status)}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {getStatusLabel(status, t)}
              </CardTitle>
              <CardDescription>
                {status.processed.toLocaleString()} / {status.total.toLocaleString()} {t('items')}
              </CardDescription>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {canPause && (
              <Button variant="outline" size="sm" onClick={onPause}>
                <Pause className="h-4 w-4 mr-2" />
                {t('pause')}
              </Button>
            )}
            {canResume && (
              <Button variant="default" size="sm" onClick={onResume}>
                <Play className="h-4 w-4 mr-2" />
                {t('resume')}
              </Button>
            )}
            {canCancel && (
              <Button variant="destructive" size="sm" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                {t('cancel')}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{status.progress}%</span>
            <Badge variant="secondary" className="font-mono">
              Batch {status.currentBatch} / {status.totalBatches}
            </Badge>
          </div>
          <Progress value={animatedProgress} className="h-3" />
        </div>

        {/* Statistics grid */}
        {showDetails && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Succeeded */}
            <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-950">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-xs text-muted-foreground">{t('succeeded')}</span>
              </div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {status.succeeded.toLocaleString()}
              </div>
            </div>

            {/* Failed */}
            <div className="p-3 rounded-lg border bg-red-50 dark:bg-red-950">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-xs text-muted-foreground">{t('failed')}</span>
              </div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {status.failed.toLocaleString()}
              </div>
            </div>

            {/* Elapsed time */}
            <div className="p-3 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs text-muted-foreground">{t('elapsed')}</span>
              </div>
              <div className="text-lg font-bold">
                {formatElapsedTime(status.elapsedTime)}
              </div>
            </div>

            {/* Speed */}
            <div className="p-3 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4" />
                <span className="text-xs text-muted-foreground">{t('speed')}</span>
              </div>
              <div className="text-lg font-bold">
                {status.speed ? `${status.speed}/s` : '-'}
              </div>
            </div>
          </div>
        )}

        {/* ETA */}
        {isActive && status.estimatedTimeRemaining !== undefined && (
          <div className="flex items-center justify-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <Clock className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {formatETA(status.estimatedTimeRemaining)}
            </span>
          </div>
        )}

        {/* Retrying indicator */}
        {status.retrying > 0 && (
          <div className="flex items-center justify-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
            <Loader2 className="h-4 w-4 text-yellow-600 mr-2 animate-spin" />
            <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              {t('retrying')} {status.retrying} {t('items')}
            </span>
          </div>
        )}

        {/* Paused message */}
        {status.isPaused && (
          <div className="flex items-center justify-center p-3 rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
            <Pause className="h-4 w-4 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('paused')}
            </span>
          </div>
        )}

        {/* Cancelled message */}
        {status.isCancelled && (
          <div className="flex items-center justify-center p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <X className="h-4 w-4 text-red-600 mr-2" />
            <span className="text-sm font-medium text-red-700 dark:text-red-300">
              {t('cancelled')}
            </span>
          </div>
        )}

        {/* Complete message */}
        {status.isComplete && !status.isCancelled && (
          <div className="flex items-center justify-center p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              {t('complete')} • {formatElapsedTime(status.elapsedTime)}
            </span>
          </div>
        )}

        {/* Error summary */}
        {showDetails && status.errors.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                {t('errors')} ({status.errors.length})
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {status.errors.slice(0, 5).map((error, index) => (
                  <div
                    key={index}
                    className="text-xs p-2 rounded bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                  >
                    <span className="font-medium">{error.itemId}:</span>{' '}
                    <span className="text-muted-foreground">{error.error}</span>
                  </div>
                ))}
                {status.errors.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center pt-1">
                    +{status.errors.length - 5} {t('moreErrors')}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Compact batch tracker
 */
export function BatchImportTrackerCompact({
  status,
  className,
}: {
  status: BatchImportStatus
  className?: string
}) {
  const t = useTranslations('import.batch')

  return (
    <div className={cn('p-4 rounded-lg border', getStatusBorderColor(status), className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={getStatusTextColor(status)}>{getStatusIcon(status)}</div>
          <div>
            <div className="font-medium text-sm">{getStatusLabel(status, t)}</div>
            <div className="text-xs text-muted-foreground">
              {status.processed} / {status.total} {t('items')}
            </div>
          </div>
        </div>
        <Badge variant="secondary" className="font-mono text-xs">
          {status.progress}%
        </Badge>
      </div>

      <Progress value={status.progress} className="h-2 mb-2" />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          ✓ {status.succeeded} • ✗ {status.failed}
        </span>
        {status.estimatedTimeRemaining !== undefined && !status.isComplete && (
          <span>{formatETA(status.estimatedTimeRemaining)}</span>
        )}
        {status.isComplete && <span>{formatElapsedTime(status.elapsedTime)}</span>}
      </div>
    </div>
  )
}

/**
 * Helper functions
 */
function getStatusIcon(status: BatchImportStatus) {
  const iconClass = 'h-5 w-5'

  if (status.isComplete && !status.isCancelled) {
    return <CheckCircle2 className={iconClass} />
  }
  if (status.isCancelled) {
    return <X className={iconClass} />
  }
  if (status.isPaused) {
    return <Pause className={iconClass} />
  }
  return <Loader2 className={cn(iconClass, 'animate-spin')} />
}

function getStatusLabel(status: BatchImportStatus, t: any): string {
  if (status.isComplete && !status.isCancelled) {
    return t('importComplete')
  }
  if (status.isCancelled) {
    return t('importCancelled')
  }
  if (status.isPaused) {
    return t('importPaused')
  }
  return t('importing')
}

function getStatusTextColor(status: BatchImportStatus): string {
  if (status.isComplete && !status.isCancelled) {
    return 'text-green-700 dark:text-green-300'
  }
  if (status.isCancelled) {
    return 'text-red-700 dark:text-red-300'
  }
  if (status.isPaused) {
    return 'text-gray-700 dark:text-gray-300'
  }
  return 'text-blue-700 dark:text-blue-300'
}

function getStatusBorderColor(status: BatchImportStatus): string {
  if (status.isComplete && !status.isCancelled) {
    return 'border-green-200 dark:border-green-800'
  }
  if (status.isCancelled) {
    return 'border-red-200 dark:border-red-800'
  }
  if (status.isPaused) {
    return 'border-gray-200 dark:border-gray-800'
  }
  return 'border-blue-200 dark:border-blue-800'
}
