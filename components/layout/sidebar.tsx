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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['orgStructure']));

  // Get orgId from URL params
  const orgId = params?.orgId as string | undefined;
  const locale = params?.locale as string | undefined;

  // Filter navigation items by user role
  const userRole = user?.defaultRole || 'user';
  const visibleNavItems = filterNavigationByRole(navigationConfig, userRole);

  // Make nav items org-aware
  const orgAwareNavItems = useMemo(() => {
    if (!orgId || !locale) return visibleNavItems;
    
    return visibleNavItems.map(item => ({
      ...item,
      href: `/${locale}/dashboard/${orgId}${item.href}`,
      children: item.children?.map(child => ({
        ...child,
        href: `/${locale}/dashboard/${orgId}${child.href}`
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
        // Check if any child is active
        const isChildActive = item.children?.some(child => 
          pathname === child.href || pathname.startsWith(`${child.href}/`)
        );
        
        // Special handling for dashboard (empty href becomes the org root)
        const isActive = item.href 
          ? pathname === item.href || pathname.startsWith(`${item.href}/`) || isChildActive
          : pathname === `/${locale}/dashboard/${orgId}`;
        
        const isExpanded = expandedItems.has(item.id);
        
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
            
            {/* Render children when expanded */}
            {item.children && isExpanded && (isHovered || isMobile) && (
              <div className="ml-4 mt-1 space-y-1">
                {item.children.map((child) => {
                  const isChildItemActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
                  return (
                    <NavItem
                      key={child.id}
                      item={child}
                      isActive={isChildItemActive}
                      label={t(child.label)}
                      isCollapsed={false}
                      isHovered={true}
                      isChild={true}
                    />
                  );
                })}
              </div>
            )}
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
