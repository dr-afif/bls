import type { AppLocale } from './types';

const BROWSER_LOCALE_MAP: Record<AppLocale, string> = {
  en: 'en-MY',
  ms: 'ms-MY',
};

export function toIntlLocale(locale: AppLocale): string {
  return BROWSER_LOCALE_MAP[locale] ?? 'en-MY';
}

function parseDate(value: Date | string | number): Date {
  if (value instanceof Date) {
    return value;
  }
  return new Date(value);
}

export function formatDate(
  value: Date | string | number,
  locale: AppLocale,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const intlLocale = toIntlLocale(locale);
  return new Intl.DateTimeFormat(
    intlLocale,
    options ?? { dateStyle: 'medium' },
  ).format(date);
}

export function formatDateTime(
  value: Date | string | number,
  locale: AppLocale,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const intlLocale = toIntlLocale(locale);
  return new Intl.DateTimeFormat(
    intlLocale,
    options ?? { dateStyle: 'medium', timeStyle: 'short' },
  ).format(date);
}

export function formatNumber(
  value: number,
  locale: AppLocale,
  options?: Intl.NumberFormatOptions,
): string {
  if (!Number.isFinite(value)) {
    return '';
  }
  const intlLocale = toIntlLocale(locale);
  return new Intl.NumberFormat(intlLocale, options).format(value);
}
