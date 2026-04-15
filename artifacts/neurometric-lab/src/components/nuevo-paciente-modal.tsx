import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreatePatient, getListPatientsQueryKey,
} from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type ProfUser = { id: number; name: string; specialty: string | null; role: string };

export function NuevoPacienteModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient   = useQueryClient();
  const { toast }     = useToast();
  const createPatient = useCreatePatient();

  const [professionals, setProfessionals] = useState<ProfUser[]>([]);
  const [form, setForm] = useState({ name: "", age: "", diagnosis: "", assignedProfessionalId: "" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Fetch user-based professionals list
  useEffect(() => {
    if (!open) return;
    fetch("/api/users/professionals", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(setProfessionals)
      .catch(() => {});
  }, [open]);

  const canSave = form.name.trim().length > 0;

  const handleClose = () => {
    setForm({ name: "", age: "", diagnosis: "", assignedProfessionalId: "" });
    onClose();
  };

  const handleSave = async () => {
    if (!canSave) return;

    const body: Record<string, any> = {
      name: form.name.trim(),
      age: form.age ? parseInt(form.age) : undefined,
      diagnosis: form.diagnosis.trim() || undefined,
    };

    if (form.assignedProfessionalId && form.assignedProfessionalId !== "__none__") {
      body.assignedProfessionalId = parseInt(form.assignedProfessionalId);
    }

    createPatient.mutate(
      { data: body as any },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
          toast({ title: "Paciente registrado correctamente" });
          handleClose();
        },
        onError: () => toast({ title: "Error al guardar", variant: "destructive" }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2 text-primary">
            <Plus className="h-5 w-5 text-accent" />
            Nuevo paciente
          </DialogTitle>
          <DialogDescription>Completa los datos básicos del paciente.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/80">
              Nombre <span className="text-red-400">*</span>
            </label>
            <Input
              placeholder="Nombre completo"
              value={form.name}
              onChange={e => set("name", e.target.value)}
              className="bg-muted/50"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/80">Edad</label>
            <Input
              type="number"
              placeholder="Años"
              min={0}
              max={120}
              value={form.age}
              onChange={e => set("age", e.target.value)}
              className="bg-muted/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/80">
              Diagnóstico <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <Input
              placeholder="Diagnóstico o motivo de consulta"
              value={form.diagnosis}
              onChange={e => set("diagnosis", e.target.value)}
              className="bg-muted/50"
            />
          </div>

          {/* Anyone can pick a professional */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/80">Profesional asignado</label>
            <Select
              value={form.assignedProfessionalId}
              onValueChange={v => set("assignedProfessionalId", v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="bg-muted/50">
                <SelectValue placeholder="Sin asignar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin asignar</SelectItem>
                {professionals.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}{p.specialty ? ` — ${p.specialty}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 pt-2 border-t border-border/50">
          <Button variant="outline" className="flex-1" onClick={handleClose} disabled={createPatient.isPending}>
            Cancelar
          </Button>
          <Button
            className="flex-1 text-white font-semibold bg-gradient-to-br from-accent to-accent/80"
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
