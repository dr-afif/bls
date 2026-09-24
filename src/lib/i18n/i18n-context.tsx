import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '../../features/auth/context/auth-context';
import { updatePreferredLanguage } from '../../features/auth/data/account-access-repository';
import { useAccountAccess } from '../../features/auth/hooks/use-account-access';
import { queryClient } from '../query-client';

import { en } from './en';
import { formatDate, formatDateTime, formatNumber } from './formatting';
import { I18nContext } from './i18n-context-def';
import { ms } from './ms';
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  type AppLocale,
  type I18nContextValue,
  type TranslationKey,
} from './types';

const DICTIONARIES = { en, ms };

function readStoredLocale(): AppLocale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'en' || stored === 'ms') {
      return stored;
    }
  } catch {
    // Ignore localStorage access failures
  }
  return DEFAULT_LOCALE;
}

function writeStoredLocale(locale: AppLocale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Ignore localStorage write failures
  }
}

export interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [manualLocale, setManualLocale] = useState<AppLocale | null>(null);
  const [isUpdatingPreference, setIsUpdatingPreference] = useState(false);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);

  const { client, state: authState } = useAuth();
  const accountAccess = useAccountAccess();

  const profilePreference = accountAccess.data?.profile?.preferredLanguage;
  const validProfileLocale: AppLocale | null =
    profilePreference === 'en' || profilePreference === 'ms'
      ? profilePreference
      : null;

  // Precedence: manual choice during active session -> profile preference when signed in -> stored local choice -> default English
  const locale: AppLocale =
    manualLocale ?? validProfileLocale ?? readStoredLocale();

  // Keep <html lang="..."> attribute and localStorage in sync
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
    writeStoredLocale(locale);
  }, [locale]);

  const setLocale = useCallback(
    async (nextLocale: AppLocale) => {
      // 1. Update UI and local storage immediately
      setManualLocale(nextLocale);
      writeStoredLocale(nextLocale);
      setPreferenceError(null);

      // 2. If signed in, persist to profile in background
      if (authState.status === 'signed_in' && client) {
        setIsUpdatingPreference(true);
        try {
          const result = await updatePreferredLanguage(
            client,
            authState.user.id,
            nextLocale,
          );
          if (!result.success) {
            setPreferenceError(result.error ?? 'Failed to update preference');
          } else {
            void queryClient.invalidateQueries({
              queryKey: ['account-access', authState.user.id],
            });
          }
        } catch {
          setPreferenceError('Failed to update preference');
        } finally {
          setIsUpdatingPreference(false);
        }
      }
    },
    [authState, client],
  );

  const t = useCallback(
    (key: TranslationKey): string => {
      const activeDict = DICTIONARIES[locale];
      const translated = activeDict[key];
      if (translated != null && translated.length > 0) {
        return translated;
      }
      // Fallback to English
      return en[key] ?? key;
    },
    [locale],
  );

  const boundFormatDate = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      formatDate(date, locale, options),
    [locale],
  );

  const boundFormatDateTime = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      formatDateTime(date, locale, options),
    [locale],
  );

  const boundFormatNumber = useCallback(
    (val: number, options?: Intl.NumberFormatOptions) =>
      formatNumber(val, locale, options),
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      formatDate: boundFormatDate,
      formatDateTime: boundFormatDateTime,
      formatNumber: boundFormatNumber,
      isUpdatingPreference,
      preferenceError,
    }),
    [
      locale,
      setLocale,
      t,
      boundFormatDate,
      boundFormatDateTime,
      boundFormatNumber,
      isUpdatingPreference,
      preferenceError,
    ],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
