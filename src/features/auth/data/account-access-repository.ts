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
  let preferredLanguageAvailable = true;
  let profileQuery = await client
    .from("profiles")
    .select("full_name, account_status, organization_id, preferred_language")
    .eq("id", userId)
    .maybeSingle();

  // Backward compatibility: If preferred_language column does not exist on hosted database yet,
  // gracefully fall back to selecting without preferred_language.
  if (
    profileQuery.error &&
    (profileQuery.error.code === "42703" ||
      profileQuery.error.message?.includes("preferred_language"))
  ) {
    preferredLanguageAvailable = false;
    profileQuery = (await client
      .from("profiles")
      .select("full_name, account_status, organization_id")
      .eq("id", userId)
      .maybeSingle()) as typeof profileQuery;
  }

  const roleResult = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (profileQuery.error || roleResult.error) {
    throw new Error("ACCOUNT_ACCESS_UNAVAILABLE");
  }

  const profileData = profileQuery.data as {
    account_status: Database["public"]["Enums"]["account_status"];
    full_name: string;
    organization_id: string | null;
    preferred_language?: string | null;
  } | null;

  return {
    profile: profileData
      ? {
          accountStatus: profileData.account_status,
          fullName: profileData.full_name,
          organizationId: profileData.organization_id,
          preferredLanguage: normalizePreferredLanguage(
            profileData.preferred_language,
          ),
          preferredLanguageAvailable,
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
      // If column does not exist on hosted database yet, treat gracefully as non-fatal local-only
      if (
        error.code === "42703" ||
        error.message?.includes("preferred_language")
      ) {
        return { success: true, persisted: false };
      }
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
