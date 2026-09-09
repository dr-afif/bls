/**
 * BLS Course Companion — Safe PWA Shell & Cache Exclusion Policy
 *
 * Privacy Rule:
 * Never cache authenticated Supabase application data, RPCs, Storage objects,
 * or user quiz attempts/results.
 */

export const CACHE_NAME = "bls-shell-v1";

export const PRECACHE_URLS = [
  "./",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable.png",
];

const EXCLUDED_HOST_PATTERNS = [
  "supabase.co",
  "supabase.in",
];

const EXCLUDED_PATH_PATTERNS = [
  "/rest/v1/",
  "/rpc/",
  "/auth/v1/",
  "/storage/v1/",
  "/functions/v1/",
];

const SENSITIVE_QUERY_PARAMS = [
  "token",
  "apikey",
  "api_key",
  "signature",
  "auth",
];

/**
 * Returns true if a URL represents dynamic, authenticated, Supabase,
 * or sensitive operational traffic that must NEVER be stored in Cache Storage.
 */
export function isExcludedFromCache(input: string | URL): boolean {
  try {
    const url = typeof input === "string" ? new URL(input, "http://localhost") : input;

    // 1. Only http / https requests are eligible for caching
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return true;
    }

    // 2. Exclude Supabase hosts
    const hostname = url.hostname.toLowerCase();
    for (const hostPattern of EXCLUDED_HOST_PATTERNS) {
      if (hostname.includes(hostPattern)) {
        return true;
      }
    }

    // 3. Exclude REST, RPC, Auth, Storage, and Edge Function endpoints
    const pathname = url.pathname.toLowerCase();
    for (const pathPattern of EXCLUDED_PATH_PATTERNS) {
      if (pathname.includes(pathPattern)) {
        return true;
      }
    }

    // 4. Exclude URLs with sensitive query parameters (e.g., signed storage URLs)
    const searchParams = url.searchParams;
    for (const param of SENSITIVE_QUERY_PARAMS) {
      if (searchParams.has(param)) {
        return true;
      }
    }

    return false;
  } catch {
    // Fail-safe: if URL cannot be parsed, exclude it from cache
    return true;
  }
}

/**
 * Returns true if a URL represents a static application-shell asset.
 */
export function isStaticAsset(input: string | URL): boolean {
  if (isExcludedFromCache(input)) {
    return false;
  }

  try {
    const url = typeof input === "string" ? new URL(input, "http://localhost") : input;
    const pathname = url.pathname.toLowerCase();

    // Check common static extensions
    return /\.(js|mjs|css|svg|png|jpg|jpeg|webp|ico|webmanifest|woff|woff2|ttf)$/.test(
      pathname,
    );
  } catch {
    return false;
  }
}
