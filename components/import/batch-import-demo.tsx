import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  BatchImportTracker,
  BatchImportTrackerCompact,
} from '@/components/import/batch-import-tracker'
import { useBatchImport } from '@/hooks/useBatchImport'
import type { BatchImportItem } from '@/lib/utils/batch-import-manager'
import { calculateOptimalBatchSize } from '@/lib/utils/batch-import-manager'

/**
 * Demo component for batch import tracking
 */
export function BatchImportDemo() {
  const [view, setView] = useState<'full' | 'compact'>('full')

  // Sample data
  const sampleItems: BatchImportItem[] = Array.from({ length: 500 }, (_, i) => ({
    id: `ITEM-${String(i + 1).padStart(4, '0')}`,
    type: i % 3 === 0 ? 'department' : 'position',
    data: {
      code: `CODE-${i + 1}`,
      name: `Item ${i + 1}`,
      description: `Description for item ${i + 1}`,
    },
  }))

  // Simulated processor that randomly fails some items
  const simulatedProcessor = async (items: BatchImportItem[]) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500))

    const succeeded: BatchImportItem[] = []
    const failed: Array<{ item: BatchImportItem; error: string }> = []

    for (const item of items) {
      // Simulate 10% failure rate
      if (Math.random() > 0.9) {
        failed.push({
          item,
          error: 'Simulated API error',
        })
      } else {
        succeeded.push(item)
      }
    }

    return { succeeded, failed }
  }

  const batchImport = useBatchImport({
    config: {
      batchSize: calculateOptimalBatchSize(sampleItems.length),
      delayBetweenBatches: 200,
      retryAttempts: 2,
      retryDelay: 1000,
    },
    onComplete: (result) => {
      console.log('Import complete:', result)
      if (result.success) {
        alert(`Import completed successfully!\nProcessed: ${result.status.processed}`)
      } else {
        alert(
          `Import completed with errors.\nSucceeded: ${result.status.succeeded}\nFailed: ${result.status.failed}`
        )
      }
    },
    onError: (error) => {
      console.error('Import error:', error)
      alert(`Import failed: ${error.message}`)
    },
  })

  const handleStartImport = () => {
    batchImport.initialize(sampleItems, simulatedProcessor)
    batchImport.start()
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Batch Import Demo</h2>
          <p className="text-muted-foreground">
            Demonstrating batch import with 500 items, progress tracking, and error handling
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'full' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('full')}
          >
            Full View
          </Button>
          <Button
            variant={view === 'compact' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('compact')}
          >
            Compact View
          </Button>
        </div>
      </div>

      {/* Control buttons */}
      {!batchImport.status.isComplete && batchImport.status.total === 0 && (
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Ready to Import</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This demo will import {sampleItems.length} items in batches. About 10% will fail and
                be retried automatically.
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Batch size: {calculateOptimalBatchSize(sampleItems.length)} items per batch
              </p>
            </div>
            <Button onClick={handleStartImport} size="lg">
              Start Import
            </Button>
          </div>
        </Card>
      )}

      {/* Batch tracker */}
      {batchImport.status.total > 0 &&
        (view === 'full' ? (
          <BatchImportTracker
            status={batchImport.status}
            onPause={batchImport.pause}
            onResume={batchImport.resume}
            onCancel={batchImport.cancel}
          />
        ) : (
          <BatchImportTrackerCompact status={batchImport.status} />
        ))}

      {/* Reset button */}
      {batchImport.status.isComplete && (
        <div className="flex justify-center">
          <Button onClick={batchImport.reset} variant="outline">
            Reset Demo
          </Button>
        </div>
      )}

      {/* Features list */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Features Demonstrated</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <div>
                <div className="font-medium">Batch Processing</div>
                <div className="text-muted-foreground">
                  Items processed in optimal batches to prevent overload
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <div>
                <div className="font-medium">Progress Tracking</div>
                <div className="text-muted-foreground">
                  Real-time progress with current batch indicator
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <div>
                <div className="font-medium">ETA & Speed</div>
                <div className="text-muted-foreground">
                  Automatic calculation of remaining time and processing speed
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <div>
                <div className="font-medium">Retry Logic</div>
                <div className="text-muted-foreground">
                  Failed items automatically retried up to 2 times
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <div>
                <div className="font-medium">Pause/Resume</div>
                <div className="text-muted-foreground">
                  User can pause and resume import at any time
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <div>
                <div className="font-medium">Cancellation</div>
                <div className="text-muted-foreground">
                  Import can be cancelled mid-process
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
