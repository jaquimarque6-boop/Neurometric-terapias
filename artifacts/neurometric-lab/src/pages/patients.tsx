import { useState } from "react";
import { useLocation } from "wouter";
import {
  Users, Search, UserCircle, ChevronRight, Calendar, User, Activity, ArrowLeft, Plus, X
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListPatients, useCreatePatient, useListProfessionals,
  getListPatientsQueryKey,
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const BRAND_BLUE = "#0E3A6D";
const BRAND_TEAL = "#20C7C7";

function semaforoColor(semaforo?: string | null) {
  if (!semaforo) return { dot: "bg-slate-300", badge: "bg-slate-100 text-slate-600" };
  if (semaforo.includes("🟢")) return { dot: "bg-emerald-400", badge: "bg-emerald-100 text-emerald-700" };
  if (semaforo.includes("🟡")) return { dot: "bg-yellow-400", badge: "bg-yellow-100 text-yellow-700" };
  if (semaforo.includes("🔴")) return { dot: "bg-red-400", badge: "bg-red-100 text-red-700" };
  return { dot: "bg-slate-300", badge: "bg-slate-100 text-slate-600" };
}

function progressLabel(semaforo?: string | null) {
  if (!semaforo) return "Sin datos";
  if (semaforo.includes("🟢")) return "Buen progreso";
  if (semaforo.includes("🟡")) return "En progreso";
  if (semaforo.includes("🔴")) return "Requiere atención";
  return semaforo;
}

function NuevoPacienteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createPatient = useCreatePatient();
  const { data: professionals = [] } = useListProfessionals();

  const [form, setForm] = useState({
    name: "", age: "", diagnosis: "", profesionalNombre: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const canSave = form.name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    createPatient.mutate(
      {
        data: {
          name: form.name.trim(),
          age: form.age ? parseInt(form.age) : undefined,
          diagnosis: form.diagnosis.trim() || undefined,
          profesionalNombre: form.profesionalNombre || undefined,
        } as any,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
          toast({ title: "Paciente registrado correctamente" });
          setForm({ name: "", age: "", diagnosis: "", profesionalNombre: "" });
          onClose();
        },
        onError: () => toast({ title: "Error al guardar", variant: "destructive" }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2" style={{ color: BRAND_BLUE }}>
            <Plus className="h-5 w-5" style={{ color: BRAND_TEAL }} />
            Nuevo paciente
          </DialogTitle>
          <DialogDescription>Completa los datos básicos del paciente.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Nombre <span className="text-red-400">*</span>
            </label>
            <Input
              placeholder="Nombre completo"
              value={form.name}
              onChange={e => set("name", e.target.value)}
              className="bg-slate-50"
              autoFocus
            />
          </div>

          {/* Edad */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Edad</label>
            <Input
              type="number"
              placeholder="Años"
              min={0}
              max={120}
              value={form.age}
              onChange={e => set("age", e.target.value)}
              className="bg-slate-50"
            />
          </div>

          {/* Diagnóstico */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Diagnóstico <span className="text-slate-400 font-normal">(opcional)</span></label>
            <Input
              placeholder="Diagnóstico o motivo de consulta"
              value={form.diagnosis}
              onChange={e => set("diagnosis", e.target.value)}
              className="bg-slate-50"
            />
          </div>

          {/* Profesional */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Profesional asignado <span className="text-slate-400 font-normal">(opcional)</span></label>
            <Select
              value={form.profesionalNombre}
              onValueChange={v => set("profesionalNombre", v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="bg-slate-50">
                <SelectValue placeholder="Sin asignar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin asignar</SelectItem>
                {(professionals as any[]).map((p: any) => (
                  <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={createPatient.isPending}>
            Cancelar
          </Button>
          <Button
            className="flex-1 text-white font-semibold"
            style={{ background: canSave ? BRAND_TEAL : undefined }}
            disabled={!canSave || createPatient.isPending}
            onClick={handleSave}
          >
            {createPatient.isPending ? "Guardando..." : "Guardar paciente"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [, navigate] = useLocation();
  const { data: patients, isLoading } = useListPatients();

  const filtered = (patients ?? []).filter(p => {
    const q = searchTerm.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) ||
      (p.diagnosis ?? "").toLowerCase().includes(q) ||
      (p.profesionalNombre ?? "").toLowerCase().includes(q) ||
      (p.franjaEtaria ?? "").includes(q);
  });

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate("/");
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">

        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors w-fit group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Volver
        </button>

        {/* Header card */}
        <div className="bg-white p-6 rounded-2xl border border-border/50 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold flex items-center gap-2" style={{ color: BRAND_BLUE }}>
                <Users className="h-6 w-6" style={{ color: BRAND_TEAL }} />
                Pacientes
              </h1>
              <p className="text-slate-500 mt-1">
                {patients?.length ?? 0} paciente{patients?.length !== 1 ? "s" : ""} registrados
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar pacientes..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-56 bg-slate-50 border-slate-200 focus-visible:ring-primary/20"
                />
              </div>

              <button
                onClick={() => setShowNewPatient(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm text-white shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.97] whitespace-nowrap"
                style={{ background: BRAND_TEAL }}
              >
                <Plus className="h-4 w-4" />
                Nuevo paciente
              </button>
            </div>
          </div>
        </div>

        {/* Patient grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="overflow-hidden border-border/50 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-20 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))
          ) : filtered.length > 0 ? (
            filtered.map(patient => {
              const sc = semaforoColor(patient.semaforo);
              const pct = patient.promedioDesempeno != null
                ? `${Math.round(patient.promedioDesempeno * 100)}%`
                : null;
              return (
                <Card
                  key={patient.id}
                  className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer"
                  style={{ borderColor: undefined }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = BRAND_TEAL + "66")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "")}
                  onClick={() => navigate(`/patients/${patient.id}`)}
                >
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-5">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-14 w-14 rounded-full flex items-center justify-center font-bold text-xl font-display ring-4 ring-white shadow-sm text-white"
                            style={{ background: BRAND_TEAL }}
                          >
                            {patient.name.charAt(0)}
                          </div>
                          <div>
                            <h3
                              className="font-bold text-lg leading-tight transition-colors"
                              style={{ color: BRAND_BLUE }}
                            >
                              {patient.name}
                            </h3>
                            {patient.age && (
                              <p className="text-sm text-slate-500">{patient.age} años</p>
                            )}
                          </div>
                        </div>
                        {patient.semaforo && (
                          <Badge variant="secondary" className={`${sc.badge} border-0 text-xs font-medium`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} mr-1.5 inline-block`} />
                            {progressLabel(patient.semaforo)}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2.5 text-sm">
                        {patient.diagnosis && (
                          <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <Activity className="h-4 w-4 shrink-0 mt-0.5" style={{ color: BRAND_TEAL }} />
                            <span className="text-slate-700 line-clamp-2">{patient.diagnosis}</span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          {patient.profesionalNombre && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="truncate text-xs">{patient.profesionalNombre}</span>
                            </div>
                          )}
                          {patient.franjaEtaria && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="text-xs">Franja {patient.franjaEtaria}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {pct && (
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs text-slate-500 font-medium">Promedio desempeño</span>
                            <span className="text-xs font-bold text-slate-700">{pct}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: pct, background: BRAND_TEAL }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>{(patient as any).totalRegistros ?? 0} registros</span>
                      <span className="flex items-center gap-1 font-medium group-hover:gap-2 transition-all" style={{ color: BRAND_TEAL }}>
                        Ver perfil <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <UserCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900">Sin resultados</h3>
              <p className="text-slate-500 mt-1">Intenta ajustar la búsqueda o agrega un nuevo paciente.</p>
              <button
                onClick={() => setShowNewPatient(true)}
                className="mt-4 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                style={{ background: BRAND_TEAL }}
              >
                <Plus className="h-4 w-4 inline mr-1.5" />
                Nuevo paciente
              </button>
            </div>
          )}
        </div>
      </div>

      <NuevoPacienteModal open={showNewPatient} onClose={() => setShowNewPatient(false)} />
    </AppLayout>
  );
}
