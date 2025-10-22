import createMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from './lib/i18n';

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Don't include default locale in URL
  localePrefix: 'as-needed'
});

export const config = {
  // Match only internationalized pathnames
  // Exclude /api, /_next, /static from middleware
  matcher: ['/((?!api|_next|static).*)']
};
