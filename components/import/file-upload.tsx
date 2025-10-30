'use client';

/**
 * FileUpload Component
 * 
 * Provides drag-and-drop file upload with Nhost integration
 * Features:
 * - Drag and drop support
 * - Click to browse fallback
 * - File size validation (5MB max)
 * - Format validation (.xlsx, .xls)
 * - Progress tracking
 * - Accessibility (keyboard navigation, screen reader support)
 */

import { useCallback, useState } from 'react';
import { useFileUpload } from '@nhost/nextjs';
import { useTranslations } from 'next-intl';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';

export interface FileUploadProps {
  onUploadSuccess: (fileId: string, fileName: string) => void;
  onUploadError: (error: string) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ACCEPTED_FORMATS = ['.xlsx', '.xls'];
const ACCEPTED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

export function FileUpload({ onUploadSuccess, onUploadError, disabled = false }: FileUploadProps) {
  const t = useTranslations('import.uploadArea');
  const tErrors = useTranslations('import.errors');
  
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { upload, isUploading, progress } = useFileUpload();

  // Validate file before upload
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return tErrors('fileTooLarge');
    }

    // Check file format
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ACCEPTED_FORMATS.some(format => fileName.endsWith(format));
    const hasValidMimeType = ACCEPTED_MIME_TYPES.includes(file.type);

    if (!hasValidExtension && !hasValidMimeType) {
      return tErrors('invalidFormat');
    }

    return null;
  }, [tErrors]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      onUploadError(validationError);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);

    try {
      // Upload to Nhost File Storage
      const result = await upload({ 
        file,
        bucketId: 'imports' // Organize imports in dedicated bucket
      });

      if (result.error) {
        console.error('Upload error:', result.error);
        onUploadError(tErrors('uploadFailed'));
        setSelectedFile(null);
        return;
      }

      if (result.id) {
        onUploadSuccess(result.id, file.name);
      }
    } catch (error) {
      console.error('Upload exception:', error);
      onUploadError(tErrors('uploadFailed'));
      setSelectedFile(null);
    }
  }, [upload, validateFile, onUploadSuccess, onUploadError, tErrors]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]); // Only accept first file
    }
  }, [disabled, isUploading, handleFileUpload]);

  // File input handler
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
    // Reset input to allow re-uploading same file
    e.target.value = '';
  }, [handleFileUpload]);

  // Keyboard handler for accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      document.getElementById('file-input')?.click();
    }
  }, []);

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
        ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}
        ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => !disabled && !isUploading && document.getElementById('file-input')?.click()}
      onKeyDown={handleKeyDown}
      tabIndex={disabled || isUploading ? -1 : 0}
      role="button"
      aria-label={t('title')}
      aria-disabled={disabled || isUploading}
    >
      {/* Hidden file input */}
      <input
        id="file-input"
        type="file"
        accept={ACCEPTED_FORMATS.join(',')}
        onChange={handleFileInputChange}
        disabled={disabled || isUploading}
        className="sr-only"
        aria-label={t('subtitle')}
      />

      {/* Upload states */}
      {isUploading ? (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('uploading')}</p>
            {progress !== null && progress !== undefined && (
              <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            )}
            {selectedFile && (
              <p className="text-xs text-muted-foreground">{selectedFile.name}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {isDragging ? (
            <Upload className="h-12 w-12 text-primary" />
          ) : (
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
          )}
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {isDragging ? t('title') : t('title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>{t('formats')}</p>
            <p>{t('maxSize')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
