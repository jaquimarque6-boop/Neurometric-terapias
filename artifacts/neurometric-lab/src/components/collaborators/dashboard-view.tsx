import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatMoney, formatMonth, moneyEntries,
  type CollaboratorDashboard, type MoneyMap,
} from "@/hooks/use-collaborators";

export function MoneyStack({ value, size = "lg" }: { value: MoneyMap | null | undefined; size?: "lg" | "sm" }) {
  const entries = moneyEntries(value);
  if (!entries.length) return <span className="text-muted-foreground/60">{size === "lg" ? "Sin importes" : "—"}</span>;
  return (
    <span className="flex flex-col gap-0.5">
      {entries.map(([cur, amt]) => (
        <span key={cur} className={size === "lg" ? "font-display font-semibold text-lg tabular-nums leading-tight" : "tabular-nums"}>
          {formatMoney(amt, cur)}
        </span>
      ))}
    </span>
  );
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1.5 text-foreground">{value}</div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copiá tu link:", link);
    }
  };
  return (
    <div className="flex items-stretch gap-2 w-full">
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5">
        <Link2 className="h-4 w-4 shrink-0 text-primary" />
        <span className="truncate font-mono text-sm text-foreground" title={link}>{link}</span>
      </div>
      <Button type="button" onClick={copy} className="shrink-0 gap-1.5" aria-live="polite">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copiado" : "Copiar"}
      </Button>
    </div>
  );
}

export function DashboardView({ data, showLink = true }: { data: CollaboratorDashboard; showLink?: boolean }) {
  return (
    <div className="space-y-5">
      {showLink && (
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Link personal</p>
            <p className="text-xs text-muted-foreground">
              Código <span className="font-mono font-semibold text-foreground">{data.code}</span>
              {" · "}Comisión vigente <span className="font-semibold text-foreground">{data.commissionPercent}%</span>
            </p>
          </div>
          <CopyLink link={data.link} />
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Referidos" value={<span className="font-display text-2xl font-bold">{data.referrals}</span>} hint="Cuentas consolidadas" />
        <Stat label="Suscripciones activas" value={<span className="font-display text-2xl font-bold">{data.activeSubscriptions}</span>} />
        <Stat label="Nuevas este mes" value={<span className="font-display text-2xl font-bold">{data.newSubscriptionsThisMonth}</span>} />
        <Stat label="Bajas este mes" value={<span className="font-display text-2xl font-bold">{data.cancellationsThisMonth}</span>} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Comisión generada este mes" value={<MoneyStack value={data.generatedThisMonth} />} />
        <Stat label="Comisión pendiente" value={<MoneyStack value={data.pending} />} />
        <Stat label="Comisión pagada" value={<MoneyStack value={data.paid} />} />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground">Historial mensual</h3>
          <p className="text-[11px] text-muted-foreground">Importes separados por moneda, sin conversión.</p>
        </div>
        {data.history.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">Todavía no hay movimientos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Mes</th>
                  <th className="px-3 py-2 text-right font-semibold">Referidos</th>
                  <th className="px-3 py-2 text-right font-semibold">Altas</th>
                  <th className="px-3 py-2 text-right font-semibold">Bajas</th>
                  <th className="px-3 py-2 text-right font-semibold">Generada</th>
                  <th className="px-3 py-2 text-right font-semibold">Pendiente</th>
                  <th className="px-4 py-2 text-right font-semibold">Pagada</th>
                </tr>
              </thead>
              <tbody>
                {data.history.map(h => (
                  <tr key={h.month} className="border-t border-border/40">
                    <td className="px-4 py-2.5 capitalize">{formatMonth(h.month)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{h.referrals}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{h.newSubscriptions}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{h.cancellations}</td>
                    <td className="px-3 py-2.5 text-right"><MoneyStack value={h.generated} size="sm" /></td>
                    <td className="px-3 py-2.5 text-right"><MoneyStack value={h.pending} size="sm" /></td>
                    <td className="px-4 py-2.5 text-right"><MoneyStack value={h.paid} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse" aria-busy="true">
      <div className="h-24 rounded-2xl bg-muted/60" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-muted/60" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map(i => <div key={i} className="h-24 rounded-2xl bg-muted/60" />)}
      </div>
      <div className="h-48 rounded-2xl bg-muted/60" />
    </div>
  );
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-destructive/25 bg-destructive/5 p-6 text-center space-y-3">
      <p className="text-sm text-destructive">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>Reintentar</Button>
    </div>
  );
}
