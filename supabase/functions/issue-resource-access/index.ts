import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

import {
  createIssueResourceAccessHandler,
  type AuthorizedResource,
} from "./handler.ts";

const allowedOrigins = new Set([
  "https://dr-afif.github.io",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
]);

export default {
  fetch: withSupabase({ auth: "user" }, async (request, context) => {
    const handler = createIssueResourceAccessHandler(
      {
        authorize: async (userId, resourceVersionId, requestId) => {
          const { data, error } = await context.supabaseAdmin.rpc(
            "authorize_resource_pdf_access",
            {
              target_user_id: userId,
              target_version_id: resourceVersionId,
              target_request_id: requestId,
            },
          );
          if (error) throw new Error(error.message);
          const authorized = data?.[0] as AuthorizedResource | undefined;
          if (!authorized) throw new Error("RESOURCE_ACCESS_DENIED");
          return authorized;
        },
        createSignedUrl: async (objectPath, expiresIn) => {
          const { data, error } = await context.supabaseAdmin.storage
            .from("course-resources")
            .createSignedUrl(objectPath, expiresIn);
          if (error || !data?.signedUrl) {
            throw new Error("RESOURCE_ACCESS_SIGNING_FAILED");
          }
          return data.signedUrl;
        },
        recordIssuance: async (userId, resourceVersionId, requestId) => {
          const { error } = await context.supabaseAdmin.rpc(
            "record_resource_pdf_issuance",
            {
              target_user_id: userId,
              target_version_id: resourceVersionId,
              target_request_id: requestId,
            },
          );
          if (error) throw new Error("RESOURCE_ACCESS_AUDIT_FAILED");
        },
      },
      allowedOrigins,
    );

    return handler(request, context.userClaims?.id ?? null);
  }),
};
