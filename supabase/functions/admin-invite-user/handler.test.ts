import { describe, expect, it, vi } from "vitest";

import {
  createAdminInviteUserHandler,
  type AdminInviteDependencies,
} from "./handler";

const callerAdminId = "33000000-0000-4000-8000-000000000001";
const targetOrgId = "10000000-0000-0000-0000-000000000001";
const otherOrgId = "99000000-0000-0000-0000-000000000001";
const newUserId = "44000000-0000-4000-8000-000000000001";
const origin = "https://dr-afif.github.io";

function mockDependencies(overrides: Partial<AdminInviteDependencies> = {}): AdminInviteDependencies {
  return {
    getCallerProfile: vi.fn().mockResolvedValue({
      id: callerAdminId,
      organization_id: targetOrgId,
      account_status: "active",
    }),
    getCallerRoles: vi.fn().mockResolvedValue([{ role: "admin" }]),
    inviteAuthUser: vi.fn().mockResolvedValue({
      id: newUserId,
      email: "newlearner@example.com",
    }),
    provisionUserTransaction: vi.fn().mockResolvedValue({
      success: true,
      user_id: newUserId,
      organization_id: targetOrgId,
      role: "learner",
      account_status: "pending_verification",
    }),
    compensateFailedInvite: vi.fn().mockResolvedValue(undefined),
    getSiteUrl: () => "https://dr-afif.github.io/bls/",
    ...overrides,
  };
}

