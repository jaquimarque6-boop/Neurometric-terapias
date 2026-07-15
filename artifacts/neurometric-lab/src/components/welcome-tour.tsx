import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/auth-context";
import {
  UserPlus, ClipboardList, Zap, Target, FolderUp, Wallet,
  ChevronLeft, ChevronRight, Check,
} from "lucide-react";

const TOUR_KEY_BASE = "nm_tour_v1";
export const OPEN_TOUR_EVENT = "nm:open-tour";

// La marca "ya visto" se guarda por profesional para que cada usuario
// vea el recorrido en su primer ingreso, aunque compartan navegador.
function tourKey(userId: number | string | undefined | null) {
  return userId != null ? `${TOUR_KEY_BASE}:${userId}` : TOUR_KEY_BASE;
}

const STEPS = [
  {
    icon: UserPlus,
    title: "1. Creá o abrí un paciente",
    text: "Desde el panel principal o la sección Pacientes, agregá un nuevo paciente con el botón \"Nuevo paciente\" o abrí la ficha de uno existente.",
  },
  {
    icon: ClipboardList,
    title: "2. Completá la anamnesis",
    text: "Dentro de la ficha del paciente vas a encontrar la anamnesis para registrar los antecedentes y la historia clínica inicial.",
  },
  {
    icon: Zap,
    title: "3. Registrá una sesión",
    text: "Usá \"Sesión rápida\" para observaciones breves en menos de un minuto, o \"Sesión completa\" para trabajar con objetivos y evolución.",
  },
  {
    icon: Target,
    title: "4. Creá objetivos terapéuticos",
    text: "Definí objetivos para cada paciente desde su ficha o aprovechá el Banco de Objetivos con metas ya redactadas.",
  },
  {
    icon: FolderUp,
    title: "5. Subí documentación",
    text: "En la ficha del paciente podés adjuntar informes, evaluaciones y otros documentos para tener todo en un solo lugar.",
  },
  {
    icon: Wallet,
    title: "6. Registrá un pago",
    text: "En \"Registro de Pagos\" anotá los cobros por paciente y llevá el control de tu mes, incluyendo tus gastos.",
  },
];

export function openTour() {
  window.dispatchEvent(new Event(OPEN_TOUR_EVENT));
}

export function WelcomeTour() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [noMostrar, setNoMostrar] = useState(false);

  const userId = (user as any)?.id as number | undefined;

  function markTourSeen() {
    try { localStorage.setItem(tourKey(userId), "done"); } catch { /* ignore */ }
  }

  useEffect(() => {
    if (userId == null) return undefined;
    let seen = "done";
    try { seen = localStorage.getItem(tourKey(userId)) ?? ""; } catch { /* ignore */ }
    if (!seen) {
      // No bloquear el ingreso: abrir con una pequeña demora
      const t = setTimeout(() => { setStep(0); setOpen(true); }, 600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [userId]);

  useEffect(() => {
    const handler = () => { setStep(0); setNoMostrar(false); setOpen(true); };
    window.addEventListener(OPEN_TOUR_EVENT, handler);
    return () => window.removeEventListener(OPEN_TOUR_EVENT, handler);
  }, []);

  function close(markDone: boolean) {
    if (markDone || noMostrar) markTourSeen();
    setOpen(false);
  }

  const s = STEPS[step];
  const Icon = s.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) close(true); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Guía de uso — primeros pasos</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center gap-3 py-2">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">{s.title}</p>
          <p className="text-sm text-muted-foreground leading-relaxed px-2">{s.text}</p>

          {/* Progreso */}
          <div className="flex items-center gap-1.5 mt-1">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? "w-5 bg-primary" : "w-1.5 bg-border"}`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="tour-no-mostrar"
            checked={noMostrar}
            onCheckedChange={v => setNoMostrar(v === true)}
          />
          <label htmlFor="tour-no-mostrar" className="text-xs text-muted-foreground cursor-pointer">
            No volver a mostrar
          </label>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => close(true)}>
            Omitir
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(v => Math.max(0, v - 1))}
              disabled={step === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            {isLast ? (
              <Button size="sm" onClick={() => close(true)} className="gap-1">
                <Check className="h-4 w-4" />
                Finalizar
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep(v => Math.min(STEPS.length - 1, v + 1))} className="gap-1">
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
