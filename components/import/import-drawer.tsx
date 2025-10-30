'use client'

/**
 * Import Drawer Component
 * 
 * A slide-in drawer that contains the import wizard.
 * Opens from the right side of the screen, maintaining context
 * while providing a focused workspace for the import flow.
 * 
 * Features:
 * - Modern side-panel UX pattern
 * - Maintains visibility of the main list view
 * - Non-modal interaction (can click outside to close)
 * - Responsive: full-screen on mobile, 70% width on desktop
 * - Smooth animations
 */

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ImportWizard } from './import-wizard'
import { FileSpreadsheet } from 'lucide-react'

interface ImportDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  type: 'departments' | 'positions'
}

export function ImportDrawer({ open, onClose, onSuccess, type }: ImportDrawerProps) {
  const t = useTranslations('import')

  // Handle successful import
  const handleImportSuccess = () => {
    if (onSuccess) {
      onSuccess()
    }
    // Auto-close drawer after short delay to show success message
    setTimeout(() => {
      onClose()
    }, 2000)
  }

  // Reset scroll position when drawer opens
  useEffect(() => {
    if (open) {
      // Scroll to top of drawer content
      const drawerContent = document.querySelector('[role="dialog"]')
      if (drawerContent) {
        drawerContent.scrollTop = 0
      }
    }
  }, [open])

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[95%] md:w-[75%] lg:w-[65%] xl:w-[60%] 2xl:w-[55%] p-0 overflow-hidden flex flex-col"
      >
        {/* Modern Gradient Header */}
        <SheetHeader className="px-6 md:px-8 pt-6 md:pt-8 pb-6 border-b bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
          {/* Decorative blur orb */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 ring-1 ring-primary/20 backdrop-blur-sm">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                {t('drawer.title')}
              </SheetTitle>
              <SheetDescription className="text-sm md:text-base text-muted-foreground">
                {t('drawer.description', { type: t(`drawer.types.${type}`) })}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable Content with better padding and max-width for readability */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 md:px-8 py-6 md:py-8 max-w-5xl mx-auto">
            <ImportWizard 
              onSuccess={handleImportSuccess}
              importType={type}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
