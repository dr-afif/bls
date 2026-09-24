import { describe, expect, it } from 'vitest';
import { localizedText } from './localized-text';

describe('localizedText', () => {
  it('returns Bahasa Melayu text when locale is ms and ms value is non-empty', () => {
    const result = localizedText({
      en: 'Adult Basic Life Support',
      ms: 'Bantuan Asas Hayat Dewasa',
      locale: 'ms',
    });
    expect(result).toBe('Bantuan Asas Hayat Dewasa');
  });

  it('falls back to English when locale is ms but ms value is null', () => {
    const result = localizedText({
      en: 'Adult Basic Life Support',
      ms: null,
      locale: 'ms',
    });
    expect(result).toBe('Adult Basic Life Support');
  });

  it('falls back to English when locale is ms but ms value is empty or whitespace-only', () => {
    expect(
      localizedText({
        en: 'Adult Basic Life Support',
        ms: '',
        locale: 'ms',
      }),
    ).toBe('Adult Basic Life Support');

    expect(
      localizedText({
        en: 'Adult Basic Life Support',
        ms: '   ',
        locale: 'ms',
      }),
    ).toBe('Adult Basic Life Support');
  });

  it('returns English when locale is en even if ms value is present', () => {
    const result = localizedText({
      en: 'Adult Basic Life Support',
      ms: 'Bantuan Asas Hayat Dewasa',
      locale: 'en',
    });
    expect(result).toBe('Adult Basic Life Support');
  });

  it('trims leading and trailing whitespace from returned string', () => {
    expect(
      localizedText({
        en: '  Adult BLS  ',
        ms: '  BLS Dewasa  ',
        locale: 'en',
      }),
    ).toBe('Adult BLS');

    expect(
      localizedText({
        en: '  Adult BLS  ',
        ms: '  BLS Dewasa  ',
        locale: 'ms',
      }),
    ).toBe('BLS Dewasa');
  });

  it('returns empty string when both values are null or undefined', () => {
    expect(
      localizedText({
        en: null,
        ms: null,
        locale: 'en',
      }),
    ).toBe('');

    expect(
      localizedText({
        en: undefined,
        ms: undefined,
        locale: 'ms',
      }),
    ).toBe('');
  });
});
