/* BLS Course Companion — Safe PWA Shell Service Worker */
/* Version: bls-shell-v1 */
/* global self, caches, Request, URL, fetch */

const CACHE_NAME = "bls-shell-v1";

const PRECACHE_ASSETS = [
  "./",
  "./index.html",
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

function isExcludedFromCache(url) {
  try {
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return true;
    }

    const hostname = url.hostname.toLowerCase();
    for (const hostPattern of EXCLUDED_HOST_PATTERNS) {
      if (hostname.includes(hostPattern)) {
        return true;
      }
    }

    const pathname = url.pathname.toLowerCase();
    for (const pathPattern of EXCLUDED_PATH_PATTERNS) {
      if (pathname.includes(pathPattern)) {
        return true;
      }
    }

    const searchParams = url.searchParams;
    for (const param of SENSITIVE_QUERY_PARAMS) {
      if (searchParams.has(param)) {
        return true;
      }
    }

    return false;
  } catch {
    return true;
  }
}

function isStaticAsset(url) {
  if (isExcludedFromCache(url)) return false;
  const pathname = url.pathname.toLowerCase();
  return /\.(js|mjs|css|svg|png|jpg|jpeg|webp|ico|webmanifest|woff|woff2|ttf)$/.test(pathname);
}

// 1. Install: Precache shell assets and activate immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return Promise.allSettled(
          PRECACHE_ASSETS.map((asset) =>
            cache.add(new Request(asset, { cache: "reload" })),
          ),
        );
      })
      .then(() => self.skipWaiting()),
  );
});

// 2. Activate: Purge old cache versions and claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith("bls-shell-") && name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// 3. Fetch: Safe network handling
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only GET requests can ever be cached
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // PRIVACY RULE: Never cache Supabase, auth, storage, or sensitive queries
  if (isExcludedFromCache(url)) {
    return; // Pass through directly to network
  }

  // Navigation requests: Network-first, fallback to cached index shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match("./") || caches.match("./index.html");
          });
        }),
    );
    return;
  }

  // Static shell assets (JS, CSS, images, icons, fonts, manifest)
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      }),
    );
  }
});
