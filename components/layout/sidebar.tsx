"use client";

import { usePathname, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRef, KeyboardEvent, useState, useMemo } from 'react';
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
  const params = useParams();
  const t = useTranslations();
  const navRef = useRef<HTMLElement>(null);
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  // Get orgId from URL params
  const orgId = params?.orgId as string | undefined;
  const locale = params?.locale as string | undefined;

  // Filter navigation items by user role
  const userRole = user?.defaultRole || 'user';
  const visibleNavItems = filterNavigationByRole(navigationConfig, userRole);

  // Normalize pathname for comparison (remove locale prefix if it exists)
  const normalizedPathname = useMemo(() => {
    // Remove leading locale if present (e.g., /tr/dashboard/... -> /dashboard/...)
    // But keep /dashboard/... as is if no locale
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');
    return pathWithoutLocale;
  }, [pathname]);

  // Make nav items org-aware
  const orgAwareNavItems = useMemo(() => {
    if (!orgId) return visibleNavItems;
    
    const localePrefix = locale && locale !== 'en' ? `/${locale}` : '';
    
    return visibleNavItems.map(item => ({
      ...item,
      href: `${localePrefix}/dashboard/${orgId}${item.href}`,
      // Store normalized href for comparison (without locale)
      normalizedHref: `/dashboard/${orgId}${item.href}`,
    }));
  }, [visibleNavItems, orgId, locale]);

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
      className="flex flex-col p-3 flex-1 relative z-10"
      onKeyDown={handleKeyDown}
    >
      {orgAwareNavItems.map((item, index) => {
        // Determine if we should add spacing before this item
        const prevItem = index > 0 ? orgAwareNavItems[index - 1] : null;
        const shouldAddSpacing = prevItem && item.group !== prevItem.group;
        
        // Check if current item is active using normalized paths
        const itemNormalized = (item as any).normalizedHref || item.href;
        
        let isActive = false;
        
        // URL matching logic
        // Special case: Dashboard (check by ID since href gets transformed)
        if (item.id === 'dashboard') {
          // Dashboard: Only active when at exact dashboard root, not any sub-routes
          const dashboardRoot = `/dashboard/${orgId}`;
          // Normalize both paths for comparison (remove trailing slashes)
          const normalizedCurrent = normalizedPathname.replace(/\/$/, '');
          const normalizedDashboard = dashboardRoot.replace(/\/$/, '');
          isActive = normalizedCurrent === normalizedDashboard;
        } else if (itemNormalized) {
          // All items are now leaf routes (no children)
          // Active if exact match or a deeper sub-route
          const normalizedCurrent = normalizedPathname.replace(/\/$/, '');
          const normalizedItem = itemNormalized.replace(/\/$/, '');
          isActive = normalizedCurrent === normalizedItem || normalizedCurrent.startsWith(`${normalizedItem}/`);
        }
        
        return (
          <div key={item.id}>
            {/* Add spacing between different groups */}
            {shouldAddSpacing && (
              <div className="h-4" aria-hidden="true" />
            )}
            
            <NavItem
              item={item}
              isActive={isActive ?? false}
              label={t(item.label)}
              isCollapsed={!isHovered && !isMobile}
              isHovered={isHovered || isMobile}
              hasChildren={false}
              isExpanded={false}
              onToggle={undefined}
            />
          </div>
        );
      })}
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
        'bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80',
        'transition-all duration-300 ease-out',
        isHovered ? 'w-60 shadow-lg' : 'w-16 shadow-sm',
        'overflow-hidden'
      )}
    >
      {/* Elegant border with gradient accent */}
      <div className={cn(
        "absolute right-0 top-0 h-full w-px",
        "bg-gradient-to-b from-border/50 via-border to-border/50",
        "transition-opacity duration-300",
        isHovered && "opacity-70"
      )} />
      
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/0 via-background/0 to-accent/5 pointer-events-none" />
      
      {navContent}
    </aside>
  );
}
