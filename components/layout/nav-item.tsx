"use client";

import Link from 'next/link';
import * as Icons from 'lucide-react';
import { NavigationItem } from '@/lib/utils/navigation-filter';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItemProps {
  item: NavigationItem;
  isActive: boolean;
  label: string;
  isCollapsed?: boolean;
  isHovered?: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  isChild?: boolean;
}

export function NavItem({ 
  item, 
  isActive, 
  label, 
  isCollapsed = false, 
  isHovered = false,
  hasChildren = false,
  isExpanded = false,
  onToggle,
  isChild = false
}: NavItemProps) {
  // Dynamically get the icon component
  const IconComponent = Icons[item.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren && onToggle) {
      e.preventDefault();
      onToggle();
    }
  };

  const linkContent = (
    <Link
      href={hasChildren ? '#' : item.href}
      onClick={handleClick}
      className={cn(
        'group relative flex items-center transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'py-2.5 px-2 rounded-lg',
        'overflow-hidden', // Important for clipping the sliding content
        isActive 
          ? 'bg-primary/90 text-primary-foreground font-semibold shadow-sm border-l-4 border-primary-foreground/30' 
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
        isChild && 'text-sm py-2'
      )}
      aria-label={isCollapsed ? label : undefined}
      aria-current={isActive ? 'page' : undefined}
      aria-expanded={hasChildren ? isExpanded : undefined}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-foreground rounded-r-full" />
      )}
      
      {/* Icon container - fixed position */}
      <div className={cn(
        'flex items-center justify-center transition-all duration-200 flex-shrink-0',
        'w-8 h-8 rounded-md',
        isChild && 'w-6 h-6'
      )}>
        {IconComponent && (
          <IconComponent
            className={cn(
              "transition-transform duration-200",
              'h-4 w-4',
              !isActive && 'group-hover:scale-110',
              isChild && 'h-3 w-3'
            )}
            aria-hidden="true"
          />
        )}
      </div>
      
      {/* Label container with sliding animation */}
      <div
        className={cn(
          "flex items-center gap-2 ml-3 whitespace-nowrap",
          "transition-all duration-300 ease-out",
          // Use width and opacity for smooth slide effect
          isHovered 
            ? 'w-40 opacity-100' 
            : 'w-0 opacity-0 ml-0',
          isChild && 'text-xs'
        )}
      >
        <span className="font-medium">
          {label}
        </span>
        {hasChildren && isHovered && (
          <ChevronDown 
            className={cn(
              "h-3 w-3 transition-transform duration-200 ml-auto",
              isExpanded && "rotate-180"
            )}
          />
        )}
      </div>
    </Link>
  );

  // Wrap with Tooltip when collapsed
  if (isCollapsed && !isHovered) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent 
            side="right" 
            className="font-medium bg-popover/95 backdrop-blur-sm border shadow-lg"
            sideOffset={8}
          >
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return linkContent;
}
