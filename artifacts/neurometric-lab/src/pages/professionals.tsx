import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  Stethoscope, Plus, Mail, ShieldCheck, Users as UsersIcon,
  Phone, Search, X, Cake, ClipboardList, CalendarDays, ChevronRight,
} from "lucide-react";
import {
  useListProfessionals,
  useCreateProfessional,
  useListPatients,
  useListPatientProfessionals,
  getListProfessionalsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const ESPECIALIDADES = [
  "Fonoaudiología",
  "Psicología Infantil",
  "Neuropsicología",
  "Terapia Ocupacional",
  "Psicopedagogía",
  "Logopedia",
  "Otra especialidad",
];

function statusBadge(status: string) {
  if (status === "active") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  return "bg-muted text-muted-foreground border-border";
}

function statusLabel(status: string) {
  return status === "active" ? "Activo" : "Inactivo";
}

function normalize(s: string | null | undefined) {
  return (s ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatDate(iso?: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return null;
  }
}

type Professional = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  specialty?: string | null;
  license?: string | null;
  status?: string | null;
  patientCount?: number;
};

export default function Professionals() {
  const { data: professionals, isLoading } = useListProfessionals();
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);

  const matches = useMemo<Professional[]>(() => {
    if (!professionals) return [];
    const q = normalize(query.trim());
    if (!q) return [];
    return (professionals as Professional[]).filter(p =>
      normalize(p.name).includes(q) ||
      normalize(p.email).includes(q) ||
      normalize(p.specialty).includes(q)
    );
  }, [professionals, query]);

  // Auto-select when there's exactly one match (guarded to avoid redundant
  // state writes on every render).
  useEffect(() => {
    if (query.trim() && matches.length === 1 && selectedId !== matches[0].id) {
      setSelectedId(matches[0].id);
    }
  }, [query, matches, selectedId]);

  // If selected pro disappears from current matches (e.g. cleared), keep it
  // but scroll into view when newly selected.
  useEffect(() => {
    if (selectedId && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedId]);

  const selectedPro: Professional | null = useMemo(() => {
    if (!selectedId || !professionals) return null;
    return (professionals as Professional[]).find(p => p.id === selectedId) ?? null;
  }, [selectedId, professionals]);

  const clearSelection = () => {
    setSelectedId(null);
    setQuery("");
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 sm:p-6 rounded-2xl border border-border/50 shadow-sm">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-primary" />
              Equipo Clínico
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {professionals?.length ?? 0} profesional{professionals?.length !== 1 ? "es" : ""} registrado{professionals?.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-primary text-white hover:bg-primary/90 shadow-sm border border-primary/20 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar profesional
          </Button>
        </div>

        {/* Search */}
        <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border/50 shadow-sm">
          <label className="text-sm font-semibold text-foreground/90 mb-2 block">
            Buscar profesional
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Escribí un nombre, correo o especialidad…"
              className="pl-9 pr-9 h-11 bg-background border-border focus-visible:border-primary"
              aria-label="Buscar profesional"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setSelectedId(null); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Live matches list when typing */}
          {query.trim() && (
            <div className="mt-3">
              {isLoading ? (
                <div className="space-y-2">
                  {Array(2).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-lg" />
                  ))}
                </div>
              ) : matches.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3 px-1">
                  No se encontraron profesionales con "{query}".
                </p>
              ) : (
                <ul className="divide-y divide-border/60 border border-border/60 rounded-lg overflow-hidden bg-background">
                  {matches.slice(0, 8).map(pro => {
                    const isSelected = pro.id === selectedId;
                    return (
                      <li key={pro.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(pro.id)}
                          className={`w-full text-left px-3.5 py-2.5 flex items-center gap-3 transition hover:bg-muted/60 ${
                            isSelected ? "bg-primary/10" : ""
                          }`}
                        >
                          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                            {pro.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground leading-tight truncate">{pro.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {pro.specialty}{pro.email ? ` · ${pro.email}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-foreground/70 shrink-0">
                            <UsersIcon className="h-3.5 w-3.5 text-primary" />
                            <span className="font-semibold text-primary">{pro.patientCount ?? 0}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Selected professional → patients section */}
        {selectedPro && (
          <div ref={detailRef}>
            <ProfessionalPatientsPanel
              pro={selectedPro}
              onClose={clearSelection}
            />
          </div>
        )}

        {/* Default grid when no search/selection */}
        {!query.trim() && !selectedPro && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="border-border/50 shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-16 rounded-lg" />
                  </CardContent>
                </Card>
              ))
            ) : professionals && professionals.length > 0 ? (
              (professionals as Professional[]).map(pro => (
                <Card
                  key={pro.id}
                  className="border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                >
                  <CardContent className="p-0">
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between mb-5 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-bold text-lg font-display shadow-md shadow-primary/20 shrink-0">
                            {pro.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-foreground leading-tight truncate">{pro.name}</h3>
                            <p className="text-sm font-medium text-primary mt-0.5 truncate">{pro.specialty}</p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs shrink-0 ${statusBadge(pro.status ?? "active")}`}
                        >
                          {statusLabel(pro.status ?? "active")}
                        </Badge>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2.5 text-sm text-foreground/70">
                          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate">{pro.email}</span>
                        </div>
                        {pro.phone && (
                          <div className="flex items-center gap-2.5 text-sm text-foreground/70">
                            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{pro.phone}</span>
                          </div>
                        )}
                        {pro.license && (
                          <div className="flex items-center gap-2.5 text-sm text-foreground/70">
                            <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>Matrícula: {pro.license}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedId(pro.id)}
                      className="w-full px-5 sm:px-6 py-3.5 bg-muted/60 border-t border-border/50 flex items-center justify-between hover:bg-muted transition text-left group/footer"
                      aria-label={`Ver pacientes de ${pro.name}`}
                    >
                      <div className="flex items-center gap-1.5 text-sm">
                        <UsersIcon className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-primary">{pro.patientCount ?? 0}</span>
                        <span className="text-foreground/70">
                          paciente{(pro.patientCount ?? 0) !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-primary inline-flex items-center gap-1">
                        Ver
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-card rounded-2xl border border-dashed border-border">
                <Stethoscope className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="font-medium text-foreground/70">No hay profesionales registrados</p>
                <p className="text-muted-foreground text-sm mt-1">Agrega el primer miembro del equipo clínico.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <ProfessionalForm onClose={() => setShowForm(false)} />
      )}
    </AppLayout>
  );
}

function ProfessionalPatientsPanel({
  pro, onClose,
}: { pro: Professional; onClose: () => void }) {
  const [, navigate] = useLocation();
  const { data: allPatients, isLoading: loadingPatients } = useListPatients();
  const { data: links, isLoading: loadingLinks } = useListPatientProfessionals({ professionalId: pro.id });

  // Source of truth = patient_professionals links (same table the card's
  // `patientCount` is computed from). Hydrate each link with patient details
  // from /api/patients. Deduped by patientId.
  const patients = useMemo(() => {
    if (!allPatients || !links) return [];
    const byId = new Map<number, any>();
    for (const p of allPatients as any[]) byId.set(p.id, p);
    const seen = new Set<number>();
    const out: any[] = [];
    for (const l of links as any[]) {
      if (seen.has(l.patientId)) continue;
      seen.add(l.patientId);
      const p = byId.get(l.patientId);
      if (p) out.push(p);
    }
    return out.sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? "", "es", { sensitivity: "base" })
    );
  }, [allPatients, links]);

  const loading = loadingPatients || loadingLinks;
  const total = patients.length;

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-bold text-base font-display shadow-md shadow-primary/20 shrink-0">
              {pro.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-lg text-foreground leading-tight truncate">
                Pacientes de {pro.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {pro.specialty}
                {pro.email && <> · <span className="text-foreground/70">{pro.email}</span></>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-semibold">
              <UsersIcon className="h-3.5 w-3.5 mr-1" />
              {total} paciente{total !== 1 ? "s" : ""}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="bg-background border-border text-foreground hover:bg-muted"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Cerrar
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="p-4 sm:p-5">
          {loading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : total === 0 ? (
            <div className="py-12 text-center">
              <UsersIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="font-medium text-foreground/70">
                Este profesional todavía no tiene pacientes cargados.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {patients.map((p: any) => {
                const created = formatDate(p.createdAt);
                return (
                  <li
                    key={p.id}
                    className="p-3.5 sm:p-4 rounded-lg border border-border/60 bg-card hover:border-primary/30 hover:shadow-sm transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground leading-tight">
                          {p.name}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/70">
                          {p.age != null && (
                            <span className="inline-flex items-center gap-1">
                              <Cake className="h-3.5 w-3.5 text-muted-foreground" />
                              {p.age} año{p.age !== 1 ? "s" : ""}
                            </span>
                          )}
                          {p.diagnosis && (
                            <span className="inline-flex items-center gap-1 max-w-full">
                              <ClipboardList className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">{p.diagnosis}</span>
                            </span>
                          )}
                          {created && (
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {created}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/nueva-sesion?patientId=${p.id}`)}
                        className="bg-primary text-white hover:bg-primary/90 border border-primary/20 shadow-sm w-full sm:w-auto shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Agregar sesión
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-5 sm:px-6 py-2.5 border-t border-border/50 bg-muted/40 text-xs text-muted-foreground">
          Solo lectura — no se puede editar ni eliminar pacientes desde acá.
        </div>
      </CardContent>
    </Card>
  );
}

function ProfessionalForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createPro = useCreateProfessional();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    license: "",
    status: "active" as "active" | "inactive",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const errors: Record<string, string> = {};
  if (form.name.trim().length < 2) errors.name = "El nombre debe tener al menos 2 caracteres";
  if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.email = "Correo electrónico inválido";
  if (form.specialty.trim().length < 2) errors.specialty = "La especialidad es requerida";
  const canSave = Object.keys(errors).length === 0;

  const handleSubmit = () => {
    if (!canSave) return;
    createPro.mutate(
      { data: { name: form.name, email: form.email, phone: form.phone || undefined, specialty: form.specialty, license: form.license || undefined, status: form.status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProfessionalsQueryKey() });
          toast({ title: "Profesional agregado", description: "El nuevo miembro fue registrado en el equipo." });
          onClose();
        },
        onError: (e: any) => {
          toast({ title: "Error", description: e.message || "No se pudo agregar el profesional.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Nuevo profesional
          </DialogTitle>
          <DialogDescription>
            Registra un nuevo miembro del equipo clínico en la plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Nombre completo *</label>
            <Input
              value={form.name}
              onChange={e => set("name", e.target.value)}
              placeholder="Dra. María García"
              className={`bg-background border-border ${errors.name && form.name ? "border-red-300" : ""}`}
            />
            {errors.name && form.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Especialidad *</label>
            <Select value={form.specialty} onValueChange={v => set("specialty", v)}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Seleccionar especialidad..." />
              </SelectTrigger>
              <SelectContent>
                {ESPECIALIDADES.map(e => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.specialty && form.specialty.length > 0 && (
              <p className="text-xs text-red-500">{errors.specialty}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Correo electrónico *</label>
            <Input
              type="email"
              value={form.email}
              onChange={e => set("email", e.target.value)}
              placeholder="profesional@neurometric.com"
              className={`bg-background border-border ${errors.email && form.email ? "border-red-300" : ""}`}
            />
            {errors.email && form.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Teléfono</label>
              <Input
                value={form.phone}
                onChange={e => set("phone", e.target.value)}
                placeholder="+54 11 5555-0000"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Matrícula</label>
              <Input
                value={form.license}
                onChange={e => set("license", e.target.value)}
                placeholder="MP-12345"
                className="bg-background border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Estado</label>
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 bg-background border-border text-foreground hover:bg-muted"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-primary text-white hover:bg-primary/90 border border-primary/20"
              disabled={!form.name || !form.email || !form.specialty || createPro.isPending}
              onClick={handleSubmit}
            >
              {createPro.isPending ? "Guardando..." : "Registrar profesional"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