function makeRequest(
  body: unknown = {
    email: "newlearner@example.com",
    fullName: "Jane Doe",
    role: "learner",
    accessMode: "unlimited",
  },
  method = "POST",
  requestOrigin = origin,
) {
  return new Request("https://example.test/admin-invite-user", {
    method,
    headers: {
      "Content-Type": "application/json",
      Origin: requestOrigin,
    },
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
}

describe("admin-invite-user handler", () => {
  it("successfully invites a learner via single transactional RPC and returns post-invite pending_verification state", async () => {
    const deps = mockDependencies();
    const handler = createAdminInviteUserHandler(deps, new Set([origin]));

    const response = await handler(makeRequest(), callerAdminId);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      success: true,
      user: {
        id: newUserId,
        email: "newlearner@example.com",
        fullName: "Jane Doe",
        role: "learner",
        organizationId: targetOrgId,
        accountStatus: "pending_verification",
      },
    });

    expect(deps.inviteAuthUser).toHaveBeenCalledWith(
      "newlearner@example.com",
      "Jane Doe",
      "https://dr-afif.github.io/bls/",
    );
    expect(deps.provisionUserTransaction).toHaveBeenCalledTimes(1);
    expect(deps.provisionUserTransaction).toHaveBeenCalledWith({
      targetUserId: newUserId,
      targetOrganizationId: targetOrgId,
      targetRole: "learner",
      fullName: "Jane Doe",
      actorUserId: callerAdminId,
      accessMode: "unlimited",
      startsAt: null,
      expiresAt: null,
    });
    expect(deps.compensateFailedInvite).not.toHaveBeenCalled();
    expect(response.headers.get("Cache-Control")).toBe("no-store, private");
  });

  it("handles valid limited-access window and passes access parameters to transactional RPC", async () => {
    const deps = mockDependencies({
      provisionUserTransaction: vi.fn().mockResolvedValue({
        success: true,
        user_id: newUserId,
        organization_id: targetOrgId,
        role: "instructor",
        account_status: "pending_verification",
      }),
    });
    const handler = createAdminInviteUserHandler(deps, new Set([origin]));

    const futureStart = new Date(Date.now() + 86400000).toISOString();
    const futureExpiry = new Date(Date.now() + 86400000 * 30).toISOString();

    const response = await handler(
      makeRequest({
        email: "instructor.jane@example.com",
        fullName: "Jane Instructor",
        role: "instructor",
        accessMode: "limited",
        startsAt: futureStart,
        expiresAt: futureExpiry,
      }),
      callerAdminId,
    );

    expect(response.status).toBe(200);
    expect(deps.provisionUserTransaction).toHaveBeenCalledTimes(1);
    expect(deps.provisionUserTransaction).toHaveBeenCalledWith({
      targetUserId: newUserId,
      targetOrganizationId: targetOrgId,
      targetRole: "instructor",
      fullName: "Jane Instructor",
      actorUserId: callerAdminId,
      accessMode: "limited",
      startsAt: futureStart,
      expiresAt: futureExpiry,
    });
  });

  it("handles an allowed preflight without invoking dependencies", async () => {
    const deps = mockDependencies();
    const handler = createAdminInviteUserHandler(deps, new Set([origin]));
    const response = await handler(makeRequest(undefined, "OPTIONS"), null);
    expect(response.status).toBe(204);
    expect(deps.inviteAuthUser).not.toHaveBeenCalled();
    expect(deps.provisionUserTransaction).not.toHaveBeenCalled();
  });

  it("rejects disallowed origins", async () => {
    const deps = mockDependencies();
    const handler = createAdminInviteUserHandler(deps, new Set([origin]));
    const response = await handler(
      makeRequest(undefined, "POST", "https://untrusted-attacker.test"),
      callerAdminId,
    );
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ code: "FORBIDDEN" });
  });

  it("rejects non-POST methods", async () => {
    const deps = mockDependencies();
    const handler = createAdminInviteUserHandler(deps, new Set([origin]));
    const response = await handler(makeRequest(undefined, "GET"), callerAdminId);
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST, OPTIONS");
  });

  it("rejects unauthenticated requests without valid user ID before Auth Admin is called", async () => {
    const deps = mockDependencies();
    const handler = createAdminInviteUserHandler(deps, new Set([origin]));
    const response = await handler(makeRequest(), null);
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ code: "AUTHENTICATION_REQUIRED" });
    expect(deps.inviteAuthUser).not.toHaveBeenCalled();
  });

  it("rejects non-existent or inactive callers before Auth Admin is called", async () => {
    const deps = mockDependencies({
      getCallerProfile: vi.fn().mockResolvedValue({
        id: callerAdminId,
        organization_id: targetOrgId,
        account_status: "suspended",
      }),
    });
    const handler = createAdminInviteUserHandler(deps, new Set([origin]));
    const response = await handler(makeRequest(), callerAdminId);
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ code: "FORBIDDEN" });
    expect(deps.inviteAuthUser).not.toHaveBeenCalled();
  });

  it("rejects non-admin callers before Auth Admin is called", async () => {
    const deps = mockDependencies({
      getCallerRoles: vi.fn().mockResolvedValue([{ role: "learner" }]),
    });
    const handler = createAdminInviteUserHandler(deps, new Set([origin]));
    const response = await handler(makeRequest(), callerAdminId);
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ code: "FORBIDDEN" });
    expect(deps.inviteAuthUser).not.toHaveBeenCalled();
  });

  it("rejects wrong-organization admin targeting foreign organization before Auth Admin is called", async () => {
    const deps = mockDependencies();
    const handler = createAdminInviteUserHandler(deps, new Set([origin]));
    const response = await handler(
      makeRequest({
        email: "test@example.com",
        fullName: "Test",
        role: "learner",
        accessMode: "unlimited",
        organizationId: otherOrgId,
      }),
      callerAdminId,
    );
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ code: "ORGANIZATION_MISMATCH" });
    expect(deps.inviteAuthUser).not.toHaveBeenCalled();
  });

  it("permits super_admin to invite into specified organization", async () => {
    const deps = mockDependencies({
      getCallerRoles: vi.fn().mockResolvedValue([{ role: "super_admin" }]),
    });
    const handler = createAdminInviteUserHandler(deps, new Set([origin]));
    const response = await handler(
      makeRequest({
        email: "learner@example.com",
        fullName: "Learner User",
        role: "learner",
        accessMode: "unlimited",
        organizationId: otherOrgId,
      }),
      callerAdminId,
    );
    expect(response.status).toBe(200);
    expect(deps.provisionUserTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        targetOrganizationId: otherOrgId,
      }),
    );
  });

  it.each([
    { email: "", fullName: "Jane", role: "learner", accessMode: "unlimited", expected: "INVALID_EMAIL" },
    { email: "bad-email", fullName: "Jane", role: "learner", accessMode: "unlimited", expected: "INVALID_EMAIL" },
    { email: "jane@test.com", fullName: "", role: "learner", accessMode: "unlimited", expected: "INVALID_NAME" },
    { email: "jane@test.com", fullName: "a".repeat(161), role: "learner", accessMode: "unlimited", expected: "INVALID_NAME" },
  ])("rejects malformed inputs: %o", async (body) => {
    const deps = mockDependencies();
    const handler = createAdminInviteUserHandler(deps, new Set([origin]));
    const response = await handler(makeRequest(body), callerAdminId);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ code: body.expected });
    expect(deps.inviteAuthUser).not.toHaveBeenCalled();
  });

  it("enforces role escalation boundary: rejects invitation of admin or super_admin before Auth Admin is called", async () => {
    const deps = mockDependencies();
    const handler = createAdminInviteUserHandler(deps, new Set([origin]));

    const responseAdmin = await handler(
      makeRequest({
        email: "newadmin@example.com",
        fullName: "Admin Candidate",
        role: "admin",
        accessMode: "unlimited",
      }),
      callerAdminId,
    );
    expect(responseAdmin.status).toBe(400);
    await expect(responseAdmin.json()).resolves.toEqual({ code: "UNSUPPORTED_ROLE" });

    const responseSuper = await handler(
      makeRequest({
        email: "newsuper@example.com",
        fullName: "Super Candidate",
        role: "super_admin",
        accessMode: "unlimited",
      }),
      callerAdminId,
    );
    expect(responseSuper.status).toBe(400);
    await expect(responseSuper.json()).resolves.toEqual({ code: "UNSUPPORTED_ROLE" });

    expect(deps.inviteAuthUser).not.toHaveBeenCalled();
  });

  it.each([
    {
      description: "missing expiresAt for limited access",
      body: { email: "j@example.com", fullName: "J", role: "learner", accessMode: "limited" },
    },
    {
      description: "expiresAt is in the past",
      body: { email: "j@example.com", fullName: "J", role: "learner", accessMode: "limited", expiresAt: "2020-01-01T00:00:00Z" },
    },
    {
      description: "expiresAt is before startsAt",
      body: {
        email: "j@example.com",
        fullName: "J",
        role: "learner",
        accessMode: "limited",
        startsAt: "2028-02-01T00:00:00Z",
        expiresAt: "2028-01-01T00:00:00Z",
      },
    },
  ])("rejects invalid access periods: $description", async ({ body }) => {
    const deps = mockDependencies();
    const handler = createAdminInviteUserHandler(deps, new Set([origin]));
    const response = await handler(makeRequest(body), callerAdminId);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_ACCESS_PERIOD" });
    expect(deps.inviteAuthUser).not.toHaveBeenCalled();
  });

  it("handles duplicate user error from Auth Admin API with structured 409 and does not delete pre-existing user", async () => {
    const deps = mockDependencies({
      inviteAuthUser: vi.fn().mockRejectedValue(new Error("A user with this email address has already been registered")),
    });
    const handler = createAdminInviteUserHandler(deps, new Set([origin]));
    const response = await handler(makeRequest(), callerAdminId);
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ code: "USER_ALREADY_EXISTS" });
    expect(deps.compensateFailedInvite).not.toHaveBeenCalled();
    expect(deps.provisionUserTransaction).not.toHaveBeenCalled();
  });

  it("handles rate limiting from Auth Admin API with structured 429", async () => {
    const deps = mockDependencies({
      inviteAuthUser: vi.fn().mockRejectedValue(new Error("Email rate limit exceeded")),
    });
    const handler = createAdminInviteUserHandler(deps, new Set([origin]));
    const response = await handler(makeRequest(), callerAdminId);
    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({ code: "RATE_LIMITED" });
    expect(response.headers.get("Retry-After")).toBe("60");
  });

  it("compensates newly created Auth user if single transactional provisioning RPC fails", async () => {
    const deps = mockDependencies({
      provisionUserTransaction: vi.fn().mockRejectedValue(new Error("TRANSACTION_FAILED")),
    });
    const handler = createAdminInviteUserHandler(deps, new Set([origin]));
    const response = await handler(makeRequest(), callerAdminId);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      code: "PROVISIONING_FAILED",
      details: "TRANSACTION_FAILED",
    });
    // Verify compensation deleted the newly created Auth user
    expect(deps.compensateFailedInvite).toHaveBeenCalledWith(newUserId);
  });

  it("returns PROVISIONING_ROLLBACK_FAILED when compensation deletion itself fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const deps = mockDependencies({
      provisionUserTransaction: vi.fn().mockRejectedValue(new Error("TRANSACTION_FAILED")),
      compensateFailedInvite: vi.fn().mockRejectedValue(new Error("COMPENSATION_NETWORK_ERROR")),
    });
    const handler = createAdminInviteUserHandler(deps, new Set([origin]));
    const response = await handler(makeRequest(), callerAdminId);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      code: "PROVISIONING_ROLLBACK_FAILED",
      userId: newUserId,
    });
    expect(deps.compensateFailedInvite).toHaveBeenCalledWith(newUserId);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  describe("invitation redirect construction and Option A SITE_URL enforcement", () => {
    it("produces canonical application base URL for production SITE_URL with trailing slash", async () => {
      const deps = mockDependencies({
        getSiteUrl: () => "https://dr-afif.github.io/bls/",
      });
      const handler = createAdminInviteUserHandler(deps, new Set([origin]));
      const response = await handler(makeRequest(), callerAdminId);
      expect(response.status).toBe(200);
      expect(deps.inviteAuthUser).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        "https://dr-afif.github.io/bls/",
      );
    });

    it("normalizes trailing slashes correctly to trusted application base URL", async () => {
      const deps = mockDependencies({
        getSiteUrl: () => "https://dr-afif.github.io/bls",
      });
      const handler = createAdminInviteUserHandler(deps, new Set([origin]));
      const response = await handler(makeRequest(), callerAdminId);
      expect(response.status).toBe(200);
      expect(deps.inviteAuthUser).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        "https://dr-afif.github.io/bls/",
      );
      const passedRedirect = (deps.inviteAuthUser as ReturnType<typeof vi.fn>).mock.calls[0][2];
      expect(passedRedirect).toBe("https://dr-afif.github.io/bls/");
    });

    it("requires explicit SITE_URL and fails request handling with CONFIGURATION_ERROR if absent (Option A)", async () => {
      const deps = mockDependencies({
        getSiteUrl: () => "",
      });
      const handler = createAdminInviteUserHandler(deps, new Set([origin]));
      const response = await handler(makeRequest(), callerAdminId);
      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({ code: "CONFIGURATION_ERROR" });
      expect(deps.inviteAuthUser).not.toHaveBeenCalled();
    });

    it("fails request handling with CONFIGURATION_ERROR if getSiteUrl throws (Option A)", async () => {
      const deps = mockDependencies({
        getSiteUrl: () => {
          throw new Error("SITE_URL environment variable is required");
        },
      });
      const handler = createAdminInviteUserHandler(deps, new Set([origin]));
      const response = await handler(makeRequest(), callerAdminId);
      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({ code: "CONFIGURATION_ERROR" });
      expect(deps.inviteAuthUser).not.toHaveBeenCalled();
    });
  });

  describe("takeover attempt prevention and compensation isolation", () => {
    it("compensates newly created Auth user when takeover attempt of established profile fails RPC validation", async () => {
      const deps = mockDependencies({
        provisionUserTransaction: vi.fn().mockRejectedValue(new Error("Target user already belongs to an organization")),
      });
      const handler = createAdminInviteUserHandler(deps, new Set([origin]));
      const response = await handler(makeRequest(), callerAdminId);

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        code: "PROVISIONING_FAILED",
        details: "Target user already belongs to an organization",
      });
      // Newly created invited Auth user is deleted to prevent orphan
      expect(deps.compensateFailedInvite).toHaveBeenCalledTimes(1);
      expect(deps.compensateFailedInvite).toHaveBeenCalledWith(newUserId);
    });

    it("compensates newly created Auth user when takeover attempt fails due to existing assigned roles", async () => {
      const deps = mockDependencies({
        provisionUserTransaction: vi.fn().mockRejectedValue(new Error("Target user already has assigned roles")),
      });
      const handler = createAdminInviteUserHandler(deps, new Set([origin]));
      const response = await handler(makeRequest(), callerAdminId);

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        code: "PROVISIONING_FAILED",
        details: "Target user already has assigned roles",
      });
      expect(deps.compensateFailedInvite).toHaveBeenCalledWith(newUserId);
    });

    it("never compensates or deletes existing user on email conflict", async () => {
      const deps = mockDependencies({
        inviteAuthUser: vi.fn().mockRejectedValue(new Error("User already exists")),
      });
      const handler = createAdminInviteUserHandler(deps, new Set([origin]));
      const response = await handler(makeRequest(), callerAdminId);

      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toEqual({ code: "USER_ALREADY_EXISTS" });
      expect(deps.compensateFailedInvite).not.toHaveBeenCalled();
      expect(deps.provisionUserTransaction).not.toHaveBeenCalled();
    });
  });
});
