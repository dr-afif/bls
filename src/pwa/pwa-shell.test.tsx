import { render, screen } from "@testing-library/react";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";

import indexHtmlRaw from "../../index.html?raw";
import manifestRaw from "../../public/manifest.webmanifest?raw";
import { NotFoundPage } from "../features/system/pages/not-found-page";
import { RouteErrorPage } from "../features/system/pages/route-error-page";
import { isExcludedFromCache, isStaticAsset, PRECACHE_URLS, CACHE_NAME } from "./pwa-policy";

describe("Production PWA Shell & Identity", () => {
  describe("Web App Manifest & Static Assets", () => {
    it("has a valid and structurally sound manifest", () => {
      expect(manifestRaw).toBeTruthy();
      const manifest = JSON.parse(manifestRaw);

      expect(manifest.name).toBe("BLS Course Companion");
      expect(manifest.short_name).toBe("BLS Companion");
      expect(manifest.description).toContain("Basic Life Support");
      expect(manifest.start_url).toBe("./");
      expect(manifest.scope).toBe("./");
      expect(manifest.display).toBe("standalone");
      expect(manifest.orientation).toBeUndefined();
      expect(manifest.theme_color).toBe("#174f7a");
      expect(manifest.background_color).toBe("#faf8f5");

      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThanOrEqual(3);

      const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
      expect(sizes).toContain("192x192");
      expect(sizes).toContain("512x512");

      const maskable = manifest.icons.find((i: { purpose?: string }) => i.purpose === "maskable");
      expect(maskable).toBeDefined();

      const srcs = manifest.icons.map((i: { src: string }) => i.src);
      expect(srcs).toContain("favicon.svg");
      expect(srcs).toContain("icon-192.png");
      expect(srcs).toContain("icon-512.png");
      expect(srcs).toContain("icon-maskable.png");
    });

    it("includes required precache assets", () => {
      expect(CACHE_NAME).toBe("bls-shell-v1");
      expect(PRECACHE_URLS).toContain("./");
      expect(PRECACHE_URLS).toContain("./manifest.webmanifest");
      expect(PRECACHE_URLS).toContain("./favicon.svg");
      expect(PRECACHE_URLS).toContain("./icon-192.png");
      expect(PRECACHE_URLS).toContain("./icon-512.png");
    });
  });

  describe("HTML Shell & Viewport Metadata", () => {
    it("configures production title, meta description, and viewport-fit=cover", () => {
      expect(indexHtmlRaw).toContain("<title>BLS Course Companion</title>");
      expect(indexHtmlRaw).not.toMatch(/<title>.*[Pp]rototype.*<\/title>/);
      expect(indexHtmlRaw).not.toMatch(/<meta\s+name="description"\s+content=".*[Pp]rototype.*"\s*\/>/);
      expect(indexHtmlRaw).toContain("viewport-fit=cover");
      expect(indexHtmlRaw).toContain('rel="manifest"');
      expect(indexHtmlRaw).toContain('rel="icon"');
    });
  });

  describe("User-Facing System Messaging", () => {
    it("renders NotFoundPage with production copy and no prototype references", () => {
      render(
        <MemoryRouter>
          <NotFoundPage />
        </MemoryRouter>,
      );

      expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
      expect(screen.getByText("The requested page does not exist.")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Return to home" })).toBeInTheDocument();
      expect(screen.queryByText(/prototype/i)).not.toBeInTheDocument();
    });

    it("renders RouteErrorPage with production copy and no prototype references", async () => {
      const router = createMemoryRouter(
        [
          {
            path: "/",
            element: <div>Root</div>,
            errorElement: <RouteErrorPage />,
            loader: () => {
              throw new Error("Render failure");
            },
          },
        ],
        { initialEntries: ["/"] },
      );

      render(<RouterProvider router={router} />);

      expect(await screen.findByText("The application could not render this route.")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Return to home" })).toBeInTheDocument();
      expect(screen.queryByText(/prototype/i)).not.toBeInTheDocument();
    });
  });

  describe("Service Worker Cache Exclusion Policy (Strict Privacy Rules)", () => {
    it("strictly excludes Supabase hosts from cache", () => {
      expect(isExcludedFromCache("https://zlaixhnyydxgbphgsetv.supabase.co/rest/v1/quiz_attempts")).toBe(true);
      expect(isExcludedFromCache("https://other-project.supabase.co/auth/v1/token")).toBe(true);
      expect(isExcludedFromCache("https://my-supabase.supabase.in/rpc/submit")).toBe(true);
    });

    it("strictly excludes Supabase REST and RPC paths from cache", () => {
      expect(isExcludedFromCache("https://api.example.com/rest/v1/cohorts")).toBe(true);
      expect(isExcludedFromCache("https://api.example.com/rpc/start_quiz_attempt")).toBe(true);
      expect(isExcludedFromCache("/rest/v1/profiles")).toBe(true);
    });

    it("strictly excludes Supabase Auth, Storage, and Edge Functions from cache", () => {
      expect(isExcludedFromCache("https://api.example.com/auth/v1/user")).toBe(true);
      expect(isExcludedFromCache("https://api.example.com/storage/v1/object/sign/protected/manual.pdf")).toBe(true);
      expect(isExcludedFromCache("https://api.example.com/functions/v1/issue-resource-access")).toBe(true);
    });

    it("strictly excludes URLs containing sensitive tokens or signatures", () => {
      expect(isExcludedFromCache("https://example.com/file.pdf?token=secret123")).toBe(true);
      expect(isExcludedFromCache("https://example.com/api?apikey=sb-12345")).toBe(true);
      expect(isExcludedFromCache("https://example.com/doc?signature=abcde")).toBe(true);
    });

    it("strictly excludes non-HTTP schemes", () => {
      expect(isExcludedFromCache("chrome-extension://abc/script.js")).toBe(true);
      expect(isExcludedFromCache("data:text/plain;base64,hello")).toBe(true);
    });

    it("permits safe static frontend assets to be cached", () => {
      expect(isExcludedFromCache("http://localhost:5173/assets/index-Bx7y8z.js")).toBe(false);
      expect(isExcludedFromCache("http://localhost:5173/assets/index-Ap9q2r.css")).toBe(false);
      expect(isExcludedFromCache("http://localhost:5173/favicon.svg")).toBe(false);
      expect(isExcludedFromCache("http://localhost:5173/icon-192.png")).toBe(false);
      expect(isExcludedFromCache("http://localhost:5173/manifest.webmanifest")).toBe(false);
    });

    it("accurately identifies static asset requests", () => {
      expect(isStaticAsset("http://localhost:5173/assets/index-Bx7y8z.js")).toBe(true);
      expect(isStaticAsset("http://localhost:5173/assets/index-Ap9q2r.css")).toBe(true);
      expect(isStaticAsset("http://localhost:5173/icon-192.png")).toBe(true);
      expect(isStaticAsset("http://localhost:5173/manifest.webmanifest")).toBe(true);

      // Dynamic or excluded paths must not be treated as static assets
      expect(isStaticAsset("https://zlaixhnyydxgbphgsetv.supabase.co/rest/v1/quiz_attempts")).toBe(false);
      expect(isStaticAsset("http://localhost:5173/rest/v1/fake.js")).toBe(false);
      expect(isStaticAsset("http://localhost:5173/api/data")).toBe(false);
    });
  });
});
