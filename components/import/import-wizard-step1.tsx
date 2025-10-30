/**
 * ImportWizardStep1 Component
 * 
 * Step 1: Template Download & File Upload
 * - Download Excel template with examples
 * - Upload Excel file with drag-and-drop
 * - Pre-upload validation with instant feedback
 * - File validation and format checking
 */

'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { Download, FileSpreadsheet, CheckCircle2, AlertCircle, Clock, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/import/file-upload'
import { downloadTemplate } from '@/lib/utils/excel-template-generator'
import { validateExcelFile, type FileValidationResult } from '@/lib/utils/excel-file-validator'

interface ImportWizardStep1Props {
  onFileUploaded: (fileId: string, fileName: string) => void
  onNext: () => void
  isLoading?: boolean
}

export function ImportWizardStep1({
  onFileUploaded,
  onNext,
  isLoading = false,
}: ImportWizardStep1Props) {
  const t = useTranslations('import.wizard.step1')
  const tCommon = useTranslations('common')
  const params = useParams()
  const locale = (params.locale as string) || 'en'

  const [uploadedFile, setUploadedFile] = useState<{
    id: string
    name: string
  } | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [validationResult, setValidationResult] = useState<FileValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  // Pre-validate file before upload
  const handleFileSelected = useCallback(async (file: File) => {
    try {
      setIsValidating(true)
      setValidationResult(null)
      setUploadError(null)

      // Run validation
      const result = await validateExcelFile(file)
      setValidationResult(result)

      if (!result.isValid) {
        setUploadError(result.errors[0]?.message || 'File validation failed')
        return false // Prevent upload
      }

      return true // Allow upload
    } catch (error) {
      console.error('Validation error:', error)
      setUploadError(error instanceof Error ? error.message : 'Validation failed')
      return false
    } finally {
      setIsValidating(false)
    }
  }, [])

  // Handle successful file upload
  const handleUploadSuccess = (fileId: string, fileName: string) => {
    setUploadedFile({ id: fileId, name: fileName })
    setUploadError(null)
    onFileUploaded(fileId, fileName)
  }

  // Handle upload error
  const handleUploadError = (error: string) => {
    setUploadError(error)
    setUploadedFile(null)
  }

  // Download Excel template
  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true)
      downloadTemplate({
        includeExamples: true,
        locale: locale === 'tr' ? 'tr' : 'en',
      })
    } catch (error) {
      console.error('Error downloading template:', error)
      setUploadError('Failed to download template')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">{t('instructions.title')}</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>{t('instructions.step1')}</li>
              <li>{t('instructions.step2')}</li>
              <li>{t('instructions.step3')}</li>
            </ol>
          </div>

          <Button
            onClick={handleDownloadTemplate}
            variant="outline"
            className="w-full"
            disabled={isDownloading}
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? t('downloadingTemplate') : t('downloadTemplate')}
          </Button>
        </CardContent>
      </Card>

      {/* Template Info */}
      <Alert>
        <FileSpreadsheet className="h-4 w-4" />
        <AlertDescription>
          {t('templateInfo')}
        </AlertDescription>
      </Alert>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>{t('uploadTitle')}</CardTitle>
          <CardDescription>{t('uploadDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            disabled={isLoading}
          />

          {/* Upload Success Message */}
          {uploadedFile && (
            <Alert className="mt-4 border-green-200 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                {t('uploadSuccess', { fileName: uploadedFile.name })}
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Error Message */}
          {uploadError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          {/* Validation Result */}
          {validationResult && validationResult.isValid && (
            <Alert className="mt-4 border-green-200 bg-green-50 dark:bg-green-950/20">
              <FileCheck className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700 dark:text-green-400">
                {t('validationPassed') || 'File Validated Successfully'}
              </AlertTitle>
              <AlertDescription className="text-sm text-green-600 dark:text-green-400 space-y-1">
                {validationResult.metadata && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <span className="font-medium">Departments:</span> {validationResult.metadata.departmentCount || 0}
                    </div>
                    <div>
                      <span className="font-medium">Positions:</span> {validationResult.metadata.positionCount || 0}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Est. Processing Time:</span>{' '}
                      {validationResult.metadata.estimatedProcessingTime}
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Warnings */}
          {validationResult && validationResult.warnings.length > 0 && (
            <Alert className="mt-4 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-700 dark:text-yellow-400">
                {validationResult.warnings.length} Warning(s)
              </AlertTitle>
              <AlertDescription className="text-sm text-yellow-600 dark:text-yellow-400">
                <ul className="list-disc list-inside space-y-1">
                  {validationResult.warnings.slice(0, 3).map((warning, idx) => (
                    <li key={idx}>{warning.message}</li>
                  ))}
                  {validationResult.warnings.length > 3 && (
                    <li>+{validationResult.warnings.length - 3} more warnings</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Validating State */}
          {isValidating && (
            <Alert className="mt-4 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <Clock className="h-4 w-4 text-blue-600 animate-spin" />
              <AlertDescription className="text-blue-700 dark:text-blue-400">
                Validating file...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Required Fields Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('requiredFields.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium mb-2">{t('requiredFields.departments')}</h5>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{t('requiredFields.deptCode')}</li>
                <li>{t('requiredFields.deptName')}</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-2">{t('requiredFields.positions')}</h5>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{t('requiredFields.posCode')}</li>
                <li>{t('requiredFields.posTitle')}</li>
                <li>{t('requiredFields.posDept')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!uploadedFile || isLoading}
          size="lg"
        >
          {isLoading ? tCommon('loading') : t('nextButton')}
        </Button>
      </div>
    </div>
  )
}
