import { useMemo } from "react";
import { Link } from "wouter";
import { ShieldAlert, History, Edit2, Receipt, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtDayOnly, type CommercialReview } from "@/hooks/use-commercial";
import { ClinicalUserCounts } from "./clinical-user-counts";

export type ReviewUser = {
  id: number; name: string; email: string; role: string; active: boolean;
  commercialStatus: string; trialStartPending?: boolean; commercialReview?: CommercialReview;
  patientCount?: number | null; clinicalSessionCount?: number | null;
};

const SEV_CLS = {
  urgent: "border-rose-500/40 text-rose-700 bg-rose-500/10",
  warning: "border-amber-500/40 text-amber-700 bg-amber-500/10",
  info: "border-sky-500/40 text-sky-700 bg-sky-500/10",
} as const;
const SEV_LABEL = { urgent: "Urgente", warning: "Atención", info: "Informativo" } as const;
const SEV_ORDER = { urgent: 0, warning: 1, info: 2 } as const;

const INSTRUCTIONS = [
  "Contrastá las fechas con el comprobante o el acuerdo real antes de editar.",
  "Si la persona pagó, registrá el cobro en Cobros (calcula el período automáticamente).",
  "Si falta una fecha, completala con Editar e indicá el motivo del cambio.",
  "No se aplican bloqueos ni correcciones automáticas: el acceso clínico sigue igual.",
];

export function VerificationPanel({ users, onEdit, onHistory }: {
  users: ReviewUser[];
  onEdit: (id: number) => void;
  onHistory: (u: ReviewUser) => void;
}) {
  const pending = useMemo(() => users
    .filter(u => u.commercialReview?.needsReview || u.trialStartPending)
    .sort((a, b) => SEV_ORDER[a.commercialReview?.severity ?? "info"] - SEV_ORDER[b.commercialReview?.severity ?? "info"] || a.name.localeCompare(b.name)),
  [users]);
  const withoutReview = users.filter(u => u.role === "professional" && !u.commercialReview).length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-500/30 bg-amber-50/50 p-4 dark:bg-amber-500/5">
        <p className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200"><ShieldAlert className="h-4 w-4" /> Modo verificación</p>
        <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">Lista de cuentas con datos faltantes, inconsistentes o vencidos. Es solo para revisión manual: nadie pierde acceso.</p>
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-amber-900/80 dark:text-amber-200/80">
          {INSTRUCTIONS.map(i => <li key={i}>{i}</li>)}
        </ul>
      </div>
      {withoutReview > 0 && (
        <p className="text-xs text-muted-foreground" data-testid="status-review-unavailable">{withoutReview} cuenta(s) sin datos de verificación del servidor.</p>
      )}
      {!pending.length ? (
        <div className="rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-500/[0.04] p-10 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
          <p className="mt-2 font-semibold">Nada para revisar</p>
          <p className="text-sm text-muted-foreground">{withoutReview ? "Faltan resultados del servidor para completar la revisión." : "No hay cuentas pendientes de revisión automática. Cortesía, bajas y administración están excluidas del vencimiento automático."}</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {pending.map(u => {
            const r = u.commercialReview;
            const sev = r?.severity ?? "info";
            return (
              <div key={u.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm" data-testid={`card-review-${u.id}`}>
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{u.name}</p>
                      <Badge variant="outline" className={SEV_CLS[sev]}>{SEV_LABEL[sev]}</Badge>
                      {!u.active && <Badge variant="outline">Inactiva</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{u.email}
                      {r?.expiresOn && ` · vence ${fmtDayOnly(r.expiresOn)}`}
                      {r?.daysRemaining != null && ` (${r.daysRemaining < 0 ? `hace ${-r.daysRemaining} días` : `${r.daysRemaining} días`})`}
                    </p>
                    <ClinicalUserCounts
                      userId={u.id}
                      role={u.role}
                      patientCount={u.patientCount}
                      clinicalSessionCount={u.clinicalSessionCount}
                      className="mt-2"
                    />
                    <ul className="mt-2 space-y-1 text-sm">
                      {u.trialStartPending && <li className="text-foreground/90">- Inicio de prueba pendiente: se fijará al primer ingreso; no requiere acción.</li>}
                      {(r?.issues ?? []).map(i => <li key={i.code} className="text-foreground/90" data-testid={`text-issue-${u.id}-${i.code}`}>- {i.message}</li>)}
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => onEdit(u.id)} data-testid={`button-review-edit-${u.id}`}><Edit2 className="h-3.5 w-3.5" /> Editar</Button>
                    <Button size="sm" variant="ghost" className="gap-1" onClick={() => onHistory(u)} data-testid={`button-review-history-${u.id}`}><History className="h-3.5 w-3.5" /> Historial</Button>
                    {u.role === "professional" && (
                      <Link href={`/colaboradoras?tab=cobros&pro=${u.id}`} className="inline-flex h-8 items-center gap-1 rounded-md px-3 text-xs font-medium text-primary hover:bg-primary/10" data-testid={`link-review-receipt-${u.id}`}>
                        <Receipt className="h-3.5 w-3.5" /> Registrar cobro
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
