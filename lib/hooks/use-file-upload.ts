'use client'

/**
 * useFileUpload Hook
 * 
 * Custom React hook for file upload operations with progress tracking,
 * retry logic, and comprehensive error handling.
 * 
 * Features:
 * - File upload with progress tracking
 * - Automatic retry on network failures
 * - File validation before upload
 * - Upload state management (idle, uploading, success, error)
 * - File download and delete operations
 * 
 * @example
 * ```tsx
 * const { uploadFile, progress, isUploading, error } = useFileUpload()
 * 
 * const handleUpload = async (file: File) => {
 *   try {
 *     const metadata = await uploadFile(file)
 *     console.log('Uploaded:', metadata.id)
 *   } catch (err) {
 *     console.error('Upload failed:', err)
 *   }
 * }
 * ```
 */

import { useState, useCallback } from 'react'
import * as storageUtils from '@/lib/nhost/storage'
import type { FileMetadata, UploadOptions } from '@/lib/nhost/storage'

export type UploadState = 'idle' | 'validating' | 'uploading' | 'success' | 'error'

export interface UseFileUploadReturn {
  /** Upload a file */
  uploadFile: (file: File, options?: UploadOptions) => Promise<FileMetadata>
  /** Get download URL for a file */
  getDownloadUrl: (fileId: string) => Promise<string>
  /** Delete a file */
  deleteFile: (fileId: string) => Promise<boolean>
  /** Get file metadata */
  getFileMetadata: (fileId: string) => Promise<FileMetadata | null>
  /** Current upload state */
  uploadState: UploadState
  /** Upload progress (0-100) */
  progress: number
  /** True if currently uploading */
  isUploading: boolean
  /** Upload error if any */
  error: Error | null
  /** Reset upload state */
  reset: () => void
}

export function useFileUpload(): UseFileUploadReturn {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  const reset = useCallback(() => {
    setUploadState('idle')
    setProgress(0)
    setError(null)
  }, [])

  const uploadFile = useCallback(async (
    file: File,
    options?: UploadOptions
  ): Promise<FileMetadata> => {
    try {
      // Reset state
      setUploadState('validating')
      setProgress(0)
      setError(null)

      // Validate file
      storageUtils.validateFile(
        file,
        options?.maxSizeMB || 10,
        options?.allowedTypes
      )

      // Start upload
      setUploadState('uploading')
      
      const metadata = await storageUtils.uploadFile(file, {
        ...options,
        onProgress: (p) => {
          setProgress(p)
          options?.onProgress?.(p)
        },
      })

      setUploadState('success')
      setProgress(100)
      
      return metadata
    } catch (err) {
      setUploadState('error')
      setError(err as Error)
      throw err
    }
  }, [])

  const getDownloadUrl = useCallback(async (fileId: string): Promise<string> => {
    try {
      setError(null)
      return await storageUtils.getDownloadUrl(fileId)
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [])

  const deleteFile = useCallback(async (fileId: string): Promise<boolean> => {
    try {
      setError(null)
      return await storageUtils.deleteFile(fileId)
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [])

  const getFileMetadata = useCallback(async (fileId: string): Promise<FileMetadata | null> => {
    try {
      setError(null)
      return await storageUtils.getFileMetadata(fileId)
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [])

  return {
    uploadFile,
    getDownloadUrl,
    deleteFile,
    getFileMetadata,
    uploadState,
    progress,
    isUploading: uploadState === 'uploading' || uploadState === 'validating',
    error,
    reset,
  }
}

/**
 * useMultipleFileUpload Hook
 * 
 * Upload multiple files with individual progress tracking.
 * 
 * @example
 * ```tsx
 * const { uploadFiles, uploads, isUploading } = useMultipleFileUpload()
 * 
 * const handleUpload = async (files: File[]) => {
 *   await uploadFiles(files)
 * }
 * ```
 */
export interface FileUploadProgress {
  file: File
  state: UploadState
  progress: number
  metadata?: FileMetadata
  error?: Error
}

export interface UseMultipleFileUploadReturn {
  uploadFiles: (files: File[], options?: UploadOptions) => Promise<FileMetadata[]>
  uploads: FileUploadProgress[]
  isUploading: boolean
  reset: () => void
}

export function useMultipleFileUpload(): UseMultipleFileUploadReturn {
  const [uploads, setUploads] = useState<FileUploadProgress[]>([])

  const reset = useCallback(() => {
    setUploads([])
  }, [])

  const uploadFiles = useCallback(async (
    files: File[],
    options?: UploadOptions
  ): Promise<FileMetadata[]> => {
    // Initialize upload tracking
    setUploads(files.map(file => ({
      file,
      state: 'idle' as UploadState,
      progress: 0,
    })))

    const results: FileMetadata[] = []

    // Upload files sequentially (could be parallelized if needed)
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      try {
        // Update state to uploading
        setUploads(prev => prev.map((upload, idx) =>
          idx === i ? { ...upload, state: 'uploading' as UploadState } : upload
        ))

        const metadata = await storageUtils.uploadFile(file, {
          ...options,
          onProgress: (progress) => {
            setUploads(prev => prev.map((upload, idx) =>
              idx === i ? { ...upload, progress } : upload
            ))
            options?.onProgress?.(progress)
          },
        })

        // Update state to success
        setUploads(prev => prev.map((upload, idx) =>
          idx === i ? { ...upload, state: 'success' as UploadState, progress: 100, metadata } : upload
        ))

        results.push(metadata)
      } catch (error) {
        // Update state to error
        setUploads(prev => prev.map((upload, idx) =>
          idx === i ? { ...upload, state: 'error' as UploadState, error: error as Error } : upload
        ))
        // Continue with next file instead of throwing
      }
    }

    return results
  }, [])

  const isUploading = uploads.some(u => u.state === 'uploading' || u.state === 'validating')

  return {
    uploadFiles,
    uploads,
    isUploading,
    reset,
  }
}
