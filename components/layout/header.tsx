"use client";

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './language-switcher';
import { ThemeToggle } from './theme-toggle';

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
  return (
    <header
      role="banner"
      className="h-16 border-b bg-background flex items-center justify-between px-4 md:px-6 gap-4"
    >
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <Button
            ref={menuButtonRef}
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            aria-expanded={false}
          >
            <Menu className="h-6 w-6" />
          </Button>
        )}
        <Link
          href="/dashboard"
          className="text-xl font-bold text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          JobE
        </Link>
      </div>
      
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
