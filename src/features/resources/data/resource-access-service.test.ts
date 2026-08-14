import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Database } from "../../../lib/supabase/database.types";
import { fetchProtectedPdf } from "./resource-access-service";

const versionId = "14000000-0000-0000-0000-000000000003";

function clientWith(data: unknown, error: unknown = null) {
  return { functions: { invoke: vi.fn().mockResolvedValue({ data, error }) } } as unknown as SupabaseClient<Database>;
}

describe("fetchProtectedPdf", () => {
  beforeEach(() => Object.defineProperty(navigator, "onLine", { configurable: true, value: true }));

  it("uses a one-time function response and fetches bytes with cache disabled", async () => {
    const client = clientWith({ signedUrl: "https://example.test/signed-file", expiresIn: 60, resourceVersionId: versionId });
    const bytes = new TextEncoder().encode("%PDF-fictional");
    const fetcher = vi.fn().mockResolvedValue(new Response(bytes, { status: 200, headers: { "Content-Type": "application/pdf" } }));

    const result = await fetchProtectedPdf(client, versionId, fetcher);

    expect(Array.from(result.bytes)).toEqual(Array.from(bytes));
    expect(client.functions.invoke).toHaveBeenCalledWith("issue-resource-access", { body: { resourceVersionId: versionId, requestId: expect.any(String) } });
    expect(fetcher).toHaveBeenCalledWith("https://example.test/signed-file", expect.objectContaining({ cache: "no-store", credentials: "omit" }));
  });

  it("returns a stable service error without exposing function details", async () => {
    const client = clientWith(null, new Error("raw hosted response"));
    await expect(fetchProtectedPdf(client, versionId, vi.fn())).rejects.toThrow("RESOURCE_ACCESS_UNAVAILABLE");
  });

  it("maps an HTTP authorization failure to a stable denial", async () => {
    const client = clientWith(null, { context: new Response(null, { status: 403 }) });
    await expect(fetchProtectedPdf(client, versionId, vi.fn())).rejects.toThrow("RESOURCE_ACCESS_DENIED");
  });

  it("does not invoke access while offline", async () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    const client = clientWith(null);
    await expect(fetchProtectedPdf(client, versionId, vi.fn())).rejects.toThrow("RESOURCE_ACCESS_OFFLINE");
    expect(client.functions.invoke).not.toHaveBeenCalled();
  });
});
