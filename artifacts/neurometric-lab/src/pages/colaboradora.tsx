import { useState } from "react";
import { useLocation } from "wouter";
import { Activity, ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { ApiError, useOwnCollaboratorDashboard } from "@/hooks/use-collaborators";
import { DashboardSkeleton, DashboardView, ErrorPanel } from "@/components/collaborators/dashboard-view";

// Private portal for the collaborator role. Separate minimal layout: no
// clinical sidebar, no clinical data, only aggregate figures from the server.
export default function ColaboradoraPortal() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { data, isLoading, isError, error, refetch, isFetching } = useOwnCollaboratorDashboard();
  const [leaving, setLeaving] = useState(false);

  const handleLogout = async () => {
    setLeaving(true);
    try { await logout(); } finally { setLocation("/login"); }
  };

  const firstName = (data?.name ?? user?.name ?? "").split(" ")[0];
  const unlinked = error instanceof ApiError && error.status === 403;

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="border-b border-border/60 bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/30">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold font-display text-foreground">Neurometric Terapias</p>
              <p className="text-[11px] text-muted-foreground">Programa de Colaboradoras</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {user?.role === "professional" && (
              <Button variant="outline" size="sm" onClick={() => setLocation("/")} className="gap-1.5" data-testid="button-return-professional">
                <ArrowLeft className="h-4 w-4" /> Volver a mi panel profesional
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout} disabled={leaving} className="gap-1.5 text-muted-foreground">
              <LogOut className="h-4 w-4" /> {leaving ? "Saliendo…" : "Cerrar sesión"}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground">
            Hola{firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tu resumen como colaboradora. Solo cifras agregadas; nunca datos de profesionales ni pacientes.
          </p>
        </div>

        {isLoading ? (
          <DashboardSkeleton />
        ) : unlinked ? (
          <div className="rounded-2xl border border-border/60 bg-card p-6 text-sm" data-testid="status-collaborator-access-denied">
            <p className="font-semibold">Tu usuario no tiene acceso al panel de colaboradora.</p>
            <p className="mt-1 text-muted-foreground">Si creés que deberías tener acceso, consultá con la administración.</p>
          </div>
        ) : isError || !data ? (
          <ErrorPanel
            message={(error as Error)?.message ?? "No se pudo cargar tu panel."}
            onRetry={() => refetch()}
          />
        ) : (
          <div className={isFetching ? "opacity-80 transition-opacity" : "transition-opacity"}>
            <DashboardView data={data} />
          </div>
        )}
      </main>
    </div>
  );
}
