'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Lightbulb } from 'lucide-react'
import { useMediaQuery } from '@/lib/hooks/use-media-query'

interface ColumnDefinition {
  letter: string
  name: string
  description: string
  required: boolean
}

interface FormatContentProps {
  type: 'departments' | 'positions'
  departmentColumns: ColumnDefinition[]
  positionColumns: ColumnDefinition[]
}

// Move FormatContent outside component to avoid recreating on every render
function FormatContent({ type, departmentColumns, positionColumns }: FormatContentProps) {
  const columns = type === 'departments' ? departmentColumns : positionColumns
    
    // Show only first 3-4 columns for compactness
    const displayColumns = type === 'departments' ? columns : columns.slice(0, 4)

    return (
      <div className="space-y-3">
        {/* Excel-Style Table Preview */}
        <div className="rounded-lg border overflow-hidden bg-white dark:bg-gray-950">
          {/* Excel Column Headers (A, B, C, D...) - Gray like Excel */}
          <div className="grid gap-0 border-b border-gray-300 dark:border-gray-700" style={{ 
            gridTemplateColumns: `40px repeat(${displayColumns.length}, minmax(0, 1fr))` 
          }}>
            {/* Empty corner cell */}
            <div className="bg-gray-100 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700" />
            
            {/* Column Letters (A, B, C, D) - Excel Gray */}
            {displayColumns.map((col) => (
              <div 
                key={col.letter}
                className="px-3 py-1.5 text-center font-semibold text-xs bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-700 last:border-r-0"
              >
                {col.letter}
              </div>
            ))}
          </div>

          {/* Excel Data Header Row (Field Names) - Blue Headers */}
          <div className="grid gap-0 border-b border-gray-300 dark:border-gray-700" style={{ 
            gridTemplateColumns: `40px repeat(${displayColumns.length}, minmax(0, 1fr))` 
          }}>
            {/* Row number: 1 - Keep gray like other row numbers */}
            <div className="px-2 py-1.5 text-center text-xs font-semibold bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-r border-gray-300 dark:border-gray-700">
              1
            </div>
            
            {/* Header cells with blue background */}
            {displayColumns.map((col, idx) => (
              <div 
                key={col.letter}
                className="px-3 py-1.5 text-xs font-semibold bg-[#4472C4] text-white border-r border-[#2E5C9A] last:border-r-0"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>{col.name}</span>
                  {col.required && (
                    <span className="text-red-200">*</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Excel Data Rows */}
          {/* Row 2 */}
          <div className="grid gap-0 border-b border-gray-200 dark:border-gray-800" style={{ 
            gridTemplateColumns: `40px repeat(${displayColumns.length}, minmax(0, 1fr))` 
          }}>
            <div className="px-2 py-1.5 text-center text-xs font-semibold bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-r border-gray-300 dark:border-gray-700">
              2
            </div>
            {type === 'departments' ? (
              <>
                <div className="px-3 py-1.5 text-xs bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">IT</div>
                <div className="px-3 py-1.5 text-xs bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">IT Department</div>
                <div className="px-3 py-1.5 text-xs bg-white dark:bg-gray-950 text-muted-foreground">-</div>
              </>
            ) : (
              <>
                <div className="px-3 py-1.5 text-xs bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">IT-DEV-01</div>
                <div className="px-3 py-1.5 text-xs bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">Senior Developer</div>
                <div className="px-3 py-1.5 text-xs bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">IT-DEV</div>
                <div className="px-3 py-1.5 text-xs bg-white dark:bg-gray-950 truncate">Software development...</div>
              </>
            )}
          </div>

          {/* Row 3 */}
          <div className="grid gap-0 border-b border-gray-200 dark:border-gray-800" style={{ 
            gridTemplateColumns: `40px repeat(${displayColumns.length}, minmax(0, 1fr))` 
          }}>
            <div className="px-2 py-1.5 text-center text-xs font-semibold bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-r border-gray-300 dark:border-gray-700">
              3
            </div>
            {type === 'departments' ? (
              <>
                <div className="px-3 py-1.5 text-xs bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">IT-DEV</div>
                <div className="px-3 py-1.5 text-xs bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">Development</div>
                <div className="px-3 py-1.5 text-xs bg-white dark:bg-gray-950">IT</div>
              </>
            ) : (
              <>
                <div className="px-3 py-1.5 text-xs bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">IT-DEV-02</div>
                <div className="px-3 py-1.5 text-xs bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">Junior Developer</div>
                <div className="px-3 py-1.5 text-xs bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">IT-DEV</div>
                <div className="px-3 py-1.5 text-xs bg-white dark:bg-gray-950 truncate">Entry level coding...</div>
              </>
            )}
          </div>

          {/* Row 4 */}
          <div className="grid gap-0" style={{ 
            gridTemplateColumns: `40px repeat(${displayColumns.length}, minmax(0, 1fr))` 
          }}>
            <div className="px-2 py-1.5 text-center text-xs font-semibold bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-r border-gray-300 dark:border-gray-700">
              4
            </div>
            {type === 'departments' ? (
              <>
                <div className="px-3 py-1.5 text-xs bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">IT-OPS</div>
                <div className="px-3 py-1.5 text-xs bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">Operations</div>
                <div className="px-3 py-1.5 text-xs bg-white dark:bg-gray-950">IT</div>
              </>
            ) : (
              <>
                <div className="px-3 py-1.5 text-xs bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">HR-MGR-01</div>
                <div className="px-3 py-1.5 text-xs bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">HR Manager</div>
                <div className="px-3 py-1.5 text-xs bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">HR</div>
                <div className="px-3 py-1.5 text-xs bg-white dark:bg-gray-950 truncate">Team management...</div>
              </>
            )}
          </div>
        </div>

        {/* Compact Required Fields Note */}
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded px-3 py-2">
            <span className="text-red-600 dark:text-red-400 font-bold">*</span>
            <span>
              <strong>Required fields:</strong> {displayColumns.filter(c => c.required).map(c => c.name).join(', ')}
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 rounded px-3 py-2">
            <span className="text-blue-600 dark:text-blue-400">ℹ️</span>
            <span>
              <strong>Column order:</strong> Fields can be in any order as long as all required fields are present in your Excel file.
            </span>
          </div>
        </div>
      </div>
    )
}

interface ExcelFormatPreviewProps {
  /** Which format to show by default */
  defaultType?: 'departments' | 'positions'
  /** Show both types or just one */
  showBoth?: boolean
}

export function ExcelFormatPreview({ 
  defaultType = 'departments',
  showBoth = true 
}: ExcelFormatPreviewProps) {
  const t = useTranslations('import.format')
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Department column definitions (matching database schema)
  const departmentColumns: ColumnDefinition[] = [
    {
      letter: 'A',
      name: 'dept_code',
      description: t('departments.columns.code.description'),
      required: true
    },
    {
      letter: 'B',
      name: 'name',
      description: t('departments.columns.name.description'),
      required: true
    },
    {
      letter: 'C',
      name: 'parent_dept_code',
      description: t('departments.columns.parent_code.description'),
      required: false
    }
  ]

  // Position column definitions (matching database schema)
  const positionColumns: ColumnDefinition[] = [
    {
      letter: 'A',
      name: 'pos_code',
      description: t('positions.columns.code'),
      required: true
    },
    {
      letter: 'B',
      name: 'title',
      description: t('positions.columns.title'),
      required: true
    },
    {
      letter: 'C',
      name: 'dept_code',
      description: t('positions.columns.department_code'),
      required: true
    },
    {
      letter: 'D',
      name: 'description',
      description: t('positions.columns.description'),
      required: false
    },
    {
      letter: 'E',
      name: 'employment_type',
      description: t('positions.columns.employment_type'),
      required: false
    },
    {
      letter: 'F',
      name: 'location',
      description: t('positions.columns.location'),
      required: false
    },
    {
      letter: 'G',
      name: 'salary_min',
      description: t('positions.columns.salary_min'),
      required: false
    },
    {
      letter: 'H',
      name: 'salary_max',
      description: t('positions.columns.salary_max'),
      required: false
    },
    {
      letter: 'I',
      name: 'salary_currency',
      description: t('positions.columns.salary_currency'),
      required: false
    }
  ]

  // Mobile: Use Accordion
  if (isMobile && showBoth) {
    return (
      <Accordion type="single" collapsible defaultValue={defaultType}>
        <AccordionItem value="departments" className="border-b last:border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
            <span className="text-sm font-semibold">
              📂 {t('departments.title')}
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <FormatContent type="departments" departmentColumns={departmentColumns} positionColumns={positionColumns} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="positions" className="border-b-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
            <span className="text-sm font-semibold">
              💼 {t('positions.title')}
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <FormatContent type="positions" departmentColumns={departmentColumns} positionColumns={positionColumns} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    )
  }

  // Single view if showBoth is false
  if (!showBoth) {
    return <FormatContent type={defaultType} departmentColumns={departmentColumns} positionColumns={positionColumns} />
  }

  // Desktop: Use Tabs
  return (
    <Tabs defaultValue={defaultType} className="w-full">
      <TabsList className="w-full grid grid-cols-2 rounded-lg mb-3">
        <TabsTrigger value="departments" className="text-xs">
          📂 {t('departments.title')}
        </TabsTrigger>
        <TabsTrigger value="positions" className="text-xs">
          💼 {t('positions.title')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="departments" className="mt-0">
        <FormatContent type="departments" departmentColumns={departmentColumns} positionColumns={positionColumns} />
      </TabsContent>

      <TabsContent value="positions" className="mt-0">
        <FormatContent type="positions" departmentColumns={departmentColumns} positionColumns={positionColumns} />
      </TabsContent>
    </Tabs>
  )
}
