"use client";

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const currentLanguage = languages.find((lang) => lang.code === locale) || languages[0];

  const switchLanguage = (newLocale: string) => {
    if (newLocale === locale) return;

    // Remove current locale from pathname if present
    let pathWithoutLocale = pathname;
    if (pathname.startsWith(`/${locale}`)) {
      pathWithoutLocale = pathname.slice(locale.length + 1) || '/';
    }

    // Build new path with new locale (omit default locale 'en')
    const newPathname = newLocale === 'en' 
      ? pathWithoutLocale 
      : `/${newLocale}${pathWithoutLocale}`;

    // Use replace to change locale without adding to history
    router.replace(newPathname);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          aria-label="Change language"
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline-flex items-center gap-1">
            <span>{currentLanguage.flag}</span>
            <span>{currentLanguage.name}</span>
          </span>
          <span className="sm:hidden">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => switchLanguage(language.code)}
            className="gap-2 cursor-pointer"
          >
            <span>{language.flag}</span>
            <span>{language.name}</span>
            {language.code === locale && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
