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
        if (data?.id) setUser(data);
        else setUser(null);
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
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Error al iniciar sesión");
    }
    const data = await res.json();
    // Persist signed token — works on all browsers regardless of cookie policy.
    if (data.token) setAuthToken(data.token);
    queryClient.clear();
    setUser(data);
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
