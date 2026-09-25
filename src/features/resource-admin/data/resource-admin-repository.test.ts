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

  it("persists content_language when creating a resource", async () => {
    const { createResource } = await import("./resource-admin-repository");
    const insertResource = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: "res-new-1" }, error: null }),
      }),
    });
    const rpc = vi.fn().mockImplementation((name: string) => {
      if (name === "create_resource_version_draft") {
        return Promise.resolve({ data: [{ version_id: "ver-new-1" }], error: null });
      }
      return Promise.resolve({ error: null });
    });

    const client = {
      from: vi.fn((table: string) => {
        if (table === "resources") return { insert: insertResource };
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }),
      rpc,
    } as unknown as SupabaseClient<Database>;

    await createResource(client, {
      organizationId: "org-1",
      courseId: "course-1",
      actorUserId: "admin-1",
      contentLanguage: "bilingual",
      slug: "new-bilingual-guide",
      title: "New Bilingual Guide",
      type: "guide",
      estimatedMinutes: 5,
      featured: false,
      summary: "Summary of guide",
      versionContent: { sections: [] },
      guidelineSource: null,
      guidelineYear: null,
      youtubeVideoId: null,
      audiences: ["learner"],
      topicIds: [],
      stageIds: [],
    });

    expect(insertResource).toHaveBeenCalledWith(expect.objectContaining({
      content_language: "bilingual",
      slug: "new-bilingual-guide",
      title: "New Bilingual Guide",
    }));
  });

  it("persists content_language when updating resource metadata", async () => {
    const { updateResourceMetadata } = await import("./resource-admin-repository");
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });

    const client = {
      from: vi.fn(() => ({ update })),
    } as unknown as SupabaseClient<Database>;

    await updateResourceMetadata(client, {
      resourceId: "res-1",
      actorUserId: "admin-1",
      contentLanguage: "ms",
      slug: "updated-slug",
      title: "Updated Title",
      estimatedMinutes: 10,
      featured: true,
    });

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      content_language: "ms",
      slug: "updated-slug",
      title: "Updated Title",
      estimated_minutes: 10,
      featured: true,
    }));
    expect(eq).toHaveBeenCalledWith("id", "res-1");
  });
});
