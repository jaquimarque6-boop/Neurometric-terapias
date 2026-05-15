import { useState } from "react";
import { Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreatePatient, getListPatientsQueryKey,
} from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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

  const [form, setForm] = useState({ name: "", age: "", diagnosis: "" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const canSave = form.name.trim().length > 0;

  const handleClose = () => {
    setForm({ name: "", age: "", diagnosis: "" });
    onClose();
  };

  const handleSave = async () => {
    if (!canSave) return;

    const body: Record<string, any> = {
      name: form.name.trim(),
      age: form.age ? parseInt(form.age) : undefined,
      diagnosis: form.diagnosis.trim() || undefined,
    };

    createPatient.mutate(
      { data: body as any },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
          toast({ title: "Paciente registrado correctamente" });
          handleClose();
        },
        onError: (err: any) => {
          const msg = err?.message ?? err?.data?.error ?? "Error al guardar el paciente";
          toast({ title: "Error al guardar", description: msg, variant: "destructive" });
        },
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
              Nombre <span className="text-primary/60">*</span>
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
        </div>

        <div className="flex gap-3 pt-2 border-t border-border/50">
          <Button variant="outline" className="flex-1" onClick={handleClose} disabled={createPatient.isPending}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-primary text-white hover:bg-primary/90 font-semibold"
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
