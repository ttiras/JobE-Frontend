/**
 * Keyboard Shortcuts Help Component
 * 
 * Displays a dialog with available keyboard shortcuts for the evaluation page.
 * Shows shortcuts for navigation (prev/next dimension) and exit.
 */

'use client';

import { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  // Detect OS for correct modifier key display
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    {
      keys: `${modKey} + ←`,
      description: 'Previous dimension',
    },
    {
      keys: `${modKey} + →`,
      description: 'Next dimension (if answered)',
    },
    {
      keys: 'Esc',
      description: 'Exit evaluation',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard className="h-4 w-4" />
          <span className="hidden sm:inline">Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate faster through the evaluation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
              >
                <span className="text-sm">{shortcut.description}</span>
                <kbd className="px-3 py-1.5 text-sm font-semibold text-foreground bg-background border border-border rounded shadow-sm">
                  {shortcut.keys}
                </kbd>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Tip: {isMac ? '⌘ Command' : 'Ctrl'} key + Arrow keys for quick navigation
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
