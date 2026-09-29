/// <reference lib="webworker" />
import { precacheAndRoute, matchPrecache, cleanupOutdatedCaches, addPlugins } from "workbox-precaching";
import { registerRoute } from "workbox-routing";

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<string | { url: string; revision?: string }> };

const base = new URL(self.registration.scope).pathname;
const isApi = (pathname: string) => pathname.startsWith("/api/") || pathname === "/api"
  || pathname.startsWith(`${base}api/`) || pathname === `${base}api`;

// Authenticated requests, including a request for a public asset that happens
// to carry Authorization, bypass Workbox entirely.
registerRoute(({ request }) => request.headers.has("Authorization"), ({ request }) => fetch(request));

// A navigation always tries the network first; only the PUBLIC, STATIC HTML
// shell is used when offline. Never interpret an API URL as a SPA navigation.
registerRoute(
  ({ request, url }) => request.method === "GET"
    && request.mode === "navigate"
    && url.origin === self.location.origin
    && url.pathname.startsWith(base)
    && !isApi(url.pathname)
    && !request.headers.has("Authorization"),
  async ({ request }) => {
    try {
      return await fetch(request);
    } catch (error) {
      const shell = await matchPrecache(`${base}index.html`);
      if (shell) return shell;
      throw error;
    }
  },
);

// Only build-hashed JS/CSS, the static shell and designated PWA icons.
// No runtime caches: all API, documents, personal data and cross-origin traffic
// pass through the network, and are never written to Cache Storage.
const safeEntries = self.__WB_MANIFEST.filter((entry) => {
  const url = typeof entry === "string" ? entry : entry.url;
  const path = new URL(url, self.registration.scope);
  return path.origin === self.location.origin && !isApi(path.pathname)
    && (path.pathname === `${base}index.html`
      || /^\/assets\/[^/]+\.(js|css)$/.test(path.pathname.slice(base.length - 1))
      || path.pathname.startsWith(`${base}icons/`) && /\.png$/.test(path.pathname));
});

addPlugins([{
  // Even installation requests for public files must not send cookies or tokens.
  requestWillFetch: async ({ request }) => new Request(request, {
    credentials: "omit",
    headers: new Headers(),
  }),
}]);
precacheAndRoute(safeEntries);
cleanupOutdatedCaches();

// Deliberately no skipWaiting() on install and no clientsClaim(): updates
// activate only after explicit user confirmation, without forcing other tabs
// to reload a form they are editing.
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});