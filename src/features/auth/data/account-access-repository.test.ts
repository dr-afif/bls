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

  it('backward compatibility: falls back gracefully when preferred_language column does not exist on remote database', async () => {
    let profileCallCount = 0;
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockImplementation(async () => {
              profileCallCount++;
              if (profileCallCount === 1) {
                // First call fails with missing column error
                return {
                  data: null,
                  error: {
                    code: '42703',
                    message: 'column profiles.preferred_language does not exist',
                  },
                };
              }
              // Second call without preferred_language succeeds
              return {
                data: {
                  account_status: 'active',
                  full_name: 'Legacy User',
                  organization_id: null,
                },
                error: null,
              };
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

    expect(profileCallCount).toBe(2);
    expect(access.profile?.fullName).toBe('Legacy User');
    expect(access.profile?.preferredLanguage).toBe('en'); // Safe fallback
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
    expect(updateSpy).toHaveBeenCalledWith({ preferred_language: 'ms' });
    expect(eqSpy).toHaveBeenCalledWith('id', userId);
  });

  it('updatePreferredLanguage treats missing remote column as non-fatal success', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: {
            code: '42703',
            message: 'column profiles.preferred_language does not exist',
          },
        }),
      })),
    } as unknown as SupabaseClient<Database>;

    const result = await updatePreferredLanguage(mockClient, userId, 'ms');

    expect(result.success).toBe(true);
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
});
