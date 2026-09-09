import { describe, expect, it } from "vitest";

import templateContent from "../../../../supabase/templates/invite.html?raw";

describe("invitation email template static validation", () => {

  it("identifies BLS Course Companion clearly", () => {
    expect(templateContent).toContain("BLS Course Companion");
  });

  it("uses GoTrue TokenHash template variable", () => {
    expect(templateContent).toContain("{{ .TokenHash }}");
  });

  it("uses explicit type=invite parameter", () => {
    expect(templateContent).toContain("type=invite");
  });

  it("does not use the default GoTrue ConfirmationURL as its acceptance action", () => {
    expect(templateContent).not.toContain("{{ .ConfirmationURL }}");
  });

  it("uses {{ .RedirectTo }} as the application base and does not use {{ .SiteURL }} for the Accept Invitation destination", () => {
    const hrefMatch = templateContent.match(/href="([^"]+)"/);
    expect(hrefMatch).not.toBeNull();
    const href = hrefMatch![1];

    expect(href).toContain("{{ .RedirectTo }}");
    expect(href).not.toContain("{{ .SiteURL }}");

    const [pathPart, fragmentPart] = href.split("#");
    expect(pathPart).toBe("{{ .RedirectTo }}");
    expect(fragmentPart).toContain("/auth/callback?token_hash={{ .TokenHash }}&type=invite");
  });

  it("generates SPA destination using HashRouter-compatible /auth/callback with token hash located after #", () => {
    expect(templateContent).toContain("#/auth/callback");
    const hrefMatch = templateContent.match(/href="([^"]+)"/);
    expect(hrefMatch).not.toBeNull();
    const href = hrefMatch![1];
    const [pathPart, fragmentPart] = href.split("#");
    expect(pathPart).toBe("{{ .RedirectTo }}");
    expect(fragmentPart).toContain("/auth/callback?token_hash={{ .TokenHash }}&type=invite");
  });

  it("embeds no access tokens, refresh tokens, passwords, or service credentials", () => {
    expect(templateContent).not.toContain("access_token");
    expect(templateContent).not.toContain("refresh_token");
    expect(templateContent).not.toContain("service_role");
    expect(templateContent).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("contains an explicit Accept Invitation action link", () => {
    expect(templateContent).toMatch(/<a[^>]+>Accept Invitation<\/a>/i);
  });
});
