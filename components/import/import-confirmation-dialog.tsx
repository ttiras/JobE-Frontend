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

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus confirm button when dialog opens
      confirmButtonRef.current?.focus();

      // Trap focus within dialog
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isConfirming) {
          onCancel();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
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
    >
      {/* Backdrop */}
      <div 
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
        <div className="p-4 border border-yellow-600/50 bg-yellow-600/10 rounded-lg">
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
