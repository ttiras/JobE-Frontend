'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { ImportWizardStep1 } from './import-wizard-step1'
import { ImportWizardStep2 } from './import-wizard-step2'
import { useImportWorkflow } from '@/hooks/useImportWorkflow'
import { ImportWorkflowState } from '@/lib/types/import'
import { animations } from '@/lib/utils/animations'

interface ImportWizardProps {
  onSuccess?: (stats?: { departments?: number; positions?: number }) => void
  onBackToUpload?: () => void
  importType?: 'departments' | 'positions'
  initialFile?: File | null  // Allow passing file directly from main page
}

export function ImportWizard({ onSuccess, onBackToUpload, importType = 'positions', initialFile = null }: ImportWizardProps) {
  const params = useParams()
  const orgId = params.orgId as string
  const locale = params.locale as string

  const [currentStep, setCurrentStep] = useState(initialFile ? 2 : 1)  // Skip step 1 if file provided
  const [hasCalledSuccess, setHasCalledSuccess] = useState(false)
  
  // Use ref to avoid onSuccess being a dependency
  const onSuccessRef = useRef(onSuccess)
  useEffect(() => {
    onSuccessRef.current = onSuccess
  }, [onSuccess])
  
  const {
    context,
    uploadFile,
    parseFile,
    confirmImport,
    reset,
    canConfirm,
    hasErrors,
    isLoading,
  } = useImportWorkflow(importType)  // Pass importType to hook

  // Process initial file if provided
  useEffect(() => {
    if (initialFile && !context.fileBuffer && context.state === ImportWorkflowState.IDLE) {
      const processInitialFile = async () => {
        try {
          console.log('Processing initial file:', initialFile.name)
          
          // Read file as ArrayBuffer
          const arrayBuffer = await initialFile.arrayBuffer()
          console.log('File read as ArrayBuffer, size:', arrayBuffer.byteLength)
          
          // Upload to workflow (this sets fileBuffer in context)
          uploadFile(arrayBuffer, initialFile.name)
        } catch (error) {
          console.error('Error processing initial file:', error)
        }
      }
      
      processInitialFile()
    }
  }, [initialFile, context.fileBuffer, context.state, uploadFile])

  // Auto-parse when fileBuffer is set from initial file
  useEffect(() => {
    if (initialFile && context.fileBuffer && context.state === ImportWorkflowState.UPLOADING) {
      console.log('FileBuffer detected, parsing with importType:', importType)
      parseFile(importType)
    }
  }, [initialFile, context.fileBuffer, context.state, importType, parseFile])

  // Auto-advance steps based on workflow state
  useEffect(() => {
    if (context.state === ImportWorkflowState.PARSING && currentStep <= 2) {
      // File uploaded and parsing - stay on current step
    } else if (context.state === ImportWorkflowState.PREVIEW && currentStep <= 2) {
      // Parsing complete, show preview (Step 2)
      if (currentStep !== 2) {
        setCurrentStep(2)
      }
    } else if (context.state === ImportWorkflowState.SUCCESS && currentStep === 2 && !hasCalledSuccess) {
      console.log('Import SUCCESS detected, redirecting...')
      setHasCalledSuccess(true)
      // Trigger success callback if provided with statistics
      // This will show toast and redirect to list page
      if (onSuccessRef.current && context.result) {
        console.log('Calling onSuccess callback')
        const stats = {
          departments: context.result.totalDepartments || 0,
          positions: context.result.totalPositions || 0,
        }
        onSuccessRef.current(stats)
      }
    }
  }, [context.state, context.result, currentStep, hasCalledSuccess])

  /**
   * Handle Step 1: File upload
   */
  const handleFileUploaded = async (fileId: string, fileName: string) => {
    try {
      // Download file from Nhost storage
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN}/v1/storage/files/${fileId}`
      )
      if (!response.ok) {
        throw new Error('Failed to download uploaded file')
      }

      // Convert to ArrayBuffer
      const arrayBuffer = await response.arrayBuffer()

      // Pass to workflow
      uploadFile(arrayBuffer, fileName)

      // Automatically trigger parsing with correct import type
      await parseFile(importType)
    } catch (error) {
      console.error('File processing error:', error)
    }
  }

  const handleStep1Next = () => {
    // After file is uploaded and parsed, move to step 2
    if (context.preview) {
      setCurrentStep(2)
    }
  }

  /**
   * Handle Step 2: Validation reviewed and confirmed, trigger import
   */
  const handleStep2Confirm = async () => {
    console.log('handleStep2Confirm called')
    console.log('hasErrors:', hasErrors)
    console.log('context.preview:', context.preview)
    console.log('context.state:', context.state)
    
    if (!hasErrors && context.preview) {
      console.log('Calling confirmImport...')
      await confirmImport()
      console.log('confirmImport completed')
      // The useEffect will handle advancing to step 3 when state becomes SUCCESS
    } else {
      console.log('Skipping import - hasErrors or no preview')
    }
  }

  /**
   * Go back to previous step
   */
  const goBack = () => {
    if (currentStep === 2 && initialFile && onBackToUpload) {
      // If we have an initialFile and are on step 2, go back to upload page
      onBackToUpload()
    } else if (currentStep > 1) {
      // Otherwise just go to previous step
      setCurrentStep(currentStep - 1)
    }
  }

  /**
   * Reset wizard to start over
   */
  const resetWizard = () => {
    reset()
    setCurrentStep(1)
    setHasCalledSuccess(false)
  }

  /**
   * View imported data
   */
  const handleViewData = () => {
    // Determine the correct route based on import type
    const route = importType === 'departments' 
      ? 'departments' 
      : 'positions'
    
    window.location.href = `/${locale}/dashboard/${orgId}/org-structure/${route}`
    
    // Also trigger success callback
    if (onSuccess) {
      onSuccess()
    }
  }

  return (
    <div className={`h-full ${animations.pageEnter}`}>
      {/* Step content without stepper */}
      <div className="space-y-6">
        {currentStep === 1 && (
          <ImportWizardStep1
            onFileUploaded={handleFileUploaded}
            onNext={handleStep1Next}
            isLoading={isLoading}
          />
        )}

        {currentStep === 2 && (
          <ImportWizardStep2
            context={context}
            onBack={goBack}
            onConfirm={handleStep2Confirm}
            isLoading={isLoading || context.state === ImportWorkflowState.CONFIRMING}
            importType={importType}
          />
        )}
      </div>
    </div>
  )
}
