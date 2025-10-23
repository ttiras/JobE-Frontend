"use client";

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRef, useEffect, KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { navigationConfig } from '@/config/navigation';
import { filterNavigationByRole } from '@/lib/utils/navigation-filter';
import { useAuth } from '@/lib/contexts/auth-context';
import { NavItem } from './nav-item';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface SidebarProps {
  isCollapsed?: boolean;
  isMobile?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  isCollapsed = false,
  isMobile = false,
  isOpen = false,
  onOpenChange,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const navRef = useRef<HTMLElement>(null);
  const { user } = useAuth();

  // Filter navigation items by user role
  const userRole = user?.defaultRole || 'user';
  const visibleNavItems = filterNavigationByRole(navigationConfig, userRole);

  // Handle arrow key navigation
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!navRef.current) return;

    const links = Array.from(
      navRef.current.querySelectorAll('a[href]')
    ) as HTMLAnchorElement[];
    
    const currentIndex = links.findIndex((link) => link === document.activeElement);

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      
      let nextIndex: number;
      if (event.key === 'ArrowDown') {
        nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % links.length;
      } else {
        nextIndex = currentIndex === -1 ? links.length - 1 : (currentIndex - 1 + links.length) % links.length;
      }
      
      links[nextIndex]?.focus();
    }
  };

  const navContent = (
    <nav
      ref={navRef}
      aria-label="Main navigation"
      className="flex flex-col p-4 space-y-2"
      onKeyDown={handleKeyDown}
    >
      {visibleNavItems.map((item, index) => (
        <NavItem
          key={item.id}
          item={item}
          isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
          label={t(item.label)}
          isCollapsed={isCollapsed && !isMobile}
        />
      ))}
    </nav>
  );

  // Mobile: Render as Sheet overlay
  if (isMobile) {
    if (!isOpen) return null;
    
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent
          side="left"
          className="w-64 p-0"
          aria-label="Mobile navigation menu"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          {navContent}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop/Tablet: Render as persistent sidebar
  return (
    <aside
      role="complementary"
      className={cn(
        'border-r bg-background h-screen sticky top-0 transition-all duration-300 flex flex-col',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {navContent}
      
      {/* Collapse/Expand Toggle Button */}
      {onToggleCollapse && (
        <div className="mt-auto p-4 border-t">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="w-full"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span className="ml-2 text-sm">Collapse</span>
              </>
            )}
          </Button>
        </div>
      )}
    </aside>
  );
}
