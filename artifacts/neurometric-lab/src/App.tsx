import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/providers/language-provider";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/patients" component={Patients} />
      <Route path="/patients/:id" component={PatientProfile} />
      <Route path="/sessions" component={Sessions} />
      <Route path="/registros" component={Registros} />
      <Route path="/objetivos" component={Objetivos} />
      <Route path="/actividades" component={Actividades} />
      <Route path="/reportes" component={Reportes} />
      <Route path="/professionals" component={Professionals} />
      <Route path="/goal-library" component={GoalLibrary} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}

export default App;
