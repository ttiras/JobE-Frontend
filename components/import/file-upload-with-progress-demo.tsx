/**
 * Example integration of progress tracking with file upload
 * This demonstrates how to use the ImportProgressTracker with real upload operations
 */

import { useState } from 'react'
import { validateExcelFile, quickValidateFile } from '@/lib/utils/excel-file-validator'
import { useImportProgress } from '@/hooks/useImportProgress'
import { ImportProgressIndicator, ImportProgressCompact } from '@/components/import/import-progress-indicator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function FileUploadWithProgress() {
  const { tracker, progressState } = useImportProgress()
  const [file, setFile] = useState<File | null>(null)
  const [validationResult, setValidationResult] = useState<any>(null)

  // Handle file selection
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    tracker.reset()

    // Quick validation first (instant feedback)
    const quickValidation = quickValidateFile(selectedFile)
    if (!quickValidation.isValid) {
      tracker.error(quickValidation.errors[0].message)
      return
    }

    // Start progress tracking
    tracker.start()
    tracker.startValidation()

    // Full validation
    try {
      const result = await validateExcelFile(selectedFile)
      setValidationResult(result)
      
      if (result.isValid) {
        tracker.completeValidation(0, result.warnings.length)
      } else {
        tracker.completeValidation(result.errors.length, result.warnings.length)
        tracker.error(result.errors[0].message)
      }
    } catch (error) {
      tracker.error('Failed to validate file')
    }
  }

  // Simulate file upload with progress
  const handleUpload = async () => {
    if (!file) return

    tracker.reset()
    tracker.start()

    // Simulate upload progress
    tracker.startUpload(file.size)
    
    const chunks = 10
    const chunkSize = file.size / chunks
    
    for (let i = 1; i <= chunks; i++) {
      await new Promise(resolve => setTimeout(resolve, 200))
      tracker.updateUpload(i * chunkSize, file.size)
    }

    // Simulate parsing
    tracker.startParsing(1000)
    for (let i = 1; i <= 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 150))
      tracker.updateParsing(i * 100, 1000)
    }
    tracker.completeParsing()

    // Simulate validation
    tracker.startValidation(1000)
    for (let i = 1; i <= 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 100))
      tracker.updateValidation(i * 100, 1000, Math.floor(Math.random() * 5), Math.floor(Math.random() * 10))
    }
    tracker.completeValidation(2, 8)

    // Simulate processing
    tracker.startProcessing(1000)
    for (let i = 1; i <= 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 120))
      tracker.updateProcessing(i * 100, 1000)
    }
    tracker.completeProcessing()

    // Simulate importing
    tracker.startImporting(1000)
    for (let i = 1; i <= 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 180))
      tracker.updateImporting(i * 100, 1000)
    }
    tracker.completeImporting()

    // Complete
    tracker.complete()
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Progress Tracking Demo</CardTitle>
          <CardDescription>
            Upload a file to see real-time progress tracking in action
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File input */}
          <div>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".xlsx,.xls"
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90"
            />
          </div>

          {/* Compact progress indicator */}
          {file && progressState.stage !== 'idle' && (
            <ImportProgressCompact progressState={progressState} />
          )}

          {/* Upload button */}
          {file && validationResult?.isValid && (
            <Button 
              onClick={handleUpload}
              disabled={progressState.stage !== 'idle' && progressState.stage !== 'complete' && progressState.stage !== 'error'}
            >
              Start Upload Simulation
            </Button>
          )}

          {/* Validation errors */}
          {validationResult && !validationResult.isValid && (
            <div className="space-y-2">
              {validationResult.errors.map((error: any, index: number) => (
                <div key={index} className="text-sm text-red-600 dark:text-red-400">
                  {error.message}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full progress indicator (only show during active operations) */}
      {progressState.stage !== 'idle' && (
        <ImportProgressIndicator 
          progressState={progressState}
          showDetails={true}
        />
      )}

      {/* Metadata display */}
      {validationResult?.metadata && (
        <Card>
          <CardHeader>
            <CardTitle>File Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-muted-foreground">File Name</dt>
                <dd>{validationResult.metadata.fileName}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">File Size</dt>
                <dd>{validationResult.metadata.fileSizeFormatted}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Sheets</dt>
                <dd>{validationResult.metadata.sheetCount}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Departments</dt>
                <dd>{validationResult.metadata.departmentCount || 0}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Positions</dt>
                <dd>{validationResult.metadata.positionCount || 0}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Est. Time</dt>
                <dd>{validationResult.metadata.estimatedProcessingTime}s</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
