/**
 * Batch Import Manager
 * Handles large imports with progress tracking, ETA, and cancellation
 */

export interface BatchImportConfig {
  batchSize: number // Number of items to process in each batch
  delayBetweenBatches?: number // Delay in ms between batches (to prevent overload)
  maxConcurrent?: number // Maximum concurrent operations
  retryAttempts?: number // Number of retry attempts for failed items
  retryDelay?: number // Delay in ms before retry
}

export interface BatchImportItem {
  id: string
  data: Record<string, any>
  type: 'department' | 'position'
}

export interface BatchImportStatus {
  total: number
  processed: number
  succeeded: number
  failed: number
  retrying: number
  currentBatch: number
  totalBatches: number
  progress: number // 0-100
  estimatedTimeRemaining?: number // seconds
  speed?: number // items per second
  startTime: number
  elapsedTime: number // seconds
  isPaused: boolean
  isCancelled: boolean
  isComplete: boolean
  errors: BatchImportError[]
}

export interface BatchImportError {
  itemId: string
  itemType: 'department' | 'position'
  attempt: number
  error: string
  data: Record<string, any>
}

export interface BatchImportResult {
  success: boolean
  status: BatchImportStatus
  successfulItems: BatchImportItem[]
  failedItems: BatchImportItem[]
  errors: BatchImportError[]
}

type ProgressCallback = (status: BatchImportStatus) => void
type BatchProcessor = (items: BatchImportItem[]) => Promise<{
  succeeded: BatchImportItem[]
  failed: Array<{ item: BatchImportItem; error: string }>
}>

/**
 * Batch Import Manager
 */
export class BatchImportManager {
  private config: Required<BatchImportConfig>
  private items: BatchImportItem[] = []
  private status: BatchImportStatus
  private callbacks: Set<ProgressCallback> = new Set()
  private abortController?: AbortController
  private isPaused = false
  private isCancelled = false
  private startTime?: number
  private processor?: BatchProcessor

  constructor(config: BatchImportConfig) {
    this.config = {
      batchSize: config.batchSize,
      delayBetweenBatches: config.delayBetweenBatches ?? 100,
      maxConcurrent: config.maxConcurrent ?? 1,
      retryAttempts: config.retryAttempts ?? 2,
      retryDelay: config.retryDelay ?? 1000,
    }

    this.status = {
      total: 0,
      processed: 0,
      succeeded: 0,
      failed: 0,
      retrying: 0,
      currentBatch: 0,
      totalBatches: 0,
      progress: 0,
      startTime: 0,
      elapsedTime: 0,
      isPaused: false,
      isCancelled: false,
      isComplete: false,
      errors: [],
    }
  }

  /**
   * Subscribe to status updates
   */
  subscribe(callback: ProgressCallback): () => void {
    this.callbacks.add(callback)
    callback(this.status)
    return () => this.callbacks.delete(callback)
  }

  /**
   * Notify all subscribers
   */
  private notify(): void {
    this.callbacks.forEach((callback) => callback({ ...this.status }))
  }

  /**
   * Update status
   */
  private updateStatus(updates: Partial<BatchImportStatus>): void {
    this.status = { ...this.status, ...updates }
    
    // Calculate elapsed time
    if (this.startTime) {
      this.status.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000)
    }

    // Calculate progress
    if (this.status.total > 0) {
      this.status.progress = Math.round((this.status.processed / this.status.total) * 100)
    }

    // Calculate speed and ETA
    if (this.status.elapsedTime > 0) {
      this.status.speed = Math.round((this.status.processed / this.status.elapsedTime) * 10) / 10
      
      const remaining = this.status.total - this.status.processed
      if (this.status.speed > 0) {
        this.status.estimatedTimeRemaining = Math.ceil(remaining / this.status.speed)
      }
    }

