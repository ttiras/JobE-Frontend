"use client";

import Link from 'next/link';
import * as Icons from 'lucide-react';
import { NavigationItem } from '@/lib/utils/navigation-filter';
import { cn } from '@/lib/utils';
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
}

export function NavItem({ item, isActive, label, isCollapsed = false, isHovered = false }: NavItemProps) {
  // Dynamically get the icon component
  const IconComponent = Icons[item.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;

  const linkContent = (
    <Link
      href={item.href}
      className={cn(
        'group relative flex items-center transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'text-muted-foreground hover:text-foreground',
        'justify-start py-2.5',
        // When expanded, the background spans the full width
        isHovered ? 'px-2 rounded-lg hover:bg-accent/50' : 'px-2 w-16 rounded-lg',
        isActive && isHovered && 'bg-accent text-foreground'
      )}
      aria-label={isCollapsed ? label : undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Icon container - stays in fixed position */}
      <div className={cn(
        'flex items-center justify-center transition-all duration-200 flex-shrink-0',
        'w-8 h-8 rounded-md relative z-10',
        isActive && !isHovered && 'bg-accent text-foreground',
        !isActive && !isHovered && 'group-hover:bg-accent/50'
      )}>
        {IconComponent && (
          <IconComponent
            className={cn(
              "transition-transform duration-200",
              'h-4 w-4',
              !isActive && 'group-hover:scale-110'
            )}
            aria-hidden="true"
          />
        )}
      </div>
      
      {/* Label that slides in from the right with beautiful animation */}
      <span className={cn(
        "absolute left-14 text-sm font-medium whitespace-nowrap px-3 py-2",
        "transition-all duration-300 ease-out",
        isActive && 'text-foreground',
        isHovered 
          ? 'opacity-100 translate-x-0 visible pointer-events-auto' 
          : 'opacity-0 -translate-x-4 invisible pointer-events-none'
      )}>
        {label}
      </span>
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
