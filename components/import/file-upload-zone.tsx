'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileSpreadsheet, CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface FileUploadZoneProps {
  /** Current uploaded file */
  file: File | null
  /** Callback when file is selected */
  onFileSelect: (file: File | null) => void
  /** Whether upload is disabled */
  disabled?: boolean
  /** Additional className */
  className?: string
}

export function FileUploadZone({
  file,
  onFileSelect,
  disabled = false,
  className
}: FileUploadZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0])
    }
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled,
    multiple: false
  })

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFileSelect(null)
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
  }

  // Get error message from file rejections
  const getErrorMessage = (): string | null => {
    if (fileRejections.length === 0) return null
    const rejection = fileRejections[0]
    if (rejection.errors[0]?.code === 'file-too-large') {
      return 'File is too large. Maximum size is 10MB.'
    }
    if (rejection.errors[0]?.code === 'file-invalid-type') {
      return 'Invalid file type. Please upload .xlsx or .xls files only.'
    }
    return 'Error uploading file. Please try again.'
  }

  const errorMessage = getErrorMessage()

  return (
    <div className={cn('space-y-2', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl transition-all duration-200',
          'min-h-[180px] flex flex-col items-center justify-center gap-3 p-6 cursor-pointer',
          'hover:border-primary/50 hover:bg-primary/5',
          isDragActive && 'border-primary bg-primary/10 scale-[1.02]',
          file && !errorMessage && 'border-green-500 bg-green-50 dark:bg-green-950/20',
          errorMessage && 'border-destructive bg-destructive/5',
          disabled && 'opacity-50 cursor-not-allowed',
          !file && !errorMessage && 'border-muted-foreground/25'
        )}
      >
        <input {...getInputProps()} />
        
        {!file && !errorMessage ? (
          <>
            <div className={cn(
              'p-3 rounded-full transition-colors',
              isDragActive 
                ? 'bg-primary/20 ring-2 ring-primary/30' 
                : 'bg-primary/10 ring-1 ring-primary/20'
            )}>
              <Upload className={cn(
                'h-6 w-6 transition-transform',
                isDragActive && 'scale-110',
                'text-primary'
              )} />
            </div>
            <div className="text-center space-y-1.5">
              <p className={cn(
                'text-base font-semibold transition-all',
                isDragActive && 'text-primary scale-105'
              )}>
                {isDragActive ? 'Drop it here!' : 'Drop your Excel file here'}
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse files
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Supports .xlsx and .xls • Max 10MB</span>
            </div>
          </>
        ) : errorMessage ? (
          <>
            <div className="p-4 rounded-full bg-destructive/10 ring-1 ring-destructive/20">
              <X className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-destructive">
                Upload Error
              </p>
              <p className="text-sm text-muted-foreground max-w-md">
                {errorMessage}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveFile}
              className="mt-2"
            >
              Try Again
            </Button>
          </>
        ) : file ? (
          <>
            <div className="p-4 rounded-full bg-green-500/10 ring-1 ring-green-500/20">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-green-700 dark:text-green-400">
                {file.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
              <p className="text-xs text-muted-foreground">
                Click to change file
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="absolute top-4 right-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : null}
      </div>

      {/* Helper text */}
      {!file && !errorMessage && (
        <p className="text-xs text-center text-muted-foreground">
          Upload your Excel file with department or position data
        </p>
      )}
    </div>
  )
}
