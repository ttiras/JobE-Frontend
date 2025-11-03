'use client';

import { useTranslations } from 'next-intl';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';

interface EvaluationHeaderProps {
  positionTitle: string;
  positionCode: string;
  departmentName: string | null;
  completedDimensions: number;
  totalDimensions: number;
  onExit: () => void;
}

export function EvaluationHeader({
  positionTitle,
  positionCode,
  departmentName,
  completedDimensions,
  totalDimensions,
  onExit,
}: EvaluationHeaderProps) {
  const t = useTranslations();
  const progressPercentage =
    totalDimensions > 0
      ? Math.round((completedDimensions / totalDimensions) * 100)
      : 0;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Position Evaluation
                </p>
                <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">
                  {positionTitle}
                </h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <KeyboardShortcutsHelp />
            <Button variant="outline" size="sm" onClick={onExit}>
              <X className="mr-2 h-4 w-4" />
              Save & Exit
            </Button>
          </div>
        </div>
        <div className="pb-2">
          <div className="flex w-full h-2 rounded-full overflow-hidden gap-1">
            {Array.from({ length: totalDimensions > 0 ? totalDimensions : 12 }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-full rounded-sm ${
                  i < completedDimensions ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between">
            <p className="text-xs text-muted-foreground">
              {t('EvaluationStepper.step', {
                current: completedDimensions,
                total: totalDimensions,
              })}
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              {progressPercentage}%
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

