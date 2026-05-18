import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// ─── Global fetch interceptor ─────────────────────────────────────────────────
// Runs before any React code. Patches window.fetch so that EVERY request to the
// backend API automatically carries Authorization: Bearer <token>.
//
// Why here instead of each page/component:
//   • 30+ raw fetch() calls spread across 12 files — patching once is safer.
//   • Mobile browsers (Safari ITP, Chrome third-party cookie phase-out) silently
//     drop cross-site cookies; the token in localStorage is the only reliable
//     credential in those environments.
//   • Private/incognito mode may throw on localStorage — we guard that here.
//
// On 401 responses (session expired / token invalid) a custom DOM event is
// dispatched so the app can redirect to login and show a clear message.

const _API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const _nativeFetch = window.fetch.bind(window);

let _lastExpiredAt = 0;

function _safeGetToken(): string | null {
  try { return localStorage.getItem("nm_auth_token"); } catch { return null; }
}

function _resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return (input as Request).url;
}

window.fetch = async function patchedFetch(input, init?) {
  const url = _resolveUrl(input as RequestInfo | URL);

  if (!_API_BASE || !url.startsWith(_API_BASE)) {
    return _nativeFetch(input as RequestInfo, init as RequestInit);
  }

  const headers = new Headers((init as RequestInit | undefined)?.headers);

  if (!headers.has("authorization")) {
    const token = _safeGetToken();
    if (token) headers.set("authorization", `Bearer ${token}`);
  }

  const response = await _nativeFetch(input as RequestInfo, {
    ...(init as RequestInit),
    credentials: "include",
    headers,
  });

  if (
    response.status === 401 &&
    !url.includes("/api/auth/login") &&
    Date.now() - _lastExpiredAt > 3000
  ) {
    _lastExpiredAt = Date.now();
    window.dispatchEvent(new CustomEvent("nm:session-expired", { detail: { url } }));
  }

  return response;
} as typeof fetch;

// ─── App bootstrap ────────────────────────────────────────────────────────────
createRoot(document.getElementById("root")!).render(<App />);
