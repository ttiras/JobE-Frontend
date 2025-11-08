/**
 * Session Expired Dialog Component
 * 
 * Displays when a user's session expires, providing:
 * - User-friendly error message
 * - Re-authentication button
 * - ReturnUrl preservation for redirect after login
 * - Bilingual support (EN/TR)
 * - Keyboard accessibility
 * 
 * @see specs/004-nhost-v4-auth-setup/plan.md Phase 5 (T037)
 */

'use client';

import { useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface SessionExpiredDialogProps {
  /** Controls dialog visibility */
  isOpen: boolean;
  
  /** Called when dialog is closed (cancel button or overlay click) */
  onClose: () => void;
  
  /** Called when user clicks "Log In Again" button */
  onReAuthenticate: () => void;
  
  /** User-friendly error message (from AuthErrorFactory) */
  errorMessage: string;
}

/**
 * SessionExpiredDialog Component
 * 
 * Shows a modal dialog when the user's session expires, providing
 * clear messaging and an easy path to re-authenticate.
 * 
 * @example
 * ```tsx
 * const [showDialog, setShowDialog] = useState(false);
 * const error = AuthErrorFactory.categorize(err);
 * 
 * <SessionExpiredDialog
 *   isOpen={showDialog}
 *   onClose={() => setShowDialog(false)}
 *   onReAuthenticate={handleReAuth}
 *   errorMessage={error.getMessage(locale)}
 * />
 * ```
 */
export function SessionExpiredDialog({
  isOpen,
  onClose,
  onReAuthenticate,
  errorMessage,
}: SessionExpiredDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('auth.sessionExpired');

  /**
   * Handle re-authentication flow
   * Preserves current page URL for redirect after login
   */
  const handleReAuthenticate = useCallback(() => {
    // Preserve current page for redirect after login (omit locale prefix for default locale)
    const dashboardPath = locale === 'en' ? '/dashboard' : `/${locale}/dashboard`
    const returnUrl = encodeURIComponent(pathname || dashboardPath);
    
    // Navigate to login with returnUrl (omit locale prefix for default locale)
    const loginPath = locale === 'en' ? '/login' : `/${locale}/login`
    router.push(`${loginPath}?returnUrl=${returnUrl}`);
    
    // Call parent handler
    onReAuthenticate();
  }, [pathname, locale, router, onReAuthenticate]);

  /**
   * Handle dialog close
   * Called when user clicks cancel or overlay
   */
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="sm:max-w-[425px]"
        data-testid="session-expired-dialog"
        aria-describedby="session-expired-description"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
            </div>
            <DialogTitle className="text-left">
              {t('title')}
            </DialogTitle>
          </div>
          <DialogDescription
            id="session-expired-description"
            className="text-left pt-2"
            data-testid="error-message"
          >
            {errorMessage || t('defaultMessage')}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            data-testid="close-button"
            className="w-full sm:w-auto"
          >
            {t('cancelButton')}
          </Button>
          <Button
            onClick={handleReAuthenticate}
            data-testid="reauth-button"
            className="w-full sm:w-auto"
          >
            {t('loginButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
