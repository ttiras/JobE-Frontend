/**
 * Import Progress Tracker
 * Tracks multi-stage import progress with real-time updates
 */

export type ProgressStage =
  | 'idle'
  | 'uploading'
  | 'parsing'
  | 'validating'
  | 'processing'
  | 'importing'
  | 'complete'
  | 'error'

export interface ProgressState {
  stage: ProgressStage
  progress: number // 0-100
  currentItem?: number
  totalItems?: number
  message?: string
  estimatedTimeRemaining?: number // seconds
  speed?: number // items per second
  startTime?: number
  errors?: number
  warnings?: number
}

export interface ProgressUpdate {
  stage: ProgressStage
  progress: number
  message?: string
  currentItem?: number
  totalItems?: number
}

type ProgressCallback = (state: ProgressState) => void

/**
 * Progress Tracker for Import Operations
 */
export class ImportProgressTracker {
  private state: ProgressState
  private callbacks: Set<ProgressCallback>
  private startTime?: number
  private stageStartTime?: number
  private processedItems: number = 0
  private updateInterval?: NodeJS.Timeout

  constructor() {
    this.state = {
      stage: 'idle',
      progress: 0,
    }
    this.callbacks = new Set()
  }

  /**
   * Subscribe to progress updates
   */
  subscribe(callback: ProgressCallback): () => void {
    this.callbacks.add(callback)
    // Immediately notify with current state
    callback(this.state)
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback)
    }
  }

  /**
   * Notify all subscribers of state change
   */
  private notify(): void {
    this.callbacks.forEach((callback) => callback(this.state))
  }

  /**
   * Update progress state
   */
  private updateState(updates: Partial<ProgressState>): void {
    this.state = { ...this.state, ...updates }
    this.notify()
  }

  /**
   * Calculate estimated time remaining
   */
  private calculateETA(): number | undefined {
    if (!this.startTime || !this.state.totalItems || !this.state.currentItem) {
      return undefined
    }

    const elapsed = (Date.now() - this.startTime) / 1000 // seconds
    const itemsProcessed = this.state.currentItem
    const itemsRemaining = this.state.totalItems - itemsProcessed

    if (itemsProcessed === 0) return undefined

    const avgTimePerItem = elapsed / itemsProcessed
    return Math.ceil(avgTimePerItem * itemsRemaining)
  }

  /**
   * Calculate processing speed
   */
  private calculateSpeed(): number | undefined {
    if (!this.stageStartTime || !this.state.currentItem) {
      return undefined
    }

    const elapsed = (Date.now() - this.stageStartTime) / 1000 // seconds
    if (elapsed === 0) return undefined

    return Math.round((this.state.currentItem / elapsed) * 10) / 10
  }

  /**
   * Start tracking
   */
  start(): void {
    this.startTime = Date.now()
    this.stageStartTime = Date.now()
    this.processedItems = 0
    this.updateState({
      stage: 'idle',
      progress: 0,
      startTime: this.startTime,
    })
  }

  /**
   * Start uploading stage
   */
  startUpload(totalBytes?: number): void {
    this.stageStartTime = Date.now()
    this.updateState({
      stage: 'uploading',
      progress: 0,
      message: 'Uploading file...',
      totalItems: totalBytes,
      currentItem: 0,
    })
  }

  /**
   * Update upload progress
   */
  updateUpload(bytesUploaded: number, totalBytes: number): void {
    const progress = Math.min(100, Math.round((bytesUploaded / totalBytes) * 100))
    const speed = this.calculateSpeed()
    const eta = this.calculateETA()

    this.updateState({
      stage: 'uploading',
      progress,
      currentItem: bytesUploaded,
      totalItems: totalBytes,
      message: `Uploading... ${progress}%`,
      speed,
      estimatedTimeRemaining: eta,
    })
  }

  /**
   * Start parsing stage
   */
  startParsing(totalRows?: number): void {
    this.stageStartTime = Date.now()
    this.updateState({
      stage: 'parsing',
      progress: 0,
      message: 'Reading Excel file...',
      totalItems: totalRows,
      currentItem: 0,
    })
  }

  /**
   * Update parsing progress
   */
  updateParsing(rowsParsed: number, totalRows: number): void {
    const progress = Math.min(100, Math.round((rowsParsed / totalRows) * 100))
    const speed = this.calculateSpeed()
    const eta = this.calculateETA()

    this.updateState({
      stage: 'parsing',
      progress,
      currentItem: rowsParsed,
      totalItems: totalRows,
      message: `Parsing data... ${rowsParsed} of ${totalRows} rows`,
      speed,
      estimatedTimeRemaining: eta,
    })
  }

  /**
   * Complete parsing stage
   */
  completeParsing(): void {
    this.updateState({
      stage: 'parsing',
      progress: 100,
      message: 'Parsing complete',
    })
  }

  /**
   * Start validation stage
   */
  startValidation(totalItems?: number): void {
    this.stageStartTime = Date.now()
    this.updateState({
      stage: 'validating',
      progress: 0,
      message: 'Validating data...',
      totalItems,
      currentItem: 0,
      errors: 0,
      warnings: 0,
    })
  }

  /**
   * Update validation progress
   */
  updateValidation(
    itemsValidated: number,
    totalItems: number,
    errors: number = 0,
    warnings: number = 0
  ): void {
    const progress = Math.min(100, Math.round((itemsValidated / totalItems) * 100))
    const speed = this.calculateSpeed()
    const eta = this.calculateETA()

    this.updateState({
      stage: 'validating',
      progress,
      currentItem: itemsValidated,
      totalItems,
      message: `Validating... ${itemsValidated} of ${totalItems} items`,
      speed,
      estimatedTimeRemaining: eta,
      errors,
      warnings,
    })
  }

  /**
   * Complete validation stage
   */
  completeValidation(errors: number = 0, warnings: number = 0): void {
    this.updateState({
      stage: 'validating',
      progress: 100,
      message: 'Validation complete',
      errors,
      warnings,
    })
  }

  /**
   * Start processing stage (data transformation)
   */
  startProcessing(totalItems?: number): void {
    this.stageStartTime = Date.now()
    this.updateState({
      stage: 'processing',
      progress: 0,
      message: 'Processing data...',
      totalItems,
      currentItem: 0,
    })
  }

  /**
   * Update processing progress
   */
  updateProcessing(itemsProcessed: number, totalItems: number): void {
    const progress = Math.min(100, Math.round((itemsProcessed / totalItems) * 100))
    const speed = this.calculateSpeed()
    const eta = this.calculateETA()

    this.updateState({
      stage: 'processing',
      progress,
      currentItem: itemsProcessed,
      totalItems,
      message: `Processing... ${itemsProcessed} of ${totalItems} items`,
      speed,
      estimatedTimeRemaining: eta,
    })
  }

  /**
   * Complete processing stage
   */
  completeProcessing(): void {
    this.updateState({
      stage: 'processing',
      progress: 100,
      message: 'Processing complete',
    })
  }

  /**
   * Start importing stage (saving to database)
   */
  startImporting(totalItems?: number): void {
    this.stageStartTime = Date.now()
    this.updateState({
      stage: 'importing',
      progress: 0,
      message: 'Saving to database...',
      totalItems,
      currentItem: 0,
    })
  }

  /**
   * Update importing progress
   */
  updateImporting(itemsImported: number, totalItems: number): void {
    const progress = Math.min(100, Math.round((itemsImported / totalItems) * 100))
    const speed = this.calculateSpeed()
    const eta = this.calculateETA()

    this.updateState({
      stage: 'importing',
      progress,
      currentItem: itemsImported,
      totalItems,
      message: `Importing... ${itemsImported} of ${totalItems} items`,
      speed,
      estimatedTimeRemaining: eta,
    })
  }

  /**
   * Complete importing stage
   */
  completeImporting(): void {
    this.updateState({
      stage: 'importing',
      progress: 100,
      message: 'Import complete',
    })
  }

  /**
   * Mark as complete
   */
  complete(): void {
    this.updateState({
      stage: 'complete',
      progress: 100,
      message: 'All done!',
    })
    this.cleanup()
  }

  /**
   * Mark as error
   */
  error(message: string): void {
    this.updateState({
      stage: 'error',
      message,
    })
    this.cleanup()
  }

  /**
   * Reset tracker
   */
  reset(): void {
    this.cleanup()
    this.state = {
      stage: 'idle',
      progress: 0,
    }
    this.startTime = undefined
    this.stageStartTime = undefined
    this.processedItems = 0
    this.notify()
  }

  /**
   * Get current state
   */
  getState(): ProgressState {
    return { ...this.state }
  }

  /**
   * Cleanup intervals
   */
  private cleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = undefined
    }
  }

  /**
   * Dispose tracker
   */
  dispose(): void {
    this.cleanup()
    this.callbacks.clear()
  }
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(seconds: number | undefined): string {
  if (seconds === undefined || seconds < 1) return ''
  
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
 * Format speed for display
 */
export function formatSpeed(speed: number | undefined, unit: string = 'items'): string {
  if (speed === undefined) return ''
  
  if (speed < 1) {
    return `${Math.round(speed * 60)} ${unit}/min`
  }
  
  return `${speed} ${unit}/s`
}

/**
 * Format bytes for display
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Get stage display info
 */
export function getStageInfo(stage: ProgressStage): {
  label: string
  color: string
  icon: string
} {
  switch (stage) {
    case 'idle':
      return { label: 'Ready', color: 'gray', icon: 'circle' }
    case 'uploading':
      return { label: 'Uploading', color: 'blue', icon: 'upload' }
    case 'parsing':
      return { label: 'Reading', color: 'indigo', icon: 'file-text' }
    case 'validating':
      return { label: 'Validating', color: 'purple', icon: 'check-circle' }
    case 'processing':
      return { label: 'Processing', color: 'yellow', icon: 'cog' }
    case 'importing':
      return { label: 'Importing', color: 'green', icon: 'database' }
    case 'complete':
      return { label: 'Complete', color: 'emerald', icon: 'check' }
    case 'error':
      return { label: 'Error', color: 'red', icon: 'alert-circle' }
  }
}