    this.notify()
  }

  /**
   * Initialize import
   */
  initialize(items: BatchImportItem[], processor: BatchProcessor): void {
    this.items = [...items]
    this.processor = processor
    this.startTime = Date.now()
    this.isPaused = false
    this.isCancelled = false
    this.abortController = new AbortController()

    const totalBatches = Math.ceil(items.length / this.config.batchSize)

    this.updateStatus({
      total: items.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      retrying: 0,
      currentBatch: 0,
      totalBatches,
      progress: 0,
      startTime: this.startTime,
      elapsedTime: 0,
      isPaused: false,
      isCancelled: false,
      isComplete: false,
      errors: [],
    })
  }

  /**
   * Start or resume import
   */
  async start(): Promise<BatchImportResult> {
    if (!this.processor || this.items.length === 0) {
      throw new Error('Import not initialized. Call initialize() first.')
    }

    this.isPaused = false
    this.updateStatus({ isPaused: false })

    const successfulItems: BatchImportItem[] = []
    const failedItems: BatchImportItem[] = []
    const errors: BatchImportError[] = []

    // Process items in batches
    for (let i = 0; i < this.items.length; i += this.config.batchSize) {
      // Check for cancellation
      if (this.isCancelled) {
        this.updateStatus({ isCancelled: true, isComplete: true })
        break
      }

      // Check for pause
      while (this.isPaused && !this.isCancelled) {
        await this.sleep(100)
      }

      const batchNumber = Math.floor(i / this.config.batchSize) + 1
      const batch = this.items.slice(i, i + this.config.batchSize)

      this.updateStatus({ currentBatch: batchNumber })

      try {
        // Process batch with retry logic
        const result = await this.processBatchWithRetry(batch)

        successfulItems.push(...result.succeeded)
        
        for (const failed of result.failed) {
          failedItems.push(failed.item)
          errors.push({
            itemId: failed.item.id,
            itemType: failed.item.type,
            attempt: this.config.retryAttempts + 1,
            error: failed.error,
            data: failed.item.data,
          })
        }

        this.updateStatus({
          processed: i + batch.length,
          succeeded: this.status.succeeded + result.succeeded.length,
          failed: this.status.failed + result.failed.length,
          errors: [...this.status.errors, ...errors],
        })

        // Delay between batches
        if (i + this.config.batchSize < this.items.length && this.config.delayBetweenBatches > 0) {
          await this.sleep(this.config.delayBetweenBatches)
        }
      } catch (error) {
        console.error('Batch processing error:', error)
        
        // Mark all items in batch as failed
        batch.forEach((item) => {
          failedItems.push(item)
          errors.push({
            itemId: item.id,
            itemType: item.type,
            attempt: 1,
            error: error instanceof Error ? error.message : 'Unknown error',
            data: item.data,
          })
        })

        this.updateStatus({
          processed: this.status.processed + batch.length,
          failed: this.status.failed + batch.length,
          errors: [...this.status.errors, ...errors],
        })
      }
    }

    this.updateStatus({ isComplete: true })

    return {
      success: failedItems.length === 0 && !this.isCancelled,
      status: { ...this.status },
      successfulItems,
      failedItems,
      errors,
    }
  }

  /**
   * Process batch with retry logic
   */
  private async processBatchWithRetry(
    batch: BatchImportItem[]
  ): Promise<{
    succeeded: BatchImportItem[]
    failed: Array<{ item: BatchImportItem; error: string }>
  }> {
    let itemsToProcess = [...batch]
    const succeeded: BatchImportItem[] = []
    const failed: Array<{ item: BatchImportItem; error: string }> = []

    for (let attempt = 1; attempt <= this.config.retryAttempts + 1; attempt++) {
      if (itemsToProcess.length === 0) break

      try {
        const result = await this.processor!(itemsToProcess)
        
        succeeded.push(...result.succeeded)
        
        // Items that failed this attempt
        if (attempt < this.config.retryAttempts + 1 && result.failed.length > 0) {
          // Retry failed items
          this.updateStatus({ retrying: result.failed.length })
          await this.sleep(this.config.retryDelay)
          itemsToProcess = result.failed.map((f) => f.item)
        } else {
          // Final attempt, add to failed
          failed.push(...result.failed)
        }
      } catch (error) {
        // If processing fails, mark all items as failed
        itemsToProcess.forEach((item) => {
          failed.push({
            item,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        })
        break
      }
    }

    this.updateStatus({ retrying: 0 })
    return { succeeded, failed }
  }

  /**
   * Pause import
   */
  pause(): void {
    this.isPaused = true
    this.updateStatus({ isPaused: true })
  }

  /**
   * Resume import
   */
  resume(): void {
    this.isPaused = false
    this.updateStatus({ isPaused: false })
  }

  /**
   * Cancel import
   */
  cancel(): void {
    this.isCancelled = true
    this.abortController?.abort()
    this.updateStatus({ isCancelled: true, isComplete: true })
  }

  /**
   * Get current status
   */
  getStatus(): BatchImportStatus {
    return { ...this.status }
  }

  /**
   * Reset manager
   */
  reset(): void {
    this.items = []
    this.processor = undefined
    this.isPaused = false
    this.isCancelled = false
    this.startTime = undefined
    this.abortController = undefined

    this.status = {
      total: 0,
      processed: 0,
      succeeded: 0,
      failed: 0,
      retrying: 0,
      currentBatch: 0,
      totalBatches: 0,
      progress: 0,
      startTime: 0,
      elapsedTime: 0,
      isPaused: false,
      isCancelled: false,
      isComplete: false,
      errors: [],
    }

    this.notify()
  }

  /**
   * Dispose manager
   */
  dispose(): void {
    this.cancel()
    this.callbacks.clear()
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

/**
 * Format elapsed time
 */
export function formatElapsedTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return `${hours}h ${remainingMinutes}m`
}

/**
 * Format ETA
 */
export function formatETA(seconds: number | undefined): string {
  if (seconds === undefined || seconds < 1) return 'Calculating...'

  if (seconds < 60) {
    return `${seconds}s remaining`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s remaining`
      : `${minutes}m remaining`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return `${hours}h ${remainingMinutes}m remaining`
}

/**
 * Calculate optimal batch size based on total items
 */
export function calculateOptimalBatchSize(totalItems: number): number {
  if (totalItems < 100) return 10
  if (totalItems < 500) return 25
  if (totalItems < 1000) return 50
  if (totalItems < 5000) return 100
  return 200
}
