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
        'group relative flex items-center transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded-lg',
        'py-2 rounded-xl text-sm',
        'overflow-hidden',
        // Center icons when collapsed, normal padding when expanded
        isCollapsed ? 'justify-center px-0' : 'px-3',
        // Only apply background when expanded (hovered)
        isActive && isHovered
          ? 'bg-primary/10 text-primary font-medium shadow-sm' 
          : isActive 
            ? 'text-primary font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
        isChild && 'py-1.5 rounded-lg text-xs'
      )}
      aria-label={isCollapsed ? label : undefined}
      aria-current={isActive ? 'page' : undefined}
      aria-expanded={hasChildren ? isExpanded : undefined}
    >
      {/* Icon container - active background when collapsed */}
      <div className={cn(
        'flex items-center justify-center transition-all duration-300 flex-shrink-0',
        'w-8 h-8 rounded-lg',
        // Apply background to icon only when collapsed and active
        isActive && !isHovered && 'bg-primary/10 shadow-sm',
        isChild && 'w-6 h-6'
      )}>
        {IconComponent && (
          <IconComponent
            className={cn(
              "transition-all duration-300",
              'h-[17px] w-[17px]',
              isActive ? 'scale-105 stroke-[2.5]' : 'stroke-[2] group-hover:scale-105',
              isChild && 'h-3.5 w-3.5'
            )}
            aria-hidden="true"
          />
        )}
      </div>
      
      {/* Label with smooth animation */}
      <div
        className={cn(
          "flex items-center gap-2 ml-2.5 whitespace-nowrap",
          "transition-all duration-300 ease-out",
          isHovered 
            ? 'w-40 opacity-100' 
            : 'w-0 opacity-0 ml-0'
        )}
      >
        <span className={cn(
          "transition-all duration-200",
          isActive && "font-medium"
        )}>
          {label}
        </span>
        {hasChildren && isHovered && (
          <ChevronDown 
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-300 ml-auto",
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
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent 
            side="right" 
            className="font-medium bg-popover/98 backdrop-blur-md border shadow-xl px-3 py-2 rounded-lg"
            sideOffset={12}
          >
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return linkContent;
}
