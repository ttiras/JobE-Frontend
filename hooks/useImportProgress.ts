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
  const [progressState, setProgressState] = useState<ProgressState>({
    stage: 'idle',
    progress: 0,
  })

  // Initialize tracker on mount
  useEffect(() => {
    trackerRef.current = new ImportProgressTracker()
    
    // Subscribe to progress updates
    const unsubscribe = trackerRef.current.subscribe((state) => {
      setProgressState(state)
    })

    // Cleanup on unmount
    return () => {
      unsubscribe()
      trackerRef.current?.dispose()
      trackerRef.current = null
    }
  }, [])

  return {
    tracker: trackerRef.current!,
    progressState,
  }
}
