import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Users,
  Search,
  UserCircle,
  ArrowLeft,
  Plus,
  ChevronRight,
  Archive,
  RotateCcw,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useListPatients, getListPatientsQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { NuevoPacienteModal } from "@/components/nuevo-paciente-modal";
import { getDiagnosisLabel } from "@/utils/diagnosis-map";
import { formatEdadCorta } from "@/utils/edad";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { API_BASE } from "@/lib/api";

const BRAND_BLUE = "#E07A5F";
const BRAND_TEAL = "#81B29A";

// ─── Status config (3 display states) ────────────────────────────────────────

type DisplayStatus = "Buen progreso" | "En progreso" | "Requiere ajuste";

const STATUS: Record<
  DisplayStatus,
  { stripe: string; dot: string; label: string }
> = {
  "Buen progreso": {
    stripe: "#10b981",
    dot: "bg-emerald-400",
    label: "text-emerald-600",
  },
  "En progreso": {
    stripe: BRAND_TEAL,
    dot: "bg-amber-400",
    label: "text-amber-700",
  },
  "Requiere ajuste": {
    stripe: "#f43f5e",
    dot: "bg-rose-400",
    label: "text-rose-600",
  },
};

function resolveStatus(raw: string | undefined): DisplayStatus {
  if (!raw) return "Requiere ajuste";
  if (raw === "Buen progreso") return "Buen progreso";
  if (raw === "En progreso") return "En progreso";
  return "Requiere ajuste";
}

