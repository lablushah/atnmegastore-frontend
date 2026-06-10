import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales:       ['en', 'fr', 'bn'],
  defaultLocale: 'en',
});

export type Locale = (typeof routing.locales)[number];
