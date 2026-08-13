import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../../lib/supabase/database.types";
import type { AccountAccess } from "../model/auth-types";

export async function getAccountAccess(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<AccountAccess> {
  const [profileResult, roleResult] = await Promise.all([
    client
      .from("profiles")
      .select("full_name, account_status, organization_id")
      .eq("id", userId)
      .maybeSingle(),
    client.from("user_roles").select("role").eq("user_id", userId),
  ]);

  if (profileResult.error || roleResult.error) {
    throw new Error("ACCOUNT_ACCESS_UNAVAILABLE");
  }

  return {
    profile: profileResult.data
      ? {
          accountStatus: profileResult.data.account_status,
          fullName: profileResult.data.full_name,
          organizationId: profileResult.data.organization_id,
        }
      : null,
    roles: (roleResult.data ?? []).map(({ role }) => role),
  };
}
