import { useMemo, useState } from "react";
import {
  Stethoscope, Plus, Mail, ShieldCheck, Users as UsersIcon,
  Phone, Search, X, Cake, ClipboardList, CalendarDays,
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

type ProfessionalLite = {
  id: number;
  name: string;
  email?: string | null;
  specialty?: string | null;
};

export default function Professionals() {
  const { data: professionals, isLoading } = useListProfessionals();
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedPro, setSelectedPro] = useState<ProfessionalLite | null>(null);

  const filtered = useMemo(() => {
    if (!professionals) return [];
    const q = normalize(query.trim());
    if (!q) return professionals;
    return professionals.filter((p: any) =>
      normalize(p.name).includes(q) ||
      normalize(p.email).includes(q) ||
      normalize(p.specialty).includes(q)
    );
  }, [professionals, query]);

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border/50 shadow-sm">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-primary" />
              Equipo Clínico
            </h1>
            <p className="text-muted-foreground mt-1">
              {professionals?.length ?? 0} profesional{professionals?.length !== 1 ? "es" : ""} registrado{professionals?.length !== 1 ? "s" : ""}
              {query.trim() && professionals && (
                <span className="ml-2 text-xs text-foreground/60">
                  · mostrando {filtered.length}
                </span>
              )}
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-primary hover:bg-primary/90 text-white shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar profesional
          </Button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nombre, correo o especialidad…"
            className="pl-9 pr-9 bg-card border-border/50"
            aria-label="Buscar profesionales"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          ) : filtered && filtered.length > 0 ? (
            filtered.map((pro: any) => {
              const count = pro.patientCount ?? 0;
              return (
                <Card
                  key={pro.id}
                  className="border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                >
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-bold text-lg font-display shadow-md shadow-primary/20">
                            {pro.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground leading-tight">{pro.name}</h3>
                            <p className="text-sm font-medium text-primary mt-0.5">{pro.specialty}</p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusBadge(pro.status ?? "active")}`}
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
                      onClick={() => setSelectedPro({
                        id: pro.id,
                        name: pro.name,
                        email: pro.email,
                        specialty: pro.specialty,
                      })}
                      className="w-full px-6 py-3.5 bg-muted/50 border-t border-border/50 flex items-center justify-between hover:bg-muted transition group/footer text-left"
                      aria-label={`Ver pacientes de ${pro.name}`}
                    >
                      <div className="flex items-center gap-1.5 text-sm text-foreground/70">
                        <UsersIcon className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-primary">{count}</span>
                        <span className="text-muted-foreground group-hover/footer:text-foreground/80 transition">
                          paciente{count !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs text-primary/70 ml-1 opacity-0 group-hover/footer:opacity-100 transition">
                          · ver lista
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">ID #{pro.id}</span>
                    </button>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center bg-card rounded-2xl border border-dashed border-border">
              <Stethoscope className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="font-medium text-foreground/70">
                {query.trim()
                  ? "No se encontraron profesionales con ese criterio"
                  : "No hay profesionales registrados"}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {query.trim()
                  ? "Probá con otro nombre, correo o especialidad."
                  : "Agrega el primer miembro del equipo clínico."}
              </p>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <ProfessionalForm onClose={() => setShowForm(false)} />
      )}

      {selectedPro && (
        <ProfessionalPatientsModal
          pro={selectedPro}
          onClose={() => setSelectedPro(null)}
        />
      )}
    </AppLayout>
  );
}

function ProfessionalPatientsModal({
  pro, onClose,
}: { pro: ProfessionalLite; onClose: () => void }) {
  const { data: allPatients, isLoading: loadingPatients } = useListPatients();
  const { data: links, isLoading: loadingLinks } = useListPatientProfessionals({ professionalId: pro.id });
  const [query, setQuery] = useState("");

  // Source of truth = patient_professionals links, identical to the card's
  // `patientCount` (computed in /api/professionals as count of those rows for
  // this professional). We hydrate each link with the full patient record from
  // /api/patients (admin gets all). Deduped by patientId to avoid showing the
  // same person twice if a duplicate link row ever exists.
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

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return patients;
    return patients.filter(p =>
      normalize(p.name).includes(q) ||
      normalize(p.diagnosis).includes(q)
    );
  }, [patients, query]);

  const loading = loadingPatients || loadingLinks;
  const total = patients.length;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-primary" />
            Pacientes de {pro.name}
          </DialogTitle>
          <DialogDescription className="flex flex-col sm:flex-row sm:items-center sm:gap-3 mt-1">
            {pro.specialty && <span>{pro.specialty}</span>}
            <span className="text-foreground/70">
              <span className="font-semibold text-primary">{total}</span> paciente{total !== 1 ? "s" : ""} asignado{total !== 1 ? "s" : ""}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Inner search */}
        <div className="px-6 pt-4 pb-3 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar paciente por nombre o diagnóstico…"
              className="pl-9 pr-9 bg-muted/50 border-border/50"
              aria-label="Buscar pacientes de este profesional"
              disabled={loading || total === 0}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scroll list */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : total === 0 ? (
            <div className="py-16 text-center">
              <UsersIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="font-medium text-foreground/70">
                Este profesional todavía no tiene pacientes cargados.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-foreground/70">
                Ningún paciente coincide con “{query}”.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((p: any) => {
                const created = formatDate(p.createdAt);
                return (
                  <li
                    key={p.id}
                    className="p-3.5 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground leading-tight truncate">
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
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70 shrink-0 mt-1">
                        #{p.id}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-6 py-3 border-t border-border/50 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <span>Solo lectura</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
              className={`bg-muted/50 ${errors.name && form.name ? "border-red-300" : ""}`}
            />
            {errors.name && form.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Especialidad *</label>
            <Select value={form.specialty} onValueChange={v => set("specialty", v)}>
              <SelectTrigger className="bg-muted/50">
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
              className={`bg-muted/50 ${errors.email && form.email ? "border-red-300" : ""}`}
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
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Matrícula</label>
              <Input
                value={form.license}
                onChange={e => set("license", e.target.value)}
                placeholder="MP-12345"
                className="bg-muted/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Estado</label>
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
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
