export const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

const TOKEN_KEY = "nm_auth_token";
// Marker that survives across the app lifetime to record that this browser has
// had a genuinely authenticated session (via token OR cookie-only). The global
// fetch interceptor uses it to decide whether a 401 means "session expired"
// (had a session) vs. "not logged in" (fresh open). Kept as a string so it
// works even when cross-site cookies are dropped (Safari/iOS) or the token is
// unavailable (cookie-only logins).
export const SESSION_MARKER_KEY = "nm_had_session";

/** Read the stored auth token. Returns null in private/incognito if storage is blocked. */
export function getAuthToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

/** Persist token after login. Silently ignored if localStorage is unavailable. */
export function setAuthToken(token: string): void {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* private mode */ }
}

/** Remove token on logout or session expiry. */
export function clearAuthToken(): void {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* private mode */ }
}

/** Mark that an authenticated session exists (call on login / verified /me). */
export function markSession(): void {
  try { localStorage.setItem(SESSION_MARKER_KEY, "1"); } catch { /* private mode */ }
}

/** True if this browser has had an authenticated session this install. */
export function hasSessionMarker(): boolean {
  try { return localStorage.getItem(SESSION_MARKER_KEY) === "1"; } catch { return false; }
}

/** Clear the session marker on logout / confirmed expiry. */
export function clearSessionMarker(): void {
  try { localStorage.removeItem(SESSION_MARKER_KEY); } catch { /* private mode */ }
}
