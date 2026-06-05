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
// 401 handling (mobile-stable):
//   A single 401 from any endpoint does NOT immediately log the user out.
//   We first re-verify via /api/auth/me. Only if THAT also returns 401 is the
//   token considered invalid and `nm:session-expired` dispatched. Network
//   errors, 5xx, timeouts, aborts, or Render cold-start hiccups never trigger
//   logout — the existing token + session stay intact.

const _API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const _nativeFetch = window.fetch.bind(window);

let _lastCheckAt = 0;
let _verifying: Promise<boolean> | null = null;

function _safeGetToken(): string | null {
  try { return localStorage.getItem("nm_auth_token"); } catch { return null; }
}

// True if this browser has ever held an authenticated session (token OR
// cookie-only). Set by the auth context on login / verified /me. Used to tell a
// "session expired" 401 (had a session) apart from a "not logged in" 401 (fresh
// open). Keep the key in sync with SESSION_MARKER_KEY in src/lib/api.ts.
function _safeHadSession(): boolean {
  try { return localStorage.getItem("nm_had_session") === "1"; } catch { return false; }
}

function _safeSetToken(t: string): void {
  try { localStorage.setItem("nm_auth_token", t); } catch { /* ignore */ }
}

function _resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return (input as Request).url;
}

// Verify session against /api/auth/me. Resolves to:
//   true  → session is alive (200 OK, or ambiguous network/5xx — fail-open)
//   false → token confirmed invalid (401 from /me itself)
// De-duplicated: concurrent 401s share the same verification round-trip.
function _verifyAuth(): Promise<boolean> {
  if (_verifying) return _verifying;
  _verifying = (async () => {
    try {
      const headers = new Headers();
      const token = _safeGetToken();
      if (token) headers.set("authorization", `Bearer ${token}`);

      const r = await _nativeFetch(`${_API_BASE}/api/auth/me`, {
        credentials: "include",
        headers,
        // Give the server a real chance — Render free tier cold start can take >10s.
        // No AbortController: if the request hangs forever the browser closes it,
        // and a thrown error here is treated as "fail-open" (assume valid).
      });

      if (r.ok) {
        try {
          const data = await r.json();
          if (data?.token) _safeSetToken(data.token);
        } catch { /* ignore body parse errors */ }
        return true;
      }
      if (r.status === 401) {
        return false; // confirmed invalid
      }
      // 5xx / 502 / 503 / 504 / anything else → fail-open, keep session.
      console.warn(`[auth] /me devolvió ${r.status} — manteniendo sesión (fail-open)`);
      return true;
    } catch (err) {
      // Network error, abort, offline, DNS, CORS preflight failure, etc.
      // Never log the user out for transport-layer issues.
      console.warn("[auth] /me falló por red — manteniendo sesión (fail-open)", err);
      return true;
    } finally {
      // Release the lock shortly after so a later real expiry can re-verify.
      setTimeout(() => { _verifying = null; }, 5000);
    }
  })();
  return _verifying;
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

  // Only consider verifying when the backend explicitly says 401.
  // Skip login (expected 401 on wrong password) and /me itself (would loop).
  //
  // Crucially, only begin the "session expired" flow when this browser has
  // actually had an authenticated session — proven by a stored token OR the
  // session marker (which also covers cookie-only logins with no token).
  // A 401 with neither means the user simply isn't logged in (e.g. a fresh
  // open on Safari/iOS where cross-site cookies are dropped) — that is NOT an
  // expiry and must never surface the "Sesión expirada" toast or trigger an
  // automatic logout.
  const shouldCheck =
    response.status === 401 &&
    !url.includes("/api/auth/login") &&
    !url.includes("/api/auth/me") &&
    (!!_safeGetToken() || _safeHadSession());

  if (shouldCheck && Date.now() - _lastCheckAt > 3000) {
    _lastCheckAt = Date.now();
    // Tell the UI we are checking — shows "Reconectando sesión…"
    window.dispatchEvent(new CustomEvent("nm:session-checking", { detail: { url } }));
    // Fire-and-forget: the original response is returned unchanged to the caller.
    // The verifier decides whether to expire or restore.
    void _verifyAuth().then((valid) => {
      if (valid) {
        window.dispatchEvent(new CustomEvent("nm:session-restored"));
      } else {
        window.dispatchEvent(new CustomEvent("nm:session-expired", { detail: { url } }));
      }
    });
  }

  return response;
} as typeof fetch;

// ─── App bootstrap ────────────────────────────────────────────────────────────
createRoot(document.getElementById("root")!).render(<App />);
