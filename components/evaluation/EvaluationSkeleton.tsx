/**
 * Evaluation Skeleton Component
 * 
 * Loading skeleton for the evaluation page.
 * Displays placeholder UI while fetching evaluation data.
 * 
 * Features:
 * - Header skeleton with position info area
 * - Factor stepper skeleton (circles with connecting lines)
 * - Sidebar skeleton with factor/dimension list
 * - Content area skeleton for questions
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function EvaluationSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-50 bg-background border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            {/* Left side - Position info */}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>

          {/* Progress skeleton */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Stepper Skeleton - Desktop */}
        <div className="hidden lg:block">
          <div className="flex items-center justify-between gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 flex-1">
                {/* Factor circle */}
                <div className="flex flex-col items-center gap-2">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                {/* Connecting line (except last) */}
                {i < 4 && <Skeleton className="h-0.5 flex-1" />}
              </div>
            ))}
          </div>
        </div>

        {/* Stepper Skeleton - Mobile */}
        <div className="lg:hidden space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="mt-8 flex gap-6">
          {/* Sidebar Skeleton - Desktop */}
          <aside className="hidden lg:block fixed left-0 top-0 h-screen w-[280px] border-r bg-background z-40 pt-[180px]">
            <div className="px-4 pb-3 border-b">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>

            <div className="p-4 space-y-4">
              {/* Factor groups */}
              {[1, 2, 3].map((f) => (
                <div key={f} className="space-y-2">
                  {/* Factor header */}
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-12" />
                  </div>

                  {/* Dimensions (only show for first factor) */}
                  {f === 1 && (
                    <div className="ml-6 space-y-2">
                      {[1, 2, 3].map((d) => (
                        <div key={d} className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-4 flex-1" />
                          <Skeleton className="h-5 w-8" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>

          {/* Main Content Skeleton */}
          <div className="flex-1 lg:ml-[280px]">
            <div className="border rounded-lg p-6 space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              {/* Content blocks */}
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border rounded-lg space-y-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile floating button skeleton */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <Skeleton className="h-14 w-40 rounded-full" />
        </div>
      </div>
    </div>
  );
}
