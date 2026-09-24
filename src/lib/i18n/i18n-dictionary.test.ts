import { describe, expect, it } from 'vitest';
import { en } from './en';
import { ms } from './ms';
import type { TranslationKey } from './types';

describe('i18n dictionaries', () => {
  it('enforces exact key parity between English and Bahasa Melayu dictionaries', () => {
    const enKeys = Object.keys(en).sort();
    const msKeys = Object.keys(ms).sort();

    expect(enKeys).toEqual(msKeys);
  });

  it('contains non-empty translations for every key', () => {
    for (const key of Object.keys(en) as TranslationKey[]) {
      expect(en[key], `English key '${key}' should be non-empty`).toBeTruthy();
      expect(ms[key], `Bahasa Melayu key '${key}' should be non-empty`).toBeTruthy();
    }
  });

  it('labels Bahasa Melayu as "Bahasa Melayu" and never "Malay"', () => {
    expect(en['language.malay']).toBe('Bahasa Melayu');
    expect(ms['language.malay']).toBe('Bahasa Melayu');
  });

  it('retains recognized technical and clinical brand terms', () => {
    expect(en['brand.appName']).toBe('BLS Course Companion');
    expect(ms['brand.appName']).toBe('BLS Course Companion');
  });
});
