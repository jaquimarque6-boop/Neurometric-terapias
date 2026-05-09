import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AREA_SUBAREAS } from "@/utils/goal-code-generator";
import { API_BASE } from "@/lib/api";

const CATEGORIAS = [
  "lenguaje", "habla", "cognición", "pragmática",
  "voz", "lectoescritura", "deglución", "motricidad oral", "audición",
];

type CreatedLibraryGoal = {
  id: number;
  idObjetivo: string;
  nombreObjetivo: string;
  areaClinica: string | null;
  area: string;
  subarea: string | null;
  franjaEtaria: string | null;
  franjaEtariaMin: number | null;
  franjaEtariaMax: number | null;
  definicionOperativa: string | null;
  nivelDificultad: string;
  isCustom: boolean;
  [key: string]: unknown;
};

type Props = {
  onClose: () => void;
  onCreated: (goal: CreatedLibraryGoal) => void;
};

export function CustomGoalDialog({ onClose, onCreated }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nombreObjetivo: "",
    areaClinica: "lenguaje",
    subarea: "",
    descripcion: "",
    franjaEtariaMin: "",
    franjaEtariaMax: "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const subareaOptions = AREA_SUBAREAS[form.areaClinica] ?? [];

  const franjaMin = form.franjaEtariaMin !== "" ? parseInt(form.franjaEtariaMin) : null;
  const franjaMax = form.franjaEtariaMax !== "" ? parseInt(form.franjaEtariaMax) : null;

  const handleSave = async () => {
    if (!form.nombreObjetivo.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/goal-library`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreObjetivo: form.nombreObjetivo.trim(),
          area: form.areaClinica,
          areaClinica: form.areaClinica,
          subarea: form.subarea || null,
          franjaEtaria: (franjaMin != null && franjaMax != null) ? `${franjaMin}-${franjaMax}` : null,
          franjaEtariaMin: franjaMin,
          franjaEtariaMax: franjaMax,
          definicionOperativa: form.descripcion || null,
          nivelDificultad: "básico",
          estadoBanco: "sesion",
          isCustom: true,
        }),
      });
      if (!res.ok) throw new Error("Error al crear objetivo");
      const created: CreatedLibraryGoal = await res.json();
      toast({ title: "Objetivo creado", description: `"${created.nombreObjetivo}" agregado a la sesión.` });
      onCreated(created);
    } catch (e: any) {
      toast({ title: "Error al crear objetivo", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" /> Nuevo objetivo personalizado
          </DialogTitle>
          <DialogDescription>
            Crea un objetivo para esta sesión. Puedes guardarlo en el banco después si quieres reutilizarlo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre del objetivo *</label>
            <Input
              value={form.nombreObjetivo}
              onChange={e => set("nombreObjetivo", e.target.value)}
              placeholder="Ej: Ampliar vocabulario en contexto funcional..."
              className="bg-muted/50"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Área clínica</label>
              <Select
                value={form.areaClinica}
                onValueChange={v => setForm(f => ({ ...f, areaClinica: v, subarea: "" }))}
              >
                <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(c => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Subárea</label>
              <Select
                value={form.subarea}
                onValueChange={v => set("subarea", v)}
                disabled={subareaOptions.length === 0}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  {subareaOptions.map((s: string) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Edad / franja etaria</label>
            <div className="flex items-center gap-2">
              <Input
                type="number" min={0} max={18}
                value={form.franjaEtariaMin}
                onChange={e => set("franjaEtariaMin", e.target.value)}
                placeholder="Desde"
                className="bg-muted/50"
              />
              <span className="text-muted-foreground text-sm shrink-0">a</span>
              <Input
                type="number" min={0} max={18}
                value={form.franjaEtariaMax}
                onChange={e => set("franjaEtariaMax", e.target.value)}
                placeholder="Hasta"
                className="bg-muted/50"
              />
              <span className="text-muted-foreground text-sm shrink-0">años</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Descripción</label>
            <Textarea
              rows={3}
              value={form.descripcion}
              onChange={e => set("descripcion", e.target.value)}
              placeholder="Describe el comportamiento observable esperado..."
              className="bg-muted/50 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !form.nombreObjetivo.trim()}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {saving ? "Guardando..." : "Crear objetivo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
