import { useState } from "react";
import { Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreatePatient, getListPatientsQueryKey,
} from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

  const [form, setForm] = useState({ name: "", age: "", fechaNacimiento: "", diagnosis: "" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const canSave = form.name.trim().length > 0;

  const handleClose = () => {
    setForm({ name: "", age: "", fechaNacimiento: "", diagnosis: "" });
    onClose();
  };

  const handleSave = async () => {
    if (!canSave) return;

    const body: Record<string, any> = {
      name: form.name.trim(),
      age: form.age ? parseInt(form.age) : undefined,
      fechaNacimiento: form.fechaNacimiento || undefined,
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
          const status = err?.response?.status ?? err?.status;
          if (status === 401) {
            toast({
              title: "Tu sesión expiró",
              description: "Inicia sesión de nuevo. Tus datos se conservaron en el formulario.",
              variant: "destructive",
            });
            return;
          }
          const msg =
            err?.response?.data?.error ??
            err?.data?.error ??
            err?.message ??
            "Error al guardar el paciente";
          toast({ title: "Error al guardar", description: msg, variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && !createPatient.isPending && handleClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 max-h-[90vh] overflow-hidden">
        <div className="flex flex-col max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-3 shrink-0">
            <DialogTitle className="font-display text-xl flex items-center gap-2 text-primary">
              <Plus className="h-5 w-5 text-accent" />
              Nuevo paciente
            </DialogTitle>
            <DialogDescription>Completa los datos básicos del paciente.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="np-name" className="text-sm font-medium text-foreground/80">
                Nombre <span className="text-primary/60">*</span>
              </label>
              <Input
                id="np-name"
                placeholder="Nombre completo"
                value={form.name}
                onChange={e => set("name", e.target.value)}
                className="bg-muted/50"
                autoComplete="off"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="np-fecha-nac" className="text-sm font-medium text-foreground/80">
                Fecha de nacimiento <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                id="np-fecha-nac"
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={form.fechaNacimiento}
                onChange={e => set("fechaNacimiento", e.target.value)}
                className="bg-muted/50 max-w-[12rem]"
              />
              <p className="text-[11px] text-muted-foreground">
                Si la cargas, la edad se calcula sola y se mantiene siempre actualizada.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="np-age" className="text-sm font-medium text-foreground/80">
                Edad <span className="text-muted-foreground font-normal">(si no conoces la fecha de nacimiento)</span>
              </label>
              <Input
                id="np-age"
                type="number"
                inputMode="numeric"
                placeholder="Años"
                min={0}
                max={120}
                value={form.age}
                onChange={e => set("age", e.target.value)}
                className="bg-muted/50 max-w-[10rem]"
                disabled={!!form.fechaNacimiento}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="np-diagnosis" className="text-sm font-medium text-foreground/80">
                Diagnóstico <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Textarea
                id="np-diagnosis"
                placeholder="Escribe libremente el diagnóstico o motivo de consulta"
                value={form.diagnosis}
                onChange={e => set("diagnosis", e.target.value)}
                rows={3}
                className="bg-muted/50 text-sm w-full"
                autoComplete="off"
              />
              <p className="text-[11px] text-muted-foreground">
                Texto libre — puedes escribir lo que necesites.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-border/50 bg-background">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
