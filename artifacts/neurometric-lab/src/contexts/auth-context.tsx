import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE, getAuthToken, setAuthToken, clearAuthToken } from "@/lib/api";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: "admin" | "professional";
  professionalId: number | null;
  specialty: string | null;
  active: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const fetchMe = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      const token = getAuthToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const r = await fetch(`${API_BASE}/api/auth/me`, {
        credentials: "include",
        headers,
      });
      if (r.ok) {
        const data = await r.json();
        if (data?.id) {
          // Persist any fresh token the server emits — this transparently
          // upgrades users who logged in before the token system existed
          // (cookie-only sessions) and refreshes the 7-day TTL on every
          // app load. Critical for Safari / iOS where cross-site cookies
          // get dropped: without this they'd hit 401 on POST /api/patients.
          if (data.token) setAuthToken(data.token);
          setUser(data);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchMe().finally(() => setLoading(false));
  }, [fetchMe]);

  // Listen for the global session-expired event dispatched by the fetch interceptor
  // in main.tsx. When fired, clear state so ProtectedRoute redirects to /login.
  useEffect(() => {
    const handler = () => {
      console.warn("[auth] sesión expirada — limpiando estado");
      clearAuthToken();
      queryClient.clear();
      setUser(null);
    };
    window.addEventListener("nm:session-expired", handler);
    return () => window.removeEventListener("nm:session-expired", handler);
  }, [queryClient]);

  const login = async (email: string, password: string) => {
    // Wipe any leftover dead token before issuing the login request. Without
    // this, the global fetch interceptor would attach a stale Authorization
    // header — harmless to the backend (login ignores it) but it muddies logs
    // and could confuse intermediate proxies on mobile networks.
    clearAuthToken();

    let res: Response;
    try {
      console.info("[auth] POST /api/auth/login → en vuelo");
      res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch (e: any) {
      // TypeError from fetch = transport-layer failure (offline, DNS, CORS,
      // CSP, Render still booting, antivirus/firewall, captive portal, etc.)
      console.error("[auth] login fetch threw:", e?.message ?? e);
      throw new Error("No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.");
    }

    console.info(`[auth] login response status=${res.status}`);

    if (!res.ok) {
      // Map server status to a friendly, accurate message — never the generic
      // "Sesión expirada" string (which belongs to mid-app 401s, not login).
      let serverMsg: string | undefined;
      try {
        const errBody = await res.json();
        serverMsg = errBody?.error;
      } catch { /* body not JSON */ }

      if (res.status === 401) {
        throw new Error(serverMsg ?? "Email o contraseña incorrectos.");
      }
      if (res.status === 403) {
        throw new Error(serverMsg ?? "Tu usuario está inactivo. Contacta al administrador.");
      }
      if (res.status === 400) {
        throw new Error(serverMsg ?? "Datos inválidos. Revisa tu email y contraseña.");
      }
      if (res.status >= 500) {
        throw new Error("El servidor no responde. Intenta nuevamente en unos segundos.");
      }
      throw new Error(serverMsg ?? `Error al iniciar sesión (HTTP ${res.status}).`);
    }

    let data: any;
    try {
      data = await res.json();
    } catch (e: any) {
      console.error("[auth] login OK pero JSON inválido:", e?.message);
      throw new Error("Respuesta inesperada del servidor. Intenta de nuevo.");
    }

    if (!data?.id) {
      console.error("[auth] login OK pero payload sin id:", data);
      throw new Error("Respuesta inesperada del servidor. Intenta de nuevo.");
    }

    // Persist signed token — works on all browsers regardless of cookie policy.
    if (data.token) {
      setAuthToken(data.token);
      const ok = getAuthToken() === data.token;
      console.info(`[auth] token guardado en localStorage: ${ok ? "✓" : "✗ (storage bloqueado)"}`);
    } else {
      console.warn("[auth] login OK pero sin token en la respuesta — solo cookie-session");
    }
    queryClient.clear();
    setUser(data);
    console.info(`[auth] ✓ usuario ${data.email} (rol=${data.role}) autenticado`);
  };

  const logout = async () => {
    clearAuthToken();
    await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
    queryClient.clear();
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchMe();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
