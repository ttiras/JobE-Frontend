/**
 * OrgStructureProgress Component
 * 
 * Displays a circular progress indicator showing organization setup completion
 * with animated progress ring and percentage display
 */

'use client'

import { useTranslations } from 'next-intl'

interface OrgStructureProgressProps {
  departmentCount: number
  positionCount: number
  evaluatedCount: number
}

export function OrgStructureProgress({
  departmentCount,
  positionCount,
  evaluatedCount,
}: OrgStructureProgressProps) {
  const t = useTranslations('pages.dashboard.onboarding')

  // Calculate completion percentage based on milestones
  // 30% for having departments, 30% for having positions, 40% for evaluations
  const calculateProgress = () => {
    let progress = 0
    if (departmentCount > 0) progress += 30
    if (positionCount > 0) progress += 30
    if (evaluatedCount > 0) progress += 40
    return progress
  }

  const progress = calculateProgress()
  
  // SVG circle calculations
  const size = 160
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      {/* Circular Progress Ring */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted"
            opacity={0.2}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`transition-all duration-1000 ease-out ${
              progress === 100
                ? 'text-green-500'
                : progress >= 50
                ? 'text-primary'
                : 'text-orange-500'
            }`}
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold">{progress}%</span>
          <span className="text-sm text-muted-foreground">
            {t('progress.complete')}
          </span>
        </div>
      </div>

      {/* Progress Details */}
      <div className="mt-6 space-y-2 w-full">
        <ProgressItem
          label={t('progress.departments')}
          count={departmentCount}
          completed={departmentCount > 0}
        />
        <ProgressItem
          label={t('progress.positions')}
          count={positionCount}
          completed={positionCount > 0}
        />
        <ProgressItem
          label={t('progress.evaluations')}
          count={evaluatedCount}
          completed={evaluatedCount > 0}
        />
      </div>
    </div>
  )
}

interface ProgressItemProps {
  label: string
  count: number
  completed: boolean
}

function ProgressItem({ label, count, completed }: ProgressItemProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            completed ? 'bg-green-500' : 'bg-muted-foreground'
          }`}
        />
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium">{count}</span>
    </div>
  )
}
