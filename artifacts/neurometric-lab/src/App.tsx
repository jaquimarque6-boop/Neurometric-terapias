import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/providers/language-provider";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm animate-pulse">Cargando…</div>
      </div>
    );
  }

  if (!user) return null;

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
      <Route path="/professionals" component={() => <ProtectedRoute component={Professionals} />} />
      <Route path="/goal-library" component={() => <ProtectedRoute component={GoalLibrary} />} />
      <Route path="/nueva-sesion" component={() => <ProtectedRoute component={NuevaSesion} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
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
