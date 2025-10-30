/**
 * PendingChangesBar Component
 * 
 * Floating action bar that appears when there are pending department moves.
 * Shows change count and provides Save/Undo actions.
 */

'use client';

import { AlertCircle, Check, Save, X, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PendingDepartmentMove } from '@/lib/types/hierarchy';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface PendingChangesBarProps {
  pendingMoves: PendingDepartmentMove[];
  onSave: () => Promise<void>;
  onUndoAll: () => void;
  isSaving?: boolean;
  className?: string;
}

export function PendingChangesBar({
  pendingMoves,
  onSave,
  onUndoAll,
  isSaving = false,
  className,
}: PendingChangesBarProps) {
  const [showReview, setShowReview] = useState(false);
  const moveCount = pendingMoves.length;

  if (moveCount === 0) return null;

  const handleSave = async () => {
    setShowReview(false);
    await onSave();
  };

  return (
    <>
      {/* Floating Action Bar */}
      <div
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
          'animate-in slide-in-from-bottom-4 fade-in duration-300',
          className
        )}
      >
        <Alert className="border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/50 shadow-2xl min-w-[400px]">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-amber-900 dark:text-amber-100">
                {moveCount} unsaved {moveCount === 1 ? 'change' : 'changes'}
              </span>
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
              >
                Pending
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {/* Review Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReview(true)}
                disabled={isSaving}
                className="h-8 text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900"
              >
                <Eye className="w-4 h-4 mr-1.5" />
                Review
              </Button>

              {/* Undo All Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={onUndoAll}
                disabled={isSaving}
                className="h-8 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900"
              >
                <X className="w-4 h-4 mr-1.5" />
                Undo All
              </Button>

              {/* Save Button */}
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1.5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>

      {/* Review Dialog */}
      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Review Changes</DialogTitle>
            <DialogDescription>
              You're about to save {moveCount} department {moveCount === 1 ? 'move' : 'moves'}.
              Review the changes below.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[400px] overflow-y-auto">
            <div className="space-y-3">
              {pendingMoves.map((move, index) => {
                const oldParent = move.oldParentId ? 'a parent department' : 'Root';
                const newParent = move.newParentId ? 'a new parent' : 'Root';

                return (
                  <div
                    key={move.departmentId}
                    className="flex items-start gap-3 p-3 border rounded-lg bg-slate-50 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm mb-1">
                        {move.departmentName}
                        <span className="ml-2 text-xs font-mono text-muted-foreground">
                          ({move.departmentCode})
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Moving from <span className="font-medium">{oldParent}</span> to{' '}
                        <span className="font-medium">{newParent}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowReview(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save All Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
