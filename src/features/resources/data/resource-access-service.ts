import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "../../../lib/supabase/database.types";

const accessResponseSchema = z.object({
  signedUrl: z.string().url(),
  expiresIn: z.number().int().positive(),
  resourceVersionId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
});

export type ProtectedPdf = {
  bytes: Uint8Array;
  expiresIn: number;
};

async function functionErrorCode(error: unknown) {
  const context = typeof error === "object" && error !== null && "context" in error
    ? (error as { context?: unknown }).context
    : null;
  if (context instanceof Response) {
    if (context.status === 401 || context.status === 403) return "RESOURCE_ACCESS_DENIED";
    if (context.status === 429) return "RESOURCE_ACCESS_RATE_LIMITED";
  }
  return "RESOURCE_ACCESS_UNAVAILABLE";
}

export async function fetchProtectedPdf(
  client: SupabaseClient<Database>,
  resourceVersionId: string,
  fetcher: typeof fetch = fetch,
): Promise<ProtectedPdf> {
  if (typeof navigator !== "undefined" && !navigator.onLine) throw new Error("RESOURCE_ACCESS_OFFLINE");

  const { data, error } = await client.functions.invoke("issue-resource-access", {
    body: { resourceVersionId, requestId: crypto.randomUUID() },
  });
  if (error) throw new Error(await functionErrorCode(error));

  const parsed = accessResponseSchema.safeParse(data);
  if (!parsed.success || parsed.data.resourceVersionId !== resourceVersionId) {
    throw new Error("RESOURCE_ACCESS_UNAVAILABLE");
  }

  const response = await fetcher(parsed.data.signedUrl, {
    cache: "no-store",
    credentials: "omit",
    headers: { Accept: "application/pdf" },
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403 || response.status === 404) {
      throw new Error("RESOURCE_ACCESS_EXPIRED");
    }
    throw new Error("RESOURCE_ACCESS_UNAVAILABLE");
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength < 5 || new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") {
    throw new Error("RESOURCE_ACCESS_UNAVAILABLE");
  }
  return { bytes, expiresIn: parsed.data.expiresIn };
}
