import { useState } from "react";
import { Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreatePatient, useListProfessionals, getListPatientsQueryKey,
} from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const BRAND_BLUE = "#0E3A6D";
const BRAND_TEAL = "#20C7C7";

export function NuevoPacienteModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient  = useQueryClient();
  const { toast }    = useToast();
  const createPatient = useCreatePatient();
  const { data: professionals = [] } = useListProfessionals();

  const [form, setForm] = useState({ name: "", age: "", diagnosis: "", profesionalNombre: "" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const canSave = form.name.trim().length > 0;

  const handleClose = () => {
    setForm({ name: "", age: "", diagnosis: "", profesionalNombre: "" });
    onClose();
  };

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
          <DialogTitle className="font-display text-xl flex items-center gap-2" style={{ color: BRAND_BLUE }}>
            <Plus className="h-5 w-5" style={{ color: BRAND_TEAL }} />
            Nuevo paciente
          </DialogTitle>
          <DialogDescription>Completa los datos básicos del paciente.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
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

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Diagnóstico <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <Input
              placeholder="Diagnóstico o motivo de consulta"
              value={form.diagnosis}
              onChange={e => set("diagnosis", e.target.value)}
              className="bg-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Profesional asignado <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
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
          <Button variant="outline" className="flex-1" onClick={handleClose} disabled={createPatient.isPending}>
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
