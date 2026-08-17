import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "../../../lib/supabase/database.types";
import { discardDraft, uploadDraftPdf } from "./resource-admin-repository";

function storageClient(options?: { status?: "missing" | "ready"; uploadError?: unknown }) {
  const upload = vi.fn().mockResolvedValue({ error: options?.uploadError ?? null });
  const remove = vi.fn().mockResolvedValue({ error: null });
  const rpc = vi.fn().mockImplementation((name: string) => {
    if (name === "get_resource_pdf_file_status") return Promise.resolve({ data: [{ file_state: options?.status ?? "ready", object_path: "org/resource/version/file.pdf" }], error: null });
    return Promise.resolve({ data: undefined, error: null });
  });
  const client = {
    rpc,
    storage: { from: vi.fn().mockReturnValue({ remove, upload }) },
  } as unknown as SupabaseClient<Database>;
  return { client, remove, rpc, upload };
}

describe("resource administrator storage boundary", () => {
  it("uploads a PDF only once with private-safe options", async () => {
    const { client, upload } = storageClient();
    const file = new File(["%PDF-fictional"], "guide.pdf", { type: "application/pdf" });

    await uploadDraftPdf(client, "org/resource/version/file.pdf", file);

    expect(upload).toHaveBeenCalledWith("org/resource/version/file.pdf", file, {
      cacheControl: "0",
      contentType: "application/pdf",
      upsert: false,
    });
  });

  it("rejects non-PDF content before contacting Storage", async () => {
    const { client, upload } = storageClient();
    const file = new File(["not a PDF"], "notes.txt", { type: "text/plain" });

    await expect(uploadDraftPdf(client, "org/resource/version/file.pdf", file)).rejects.toThrow("RESOURCE_PDF_INVALID");
    expect(upload).not.toHaveBeenCalled();
  });

  it("maps hosted upload details to a stable application error", async () => {
    const { client } = storageClient({ uploadError: new Error("raw hosted message") });
    const file = new File(["%PDF-fictional"], "guide.pdf", { type: "application/pdf" });

    await expect(uploadDraftPdf(client, "org/resource/version/file.pdf", file)).rejects.toThrow("RESOURCE_PDF_UPLOAD_FAILED");
  });

  it("removes an existing private draft object before discarding its row", async () => {
    const { client, remove, rpc } = storageClient({ status: "ready" });

    await discardDraft(client, "version-id", "org/resource/version/file.pdf");

    expect(remove).toHaveBeenCalledWith(["org/resource/version/file.pdf"]);
    expect(rpc).toHaveBeenLastCalledWith("discard_resource_version_draft", { target_version_id: "version-id" });
  });
});
