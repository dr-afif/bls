import type { AppLocale } from './types';

export interface LocalizedTextOptions {
  en?: string | null;
  ms?: string | null;
  locale: AppLocale;
}

export function localizedText(options: LocalizedTextOptions): string {
  const { en, ms, locale } = options;
  const enClean = en != null ? en.trim() : '';
  const msClean = ms != null ? ms.trim() : '';

  if (locale === 'ms' && msClean.length > 0) {
    return msClean;
  }

  return enClean;
}
