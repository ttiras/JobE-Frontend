"use client";

import Link from 'next/link';
import { Menu, LogOut, User, Building2, ChevronDown } from 'lucide-react';
import { RefObject } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from './theme-toggle';
import { logout } from '@/lib/nhost/auth';
import { useAuth } from '@/lib/hooks/use-auth';
import { useOrganization } from '@/lib/contexts/organization-context';
import { cn } from '@/lib/utils';

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
  const { currentOrganization } = useOrganization();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Successfully signed out');
      router.push(`/${locale}/login`);
    } catch {
      toast.error('Failed to sign out. Please try again.');
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.displayName) return <User className="h-4 w-4" />;
    return user.displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header
      role="banner"
      className={cn(
        "h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "flex items-center justify-between px-4 md:px-6 gap-4",
        "sticky top-0 z-50 shadow-sm"
      )}
    >
      <div className="flex items-center gap-3">
        {showMenuButton && (
          <Button
            ref={menuButtonRef}
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            aria-expanded={false}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <Link
          href="/dashboard"
          className={cn(
            "text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent",
            "hover:from-primary/80 hover:to-primary/40 transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md px-1"
          )}
        >
          JobE
        </Link>

        {/* Organization Selector - Similar to Supabase project selector */}
        {isAuthenticated && currentOrganization && (
          <div className="hidden md:flex items-center ml-4 pl-4 border-l">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors text-left group">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{currentOrganization.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </button>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <ThemeToggle />
        
        {isAuthenticated && (
          <div className="flex items-center gap-2 pl-2 border-l">
            {/* User Profile Button */}
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 h-9 px-2"
            >
              <Avatar className="h-7 w-7 border-2 border-primary/10">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm font-medium">
                {user?.displayName || user?.email?.split('@')[0] || 'User'}
              </span>
            </Button>
            
            {/* Logout Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
