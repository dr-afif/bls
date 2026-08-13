import { describe, expect, it } from "vitest";

import { parsePublicEnvironment } from "./env";

describe("parsePublicEnvironment", () => {
  it("accepts only the public browser configuration", () => {
    expect(
      parsePublicEnvironment({
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
        VITE_SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toEqual({
      configured: true,
      value: {
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
        VITE_SUPABASE_URL: "https://example.supabase.co",
      },
    });
  });

  it("fails closed when configuration is incomplete or insecure", () => {
    const result = parsePublicEnvironment({
      VITE_SUPABASE_PUBLISHABLE_KEY: "",
      VITE_SUPABASE_URL: "http://example.supabase.co",
    });

    expect(result.configured).toBe(false);
  });
});
