import { useEffect, useState, useRef } from 'react'
import {
  ImportProgressTracker,
  type ProgressState,
} from '@/lib/utils/import-progress-tracker'

/**
 * React hook for using the import progress tracker
 * 
 * @example
 * ```tsx
 * const { tracker, progressState } = useImportProgress()
 * 
 * const handleImport = async () => {
 *   tracker.start()
 *   tracker.startUpload(file.size)
 *   // Upload file...
 *   tracker.startParsing()
 *   // Parse file...
 *   tracker.complete()
 * }
 * ```
 */
export function useImportProgress() {
  const trackerRef = useRef<ImportProgressTracker | null>(null)
  const [tracker, setTracker] = useState<ImportProgressTracker | null>(null)
  const [progressState, setProgressState] = useState<ProgressState>({
    stage: 'idle',
    progress: 0,
  })

  // Initialize tracker on mount
  useEffect(() => {
    const newTracker = new ImportProgressTracker()
    trackerRef.current = newTracker
    
    // Defer setState to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => {
      setTracker(newTracker)
    }, 0)
    
    // Subscribe to progress updates
    const unsubscribe = newTracker.subscribe((state) => {
      setProgressState(state)
    })

    // Cleanup on unmount
    return () => {
      clearTimeout(timeoutId)
      unsubscribe()
      trackerRef.current?.dispose()
      trackerRef.current = null
      setTracker(null)
    }
  }, [])

  return {
    tracker: tracker!,
    progressState,
  }
}
