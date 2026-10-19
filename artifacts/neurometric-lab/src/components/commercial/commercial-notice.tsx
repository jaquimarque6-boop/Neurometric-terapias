import { AlertTriangle, Info, Clock } from "lucide-react";
import { useOwnCommercial, fmtDayOnly } from "@/hooks/use-commercial";

const SEVERITY_CLS = {
  info: "border-sky-500/30 bg-sky-50/70 text-sky-900 dark:bg-sky-500/10 dark:text-sky-100",
  warning: "border-amber-500/40 bg-amber-50/80 text-amber-900 dark:bg-amber-500/10 dark:text-amber-100",
  urgent: "border-rose-500/50 bg-rose-50/80 text-rose-900 dark:bg-rose-500/10 dark:text-rose-100",
} as const;

/**
 * Aviso comercial informativo para profesionales. Nunca bloquea, redirige ni
 * abre modales: si falla la consulta, la interfaz clínica sigue intacta.
 */
export function CommercialNotice() {
  const q = useOwnCommercial();
  if (q.isError) {
    return (
      <p className="mb-4 text-[11px] text-muted-foreground" role="status" data-testid="status-commercial-notice-error">
        No se pudo consultar el estado de tu suscripción. Tu acceso clínico no se ve afectado.
      </p>
    );
  }
  const d = q.data;
  if (!d || d.exempt || !d.notice) return null;
  const sev = d.severity in SEVERITY_CLS ? d.severity : "info";
  const Icon = sev === "urgent" ? AlertTriangle : sev === "warning" ? Clock : Info;
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="banner-commercial-notice"
      data-severity={sev}
      className={`mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm ${SEVERITY_CLS[sev]}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className={sev === "urgent" ? "font-semibold" : "font-medium"}>{d.notice}</p>
        {d.expiresOn && (
          <p className="mt-0.5 text-xs opacity-80" data-testid="text-commercial-expires">
            Fecha de referencia: {fmtDayOnly(d.expiresOn)}
            {d.daysRemaining != null && d.daysRemaining >= 0 && ` · ${d.daysRemaining === 0 ? "vence hoy" : `${d.daysRemaining} día${d.daysRemaining === 1 ? "" : "s"} restante${d.daysRemaining === 1 ? "" : "s"}`}`}
          </p>
        )}
        <p className="mt-0.5 text-[11px] opacity-70">Aviso informativo: tu acceso a pacientes y registros continúa normalmente.</p>
      </div>
    </div>
  );
}
