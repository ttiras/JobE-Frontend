import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BatchImportManager,
  type BatchImportConfig,
  type BatchImportStatus,
  type BatchImportResult,
  type BatchImportItem,
} from '@/lib/utils/batch-import-manager'

interface UseBatchImportOptions {
  config: BatchImportConfig
  onComplete?: (result: BatchImportResult) => void
  onError?: (error: Error) => void
}

export function useBatchImport({ config, onComplete, onError }: UseBatchImportOptions) {
  const [status, setStatus] = useState<BatchImportStatus>({
    total: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    retrying: 0,
    currentBatch: 0,
    totalBatches: 0,
    progress: 0,
    estimatedTimeRemaining: undefined,
    speed: undefined,
    startTime: 0,
    elapsedTime: 0,
    isPaused: false,
    isCancelled: false,
    isComplete: false,
    errors: [],
  })

  const managerRef = useRef<BatchImportManager | null>(null)

  /**
   * Initialize the batch import
   */
  const initialize = useCallback(
    (
      items: BatchImportItem[],
      processor: (items: BatchImportItem[]) => Promise<{
        succeeded: BatchImportItem[]
        failed: Array<{ item: BatchImportItem; error: string }>
      }>
    ) => {
      // Clean up existing manager
      if (managerRef.current) {
        managerRef.current.dispose()
      }

      // Create new manager
      const manager = new BatchImportManager(config)
      managerRef.current = manager

      // Subscribe to status updates
      manager.subscribe((newStatus) => {
        setStatus(newStatus)
      })

      // Initialize with items and processor
      manager.initialize(items, processor)

      return manager
    },
    [config]
  )

  /**
   * Start the import
   */
  const start = useCallback(async () => {
    if (!managerRef.current) {
      throw new Error('BatchImportManager not initialized. Call initialize() first.')
    }

    try {
      const result = await managerRef.current.start()

      if (onComplete) {
        onComplete(result)
      }

      return result
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error)
      }
      throw error
    }
  }, [onComplete, onError])

  /**
   * Pause the import
   */
  const pause = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.pause()
    }
  }, [])

  /**
   * Resume the import
   */
  const resume = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.resume()
    }
  }, [])

  /**
   * Cancel the import
   */
  const cancel = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.cancel()
    }
  }, [])

  /**
   * Reset the import
   */
  const reset = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.reset()
      setStatus(managerRef.current.getStatus())
    }
  }, [])

  /**
   * Clean up on unmount
   */
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.dispose()
      }
    }
  }, [])

  return {
    status,
    initialize,
    start,
    pause,
    resume,
    cancel,
    reset,
    manager: managerRef.current,
  }
}
