import { createContext, useContext } from 'react';
import { en } from './en';
import { formatDate, formatDateTime, formatNumber } from './formatting';
import { DEFAULT_LOCALE, type I18nContextValue } from './types';

export const defaultContextValue: I18nContextValue = {
  locale: DEFAULT_LOCALE,
  setLocale: async () => {},
  t: (key, params) => {
    let translated = en[key] ?? key;
    if (params) {
      for (const [pKey, pVal] of Object.entries(params)) {
        translated = translated.replaceAll(`{${pKey}}`, String(pVal));
      }
    }
    return translated;
  },
  formatDate: (d, opt) => formatDate(d, DEFAULT_LOCALE, opt),
  formatDateTime: (d, opt) => formatDateTime(d, DEFAULT_LOCALE, opt),
  formatNumber: (n, opt) => formatNumber(n, DEFAULT_LOCALE, opt),
  isUpdatingPreference: false,
  preferenceError: null,
};

export const I18nContext = createContext<I18nContextValue>(defaultContextValue);

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
