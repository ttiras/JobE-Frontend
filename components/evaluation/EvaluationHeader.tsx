'use client';

import { useTranslations } from 'next-intl';
import { Save, X, MapPin, Building2, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { Badge } from '@/components/ui/badge';

interface EvaluationHeaderProps {
  positionTitle: string;
  positionCode: string;
  departmentName: string | null;
  completedDimensions: number;
  totalDimensions: number;
  onExit: () => void;
  grade?: string | null;
  location?: string | null;
}

export function EvaluationHeader({
  positionTitle,
  positionCode,
  departmentName,
  completedDimensions,
  totalDimensions,
  onExit,
  grade,
  location,
}: EvaluationHeaderProps) {
  const t = useTranslations();
  const progressPercentage =
    totalDimensions > 0
      ? Math.round((completedDimensions / totalDimensions) * 100)
      : 0;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Position evaluation
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
              Save & exit
            </Button>
          </div>
        </div>

        {/* Position Context Chips */}
        {(departmentName || grade || location) && (
          <div className="flex flex-wrap items-center gap-2 pb-3">
            {departmentName && (
              <Badge variant="secondary" className="text-xs font-normal">
                <Building2 className="mr-1.5 h-3 w-3" />
                {departmentName}
              </Badge>
            )}
            {grade && (
              <Badge variant="secondary" className="text-xs font-normal">
                <Award className="mr-1.5 h-3 w-3" />
                Grade {grade}
              </Badge>
            )}
            {location && (
              <Badge variant="secondary" className="text-xs font-normal">
                <MapPin className="mr-1.5 h-3 w-3" />
                {location}
              </Badge>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

