import { useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, HeartHandshake, Plus, Pencil, Power, Receipt, RefreshCcw, BadgeCheck, ChevronRight, Eye, EyeOff,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  formatMoney, newIdempotencyKey,
  useCollaboratorDashboard, useCollaborators, useCreateCollaborator, useCreateReceipt,
  useMarkReceiptPaid, useProfessionalUsers, useSaasReceipts, useSetSaasStatus, useUpdateCollaborator,
  type Collaborator, type SaasStatus, type SaasStatusResult,
} from "@/hooks/use-collaborators";
import { normalizeReferralCode } from "@/lib/referral";
import { DashboardSkeleton, DashboardView, ErrorPanel } from "@/components/collaborators/dashboard-view";

const selectCls = "w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function validPercent(p: string) {
  const n = Number(p);
  return p.trim() !== "" && /^\d{1,3}(\.\d{1,2})?$/.test(p.trim()) && n >= 0 && n <= 100;
}

function RowSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-muted/60" />)}
    </div>
  );
}

// ─── Create / edit dialog ──────────────────────────────────────────────────
function CollaboratorDialog({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: Collaborator | null }) {
  const { toast } = useToast();
  const create = useCreateCollaborator();
  const update = useUpdateCollaborator();
  const [f, setF] = useState({ name: "", email: "", password: "", country: "", code: "", commissionPercent: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [initFor, setInitFor] = useState<string>("");

  const key = open ? (editing ? `e${editing.id}` : "new") : "";
  if (key !== initFor) {
    setInitFor(key);
    setShowPwd(false);
    setF(editing
      ? { name: editing.name, email: "", password: "", country: editing.country, code: editing.code, commissionPercent: editing.commissionPercent }
      : { name: "", email: "", password: "", country: "", code: "", commissionPercent: "" });
  }
  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));
  const code = normalizeReferralCode(f.code);
  const pending = create.isPending || update.isPending;

  const submit = () => {
    if (!f.name.trim() || !f.country.trim()) return toast({ title: "Nombre y país son obligatorios", variant: "destructive" });
    if (!code) return toast({ title: "Código inválido", description: "Solo letras y números, 2 a 32 caracteres.", variant: "destructive" });
    if (!validPercent(f.commissionPercent)) return toast({ title: "Porcentaje inválido (0 a 100, hasta 2 decimales)", variant: "destructive" });
    if (editing) {
      const data: Record<string, string> = {};
      if (f.name.trim() !== editing.name) data.name = f.name.trim();
      if (f.country.trim() !== editing.country) data.country = f.country.trim();
      if (code !== editing.code) data.code = code;
      if (f.commissionPercent.trim() !== editing.commissionPercent) data.commissionPercent = f.commissionPercent.trim();
      if (!Object.keys(data).length) return onClose();
      update.mutate({ id: editing.id, data }, {
        onSuccess: () => { toast({ title: "Colaboradora actualizada" }); onClose(); },
        onError: e => toast({ title: e.message, variant: "destructive" }),
      });
    } else {
      if (!f.email.trim()) return toast({ title: "El email de acceso es obligatorio", variant: "destructive" });
      if (f.password.trim().length < 6) return toast({ title: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      create.mutate({
        name: f.name.trim(), email: f.email.trim(), password: f.password.trim(),
        country: f.country.trim(), code, commissionPercent: f.commissionPercent.trim(),
      }, {
        onSuccess: () => { toast({ title: "Colaboradora creada", description: "Queda inactiva hasta que la actives." }); onClose(); },
        onError: e => toast({ title: e.message, variant: "destructive" }),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => { if (!o && !pending) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar colaboradora" : "Nueva colaboradora"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Cambiar el porcentaje no recalcula comisiones ya generadas. El código no puede cambiarse si ya tiene referidos o cobros."
              : "Se crea también su usuario de acceso con rol colaboradora. Queda inactiva hasta activarla."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nombre"><Input value={f.name} onChange={e => set("name", e.target.value)} className="bg-muted/30" /></Field>
          <Field label="País"><Input value={f.country} onChange={e => set("country", e.target.value)} className="bg-muted/30" /></Field>
          {!editing && (
            <>
              <Field label="Email de acceso"><Input type="email" autoComplete="off" value={f.email} onChange={e => set("email", e.target.value)} className="bg-muted/30" /></Field>
              <Field label="Contraseña">
                <div className="relative">
                  <Input type={showPwd ? "text" : "password"} autoComplete="new-password" value={f.password} onChange={e => set("password", e.target.value)} className="bg-muted/30 pr-10" placeholder="Mínimo 6 caracteres" />
                  <button type="button" tabIndex={-1} onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Mostrar contraseña">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
            </>
          )}
          <Field label="Código" hint={code ? `Link: /?ref=${code.toLowerCase()}` : "Letras y números, 2 a 32"}>
            <Input value={f.code} onChange={e => set("code", e.target.value.toUpperCase())} className="bg-muted/30 font-mono uppercase" />
          </Field>
          <Field label="Comisión %">
            <Input inputMode="decimal" value={f.commissionPercent} onChange={e => set("commissionPercent", e.target.value.replace(",", "."))} className="bg-muted/30" placeholder="Ej. 32.5" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>Cancelar</Button>
          <Button onClick={submit} disabled={pending}>{pending ? "Guardando…" : editing ? "Guardar cambios" : "Crear colaboradora"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Collaborators tab ─────────────────────────────────────────────────────
function CollaboratorsTab() {
  const { toast } = useToast();
  const list = useCollaborators();
  const update = useUpdateCollaborator();
  const [dialog, setDialog] = useState<{ open: boolean; editing: Collaborator | null }>({ open: false, editing: null });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<Collaborator | null>(null);
  const dash = useCollaboratorDashboard(selectedId);
  const selected = list.data?.find(c => c.id === selectedId) ?? null;

  const toggle = (c: Collaborator) => {
    update.mutate({ id: c.id, data: { active: !c.active } }, {
      onSuccess: () => { toast({ title: c.active ? "Colaboradora desactivada" : "Colaboradora activada" }); setConfirmToggle(null); },
      onError: e => toast({ title: e.message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground">
          {list.data ? `${list.data.filter(c => c.active).length} activas · ${list.data.filter(c => !c.active).length} inactivas` : " "}
        </p>
        <Button onClick={() => setDialog({ open: true, editing: null })} className="gap-2"><Plus className="h-4 w-4" /> Nueva colaboradora</Button>
      </div>

      {list.isLoading ? <RowSkeleton /> : list.isError ? (
        <ErrorPanel message={(list.error as Error).message} onRetry={() => list.refetch()} />
      ) : !list.data?.length ? (
        <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/[0.03] p-10 text-center">
          <HeartHandshake className="mx-auto h-8 w-8 text-primary/70" />
          <p className="mt-3 font-semibold text-foreground">Todavía no hay colaboradoras</p>
          <p className="mt-1 text-sm text-muted-foreground">Creá la primera para generar su link personal de referidos.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {list.data.map(c => (
            <div key={c.id} className={`rounded-2xl border bg-card p-4 shadow-sm transition-colors ${selectedId === c.id ? "border-primary/50 ring-1 ring-primary/20" : "border-border/60"}`}>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 font-mono text-xs font-bold text-primary">
                  {c.code.slice(0, 3)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground truncate">{c.name}</p>
                    <Badge variant="outline" className={c.active ? "border-emerald-500/40 text-emerald-700" : "border-muted-foreground/40 text-muted-foreground"}>
                      {c.active ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-mono">{c.code}</span> · {c.country} · {c.commissionPercent}%
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setDialog({ open: true, editing: c })} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmToggle(c)} aria-label={c.active ? "Desactivar" : "Activar"}>
                    <Power className={`h-4 w-4 ${c.active ? "text-emerald-600" : "text-muted-foreground"}`} />
                  </Button>
                  <Button size="sm" variant={selectedId === c.id ? "secondary" : "outline"} onClick={() => setSelectedId(selectedId === c.id ? null : c.id)} className="gap-1">
                    Panel <ChevronRight className={`h-3.5 w-3.5 transition-transform ${selectedId === c.id ? "rotate-90" : ""}`} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Panel de {selected.name}</h2>
            <Button size="sm" variant="ghost" onClick={() => dash.refetch()} className="gap-1.5 text-muted-foreground"><RefreshCcw className="h-3.5 w-3.5" /> Actualizar</Button>
          </div>
          {dash.isLoading ? <DashboardSkeleton /> : dash.isError || !dash.data ? (
            <ErrorPanel message={(dash.error as Error)?.message ?? "No se pudo cargar el panel"} onRetry={() => dash.refetch()} />
          ) : <DashboardView data={dash.data} />}
        </section>
      )}

      <CollaboratorDialog open={dialog.open} editing={dialog.editing} onClose={() => setDialog({ open: false, editing: null })} />

      <Dialog open={!!confirmToggle} onOpenChange={o => { if (!o && !update.isPending) setConfirmToggle(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmToggle?.active ? "Desactivar colaboradora" : "Activar colaboradora"}</DialogTitle>
            <DialogDescription>
              {confirmToggle?.active
                ? "Su código dejará de validar para nuevos referidos y no podrá entrar a su panel. Las atribuciones y comisiones existentes se conservan."
                : "Su código empezará a validar y podrá entrar a su panel privado."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmToggle(null)} disabled={update.isPending}>Cancelar</Button>
            <Button onClick={() => confirmToggle && toggle(confirmToggle)} disabled={update.isPending}>
              {update.isPending ? "Guardando…" : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Receipts tab ──────────────────────────────────────────────────────────
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDay(d: string) {
  return new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString("es-AR");
}

function ReceiptsTab() {
  const { toast } = useToast();
  const receipts = useSaasReceipts();
  const pros = useProfessionalUsers();
  const collabs = useCollaborators();
  const create = useCreateReceipt();
  const markPaid = useMarkReceiptPaid();
  const [f, setF] = useState({ professionalUserId: "", amount: "", currency: "ARS", receivedAt: todayISO(), periodFrom: "", periodTo: "", reference: "" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<number | null>(null);
  const [payRef, setPayRef] = useState("");
  // Idempotency key: created once per submit attempt and REUSED on retries of the
  // same payload (double click, network retry). Changing any field starts a new operation.
  const keyRef = useRef<string | null>(null);
  const set = (k: keyof typeof f, v: string) => { keyRef.current = null; setF(p => ({ ...p, [k]: v })); };

  const proName = useMemo(() => new Map((pros.data ?? []).map(u => [u.id, u.name])), [pros.data]);
  const collabName = useMemo(() => new Map((collabs.data ?? []).map(c => [c.id, c.name])), [collabs.data]);

  const amountOk = /^\d+(\.\d{1,2})?$/.test(f.amount.trim()) && Number(f.amount) > 0;
  const currencyOk = /^[A-Z]{3}$/.test(f.currency);
  const periodOk = !!f.periodFrom && !!f.periodTo && f.periodFrom <= f.periodTo;
  const referenceOk = f.reference.trim().length > 0 && f.reference.trim().length <= 256;
  const canSubmit = !!f.professionalUserId && amountOk && currencyOk && !!f.receivedAt && periodOk && referenceOk;

  const submit = () => {
    if (create.isPending) return;
    if (!keyRef.current) keyRef.current = newIdempotencyKey();
    create.mutate({
      professionalUserId: Number(f.professionalUserId),
      amount: Number(f.amount).toFixed(2),
      currency: f.currency,
      receivedAt: f.receivedAt,
      periodFrom: f.periodFrom,
      periodTo: f.periodTo,
      reference: f.reference.trim(),
      idempotencyKey: keyRef.current,
    }, {
      onSuccess: r => {
        toast({ title: "Cobro confirmado", description: r.commissionAmount ? `Comisión generada: ${formatMoney(r.commissionAmount, r.currency)}` : "Sin atribución: no genera comisión." });
        keyRef.current = null;
        setConfirmOpen(false);
        setF(p => ({ ...p, amount: "", professionalUserId: "", reference: "", periodFrom: "", periodTo: "" }));
      },
      onError: e => toast({ title: e.message, description: "Podés reintentar: no se duplicará el cobro.", variant: "destructive" }),
    });
  };

  const pay = (id: number) => markPaid.mutate({ id, paymentReference: payRef }, {
    onSuccess: () => { toast({ title: "Comisión marcada como pagada" }); setPayTarget(null); setPayRef(""); },
    onError: e => toast({ title: e.message, variant: "destructive" }),
  });

  const sorted = useMemo(() => [...(receipts.data ?? [])].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt) || b.id - a.id), [receipts.data]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
        <div>
          <h2 className="font-semibold text-foreground">Registrar cobro SaaS</h2>
          <p className="text-xs text-muted-foreground">Confirmación manual. Un cobro confirmado no se edita ni elimina y genera como máximo una comisión.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <Field label="Profesional">
              <select value={f.professionalUserId} onChange={e => set("professionalUserId", e.target.value)} className={selectCls} disabled={pros.isLoading}>
                <option value="">{pros.isLoading ? "Cargando…" : pros.isError ? "Error al cargar" : "Elegir profesional"}</option>
                {(pros.data ?? []).map(u => <option key={u.id} value={u.id}>{u.name} · {u.email}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Importe"><Input inputMode="decimal" value={f.amount} onChange={e => set("amount", e.target.value.replace(",", "."))} placeholder="0.00" className="bg-muted/30 tabular-nums" /></Field>
          <Field label="Moneda"><Input value={f.currency} maxLength={3} onChange={e => set("currency", e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))} className="bg-muted/30 font-mono" /></Field>
          <Field label="Fecha de cobro"><Input type="date" value={f.receivedAt} onChange={e => set("receivedAt", e.target.value)} className="bg-muted/30" /></Field>
          <Field label="Período desde"><Input type="date" value={f.periodFrom} onChange={e => set("periodFrom", e.target.value)} className="bg-muted/30" /></Field>
          <Field label="Período hasta" hint={f.periodFrom && f.periodTo && f.periodFrom > f.periodTo ? "Debe ser posterior a «desde»" : undefined}>
            <Input type="date" value={f.periodTo} min={f.periodFrom || undefined} onChange={e => set("periodTo", e.target.value)} className="bg-muted/30" />
          </Field>
          <Field label="Referencia del cobro" hint="Ej. número de transferencia o comprobante">
            <Input value={f.reference} maxLength={256} onChange={e => set("reference", e.target.value)} className="bg-muted/30" />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button disabled={!canSubmit || create.isPending} onClick={() => setConfirmOpen(true)} className="gap-2"><Receipt className="h-4 w-4" /> Confirmar cobro</Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
          <h3 className="text-sm font-semibold">Cobros confirmados</h3>
          <span className="text-xs text-muted-foreground">{receipts.data?.length ?? 0}</span>
        </div>
        {receipts.isLoading ? <div className="p-4"><RowSkeleton /></div> : receipts.isError ? (
          <div className="p-4"><ErrorPanel message={(receipts.error as Error).message} onRetry={() => receipts.refetch()} /></div>
        ) : !sorted.length ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">Sin cobros registrados todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Fecha</th>
                  <th className="px-3 py-2 text-left font-semibold">Profesional</th>
                  <th className="px-3 py-2 text-right font-semibold">Importe</th>
                  <th className="px-3 py-2 text-left font-semibold">Colaboradora</th>
                  <th className="px-3 py-2 text-right font-semibold">Comisión</th>
                  <th className="px-4 py-2 text-right font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(r => (
                  <tr key={r.id} className="border-t border-border/40">
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {fmtDay(r.receivedAt)}
                      <span className="block text-[11px] text-muted-foreground">{r.periodFrom && r.periodTo ? `${fmtDay(r.periodFrom)} – ${fmtDay(r.periodTo)}` : ""}</span>
                      {r.reference && <span className="block text-[11px] text-muted-foreground truncate max-w-[12rem]" title={r.reference}>Ref. {r.reference}</span>}
                    </td>
                    <td className="px-3 py-2.5">{proName.get(r.professionalUserId) ?? `#${r.professionalUserId}`}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">{formatMoney(r.amount, r.currency)}</td>
                    <td className="px-3 py-2.5">{r.collaboratorId ? (collabName.get(r.collaboratorId) ?? `#${r.collaboratorId}`) : <span className="text-muted-foreground">Sin atribución</span>}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap">
                      {r.commissionAmount ? <>{formatMoney(r.commissionAmount, r.currency)}<span className="block text-[11px] text-muted-foreground">{r.commissionPercentSnapshot}%</span></> : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {!r.commissionAmount ? <span className="text-xs text-muted-foreground">—</span> : r.paidAt ? (
                        <span className="inline-flex flex-col items-end text-xs text-emerald-700">
                          <span className="inline-flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5" /> Pagada {new Date(r.paidAt).toLocaleDateString("es-AR")}</span>
                          {r.paymentReference && <span className="text-[11px] text-muted-foreground">Ref. {r.paymentReference}</span>}
                        </span>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setPayTarget(r.id)}>Marcar pagada</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={o => { if (!o && !create.isPending) setConfirmOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar cobro</DialogTitle>
            <DialogDescription>
              {proName.get(Number(f.professionalUserId)) ?? "Profesional"} · {amountOk ? formatMoney(Number(f.amount).toFixed(2), f.currency) : ""} · cobrado {f.receivedAt} · período {f.periodFrom} a {f.periodTo} · ref. {f.reference.trim()}.
              {" "}Una vez confirmado no se puede editar ni eliminar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={create.isPending}>Volver</Button>
            <Button onClick={submit} disabled={create.isPending}>{create.isPending ? "Confirmando…" : "Confirmar cobro"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payTarget != null} onOpenChange={o => { if (!o && !markPaid.isPending) { setPayTarget(null); setPayRef(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Marcar comisión pagada</DialogTitle>
            <DialogDescription>Se registra el pago de la comisión completa. No hay pagos parciales en esta versión.</DialogDescription>
          </DialogHeader>
          <Field label="Referencia del pago (opcional)">
            <Input value={payRef} maxLength={256} onChange={e => setPayRef(e.target.value)} className="bg-muted/30" placeholder="Ej. transferencia 000123" />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayTarget(null)} disabled={markPaid.isPending}>Cancelar</Button>
            <Button onClick={() => payTarget != null && pay(payTarget)} disabled={markPaid.isPending}>{markPaid.isPending ? "Guardando…" : "Marcar pagada"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Commercial status tab ─────────────────────────────────────────────────
const STATUS_LABEL: Record<SaasStatus, string> = {
  paying: "Pagando", churned: "Baja", trial: "En prueba", overdue: "Pago vencido", courtesy: "Cortesía",
};
const EVENT_LABEL: Record<NonNullable<SaasStatusResult["event"]>, string> = {
  first_paid: "Primera alta paga", cancellation: "Cancelación", reactivation: "Reactivación",
};

function StatusTab() {
  const { toast } = useToast();
  const pros = useProfessionalUsers();
  const setStatus = useSetSaasStatus();
  const [userId, setUserId] = useState("");
  const [status, setStatusV] = useState<SaasStatus>("paying");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [log, setLog] = useState<(SaasStatusResult & { at: string; name: string })[]>([]);
  const current = pros.data?.find(u => String(u.id) === userId);

  const submit = () => {
    if (!userId || setStatus.isPending) return;
    setStatus.mutate({ professionalUserId: Number(userId), status, ...(effectiveDate ? { effectiveDate } : {}) }, {
      onSuccess: r => {
        setLog(l => [{ ...r, at: new Date().toLocaleTimeString("es-AR"), name: current?.name ?? `#${r.professionalUserId}` }, ...l]);
        toast({ title: "Estado actualizado", description: r.event ? `Evento registrado: ${EVENT_LABEL[r.event]}` : "Sin evento de suscripción." });
      },
      onError: e => toast({ title: e.message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
        <div>
          <h2 className="font-semibold text-foreground">Alta, baja y reactivación</h2>
          <p className="text-xs text-muted-foreground">El servidor registra automáticamente primera alta paga, cancelación o reactivación según la transición.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="sm:col-span-2">
            <Field label="Profesional" hint={current?.commercialStatus ? `Estado actual: ${STATUS_LABEL[current.commercialStatus] ?? current.commercialStatus}` : undefined}>
              <select value={userId} onChange={e => setUserId(e.target.value)} className={selectCls} disabled={pros.isLoading}>
                <option value="">{pros.isLoading ? "Cargando…" : pros.isError ? "Error al cargar" : "Elegir profesional"}</option>
                {(pros.data ?? []).map(u => <option key={u.id} value={u.id}>{u.name} · {u.email}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Nuevo estado">
            <select value={status} onChange={e => setStatusV(e.target.value as SaasStatus)} className={selectCls}>
              {(Object.keys(STATUS_LABEL) as SaasStatus[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </Field>
          <Field label="Fecha efectiva" hint="Opcional; por defecto hoy">
            <Input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} className="bg-muted/30" />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button onClick={submit} disabled={!userId || setStatus.isPending}>{setStatus.isPending ? "Guardando…" : "Aplicar estado"}</Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="px-5 py-3 border-b border-border/50">
          <h3 className="text-sm font-semibold">Cambios de esta sesión</h3>
          <p className="text-[11px] text-muted-foreground">El historial agregado por mes se ve en el panel de cada colaboradora.</p>
        </div>
        {!log.length ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">Sin cambios en esta sesión.</p>
        ) : (
          <ul className="divide-y divide-border/40">
            {log.map((l, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-sm">
                <span>{l.name} → <strong>{STATUS_LABEL[l.status] ?? l.status}</strong></span>
                <span className="flex items-center gap-2">
                  {l.event && <Badge variant="outline" className="border-primary/40 text-primary">{EVENT_LABEL[l.event]}</Badge>}
                  <span className="text-xs text-muted-foreground">{l.at}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function Colaboradoras() {
  const [, navigate] = useLocation();
  return (
    <AppLayout>
      <div className="flex flex-col gap-5 animate-in fade-in duration-400 max-w-5xl mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground/80 transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" /> Volver al panel
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10"><HeartHandshake className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Programa de Colaboradoras</h1>
            <p className="text-sm text-muted-foreground">Referidos, cobros SaaS y comisiones.</p>
          </div>
        </div>
        <Tabs defaultValue="colaboradoras">
          <TabsList className="bg-card border border-border/50 p-1 rounded-xl shadow-sm h-auto gap-1 flex-wrap">
            <TabsTrigger value="colaboradoras" className="rounded-lg text-sm">Colaboradoras</TabsTrigger>
            <TabsTrigger value="cobros" className="rounded-lg text-sm">Cobros y comisiones</TabsTrigger>
            <TabsTrigger value="estado" className="rounded-lg text-sm">Alta / baja</TabsTrigger>
          </TabsList>
          <TabsContent value="colaboradoras" className="mt-5"><CollaboratorsTab /></TabsContent>
          <TabsContent value="cobros" className="mt-5"><ReceiptsTab /></TabsContent>
          <TabsContent value="estado" className="mt-5"><StatusTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
