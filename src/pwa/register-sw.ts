/**
 * Service worker registration helper for BLS Course Companion.
 * Uses Vite's base path to ensure correct scope on GitHub Pages (/bls/) and localhost (/).
 */
export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    const baseUrl = import.meta.env.BASE_URL || "/";
    const swUrl = `${baseUrl.replace(/\/$/, "")}/sw.js`;

    navigator.serviceWorker
      .register(swUrl, { scope: baseUrl })
      .then((registration) => {
        // Check for updates quietly
        registration.update().catch(() => {
          // Ignore background update check failures
        });
      })
      .catch((error) => {
        // Safe fail — application remains fully operational without service worker
        console.warn("BLS Course Companion service worker registration failed:", error);
      });
  });
}
