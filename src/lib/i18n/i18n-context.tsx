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
  const [localLocale, setLocalLocale] = useState<AppLocale | null>(null);
  const [optimisticLocale, setOptimisticLocale] = useState<AppLocale | null>(null);
  const [isUpdatingPreference, setIsUpdatingPreference] = useState(false);
  const [preferenceError, setPreferenceError] = useState<TranslationKey | null>(null);

  const { client, state: authState } = useAuth();
  const accountAccess = useAccountAccess();

  const profile = accountAccess.data?.profile;
  const isProfileAvailable =
    authState.status === 'signed_in' &&
    profile != null &&
    (profile.preferredLanguage === 'en' || profile.preferredLanguage === 'ms');

  const [prevAuthStatus, setPrevAuthStatus] = useState(authState.status);
  const [lastAuthoritativeProfileLang, setLastAuthoritativeProfileLang] = useState<string | null>(null);

  // If user signs out or auth status changes, clear transient update states during rendering
  if (authState.status !== prevAuthStatus) {
    setPrevAuthStatus(authState.status);
    if (authState.status !== 'signed_in') {
      setOptimisticLocale(null);
      setIsUpdatingPreference(false);
      setPreferenceError(null);
      setLastAuthoritativeProfileLang(null);
    }
  }

  // Synchronize localLocale to authoritative profile language when available.
  // This ensures that a subsequent signed-out state retains the profile's locale.
  if (isProfileAvailable && profile.preferredLanguage !== lastAuthoritativeProfileLang) {
    setLastAuthoritativeProfileLang(profile.preferredLanguage);
    setLocalLocale(profile.preferredLanguage);
  }

  // Once persisted profile matches requested locale, clear temporary optimistic state.
  // While saving or awaiting refetch, activeOptimistic keeps the UI on the requested locale.
  const activeOptimistic =
    optimisticLocale != null && profile?.preferredLanguage !== optimisticLocale
      ? optimisticLocale
      : null;

  // Precedence rule:
  // SIGNED IN:
  //   optimistic update if actively saving -> persisted profile preferred_language -> English fail-safe
  // SIGNED OUT:
  //   local choice -> localStorage stored choice -> English
  const locale: AppLocale = isProfileAvailable
    ? (activeOptimistic ?? profile.preferredLanguage)
    : (localLocale ?? readStoredLocale());

  // Keep <html lang="..."> attribute and localStorage in sync
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
    writeStoredLocale(locale);
  }, [locale]);

  const setLocale = useCallback(
    async (nextLocale: AppLocale) => {
      setPreferenceError(null);

      // If signed in and profile preference is available, perform optimistic persistence
      if (authState.status === 'signed_in' && isProfileAvailable && client && profile) {
        setOptimisticLocale(nextLocale);
        setLocalLocale(nextLocale);
        writeStoredLocale(nextLocale);
        setIsUpdatingPreference(true);

        try {
          const result = await updatePreferredLanguage(
            client,
            authState.user.id,
            nextLocale,
          );

          if (!result.success) {
            // Revert optimistic update to persisted profile preference
            setOptimisticLocale(null);
            setLocalLocale(profile.preferredLanguage);
            writeStoredLocale(profile.preferredLanguage);
            setPreferenceError('profile.languageUpdateFailed');
          } else {
            // Invalidate to trigger profile refetch; activeOptimistic clears once profile updates
            await queryClient.invalidateQueries({
              queryKey: ['account-access', authState.user.id],
            });
          }
        } catch {
          // Revert optimistic update to persisted profile preference
          setOptimisticLocale(null);
          setLocalLocale(profile.preferredLanguage);
          writeStoredLocale(profile.preferredLanguage);
          setPreferenceError('profile.languageUpdateFailed');
        } finally {
          setIsUpdatingPreference(false);
        }
      } else {
        // Signed out: selection remains local-only without persistence
        setLocalLocale(nextLocale);
        writeStoredLocale(nextLocale);
      }
    },
    [authState, client, isProfileAvailable, profile],
  );

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const activeDict = DICTIONARIES[locale];
      let translated = activeDict[key];
      if (translated == null || translated.length === 0) {
        translated = en[key] ?? key;
      }
      if (params) {
        for (const [pKey, pVal] of Object.entries(params)) {
          translated = translated.replaceAll(`{${pKey}}`, String(pVal));
        }
      }
      return translated;
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
