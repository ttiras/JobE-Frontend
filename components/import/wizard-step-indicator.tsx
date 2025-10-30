/**
 * WizardStepIndicator Component
 * 
 * Visual step progress indicator for multi-step wizards.
 * Shows current step, completed steps, and upcoming steps.
 */

'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface WizardStep {
  id: string
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
}

interface WizardStepIndicatorProps {
  steps: WizardStep[]
  currentStep: number
  completedSteps?: number[]
  className?: string
}

export function WizardStepIndicator({
  steps,
  currentStep,
  completedSteps = [],
  className,
}: WizardStepIndicatorProps) {
  return (
    <nav aria-label="Progress" className={className}>
      <ol role="list" className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCurrent = currentStep === stepNumber
          const isCompleted = completedSteps.includes(stepNumber)
          const isPast = stepNumber < currentStep
          const isUpcoming = stepNumber > currentStep

          const StepIcon = step.icon

          return (
            <li
              key={step.id}
              className={cn(
                'relative flex flex-col items-center',
                index < steps.length - 1 ? 'flex-1' : ''
              )}
            >
              {/* Connector Line (not for last step) */}
              {index < steps.length - 1 && (
                <div
                  className="absolute top-5 left-[50%] right-[-50%] h-0.5 -translate-y-1/2"
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      'h-full transition-colors duration-300',
                      isPast || isCompleted
                        ? 'bg-primary'
                        : 'bg-muted'
                    )}
                  />
                </div>
              )}

              {/* Step Circle */}
              <div
                className={cn(
                  'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
                  isCurrent &&
                    'border-primary bg-primary text-primary-foreground shadow-lg scale-110',
                  isCompleted &&
                    'border-primary bg-primary text-primary-foreground',
                  isPast &&
                    'border-primary bg-primary text-primary-foreground',
                  isUpcoming &&
                    'border-muted-foreground/30 bg-background text-muted-foreground'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted || isPast ? (
                  <Check className="h-5 w-5" aria-hidden="true" />
                ) : StepIcon ? (
                  <StepIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <span className="text-sm font-semibold">{stepNumber}</span>
                )}
              </div>

              {/* Step Label */}
              <div className="mt-3 text-center max-w-[120px]">
                <div
                  className={cn(
                    'text-sm font-medium transition-colors duration-300',
                    isCurrent && 'text-primary',
                    (isCompleted || isPast) && 'text-foreground',
                    isUpcoming && 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </div>
                {step.description && (
                  <div
                    className={cn(
                      'mt-1 text-xs transition-colors duration-300',
                      isCurrent && 'text-primary/80',
                      (isCompleted || isPast) && 'text-muted-foreground',
                      isUpcoming && 'text-muted-foreground/60'
                    )}
                  >
                    {step.description}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * Compact version for mobile/smaller screens
 */
export function WizardStepIndicatorCompact({
  steps,
  currentStep,
  className,
}: Omit<WizardStepIndicatorProps, 'completedSteps'>) {
  const currentStepData = steps[currentStep - 1]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1">
        {steps.map((_, index) => {
          const stepNumber = index + 1
          const isCurrent = currentStep === stepNumber
          const isPast = stepNumber < currentStep

          return (
            <div
              key={index}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                isCurrent && 'w-8 bg-primary',
                isPast && 'w-2 bg-primary',
                !isCurrent && !isPast && 'w-2 bg-muted'
              )}
            />
          )
        })}
      </div>
      <span className="text-sm font-medium">
        {currentStep} / {steps.length}: {currentStepData.title}
      </span>
    </div>
  )
}
