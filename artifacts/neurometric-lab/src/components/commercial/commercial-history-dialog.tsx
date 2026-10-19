import { History } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useCommercialHistory, COMMERCIAL_EVENT_LABEL, COMMERCIAL_FIELD_LABEL, formatFieldValue, fmtDayOnly,
} from "@/hooks/use-commercial";

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function CommercialHistoryDialog({ user, onClose }: { user: { id: number; name: string } | null; onClose: () => void }) {
  const q = useCommercialHistory(user?.id ?? null);
  const rows = [...(q.data ?? [])].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.id - a.id);
  return (
    <Dialog open={!!user} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><History className="h-4 w-4" /> Historial comercial · {user?.name}</DialogTitle>
          <DialogDescription>Cambios registrados por el servidor con sus valores anteriores y nuevos.</DialogDescription>
        </DialogHeader>
        {q.isLoading ? (
          <div className="space-y-2 animate-pulse">{[0, 1, 2].map(i => <div key={i} className="h-16 rounded-xl bg-muted/60" />)}</div>
        ) : q.isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" data-testid="status-history-error">
            {(q.error as Error).message || "No se pudo cargar el historial."}
            <Button size="sm" variant="outline" className="ml-3" onClick={() => q.refetch()} data-testid="button-retry-history">Reintentar</Button>
          </div>
        ) : !rows.length ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Sin cambios comerciales registrados todavía.</p>
        ) : (
          <ol className="relative space-y-3 border-l border-border/60 pl-4">
            {rows.map(r => {
              const before = r.details?.before ?? {};
              const after = r.details?.after ?? {};
              const fields = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
              return (
                <li key={r.id} className="relative rounded-xl border border-border/60 bg-card p-3" data-testid={`row-history-${r.id}`}>
                  <span className="absolute -left-[21px] top-4 h-2.5 w-2.5 rounded-full bg-primary" />
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold">{COMMERCIAL_EVENT_LABEL[r.event] ?? r.event}</p>
                    <p className="text-[11px] text-muted-foreground">{fmtDateTime(r.occurredAt)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {r.actorName ?? (r.actorUserId ? `Usuario #${r.actorUserId}` : "Sistema")}
                    {r.effectiveDate && ` · efectivo ${fmtDayOnly(r.effectiveDate)}`}
                    {r.details?.receiptId != null && ` · cobro #${r.details.receiptId}`}
                  </p>
                  {fields.length > 0 && (
                    <dl className="mt-2 grid gap-1 text-xs">
                      {fields.map(f => (
                        <div key={f} className="grid grid-cols-[9rem_1fr] gap-2">
                          <dt className="text-muted-foreground">{COMMERCIAL_FIELD_LABEL[f] ?? f}</dt>
                          <dd><span className="line-through opacity-60">{formatFieldValue(f, before[f])}</span> <span className="mx-1 text-muted-foreground">a</span> <span className="font-medium">{formatFieldValue(f, after[f])}</span></dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {r.details?.reason && <p className="mt-2 rounded-lg bg-muted/50 px-2 py-1 text-xs">Motivo: {r.details.reason}</p>}
                </li>
              );
            })}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
