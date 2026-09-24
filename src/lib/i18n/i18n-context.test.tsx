import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as authContext from '../../features/auth/context/auth-context';
import * as accountAccessRepo from '../../features/auth/data/account-access-repository';
import * as accountAccessHook from '../../features/auth/hooks/use-account-access';
import type { Database } from '../supabase/database.types';
import { I18nProvider } from './i18n-context';
import { useI18n } from './i18n-context-def';
import { LOCALE_STORAGE_KEY } from './types';

describe('I18nContext and Provider', () => {
  const userId = '33000000-0000-4000-8000-000000000001';
  const mockClient = {} as unknown as SupabaseClient<Database>;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
    vi.clearAllMocks();

    // Default: signed out
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      client: mockClient,
      state: { status: 'signed_out' },
      requestPasswordReset: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      updatePassword: vi.fn(),
      verifyOtp: vi.fn(),
    });

    vi.spyOn(accountAccessHook, 'useAccountAccess').mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof accountAccessHook.useAccountAccess>);
  });

  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <I18nProvider>{children}</I18nProvider>
        </QueryClientProvider>
      );
    };
  }

  it('defaults to English when no preference is stored', () => {
    const { result } = renderHook(() => useI18n(), {
      wrapper: createWrapper(),
    });

    expect(result.current.locale).toBe('en');
    expect(result.current.t('nav.home')).toBe('Home');
    expect(document.documentElement.lang).toBe('en');
  });

  it('restores valid locale (ms) from localStorage', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'ms');

    const { result } = renderHook(() => useI18n(), {
      wrapper: createWrapper(),
    });

    expect(result.current.locale).toBe('ms');
    expect(result.current.t('nav.home')).toBe('Laman Utama');
    expect(document.documentElement.lang).toBe('ms');
  });

  it('ignores invalid or unsupported stored locale and falls back to English', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');

    const { result } = renderHook(() => useI18n(), {
      wrapper: createWrapper(),
    });

    expect(result.current.locale).toBe('en');
    expect(result.current.t('nav.home')).toBe('Home');
    expect(document.documentElement.lang).toBe('en');
  });

  it('setLocale changes rendered strings and updates document.documentElement.lang', async () => {
    const { result } = renderHook(() => useI18n(), {
      wrapper: createWrapper(),
    });

    expect(result.current.locale).toBe('en');
    expect(result.current.t('auth.login.title')).toBe('Sign in');

    await act(async () => {
      await result.current.setLocale('ms');
    });

    expect(result.current.locale).toBe('ms');
    expect(result.current.t('auth.login.title')).toBe('Log Masuk');
    expect(document.documentElement.lang).toBe('ms');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ms');
  });

  it('signed-in profile language en overrides pre-auth selection of ms (Correction 1 regression test)', async () => {
    let authStateValue = { status: 'signed_out' as const };
    let accountAccessValue: ReturnType<typeof accountAccessHook.useAccountAccess> = {
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof accountAccessHook.useAccountAccess>;

    vi.spyOn(authContext, 'useAuth').mockImplementation(() => ({
      client: mockClient,
      state: authStateValue,
      requestPasswordReset: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      updatePassword: vi.fn(),
      verifyOtp: vi.fn(),
    }));

    vi.spyOn(accountAccessHook, 'useAccountAccess').mockImplementation(
      () => accountAccessValue,
    );

    // 1. User starts signed out
    const { result, rerender } = renderHook(() => useI18n(), {
      wrapper: createWrapper(),
    });

    expect(result.current.locale).toBe('en');

    // 2. Selects ms while signed out
    await act(async () => {
      await result.current.setLocale('ms');
    });
    expect(result.current.locale).toBe('ms');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ms');

    // 3 & 4. Account signs in with profile preference = en
    authStateValue = {
      status: 'signed_in',
      session: { user: { id: userId } } as unknown as Session,
      user: { id: userId } as unknown as User,
    } as unknown as typeof authStateValue;

    accountAccessValue = {
      data: {
        profile: {
          accountStatus: 'active',
          fullName: 'Dr Afif',
          organizationId: null,
          preferredLanguage: 'en',
          preferredLanguageAvailable: true,
        },
        roles: ['learner'],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as typeof accountAccessValue;

    rerender();

    // 5. Resulting signed-in locale MUST be en (profile takes authority!)
    expect(result.current.locale).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
  });

  it('signed-in profile language ms overrides pre-auth selection of en (Inverse test)', async () => {
    let authStateValue = { status: 'signed_out' as const };
    let accountAccessValue: ReturnType<typeof accountAccessHook.useAccountAccess> = {
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof accountAccessHook.useAccountAccess>;

    vi.spyOn(authContext, 'useAuth').mockImplementation(() => ({
      client: mockClient,
      state: authStateValue,
      requestPasswordReset: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      updatePassword: vi.fn(),
      verifyOtp: vi.fn(),
    }));

    vi.spyOn(accountAccessHook, 'useAccountAccess').mockImplementation(
      () => accountAccessValue,
    );

    // 1. User starts signed out with English
    const { result, rerender } = renderHook(() => useI18n(), {
      wrapper: createWrapper(),
    });

    expect(result.current.locale).toBe('en');

    // 2. Account signs in with profile preference = ms
    authStateValue = {
      status: 'signed_in',
      session: { user: { id: userId } } as unknown as Session,
      user: { id: userId } as unknown as User,
    } as unknown as typeof authStateValue;

    accountAccessValue = {
      data: {
        profile: {
          accountStatus: 'active',
          fullName: 'Dr Afif',
          organizationId: null,
          preferredLanguage: 'ms',
          preferredLanguageAvailable: true,
        },
        roles: ['learner'],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as typeof accountAccessValue;

    rerender();

    // 3. Resulting signed-in locale MUST be ms
    expect(result.current.locale).toBe('ms');
    expect(document.documentElement.lang).toBe('ms');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ms');
  });

  it('persists preferred language to profile when signed in and profile preference is available', async () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      client: mockClient,
      state: {
        status: 'signed_in',
        session: { user: { id: userId } } as unknown as Session,
        user: { id: userId } as unknown as User,
      },
      requestPasswordReset: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      updatePassword: vi.fn(),
      verifyOtp: vi.fn(),
    });

    vi.spyOn(accountAccessHook, 'useAccountAccess').mockReturnValue({
      data: {
        profile: {
          accountStatus: 'active',
          fullName: 'Test User',
          organizationId: null,
          preferredLanguage: 'en',
          preferredLanguageAvailable: true,
        },
        roles: ['learner'],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof accountAccessHook.useAccountAccess>);

    const updateSpy = vi
      .spyOn(accountAccessRepo, 'updatePreferredLanguage')
      .mockResolvedValue({ success: true, persisted: true });

    const { result } = renderHook(() => useI18n(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.setLocale('ms');
    });

    expect(updateSpy).toHaveBeenCalledWith(mockClient, userId, 'ms');
    expect(result.current.locale).toBe('ms');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ms');
    expect(result.current.preferenceError).toBeNull();
  });

  it('reverts optimistic locale and restores localStorage on persistence failure without signing out', async () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      client: mockClient,
      state: {
        status: 'signed_in',
        session: { user: { id: userId } } as unknown as Session,
        user: { id: userId } as unknown as User,
      },
      requestPasswordReset: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      updatePassword: vi.fn(),
      verifyOtp: vi.fn(),
    });

    vi.spyOn(accountAccessHook, 'useAccountAccess').mockReturnValue({
      data: {
        profile: {
          accountStatus: 'active',
          fullName: 'Test User',
          organizationId: null,
          preferredLanguage: 'en',
          preferredLanguageAvailable: true,
        },
        roles: ['learner'],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof accountAccessHook.useAccountAccess>);

    vi.spyOn(accountAccessRepo, 'updatePreferredLanguage').mockResolvedValue({
      success: false,
      persisted: false,
      error: 'Network timeout',
    });

    const { result } = renderHook(() => useI18n(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.setLocale('ms');
    });

    // Reverted back to persisted profile preference 'en'
    expect(result.current.locale).toBe('en');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
    // Error recorded safely as semantic translation key
    expect(result.current.preferenceError).toBe('profile.languageUpdateFailed');
  });

  it('when preferredLanguageAvailable is false (hosted 7.1), selection remains local without calling db or showing error', async () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      client: mockClient,
      state: {
        status: 'signed_in',
        session: { user: { id: userId } } as unknown as Session,
        user: { id: userId } as unknown as User,
      },
      requestPasswordReset: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      updatePassword: vi.fn(),
      verifyOtp: vi.fn(),
    });

    vi.spyOn(accountAccessHook, 'useAccountAccess').mockReturnValue({
      data: {
        profile: {
          accountStatus: 'active',
          fullName: 'Legacy User',
          organizationId: null,
          preferredLanguage: 'en',
          preferredLanguageAvailable: false, // Hosted schema fallback
        },
        roles: ['learner'],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof accountAccessHook.useAccountAccess>);

    const updateSpy = vi.spyOn(accountAccessRepo, 'updatePreferredLanguage');

    const { result } = renderHook(() => useI18n(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.setLocale('ms');
    });

    // Language switches locally
    expect(result.current.locale).toBe('ms');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ms');
    // DB update not called, no false error shown
    expect(updateSpy).not.toHaveBeenCalled();
    expect(result.current.preferenceError).toBeNull();
  });
});
