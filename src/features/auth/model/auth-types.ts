import type { Session, User } from "@supabase/supabase-js";

import type { Enums } from "../../../lib/supabase/database.types";

export type AccountStatus = Enums<"account_status">;
export type AppRole = Enums<"app_role">;

export type AccountAccess = {
  profile: {
    accountStatus: AccountStatus;
    fullName: string;
    organizationId: string | null;
  } | null;
  roles: AppRole[];
};

export type AuthState =
  | { status: "configuration_error" }
  | { status: "initializing" }
  | { status: "signed_out" }
  | { status: "signed_in"; session: Session; user: User };
