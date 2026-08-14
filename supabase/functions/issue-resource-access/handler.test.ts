import { describe, expect, it, vi } from "vitest";

import {
  createIssueResourceAccessHandler,
  type AccessDependencies,
} from "./handler";

const userId = "33000000-0000-4000-8000-000000000001";
const versionId = "61000000-0000-4000-8000-000000000001";
const requestId = "63000000-0000-4000-8000-000000000001";
const origin = "https://dr-afif.github.io";

function dependencies(): AccessDependencies {
  return {
    authorize: vi.fn().mockResolvedValue({
      organization_id: "23000000-0000-4000-8000-000000000001",
      user_id: userId,
      resource_id: "60000000-0000-4000-8000-000000000001",
      resource_version_id: versionId,
      object_path: "org/resource/version/test.pdf",
      expires_in_seconds: 60,
    }),
    createSignedUrl: vi.fn().mockResolvedValue("https://example.test/signed"),
    recordIssuance: vi.fn().mockResolvedValue(undefined),
  };
}

function request(
  body: unknown = { resourceVersionId: versionId, requestId },
  method = "POST",
  requestOrigin = origin,
) {
  return new Request("https://example.test/issue-resource-access", {
    method,
    headers: {
      "Content-Type": "application/json",
      Origin: requestOrigin,
    },
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
}

describe("issue-resource-access handler", () => {
  it("returns a short-lived signed URL with explicit no-store headers", async () => {
    const service = dependencies();
    const handler = createIssueResourceAccessHandler(service, new Set([origin]));
    const response = await handler(request(), userId);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      signedUrl: "https://example.test/signed",
      expiresIn: 60,
      resourceVersionId: versionId,
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store, private");
    expect(response.headers.get("Pragma")).toBe("no-cache");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
    const signingOrder = vi.mocked(service.createSignedUrl).mock.invocationCallOrder[0];
    const auditOrder = vi.mocked(service.recordIssuance).mock.invocationCallOrder[0];
    expect(auditOrder).toBeGreaterThan(signingOrder ?? 0);
  });

  it("handles an allowed preflight without invoking dependencies", async () => {
    const service = dependencies();
    const handler = createIssueResourceAccessHandler(service, new Set([origin]));
    const response = await handler(request(undefined, "OPTIONS"), null);
    expect(response.status).toBe(204);
    expect(service.authorize).not.toHaveBeenCalled();
  });

  it("rejects unsupported origins without reflecting them", async () => {
    const handler = createIssueResourceAccessHandler(dependencies(), new Set([origin]));
    const response = await handler(request(undefined, "POST", "https://evil.test"), userId);
    expect(response.status).toBe(403);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("rejects methods other than POST and OPTIONS", async () => {
    const handler = createIssueResourceAccessHandler(dependencies(), new Set([origin]));
    const response = await handler(request(undefined, "GET"), userId);
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST, OPTIONS");
  });

  it("rejects a missing verified user", async () => {
    const handler = createIssueResourceAccessHandler(dependencies(), new Set([origin]));
    const response = await handler(request(), null);
    await expect(response.json()).resolves.toEqual({ code: "AUTHENTICATION_REQUIRED" });
    expect(response.status).toBe(401);
  });

  it.each([
    {},
    { resourceVersionId: "not-a-uuid", requestId },
    { resourceVersionId: versionId, requestId: "not-a-uuid" },
  ])("rejects invalid input", async (body) => {
    const handler = createIssueResourceAccessHandler(dependencies(), new Set([origin]));
    const response = await handler(request(body), userId);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ code: "INVALID_REQUEST" });
  });

  it("maps authorization denial without exposing the database error", async () => {
    const service = dependencies();
    vi.mocked(service.authorize).mockRejectedValue(new Error("RESOURCE_ACCESS_DENIED: internal"));
    const handler = createIssueResourceAccessHandler(service, new Set([origin]));
    const response = await handler(request(), userId);
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ code: "RESOURCE_ACCESS_DENIED" });
  });

  it("maps rate limiting and supplies Retry-After", async () => {
    const service = dependencies();
    vi.mocked(service.authorize).mockRejectedValue(new Error("RESOURCE_ACCESS_RATE_LIMITED"));
    const handler = createIssueResourceAccessHandler(service, new Set([origin]));
    const response = await handler(request(), userId);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
  });

  it("fails closed when signing fails", async () => {
    const service = dependencies();
    vi.mocked(service.createSignedUrl).mockRejectedValue(new Error("signing failed"));
    const handler = createIssueResourceAccessHandler(service, new Set([origin]));
    const response = await handler(request(), userId);
    expect(response.status).toBe(503);
    expect(service.recordIssuance).not.toHaveBeenCalled();
  });

  it("fails closed when issuance auditing fails", async () => {
    const service = dependencies();
    vi.mocked(service.recordIssuance).mockRejectedValue(new Error("audit failed"));
    const handler = createIssueResourceAccessHandler(service, new Set([origin]));
    const response = await handler(request(), userId);
    expect(response.status).toBe(503);
    const body = await response.text();
    expect(body).not.toContain("signed");
    expect(body).toContain("RESOURCE_ACCESS_UNAVAILABLE");
  });
});
