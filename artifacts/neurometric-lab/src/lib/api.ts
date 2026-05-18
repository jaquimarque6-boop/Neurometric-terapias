export const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

const TOKEN_KEY = "nm_auth_token";

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
