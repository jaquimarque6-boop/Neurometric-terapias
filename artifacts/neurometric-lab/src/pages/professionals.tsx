import { useState } from "react";
import {
  Stethoscope, Plus, Mail, ShieldCheck, Users as UsersIcon,
  Phone, Pencil, Trash2
} from "lucide-react";
import {
  useListProfessionals,
  useCreateProfessional,
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

export default function Professionals() {
  const { data: professionals, isLoading } = useListProfessionals();
  const [showForm, setShowForm] = useState(false);

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
          ) : professionals && professionals.length > 0 ? (
            professionals.map(pro => (
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

                  <div className="px-6 py-3.5 bg-muted/50 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm text-foreground/70">
                      <UsersIcon className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-primary">{(pro as any).patientCount ?? 0}</span>
                      <span className="text-muted-foreground">paciente{(pro as any).patientCount !== 1 ? "s" : ""}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">ID #{pro.id}</span>
                  </div>
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
      </div>

      {showForm && (
        <ProfessionalForm onClose={() => setShowForm(false)} />
      )}
    </AppLayout>
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
