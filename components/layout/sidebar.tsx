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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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
      children: item.children?.map(child => ({
        ...child,
        href: `${localePrefix}/dashboard/${orgId}${child.href}`,
        normalizedHref: `/dashboard/${orgId}${child.href}`
      }))
    }));
  }, [visibleNavItems, orgId, locale]);

  // Toggle parent item expansion
  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

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
      {orgAwareNavItems.map((item) => {
        // Check if any child is active using normalized paths
        const hasActiveChild = item.children?.some(child => {
          const childNormalized = (child as any).normalizedHref || child.href;
          return normalizedPathname === childNormalized || normalizedPathname.startsWith(`${childNormalized}/`);
        });
        
        // Check if current item is active using normalized paths
        // Parent items should NOT be active if a child is active
        const itemNormalized = (item as any).normalizedHref || item.href;
        
        let isActive = false;
        if (itemNormalized) {
          // For items with children, only exact match (no startsWith to avoid matching children routes)
          if (item.children && item.children.length > 0) {
            isActive = !hasActiveChild && normalizedPathname === itemNormalized;
          } else {
            // For items without children, allow startsWith for sub-routes
            isActive = normalizedPathname === itemNormalized || normalizedPathname.startsWith(`${itemNormalized}/`);
          }
        } else {
          // Dashboard (empty href) - only exact match
          isActive = !hasActiveChild && (normalizedPathname === `/dashboard/${orgId}` || normalizedPathname === `/dashboard/${orgId}/`);
        }
        
        // Auto-expand parent if a child is active
        const isExpanded = expandedItems.has(item.id) || hasActiveChild;
        
        return (
          <div key={item.id}>
            <NavItem
              item={item}
              isActive={isActive ?? false}
              label={t(item.label)}
              isCollapsed={!isHovered && !isMobile}
              isHovered={isHovered || isMobile}
              hasChildren={!!item.children}
              isExpanded={isExpanded}
              onToggle={() => toggleExpanded(item.id)}
            />
            
            {/* Render children with sliding animation */}
            <div className={cn(
              "overflow-hidden transition-all duration-300 ease-out",
              item.children && isExpanded && (isHovered || isMobile) 
                ? "max-h-96 opacity-100" 
                : "max-h-0 opacity-0"
            )}>
              <div className="ml-4 mt-1 space-y-1">
                {item.children?.map((child) => {
                  const childNormalized = (child as any).normalizedHref || child.href;
                  const isChildItemActive = normalizedPathname === childNormalized || normalizedPathname.startsWith(`${childNormalized}/`);
                  return (
                    <NavItem
                      key={child.id}
                      item={child}
                      isActive={isChildItemActive}
                      label={t(child.label)}
                      isCollapsed={false}
                      isHovered={isHovered || isMobile}
                      isChild={true}
                    />
                  );
                })}
              </div>
            </div>
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
        'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        'transition-[width] duration-250 ease-out',
        isHovered ? 'w-60' : 'w-16',
        'shadow-sm overflow-hidden' // Add overflow-hidden to clip content
      )}
    >
      {/* Border that moves with the width */}
      <div className="absolute right-0 top-0 h-full w-px bg-border" />
      {navContent}
    </aside>
  );
}
