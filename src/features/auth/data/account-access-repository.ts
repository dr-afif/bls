import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppLocale } from "../../../lib/i18n/types";
import type { Database } from "../../../lib/supabase/database.types";
import type { AccountAccess } from "../model/auth-types";

function normalizePreferredLanguage(value: unknown): AppLocale {
  return value === "ms" ? "ms" : "en";
}

export async function getAccountAccess(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<AccountAccess> {
  const [profileResult, roleResult] = await Promise.all([
    client
      .from("profiles")
      .select("full_name, account_status, organization_id, preferred_language")
      .eq("id", userId)
      .maybeSingle(),
    client
      .from("user_roles")
      .select("role")
      .eq("user_id", userId),
  ]);

  if (profileResult.error || roleResult.error) {
    throw new Error("ACCOUNT_ACCESS_UNAVAILABLE");
  }

  const profileData = profileResult.data;

  return {
    profile: profileData
      ? {
          accountStatus: profileData.account_status,
          fullName: profileData.full_name,
          organizationId: profileData.organization_id,
          preferredLanguage: normalizePreferredLanguage(
            profileData.preferred_language,
          ),
        }
      : null,
    roles: (roleResult.data ?? []).map(({ role }) => role),
  };
}

export async function updatePreferredLanguage(
  client: SupabaseClient<Database>,
  userId: string,
  preferredLanguage: AppLocale,
): Promise<{ success: boolean; persisted: boolean; error?: string }> {
  try {
    const { error } = await client
      .from("profiles")
      .update({ preferred_language: preferredLanguage })
      .eq("id", userId);

    if (error) {
      return { success: false, persisted: false, error: error.message };
    }

    return { success: true, persisted: true };
  } catch (err) {
    return {
      success: false,
      persisted: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
