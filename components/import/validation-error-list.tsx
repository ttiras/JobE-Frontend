'use client';

/**
 * ValidationErrorList Component
 * 
 * Displays validation errors with row/column specificity
 * Features:
 * - Grouped by error type
 * - Row and column highlighting
 * - Severity indicators (ERROR/WARNING)
 * - Actionable suggestions
 * - Accessible error announcements
 */

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, AlertTriangle, Download } from 'lucide-react';
import { ValidationError, ErrorSeverity, ErrorType } from '@/lib/types/import';

export interface ValidationErrorListProps {
  errors: ValidationError[];
  onDownloadOriginal?: () => void;
  className?: string;
}

export function ValidationErrorList({ 
  errors, 
  onDownloadOriginal,
  className = '' 
}: ValidationErrorListProps) {
  const t = useTranslations('import.validation');

  // Group errors by type for better organization
  const groupedErrors = useMemo(() => {
    const groups = new Map<ErrorType, ValidationError[]>();
    
    errors.forEach(error => {
      const existing = groups.get(error.type) || [];
      groups.set(error.type, [...existing, error]);
    });

    return groups;
  }, [errors]);

  // Count errors by severity
  const errorCounts = useMemo(() => {
    return errors.reduce(
      (acc, error) => {
        if (error.severity === ErrorSeverity.ERROR) {
          acc.errors++;
        } else {
          acc.warnings++;
        }
        return acc;
      },
      { errors: 0, warnings: 0 }
    );
  }, [errors]);

  if (errors.length === 0) {
    return null;
  }

  return (
    <div 
      className={`rounded-lg border border-destructive/50 bg-destructive/5 ${className}`}
      role="alert"
      aria-live="polite"
    >
      {/* Header */}
      <div className="border-b border-destructive/50 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-destructive">
                {t('title')}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('errorCount', { count: errors.length })}
                {errorCounts.warnings > 0 && ` (${errorCounts.warnings} warnings)`}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('fixErrors')}
              </p>
            </div>
          </div>

          {onDownloadOriginal && (
            <button
              onClick={onDownloadOriginal}
              className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-secondary transition-colors"
              aria-label={t('downloadOriginal')}
            >
              <Download className="h-4 w-4" />
              {t('downloadOriginal')}
            </button>
          )}
        </div>
      </div>

      {/* Error list */}
      <div className="divide-y divide-border">
        {Array.from(groupedErrors.entries()).map(([errorType, typeErrors]) => (
          <div key={errorType} className="p-4">
            {/* Error type header */}
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              {errorType.replace(/_/g, ' ')}
              <span className="text-xs text-muted-foreground">
                ({typeErrors.length})
              </span>
            </h4>

            {/* Individual errors */}
            <div className="space-y-2">
              {typeErrors.map((error, index) => (
                <div 
                  key={`${error.type}-${error.row}-${index}`}
                  className="flex items-start gap-3 p-3 rounded-md bg-background border"
                >
                  {/* Severity icon */}
                  {error.severity === ErrorSeverity.ERROR ? (
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  )}

                  {/* Error details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Location */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">
                        {t('row')} {error.row}
                      </span>
                      {error.column && (
                        <>
                          <span>•</span>
                          <span className="font-medium">
                            {t('column')}: {error.column}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span className="uppercase">
                        {error.sheet}
                      </span>
                    </div>

                    {/* Message */}
                    <p className="text-sm">
                      {error.message}
                    </p>

                    {/* Suggestion */}
                    {error.suggestion && (
                      <p className="text-sm text-muted-foreground italic">
                        💡 {error.suggestion}
                      </p>
                    )}

                    {/* Affected codes */}
                    {error.affectedCodes && error.affectedCodes.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Affected codes:</span>
                        {error.affectedCodes.map((code, codeIndex) => (
                          <code 
                            key={`${error.type}-${error.row}-${code}-${codeIndex}`}
                            className="text-xs px-2 py-0.5 rounded bg-secondary font-mono"
                          >
                            {code}
                          </code>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
