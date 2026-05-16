import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE } from "@/lib/api";

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

  const fetchMe = async () => {
    try {
      const headers: Record<string, string> = {};
      const stored = localStorage.getItem("nm_auth_token");
      if (stored) headers["Authorization"] = `Bearer ${stored}`;

      const r = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include", headers });
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
  };

  useEffect(() => {
    fetchMe().finally(() => setLoading(false));
  }, []);

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
    // Store the signed token so subsequent requests can send it via
    // Authorization header — bypasses third-party cookie blocking (Safari, Chrome).
    if (data.token) {
      localStorage.setItem("nm_auth_token", data.token);
    }
    // Clear cache so the new user's data loads fresh
    queryClient.clear();
    setUser(data);
  };

  const logout = async () => {
    localStorage.removeItem("nm_auth_token");
    await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
    // Clear ALL cached query data so next user starts fresh
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
