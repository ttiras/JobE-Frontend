'use client';

/**
 * ImportConfirmationDialog Component
 * 
 * Modal dialog for import confirmation
 * Features:
 * - Summary of operations (creates/updates)
 * - Warning about data changes
 * - Accessible dialog (keyboard navigation, focus trap)
 * - Bilingual support
 */

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Building2, Briefcase, Loader2 } from 'lucide-react';
import { ImportSummary } from '@/lib/types/import';

export interface ImportConfirmationDialogProps {
  isOpen: boolean;
  summary: ImportSummary;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ImportConfirmationDialog({ 
  isOpen, 
  summary, 
  isConfirming = false,
  onConfirm, 
  onCancel 
}: ImportConfirmationDialogProps) {
  const t = useTranslations('import.confirmation');
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousActiveElementRef.current = document.activeElement as HTMLElement;

      // Focus confirm button when dialog opens
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 0);

      // Get all focusable elements within the dialog
      const getFocusableElements = (): HTMLElement[] => {
        if (!dialogRef.current) return [];
        const focusableSelectors = [
          'button:not([disabled])',
          '[href]',
          'input:not([disabled])',
          'select:not([disabled])',
          'textarea:not([disabled])',
          '[tabindex]:not([tabindex="-1"])',
        ].join(', ');
        return Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelectors));
      };

      // Trap focus within dialog
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isConfirming) {
          onCancel();
          return;
        }

        if (e.key === 'Tab') {
          const focusableElements = getFocusableElements();
          if (focusableElements.length === 0) return;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];
          const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

          // Always prevent default and manage focus manually to ensure consistent behavior
          e.preventDefault();

          if (e.shiftKey) {
            // Shift + Tab (backwards)
            if (currentIndex <= 0 || currentIndex === -1) {
              // Wrap to last element
              lastElement.focus();
            } else {
              // Move to previous element
              focusableElements[currentIndex - 1].focus();
            }
          } else {
            // Tab (forwards)
            if (currentIndex === -1) {
              // If active element not found, focus first element
              firstElement.focus();
            } else if (currentIndex >= focusableElements.length - 1) {
              // Wrap to first element
              firstElement.focus();
            } else {
              // Move to next element
              focusableElements[currentIndex + 1].focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        // Restore focus to previously focused element
        if (previousActiveElementRef.current) {
          previousActiveElementRef.current.focus();
        }
      };
    }
  }, [isOpen, isConfirming, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-warning"
    >
      {/* Backdrop */}
      <div 
        data-testid="dialog-backdrop"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={!isConfirming ? onCancel : undefined}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div 
        ref={dialogRef}
        className="relative bg-background border rounded-lg shadow-lg max-w-lg w-full mx-4 p-6 space-y-6"
      >
        {/* Header */}
        <div className="space-y-2">
          <h2 
            id="dialog-title" 
            className="text-xl font-semibold flex items-center gap-2"
          >
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            {t('title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        {/* Summary statistics */}
        <div className="space-y-4">
          {/* Departments */}
          <div className="p-4 border rounded-lg space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Building2 className="h-4 w-4 text-primary" />
              {t('departments')}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">{t('creates')}</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {summary.departments.creates}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">{t('updates')}</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {summary.departments.updates}
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground border-t pt-2">
              {t('total')}: {summary.departments.total}
            </div>
          </div>

          {/* Positions */}
          <div className="p-4 border rounded-lg space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Briefcase className="h-4 w-4 text-primary" />
              {t('positions')}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">{t('creates')}</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {summary.positions.creates}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">{t('updates')}</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {summary.positions.updates}
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground border-t pt-2">
              {t('total')}: {summary.positions.total}
            </div>
          </div>
        </div>

        {/* Warning message */}
        <div id="dialog-warning" role="alert" className="p-4 border border-yellow-600/50 bg-yellow-600/10 rounded-lg">
          <p className="text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <span>{t('warning')}</span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isConfirming}
            className="px-4 py-2 border rounded-md hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('cancel')}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            disabled={isConfirming}
            aria-busy={isConfirming}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isConfirming && <Loader2 className="h-4 w-4 animate-spin" />}
            {isConfirming ? t('confirming') : t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
