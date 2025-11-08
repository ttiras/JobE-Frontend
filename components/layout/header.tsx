"use client";

import Link from 'next/link';
import { Menu, LogOut, User, Settings, Sun, Moon, Monitor } from 'lucide-react';
import { RefObject } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { logout } from '@/lib/nhost/auth';
import { useAuth } from '@/lib/hooks/use-auth';
import { OrganizationSwitcher } from '@/components/layout/organization-switcher';
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
  const { setTheme } = useTheme();

  // Debug: Log auth state on mount and when it changes
  if (process.env.NODE_ENV === 'development') {
    console.log('[Header] Render - pathname:', pathname, 'isAuthenticated:', isAuthenticated, 'hasUser:', !!user);
  }

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Successfully signed out');
      router.push(locale === 'en' ? '/login' : `/${locale}/login`);
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
          href={locale === 'en' ? '/dashboard' : `/${locale}/dashboard`}
          className={cn(
            "text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent",
            "hover:from-primary/80 hover:to-primary/40 transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md px-1"
          )}
        >
          JobE
        </Link>

        {/* Organization Switcher - Supabase style */}
        {isAuthenticated && (
          <div className="hidden sm:flex items-center ml-2 sm:ml-4 pl-2 sm:pl-4 border-l">
            <OrganizationSwitcher />
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {/* Mobile Organization Switcher */}
        {isAuthenticated && (
          <div className="sm:hidden">
            <OrganizationSwitcher />
          </div>
        )}

        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full ml-2 border-l pl-4"
              >
                <Avatar className="h-8 w-8 border-2 border-primary/20 ring-1 ring-background">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.displayName || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || 'user@example.com'}
                  </p>
                  {user?.roles && user.roles.length > 0 && (
                    <p className="text-xs leading-none text-muted-foreground mt-1">
                      Role: {user.roles.join(', ')}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => router.push(`/${locale}/profile`)}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => router.push(`/${locale}/settings`)}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <Monitor className="mr-2 h-4 w-4" />
                  <span>Theme</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => setTheme('light')}
                  >
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => setTheme('dark')}
                  >
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => setTheme('system')}
                  >
                    <Monitor className="mr-2 h-4 w-4" />
                    <span>System</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </header>
  );
}
