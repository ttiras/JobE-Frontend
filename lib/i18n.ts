import {getRequestConfig} from 'next-intl/server';

// Can be imported from a shared config
export const locales = ['en', 'tr'] as const;
export const defaultLocale = 'en' as const;

export default getRequestConfig(async ({locale}) => {
  // This typically corresponds to the `[locale]` segment
  type Locale = typeof locales[number]
  const isLocale = (input: unknown): input is Locale =>
    typeof input === 'string' && (locales as readonly string[]).includes(input)

  const resolvedLocale: Locale = isLocale(locale) ? locale : defaultLocale

  return {
    locale: resolvedLocale,
    messages: (await import(`../messages/${resolvedLocale}.json`)).default
  };
});
