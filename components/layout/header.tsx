"use client";

import Link from 'next/link';
import { Menu, LogOut } from 'lucide-react';
import { RefObject } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import { logout } from '@/lib/nhost/auth';
import { useAuth } from '@/lib/hooks/use-auth';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  menuButtonRef?: RefObject<HTMLButtonElement | null>;
}

export default function Header({
  onMenuClick,
  showMenuButton = false,
  menuButtonRef,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.match(/^\/(en|tr)\b/)?.[1] || 'en';
  const { isAuthenticated, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Successfully signed out');
  router.push(`/${locale}/login`);
    } catch (error) {
      toast.error('Failed to sign out. Please try again.');
    }
  };

  return (
    <header
      role="banner"
      className="h-16 border-b bg-background flex items-center justify-between px-4 md:px-6 gap-4"
    >
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <Button
            ref={menuButtonRef}
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            aria-expanded={false}
          >
            <Menu className="h-6 w-6" />
          </Button>
        )}
        <Link
          href="/dashboard"
          className="text-xl font-bold text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          JobE
        </Link>
      </div>
      
      <div className="flex items-center gap-2">
  <ThemeToggle />
        {isAuthenticated && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        )}
      </div>
    </header>
  );
}
