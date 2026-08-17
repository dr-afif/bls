import { describe, expect, it } from "vitest";

import { resourceTaxonomySchema, slugifyTaxonomyName } from "./resource-taxonomy-form-utils";

describe("resource taxonomy form utilities", () => {
  it("creates a stable lowercase slug from a human-readable name", () => {
    expect(slugifyTaxonomyName("  Pédiatric CPR & AED  ")).toBe("pediatric-cpr-aed");
    expect(slugifyTaxonomyName("Adult CPR: 2026 update")).toBe("adult-cpr-2026-update");
  });

  it("requires a valid name and non-negative whole display order", () => {
    expect(resourceTaxonomySchema.safeParse({ description: "", displayOrder: "0", name: "Adult CPR" }).success).toBe(true);
    expect(resourceTaxonomySchema.safeParse({ description: "", displayOrder: "-1", name: "A" }).success).toBe(false);
  });
});
