import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import type { Database } from '../../../lib/supabase/database.types';
import {
  getAccountAccess,
  updatePreferredLanguage,
} from './account-access-repository';

describe('account-access-repository', () => {
  const userId = '33000000-0000-4000-8000-000000000001';

  it('queries preferred_language and normalizes to AppLocale', async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                account_status: 'active',
                full_name: 'Siti Aminah',
                organization_id: '10000000-0000-0000-0000-000000000001',
                preferred_language: 'ms',
              },
              error: null,
            }),
          };
        }
        if (table === 'user_roles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [{ role: 'learner' }],
              error: null,
            }),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as unknown as SupabaseClient<Database>;

    const access = await getAccountAccess(mockClient, userId);

    expect(access.profile?.preferredLanguage).toBe('ms');
    expect(access.profile?.fullName).toBe('Siti Aminah');
    expect(access.roles).toEqual(['learner']);
  });

  it('normalizes null or unexpected preferred_language to en', async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                account_status: 'active',
                full_name: 'John Doe',
                organization_id: null,
                preferred_language: null,
              },
              error: null,
            }),
          };
        }
        if (table === 'user_roles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [{ role: 'instructor' }],
              error: null,
            }),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as unknown as SupabaseClient<Database>;

    const access = await getAccountAccess(mockClient, userId);

    expect(access.profile?.fullName).toBe('John Doe');
    expect(access.profile?.preferredLanguage).toBe('en');
    expect(access.roles).toEqual(['instructor']);
  });

  it('updatePreferredLanguage persists preferred_language when supported', async () => {
    const updateSpy = vi.fn().mockReturnThis();
    const eqSpy = vi.fn().mockResolvedValue({ error: null });

    const mockClient = {
      from: vi.fn(() => ({
        update: updateSpy,
        eq: eqSpy,
      })),
    } as unknown as SupabaseClient<Database>;

    const result = await updatePreferredLanguage(mockClient, userId, 'ms');

    expect(result.success).toBe(true);
    expect(result.persisted).toBe(true);
    expect(updateSpy).toHaveBeenCalledWith({ preferred_language: 'ms' });
    expect(eqSpy).toHaveBeenCalledWith('id', userId);
  });

  it('updatePreferredLanguage returns failure when unexpected database error occurs', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: {
            code: '42501',
            message: 'permission denied for table profiles',
          },
        }),
      })),
    } as unknown as SupabaseClient<Database>;

    const result = await updatePreferredLanguage(mockClient, userId, 'ms');

    expect(result.success).toBe(false);
    expect(result.error).toBe('permission denied for table profiles');
  });

  it('getAccountAccess propagates database query errors directly without 42703 fallback suppression', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: {
            code: '42703',
            message: 'column profiles.preferred_language does not exist',
          },
        }),
      })),
    } as unknown as SupabaseClient<Database>;

    await expect(getAccountAccess(mockClient, userId)).rejects.toThrow(
      'ACCOUNT_ACCESS_UNAVAILABLE',
    );
  });
});
