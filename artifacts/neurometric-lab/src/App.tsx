import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/providers/language-provider";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import PatientProfile from "@/pages/patient-profile";
import Sessions from "@/pages/sessions";
import Registros from "@/pages/registros";
import Objetivos from "@/pages/objetivos";
import Actividades from "@/pages/actividades";
import Reportes from "@/pages/reportes";
import Professionals from "@/pages/professionals";
import GoalLibrary from "@/pages/goal-library";
import NuevaSesion from "@/pages/nueva-sesion";
import Agenda from "@/pages/agenda";
import AgendaPagos from "@/pages/agenda-pagos";
import Usuario from "@/pages/usuario";
import Usuarios from "@/pages/usuarios";
import SesionRapida from "@/pages/sesion-rapida";
import LoginPage from "@/pages/login";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
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

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/patients" component={() => <ProtectedRoute component={Patients} />} />
      <Route path="/patients/:id" component={() => <ProtectedRoute component={PatientProfile} />} />
      <Route path="/sessions" component={() => <ProtectedRoute component={Sessions} />} />
      <Route path="/registros" component={() => <ProtectedRoute component={Registros} />} />
      <Route path="/objetivos" component={() => <ProtectedRoute component={Objetivos} />} />
      <Route path="/actividades" component={() => <ProtectedRoute component={Actividades} />} />
      <Route path="/reportes" component={() => <ProtectedRoute component={Reportes} />} />
      <Route path="/professionals" component={() => <AdminRoute component={Professionals} />} />
      <Route path="/goal-library" component={() => <ProtectedRoute component={GoalLibrary} />} />
      <Route path="/nueva-sesion" component={() => <ProtectedRoute component={NuevaSesion} />} />
      <Route path="/agenda" component={() => <ProtectedRoute component={Agenda} />} />
      <Route path="/agenda-pagos" component={() => <ProtectedRoute component={AgendaPagos} />} />
      <Route path="/usuario" component={() => <ProtectedRoute component={Usuario} />} />
      <Route path="/usuarios" component={() => <AdminRoute component={Usuarios} />} />
      <Route path="/sesion-rapida" component={() => <ProtectedRoute component={SesionRapida} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Listens for the nm:session-expired event fired by the global fetch interceptor
// in main.tsx whenever any API request returns 401.
function SessionGuard() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handler = () => {
      toast({
        title: "Sesión expirada",
        description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
        variant: "destructive",
        duration: 6000,
      });
      logout().finally(() => setLocation("/login"));
    };
    window.addEventListener("nm:session-expired", handler);
    return () => window.removeEventListener("nm:session-expired", handler);
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
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}

export default App;
