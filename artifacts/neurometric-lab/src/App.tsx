import { useEffect, useRef, lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/providers/language-provider";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

// Eager: login is the entry screen and NotFound is the cheap fallback. Keeping
// them in the initial chunk avoids a loading flash on first paint.
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";

// Lazy: every authenticated page is code-split into its own chunk so the initial
// bundle (and time-to-interactive) only pays for what the user actually opens.
// Behaviour is unchanged — only when each module is downloaded.
const Seleccion = lazy(() => import("@/pages/seleccion"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Patients = lazy(() => import("@/pages/patients"));
const PatientProfile = lazy(() => import("@/pages/patient-profile"));
const Respaldo = lazy(() => import("@/pages/respaldo"));
const Sessions = lazy(() => import("@/pages/sessions"));
const Registros = lazy(() => import("@/pages/registros"));
const Objetivos = lazy(() => import("@/pages/objetivos"));
const Actividades = lazy(() => import("@/pages/actividades"));
const MisMateriales = lazy(() => import("@/pages/mis-materiales"));
const Reportes = lazy(() => import("@/pages/reportes"));
const Professionals = lazy(() => import("@/pages/professionals"));
const GoalLibrary = lazy(() => import("@/pages/goal-library"));
const NuevaSesion = lazy(() => import("@/pages/nueva-sesion"));
const Agenda = lazy(() => import("@/pages/agenda"));
const AgendaPagos = lazy(() => import("@/pages/agenda-pagos"));
const Usuario = lazy(() => import("@/pages/usuario"));
const Usuarios = lazy(() => import("@/pages/usuarios"));
const SesionRapida = lazy(() => import("@/pages/sesion-rapida"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: "always",
      staleTime: 1000 * 60 * 5,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [loading, user, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm animate-pulse">Cargando…</div>
      </div>
    );
  }

  if (!user) return null;

  return <Component />;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) setLocation("/login");
      else if (user.role !== "admin") setLocation("/");
    }
  }, [loading, user, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm animate-pulse">Cargando…</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  return <Component />;
}

// Lightweight fallback shown while a code-split page chunk downloads. Matches
// the existing "Cargando…" treatment so route transitions never look frozen.
function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-muted-foreground text-sm animate-pulse">Cargando…</div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/seleccion" component={() => <ProtectedRoute component={Seleccion} />} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/patients" component={() => <ProtectedRoute component={Patients} />} />
      <Route path="/patients/:id" component={() => <ProtectedRoute component={PatientProfile} />} />
      <Route path="/sessions" component={() => <ProtectedRoute component={Sessions} />} />
      <Route path="/registros" component={() => <ProtectedRoute component={Registros} />} />
      <Route path="/objetivos" component={() => <ProtectedRoute component={Objetivos} />} />
      <Route path="/actividades" component={() => <ProtectedRoute component={Actividades} />} />
      <Route path="/mis-materiales" component={() => <ProtectedRoute component={MisMateriales} />} />
      <Route path="/reportes" component={() => <ProtectedRoute component={Reportes} />} />
      <Route path="/professionals" component={() => <AdminRoute component={Professionals} />} />
      <Route path="/goal-library" component={() => <ProtectedRoute component={GoalLibrary} />} />
      <Route path="/nueva-sesion" component={() => <ProtectedRoute component={NuevaSesion} />} />
      <Route path="/agenda" component={() => <ProtectedRoute component={Agenda} />} />
      <Route path="/agenda-pagos" component={() => <ProtectedRoute component={AgendaPagos} />} />
      <Route path="/usuario" component={() => <ProtectedRoute component={Usuario} />} />
      <Route path="/usuarios" component={() => <AdminRoute component={Usuarios} />} />
      <Route path="/sesion-rapida" component={() => <ProtectedRoute component={SesionRapida} />} />
      <Route path="/respaldo" component={() => <ProtectedRoute component={Respaldo} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Listens for the auth lifecycle events fired by the global fetch interceptor
// in main.tsx. The interceptor never logs the user out on a single 401: it
// first re-verifies via /api/auth/me and dispatches either `restored` or
// `expired`. While that verification is in flight, we surface a friendly
// "Reconectando sesión…" toast so the user isn't blamed for a Render cold
// start, a flaky mobile network, or a transient cookie hiccup.
function SessionGuard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // The session lifecycle listeners live for the whole app lifetime, so they
  // must read the *current* auth state, not a stale closure value. A ref tracks
  // whether there is (or was) an active session this load. This is the single
  // source of truth for "¿realmente había una sesión activa?": only then do we
  // show "Sesión expirada" or run logout(). Opening the app with no prior
  // session must never trigger either — the user just sees the login form.
  const hadActiveSessionRef = useRef(false);
  useEffect(() => {
    if (user) hadActiveSessionRef.current = true;
  }, [user]);

  useEffect(() => {
    let reconnectToastDismiss: (() => void) | null = null;

    const clearReconnectToast = () => {
      if (reconnectToastDismiss) {
        reconnectToastDismiss();
        reconnectToastDismiss = null;
      }
    };

    const onChecking = () => {
      // No active session → a 401 just means "not logged in". Stay quiet.
      if (!hadActiveSessionRef.current) return;
      if (reconnectToastDismiss) return; // already showing
      const { dismiss } = toast({
        title: "Reconectando sesión…",
        description: "Verificando tu acceso. No cierres la app.",
        duration: 15000,
      });
      reconnectToastDismiss = dismiss;
    };

    const onRestored = () => {
      clearReconnectToast();
    };

    const onExpired = () => {
      clearReconnectToast();
      // Only surface the expiry message + auto-logout when there genuinely was
      // an active session. Without this guard, a fresh open on Safari/iOS (no
      // session, cookies dropped) would wrongly show "Sesión expirada" and call
      // logout(). With no prior session we simply ensure the login screen.
      if (!hadActiveSessionRef.current) {
        setLocation("/login");
        return;
      }
      hadActiveSessionRef.current = false;
      toast({
        title: "Sesión expirada",
        description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
        variant: "destructive",
        duration: 6000,
      });
      logout().finally(() => setLocation("/login"));
    };

    window.addEventListener("nm:session-checking", onChecking);
    window.addEventListener("nm:session-restored", onRestored);
    window.addEventListener("nm:session-expired", onExpired);
    return () => {
      window.removeEventListener("nm:session-checking", onChecking);
      window.removeEventListener("nm:session-restored", onRestored);
      window.removeEventListener("nm:session-expired", onExpired);
      clearReconnectToast();
    };
  }, [logout, toast, setLocation]);

  return null;
}

function App() {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <SessionGuard />
              <Suspense fallback={<PageFallback />}>
                <Router />
              </Suspense>
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}

export default App;
