import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

import {
  createAdminInviteUserHandler,
  type AdminInviteDependencies,
} from "./handler.ts";

const allowedOrigins = new Set([
  "https://dr-afif.github.io",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
]);

export default {
  fetch: withSupabase({ auth: "user" }, async (request, context) => {
    const dependencies: AdminInviteDependencies = {
      getCallerProfile: async (userId) => {
        const { data, error } = await context.supabaseAdmin
          .from("profiles")
          .select("id, organization_id, account_status")
          .eq("id", userId)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data;
      },
      getCallerRoles: async (userId) => {
        const { data, error } = await context.supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);
        if (error) throw new Error(error.message);
        return data ?? [];
      },
      inviteAuthUser: async (email, fullName, redirectTo) => {
        const { data, error } = await context.supabaseAdmin.auth.admin.inviteUserByEmail(
          email,
          {
            data: { full_name: fullName },
            redirectTo,
          },
        );
        if (error || !data.user) {
          throw new Error(error ? error.message : "INVITATION_FAILED");
        }
        return { id: data.user.id, email: data.user.email ?? email };
      },
      provisionUserTransaction: async (params) => {
        const { data, error } = await context.supabaseAdmin.rpc(
          "provision_invited_user",
          {
            target_user_id: params.targetUserId,
            target_organization_id: params.targetOrganizationId,
            target_role: params.targetRole,
            full_name: params.fullName,
            actor_user_id: params.actorUserId,
            access_mode: params.accessMode,
            access_starts_at: params.startsAt,
            access_ends_at: params.expiresAt,
          },
        );
        if (error) throw new Error(error.message);
        return (data as { success: boolean; account_status?: string }) ?? { success: true };
      },
      compensateFailedInvite: async (userId) => {
        const { error } = await context.supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) throw new Error(error.message);
      },
      getSiteUrl: () => {
        const url = typeof Deno !== "undefined" ? Deno.env.get("SITE_URL") : null;
        if (!url || !url.trim()) {
          throw new Error("SITE_URL environment variable is required");
        }
        return url.trim();
      },
    };

    const handler = createAdminInviteUserHandler(dependencies, allowedOrigins);
    return handler(request, context.userClaims?.id ?? null);
  }),
};