function shortAction(raw: string | undefined): string | null {
  if (!raw) return null;
  if (raw.includes("Continuar")) return "Continuar";
  if (raw.includes("Aumentar") || raw.includes("dificultad"))
    return "Subir nivel";
  if (raw.includes("Revisar")) return "Revisar";
  if (raw.includes("Agregar") || raw.includes("nuevo")) return "Agregar";
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [patientView, setPatientView] = useState<"active" | "archived">("active");
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patients, isLoading } = useListPatients();

  const {
    data: archivedPatientsData,
    isLoading: loadingArchived,
    isError: archivedPatientsError,
    refetch: refetchArchivedPatients,
  } = useQuery<any[]>({
    queryKey: ["archivedPatients", user?.id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/patients?includeArchived=true`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al cargar archivados");
      return res.json() as Promise<any[]>;
    },
    enabled: patientView === "archived" && !!user?.id,
  });
  const archivedPatients = archivedPatientsData ?? [];

  const handleRestore = async (patientId: number, patientName: string) => {
    setRestoringId(patientId);
    try {
      const res = await fetch(`${API_BASE}/api/patients/${patientId}/restore`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: ["archivedPatients"] }),
      ]);
      toast({
        title: "Paciente restaurado",
        description: `${patientName} vuelve a aparecer en los listados activos.`,
      });
    } catch (err: any) {
      toast({ title: "Error al restaurar", description: err.message, variant: "destructive" });
    } finally {
      setRestoringId(null);
    }
  };

  // Recompute the filtered list only when the data or the search term changes,
  // not on every render (e.g. unrelated state updates). Same result, less work.
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return (patients ?? []).filter((p: any) => {
      return (
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.diagnosis ?? "").toLowerCase().includes(q) ||
        (p.profesionalNombre ?? "").toLowerCase().includes(q) ||
        (p.franjaEtaria ?? "").includes(q)
      );
    });
  }, [patients, searchTerm]);

  const filteredArchived = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return archivedPatients.filter((p) => (
      !q ||
      (p.name ?? "").toLowerCase().includes(q) ||
      (p.diagnosis ?? "").toLowerCase().includes(q) ||
      (p.profesionalNombre ?? "").toLowerCase().includes(q) ||
      (p.franjaEtaria ?? "").includes(q)
    ));
  }, [archivedPatients, searchTerm]);

  const selectedCount = patientView === "active"
    ? patients?.length
    : archivedPatientsData?.length;

  const handleBack = () => {
    if (window.history.length > 1) window.history.back();
    else navigate("/");
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 animate-in fade-in duration-400">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground/80 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold" style={{ color: BRAND_BLUE }}>
              Pacientes
            </h1>
            {(patientView === "active" ? !isLoading : !!archivedPatientsData) && (
              <span className="text-sm text-muted-foreground">
                ({selectedCount ?? 0})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-sm w-44 bg-card border-border focus-visible:ring-primary/20"
              />
            </div>
            <button
              onClick={() => setShowNewPatient(true)}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-[0.97] whitespace-nowrap"
              style={{ background: BRAND_TEAL }}
            >
              <Plus className="h-3.5 w-3.5" />
              Nuevo
            </button>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Estado de pacientes"
          className="inline-flex w-fit items-center gap-1 rounded-xl border border-border/60 bg-muted/50 p-1"
        >
          <button
            type="button"
            id="patients-active-tab"
            role="tab"
            aria-selected={patientView === "active"}
            aria-controls="patients-active-panel"
            data-testid="tab-patients-active"
            onClick={() => setPatientView("active")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
              patientView === "active"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-4 w-4" />
            Activos
            {patients && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">
                {patients.length}
              </span>
            )}
          </button>
          <button
            type="button"
            id="patients-archived-tab"
            role="tab"
            aria-selected={patientView === "archived"}
            aria-controls="patients-archived-panel"
            data-testid="tab-patients-archived"
            onClick={() => setPatientView("archived")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
              patientView === "archived"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Archive className="h-4 w-4" />
            Archivados
            {archivedPatientsData && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">
                {archivedPatientsData.length}
              </span>
            )}
          </button>
        </div>

        {/* Patient list */}
        <div
          id="patients-active-panel"
          role="tabpanel"
          aria-labelledby="patients-active-tab"
          data-testid="panel-active-patients"
          hidden={patientView !== "active"}
          className={`${patientView === "active" ? "grid" : "hidden"} grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3`}
        >
          {isLoading ? (
            Array(6)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="bg-card rounded-xl border border-border/50 p-4 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3.5 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-40" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-1 flex-1 rounded-full" />
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-6 w-16 rounded-md" />
                  </div>
                </div>
              ))
          ) : filtered.length > 0 ? (
            filtered.map((patient: any) => {
              const rawStatus = (patient as any).clinicalStatus as
                | string
                | undefined;
              const focus = (patient as any).currentFocus as
                | { title: string; area: string }
                | null
                | undefined;
              const rawAction = (patient as any).nextAction as
                | string
                | undefined;
              const pct =
                patient.promedioDesempeno != null
                  ? Math.round((patient.promedioDesempeno as number) * 100)
                  : null;

              const displayStatus = resolveStatus(rawStatus);
              const sc = STATUS[displayStatus];
              const action = shortAction(rawAction);

              const focusLine = focus
                ? [focus.area, focus.title].filter(Boolean).join(" – ")
                : (patient.diagnosis ? getDiagnosisLabel(patient.diagnosis) : null);

              return (
                <div
                  key={patient.id}
                  onClick={() => navigate(`/patients/${patient.id}`)}
                  className="bg-card rounded-xl border border-border/50 shadow-sm cursor-pointer group
                             hover:shadow-md hover:border-border transition-all duration-200
                             overflow-hidden flex"
                  style={{ borderLeft: `3px solid ${sc.stripe}` }}
                >
                  <div className="flex-1 p-4 min-w-0 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-baseline gap-2 min-w-0">
                        <span
                          className="font-semibold text-sm truncate leading-none"
                          style={{ color: BRAND_BLUE }}
                        >
                          {patient.name}
                        </span>
                        {formatEdadCorta((patient as any).fechaNacimiento, patient.age) && (
                          <span className="text-xs text-muted-foreground shrink-0 leading-none">
                            {formatEdadCorta((patient as any).fechaNacimiento, patient.age)}
                          </span>
                        )}
                      </div>
                      <span
                        className={`flex items-center gap-1 text-xs font-medium shrink-0 ${sc.label}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${sc.dot} shrink-0`}
                        />
                        {displayStatus}
                      </span>
                    </div>

                    {patient.profesionalNombre && (
                      <p className="text-xs text-muted-foreground/70 truncate leading-none flex items-center gap-1">
                        <UserCircle className="h-3 w-3 shrink-0" />
                        {patient.profesionalNombre}
                      </p>
                    )}

                    {focusLine && (
                      <p className="text-xs text-muted-foreground truncate leading-none">
                        {focusLine}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-0.5">
                      {pct !== null ? (
                        <>
                          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                background: sc.stripe,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                            {pct}%
                          </span>
                        </>
                      ) : (
                        <div className="flex-1" />
                      )}

                      {action && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/patients/${patient.id}`);
                          }}
                          className="shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold transition-all
                                     hover:opacity-80 active:scale-95"
                          style={{
                            color: BRAND_TEAL,
                            background: BRAND_TEAL + "18",
                          }}
                        >
                          {action}
                        </button>
                      )}

                      {!action && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 transition-colors" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center bg-card rounded-2xl border border-dashed border-border">
              <UserCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground/70">
                Sin resultados
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ajusta la búsqueda o agrega un nuevo paciente.
              </p>
              <button
                onClick={() => setShowNewPatient(true)}
                className="mt-4 px-4 py-2 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                style={{ background: BRAND_TEAL }}
              >
                Nuevo paciente
              </button>
            </div>
          )}
        </div>

        <section
          id="patients-archived-panel"
          role="tabpanel"
          aria-labelledby="patients-archived-tab"
          data-testid="panel-archived-patients"
          hidden={patientView !== "archived"}
          className={`space-y-3 ${patientView === "archived" ? "block" : "hidden"}`}
        >
          {loadingArchived ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="bg-card rounded-xl border border-border/50 p-4 space-y-3 shadow-sm opacity-60">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              ))}
            </div>
          ) : archivedPatientsError ? (
            <div
              role="alert"
              data-testid="status-archived-patients-error"
              className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-center"
            >
              <p className="text-sm text-rose-800">No se pudieron cargar los pacientes archivados.</p>
              <button
                type="button"
                data-testid="button-retry-archived-patients"
                onClick={() => refetchArchivedPatients()}
                className="mt-3 rounded-lg border border-rose-200 bg-card px-3 py-1.5 text-sm font-medium text-rose-800 hover:bg-rose-100"
              >
                Reintentar
              </button>
            </div>
          ) : filteredArchived.length === 0 ? (
            <div
              data-testid="status-no-archived-patients"
              className="py-8 text-center bg-muted/30 rounded-xl border border-dashed border-border"
            >
              <Archive className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {archivedPatients.length === 0
                  ? "No hay pacientes archivados."
                  : "No se encontraron pacientes con esa búsqueda."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredArchived.map((patient: any) => (
                <div
                  key={patient.id}
                  data-testid={`card-archived-patient-${patient.id}`}
                  className="bg-card/60 rounded-xl border border-border/40 shadow-sm overflow-hidden flex"
                  style={{ borderLeft: "3px solid #94a3b8" }}
                >
                  <div className="flex-1 p-4 min-w-0 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-baseline gap-2 min-w-0">
                        <span
                          data-testid={`text-archived-patient-name-${patient.id}`}
                          className="font-semibold text-sm truncate leading-none text-foreground"
                        >
                          {patient.name}
                        </span>
                        {formatEdadCorta(patient.fechaNacimiento, patient.age) && (
                          <span className="text-xs text-muted-foreground shrink-0 leading-none">
                            {formatEdadCorta(patient.fechaNacimiento, patient.age)}
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 bg-muted/60 px-2 py-0.5 rounded-full">
                        <Archive className="h-2.5 w-2.5" />
                        Archivado
                      </span>
                    </div>

                    {patient.profesionalNombre && (
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <UserCircle className="h-3 w-3 shrink-0" />
                        {patient.profesionalNombre}
                      </p>
                    )}

                    {patient.diagnosis && (
                      <p className="text-xs text-muted-foreground truncate">
                        {getDiagnosisLabel(patient.diagnosis)}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <button
                        type="button"
                        data-testid={`button-view-archived-history-${patient.id}`}
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                      >
                        Ver historial
                      </button>
                      <button
                        type="button"
                        data-testid={`button-restore-patient-${patient.id}`}
                        onClick={() => handleRestore(patient.id, patient.name)}
                        disabled={restoringId === patient.id}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <RotateCcw className="h-3 w-3" />
                        {restoringId === patient.id ? "Reactivando…" : "Reactivar"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <NuevoPacienteModal
        open={showNewPatient}
        onClose={() => setShowNewPatient(false)}
      />
    </AppLayout>
  );
}
