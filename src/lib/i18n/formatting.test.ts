import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, formatNumber, toIntlLocale } from './formatting';

describe('i18n formatting', () => {
  it('maps locales to Malaysian BCP 47 tags', () => {
    expect(toIntlLocale('en')).toBe('en-MY');
    expect(toIntlLocale('ms')).toBe('ms-MY');
  });

  it('formats dates consistently', () => {
    const date = new Date(Date.UTC(2026, 8, 24, 8, 30, 0)); // Sep 24, 2026
    const formattedEn = formatDate(date, 'en');
    const formattedMs = formatDate(date, 'ms');

    expect(formattedEn).toContain('2026');
    expect(formattedMs).toContain('2026');
  });

  it('formats date and time consistently', () => {
    const date = new Date(Date.UTC(2026, 8, 24, 8, 30, 0));
    const formattedEn = formatDateTime(date, 'en');
    const formattedMs = formatDateTime(date, 'ms');

    expect(formattedEn).toBeTruthy();
    expect(formattedMs).toBeTruthy();
  });

  it('returns empty string for invalid dates', () => {
    expect(formatDate('invalid-date', 'en')).toBe('');
    expect(formatDateTime('invalid-date', 'ms')).toBe('');
  });

  it('formats numbers with locale conventions', () => {
    expect(formatNumber(1234.56, 'en')).toBe('1,234.56');
    expect(formatNumber(1234.56, 'ms')).toBe('1,234.56');
  });

  it('returns empty string for non-finite numbers', () => {
    expect(formatNumber(Number.NaN, 'en')).toBe('');
    expect(formatNumber(Number.POSITIVE_INFINITY, 'ms')).toBe('');
  });
});
