export type SupportedInviteRole = "learner" | "instructor";
export type AccessMode = "unlimited" | "limited";

export type AdminInviteUserInput = {
  email: string;
  fullName: string;
  role: SupportedInviteRole;
  accessMode: AccessMode;
  startsAt?: string | null;
  expiresAt?: string | null;
  organizationId?: string | null;
};

export type CallerProfile = {
  id: string;
  organization_id: string;
  account_status: string;
};

export type CallerRole = {
  role: string;
};

export type ProvisionTransactionParams = {
  targetUserId: string;
  targetOrganizationId: string;
  targetRole: SupportedInviteRole;
  fullName: string;
  actorUserId: string;
  accessMode: AccessMode;
  startsAt: string | null;
  expiresAt: string | null;
};

export type ProvisionTransactionResult = {
  success: boolean;
  user_id?: string;
  organization_id?: string;
  role?: string;
  account_status?: string;
};

export type AdminInviteDependencies = {
  getCallerProfile: (userId: string) => Promise<CallerProfile | null>;
  getCallerRoles: (userId: string) => Promise<CallerRole[]>;
  inviteAuthUser: (
    email: string,
    fullName: string,
    redirectTo?: string,
  ) => Promise<{ id: string; email: string }>;
  provisionUserTransaction: (
    params: ProvisionTransactionParams,
  ) => Promise<ProvisionTransactionResult>;
  compensateFailedInvite: (userId: string) => Promise<void>;
  getSiteUrl?: () => string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, private",
  "Content-Type": "application/json",
  Expires: "0",
  Pragma: "no-cache",
};

function corsHeaders(origin: string | null, allowedOrigins: ReadonlySet<string>) {
  if (!origin || !allowedOrigins.has(origin)) return {};
  return {
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
  };
}

function jsonResponse(
  status: number,
  body: Record<string, unknown>,
  origin: string | null,
  allowedOrigins: ReadonlySet<string>,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...NO_STORE_HEADERS,
      ...corsHeaders(origin, allowedOrigins),
      ...extraHeaders,
    },
  });
}

function isDuplicateUserError(errorMessage: string): boolean {
  const lower = errorMessage.toLowerCase();
  return (
    lower.includes("already registered") ||
    lower.includes("already been registered") ||
    lower.includes("user_already_exists") ||
    lower.includes("user already exists") ||
    lower.includes("duplicate") ||
    lower.includes("user with this email already exists")
  );
}

