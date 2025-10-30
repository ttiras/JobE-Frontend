'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { ImportWizardStep1 } from './import-wizard-step1'
import { ImportWizardStep2 } from './import-wizard-step2'
import { ImportWizardStep4 } from './import-wizard-step4'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'
import { useImportWorkflow } from '@/hooks/useImportWorkflow'
import { ImportWorkflowState } from '@/lib/types/import'
import { animations } from '@/lib/utils/animations'

interface ImportWizardProps {
  onSuccess?: () => void
  importType?: 'departments' | 'positions'
  initialFile?: File | null  // Allow passing file directly from main page
}

export function ImportWizard({ onSuccess, importType = 'positions', initialFile = null }: ImportWizardProps) {
  const t = useTranslations('import.wizard')
  const params = useParams()
  const orgId = params.orgId as string
  const locale = params.locale as string

  const [currentStep, setCurrentStep] = useState(initialFile ? 2 : 1)  // Skip step 1 if file provided
  
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
    } else if (context.state === ImportWorkflowState.SUCCESS && currentStep === 2) {
      console.log('Import SUCCESS detected, advancing to step 3')
      setCurrentStep(3)
      // Trigger success callback if provided
      if (onSuccess) {
        console.log('Calling onSuccess callback')
        onSuccess()
      }
    }
  }, [context.state, currentStep, onSuccess])

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
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  /**
   * Reset wizard to start over
   */
  const resetWizard = () => {
    reset()
    setCurrentStep(1)
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

  const totalSteps = 3
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Handle step transition animations
  const handleStepChange = (newStep: number) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentStep(newStep)
      setIsTransitioning(false)
    }, 150)
  }

  return (
    <div className={`h-full flex flex-col ${animations.pageEnter}`}>
      {/* Modern Progress Header */}
      <div className="flex-shrink-0 pb-6 border-b">
        {/* Step Counter Badge */}
        <div className="flex items-center justify-between mb-4">
          <Badge 
            variant="outline" 
            className="text-xs font-medium px-3 py-1 bg-primary/5 border-primary/20 text-primary"
          >
            {t('stepCount', { current: currentStep, total: totalSteps })}
          </Badge>
        </div>

        {/* Step Title & Description */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {t(`steps.step${currentStep}.title`)}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {t(`steps.step${currentStep}.description`)}
          </p>
        </div>

        {/* Modern Step Indicator - Desktop */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Progress Background Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" />
            
            {/* Active Progress Line */}
            <div 
              className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-primary to-primary/60 transition-all duration-500 ease-out"
              style={{ width: `${(((currentStep - 1) / (totalSteps - 1)) * 100)}%` }}
            />

            {/* Step Dots */}
            <div className="relative flex justify-between">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex flex-col items-center gap-2">
                  <div
                    className={`
                      relative z-10 flex items-center justify-center 
                      w-10 h-10 rounded-full transition-all duration-300
                      ${step < currentStep
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-100'
                        : step === currentStep
                        ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/40 scale-110 ring-4 ring-primary/10'
                        : 'bg-background border-2 border-muted text-muted-foreground scale-90'
                      }
                    `}
                  >
                    {step < currentStep ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-bold">{step}</span>
                    )}
                  </div>
                  <span
                    className={`
                      text-xs font-medium transition-all duration-200 whitespace-nowrap
                      ${step === currentStep 
                        ? 'text-foreground scale-105' 
                        : step < currentStep
                        ? 'text-foreground/70'
                        : 'text-muted-foreground'
                      }
                    `}
                  >
                    {t(`steps.step${step}.label`)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Step Indicator */}
        <div className="md:hidden">
          {/* Mini Step Dots */}
          <div className="flex items-center justify-center gap-2 mb-3">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`
                  transition-all duration-300
                  ${step === currentStep 
                    ? 'w-8 h-2 bg-primary rounded-full' 
                    : step < currentStep
                    ? 'w-2 h-2 bg-primary rounded-full'
                    : 'w-2 h-2 bg-muted rounded-full'
                  }
                `}
              />
            ))}
          </div>
          
          {/* Progress Bar */}
          <Progress value={progress} className="h-1.5 bg-muted" />
          
          {/* Step Labels */}
          <div className="flex justify-between mt-3 px-1">
            {[1, 2, 3].map((step) => (
              <span
                key={step}
                className={`
                  text-[10px] transition-all duration-200
                  ${step === currentStep 
                    ? 'text-foreground font-semibold' 
                    : step < currentStep
                    ? 'text-foreground/60 font-medium'
                    : 'text-muted-foreground'
                  }
                `}
              >
                {t(`steps.step${step}.label`)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Step content with smooth transitions and modern styling */}
      <div className="flex-1 overflow-y-auto pt-6">
        <div 
          className={`
            transition-all duration-300 ease-out
            ${isTransitioning 
              ? 'opacity-0 translate-y-4 scale-[0.98]' 
              : 'opacity-100 translate-y-0 scale-100'
            }
          `}
        >
          {/* Removed Card wrapper - content flows naturally */}
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

            {currentStep === 3 && (
              <ImportWizardStep4
                context={context}
                onImportMore={resetWizard}
                onViewData={handleViewData}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
