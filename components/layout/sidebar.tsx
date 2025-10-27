"use client";

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRef, KeyboardEvent, useState } from 'react';
import { navigationConfig } from '@/config/navigation';
import { filterNavigationByRole } from '@/lib/utils/navigation-filter';
import { useAuth } from '@/lib/contexts/auth-context';
import { NavItem } from './nav-item';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface SidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Sidebar({
  isMobile = false,
  isOpen = false,
  onOpenChange,
}: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const navRef = useRef<HTMLElement>(null);
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

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
      className="flex flex-col p-3 space-y-1 flex-1 relative z-10"
      onKeyDown={handleKeyDown}
    >
      {visibleNavItems.map((item) => (
        <NavItem
          key={item.id}
          item={item}
          isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
          label={t(item.label)}
          isCollapsed={!isHovered && !isMobile}
          isHovered={isHovered || isMobile}
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

  // Desktop/Tablet: Render as persistent sidebar with hover-expand overlay
  return (
    <aside
      role="complementary"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)] flex flex-col',
        'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        'transition-all duration-300 ease-out',
        isHovered ? 'w-60' : 'w-16',
        'shadow-sm'
      )}
    >
      {/* Border that moves with the width */}
      <div className="absolute right-0 top-0 h-full w-px bg-border" />
      {navContent}
    </aside>
  );
}
