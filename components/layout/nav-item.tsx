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
}

export function NavItem({ item, isActive, label, isCollapsed = false }: NavItemProps) {
  // Dynamically get the icon component
  const IconComponent = Icons[item.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;

  const linkContent = (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isActive && 'bg-accent text-accent-foreground border-l-4 border-primary',
        isCollapsed && 'justify-center px-2'
      )}
      aria-label={isCollapsed ? label : undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      {IconComponent && (
        <IconComponent
          className="h-5 w-5 flex-shrink-0"
          aria-hidden="true"
        />
      )}
      {!isCollapsed && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );

  // Wrap with Tooltip when collapsed
  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return linkContent;
}