export function createAdminInviteUserHandler(
  dependencies: AdminInviteDependencies,
  allowedOrigins: ReadonlySet<string>,
) {
  return async (request: Request, callerUserId: string | null): Promise<Response> => {
    const origin = request.headers.get("Origin");

    if (origin && !allowedOrigins.has(origin)) {
      return jsonResponse(
        403,
        { code: "FORBIDDEN" },
        null,
        allowedOrigins,
      );
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...NO_STORE_HEADERS,
          ...corsHeaders(origin, allowedOrigins),
        },
      });
    }

    if (request.method !== "POST") {
      return jsonResponse(
        405,
        { code: "METHOD_NOT_ALLOWED" },
        origin,
        allowedOrigins,
        { Allow: "POST, OPTIONS" },
      );
    }

    // 1. Caller Authentication
    if (!callerUserId || !UUID_PATTERN.test(callerUserId)) {
      return jsonResponse(
        401,
        { code: "AUTHENTICATION_REQUIRED" },
        origin,
        allowedOrigins,
      );
    }

    // 2. Caller Profile & Account Status Verification
    const callerProfile = await dependencies.getCallerProfile(callerUserId);
    if (!callerProfile || callerProfile.account_status !== "active") {
      return jsonResponse(
        403,
        { code: "FORBIDDEN" },
        origin,
        allowedOrigins,
      );
    }

    // 3. Caller Role Verification
    const callerRoles = await dependencies.getCallerRoles(callerUserId);
    const isSuperAdmin = callerRoles.some((r) => r.role === "super_admin");
    const isAdmin = callerRoles.some((r) => r.role === "admin");

    if (!isSuperAdmin && !isAdmin) {
      return jsonResponse(
        403,
        { code: "FORBIDDEN" },
        origin,
        allowedOrigins,
      );
    }

    // 4. Parse Request Body
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return jsonResponse(
        400,
        { code: "INVALID_REQUEST" },
        origin,
        allowedOrigins,
      );
    }

    if (!body || typeof body !== "object") {
      return jsonResponse(
        400,
        { code: "INVALID_REQUEST" },
        origin,
        allowedOrigins,
      );
    }

    // 5. Validate Email
    const rawEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!rawEmail || rawEmail.length > 255 || !EMAIL_PATTERN.test(rawEmail)) {
      return jsonResponse(
        400,
        { code: "INVALID_EMAIL" },
        origin,
        allowedOrigins,
      );
    }

    // 6. Validate Full Name
    const rawFullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    if (!rawFullName || rawFullName.length > 160) {
      return jsonResponse(
        400,
        { code: "INVALID_NAME" },
        origin,
        allowedOrigins,
      );
    }

    // 7. Validate Role (Strict role-escalation boundary: only learner and instructor)
    const rawRole = body.role;
    if (rawRole !== "learner" && rawRole !== "instructor") {
      return jsonResponse(
        400,
        { code: "UNSUPPORTED_ROLE" },
        origin,
        allowedOrigins,
      );
    }
    const targetRole = rawRole as SupportedInviteRole;

    // 8. Validate Access Mode and Dates
    const rawAccessMode = body.accessMode;
    if (rawAccessMode !== "unlimited" && rawAccessMode !== "limited") {
      return jsonResponse(
        400,
        { code: "INVALID_REQUEST" },
        origin,
        allowedOrigins,
      );
    }
    const accessMode = rawAccessMode as AccessMode;

    let startsAt: string | null = null;
    let expiresAt: string | null = null;

    if (accessMode === "limited") {
      if (typeof body.expiresAt !== "string" || !body.expiresAt) {
        return jsonResponse(
          400,
          { code: "INVALID_ACCESS_PERIOD" },
          origin,
          allowedOrigins,
        );
      }

      const expiryDate = new Date(body.expiresAt);
      if (Number.isNaN(expiryDate.getTime()) || expiryDate.getTime() <= Date.now()) {
        return jsonResponse(
          400,
          { code: "INVALID_ACCESS_PERIOD" },
          origin,
          allowedOrigins,
        );
      }
      expiresAt = expiryDate.toISOString();

      if (typeof body.startsAt === "string" && body.startsAt) {
        const startDate = new Date(body.startsAt);
        if (Number.isNaN(startDate.getTime()) || expiryDate.getTime() <= startDate.getTime()) {
          return jsonResponse(
            400,
            { code: "INVALID_ACCESS_PERIOD" },
            origin,
            allowedOrigins,
          );
        }
        startsAt = startDate.toISOString();
      }
    }

    // 9. Resolve Target Organization
    let targetOrgId = callerProfile.organization_id;
    if (typeof body.organizationId === "string" && body.organizationId) {
      if (!UUID_PATTERN.test(body.organizationId)) {
        return jsonResponse(
          400,
          { code: "INVALID_REQUEST" },
          origin,
          allowedOrigins,
        );
      }
      if (!isSuperAdmin && body.organizationId !== callerProfile.organization_id) {
        return jsonResponse(
          403,
          { code: "ORGANIZATION_MISMATCH" },
          origin,
          allowedOrigins,
        );
      }
      targetOrgId = body.organizationId;
    }

    if (!targetOrgId) {
      return jsonResponse(
        400,
        { code: "ORGANIZATION_REQUIRED" },
        origin,
        allowedOrigins,
      );
    }

    // 10. Perform Supabase Auth Invitation
    let rawSiteUrl: string | null = null;
    try {
      rawSiteUrl = dependencies.getSiteUrl ? dependencies.getSiteUrl() : null;
    } catch {
      rawSiteUrl = null;
    }

    const siteUrl = rawSiteUrl?.trim();
    if (!siteUrl) {
      return jsonResponse(
        500,
        { code: "CONFIGURATION_ERROR" },
        origin,
        allowedOrigins,
      );
    }

    const normalizedBase = siteUrl.replace(/\/+$/, "");
    const redirectTo = `${normalizedBase}/`;

    let invitedAuthUser: { id: string; email: string };
    try {
      invitedAuthUser = await dependencies.inviteAuthUser(
        rawEmail,
        rawFullName,
        redirectTo,
      );
    } catch (inviteError) {
      const message = inviteError instanceof Error ? inviteError.message : String(inviteError);
      if (isDuplicateUserError(message)) {
        return jsonResponse(
          409,
          { code: "USER_ALREADY_EXISTS" },
          origin,
          allowedOrigins,
        );
      }
      if (message.toLowerCase().includes("rate limit")) {
        return jsonResponse(
          429,
          { code: "RATE_LIMITED" },
          origin,
          allowedOrigins,
          { "Retry-After": "60" },
        );
      }
      return jsonResponse(
        500,
        { code: "INVITATION_FAILED" },
        origin,
        allowedOrigins,
      );
    }

    // 11. Transactional Database Provisioning & Compensation Guard
    try {
      const provisionResult = await dependencies.provisionUserTransaction({
        targetUserId: invitedAuthUser.id,
        targetOrganizationId: targetOrgId,
        targetRole,
        fullName: rawFullName,
        actorUserId: callerUserId,
        accessMode,
        startsAt,
        expiresAt,
      });

      return jsonResponse(
        200,
        {
          success: true,
          user: {
            id: invitedAuthUser.id,
            email: invitedAuthUser.email,
            fullName: rawFullName,
            role: targetRole,
            organizationId: targetOrgId,
            accountStatus: provisionResult.account_status ?? "pending_verification",
          },
        },
        origin,
        allowedOrigins,
      );
    } catch (provisionError) {
      // Compensate: Delete newly created Auth user to avoid orphaned un-provisioned accounts
      let rollbackSuccess = false;
      try {
        await dependencies.compensateFailedInvite(invitedAuthUser.id);
        rollbackSuccess = true;
      } catch (compensationError) {
        // Diagnostic logging without leaking secrets to the browser
        console.error(
          `[CRITICAL] Compensation rollback failed for user ${invitedAuthUser.id}:`,
          compensationError instanceof Error ? compensationError.message : compensationError,
        );
      }

      if (!rollbackSuccess) {
        return jsonResponse(
          500,
          {
            code: "PROVISIONING_ROLLBACK_FAILED",
            userId: invitedAuthUser.id,
          },
          origin,
          allowedOrigins,
        );
      }

      return jsonResponse(
        500,
        {
          code: "PROVISIONING_FAILED",
          details: provisionError instanceof Error ? provisionError.message : undefined,
        },
        origin,
        allowedOrigins,
      );
    }
  };
}
