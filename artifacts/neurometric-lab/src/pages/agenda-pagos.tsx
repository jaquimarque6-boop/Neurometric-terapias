import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, CheckCircle2, Wallet, TrendingUp, Clock, AlertCircle, Trash2 } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const MESES_ES: Record<string, string> = {
  "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
  "05": "Mayo", "06": "Junio", "07": "Julio", "08": "Agosto",
  "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre",
};

function mesLabel(mes: string) {
  const [year, month] = mes.split("-");
  return `${MESES_ES[month] ?? month} ${year}`;
}

function formatMonto(monto: string | number) {
  const n = typeof monto === "string" ? parseFloat(monto) : monto;
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

function getCurrentMes() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function generateMesOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = -3; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    options.push({ value, label: mesLabel(value) });
  }
  return options;
}

type Pago = {
  id: number;
  patientId: number;
  patientName: string;
  monto: string;
  mes: string;
  tipo: string;
  nombreObraSocial?: string | null;
  fecha: string;
  estado: string;
  notas?: string | null;
};

type Patient = { id: number; name: string };

const emptyForm = {
  patientId: "",
  monto: "",
  mes: getCurrentMes(),
  tipo: "particular",
  nombreObraSocial: "",
  fecha: new Date().toISOString().slice(0, 10),
  estado: "pendiente",
  notas: "",
};

export default function AgendaPagos() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [filterMes, setFilterMes] = useState<string>(getCurrentMes());
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [filterTipo, setFilterTipo] = useState<string>("todos");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Pago | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Pago | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const mesOptions = useMemo(() => generateMesOptions(), []);

  const { data: patients = [], isLoading: patientsLoading } = useQuery<Patient[]>({
    queryKey: ["patients-list"],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/patients`, { credentials: "include" });
      if (!r.ok) throw new Error("Error");
      return r.json();
    },
  });

  const { data: pagos = [], isLoading } = useQuery<Pago[]>({
    queryKey: ["pagos", filterMes, filterEstado, filterTipo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterMes) params.set("mes", filterMes);
      if (filterEstado !== "todos") params.set("estado", filterEstado);
      if (filterTipo !== "todos") params.set("tipo", filterTipo);
      const r = await fetch(`${API_BASE}/api/pagos?${params}`, { credentials: "include" });
      if (!r.ok) throw new Error("Error");
      return r.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const r = await fetch(`${API_BASE}/api/pagos`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, monto: parseFloat(data.monto), patientId: parseInt(data.patientId) }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Error");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pagos"] });
      toast({ title: "Pago registrado", description: "El pago fue creado correctamente." });
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof emptyForm> }) => {
      const r = await fetch(`${API_BASE}/api/pagos/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          monto: data.monto !== undefined ? parseFloat(data.monto) : undefined,
          patientId: data.patientId !== undefined ? parseInt(data.patientId) : undefined,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Error");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pagos"] });
      toast({ title: "Pago actualizado" });
      setDialogOpen(false);
      setEditTarget(null);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`${API_BASE}/api/pagos/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error((await r.json()).error ?? "Error");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pagos"] });
      toast({ title: "Pago eliminado" });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(pago: Pago) {
    setEditTarget(pago);
    setForm({
      patientId: String(pago.patientId),
      monto: pago.monto,
      mes: pago.mes,
      tipo: pago.tipo,
      nombreObraSocial: pago.nombreObraSocial ?? "",
      fecha: pago.fecha,
      estado: pago.estado,
      notas: pago.notas ?? "",
    });
    setDialogOpen(true);
  }

  function markAsPaid(pago: Pago) {
    updateMutation.mutate({ id: pago.id, data: { estado: "pagado" } });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.patientId || !form.monto || !form.mes || !form.fecha) {
      toast({ title: "Campos incompletos", description: "Completá paciente, monto, mes y fecha.", variant: "destructive" });
      return;
    }
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const totalPagado = pagos.filter(p => p.estado === "pagado").reduce((acc, p) => acc + parseFloat(p.monto), 0);
  const totalPendiente = pagos.filter(p => p.estado === "pendiente").reduce((acc, p) => acc + parseFloat(p.monto), 0);
  const countPagado = pagos.filter(p => p.estado === "pagado").length;
  const countPendiente = pagos.filter(p => p.estado === "pendiente").length;

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              Agenda de Pagos
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filterMes ? mesLabel(filterMes) : "Todos los meses"} · Seguimiento de cobros por paciente
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Agregar pago
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cobrado</p>
              <p className="font-bold text-foreground">{formatMonto(totalPagado)}</p>
              <p className="text-xs text-muted-foreground">{countPagado} pago{countPagado !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pendiente</p>
              <p className="font-bold text-foreground">{formatMonto(totalPendiente)}</p>
              <p className="text-xs text-muted-foreground">{countPendiente} pago{countPendiente !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-bold text-foreground">{formatMonto(totalPagado + totalPendiente)}</p>
              <p className="text-xs text-muted-foreground">{pagos.length} registro{pagos.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-rose-100 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Por cobrar</p>
              <p className="font-bold text-rose-600">{countPendiente > 0 ? formatMonto(totalPendiente) : "—"}</p>
              <p className="text-xs text-muted-foreground">{countPendiente} pendiente{countPendiente !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={filterMes} onValueChange={setFilterMes}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los meses</SelectItem>
              {mesOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="pagado">Pagado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="particular">Particular</SelectItem>
              <SelectItem value="obra_social">Obra social</SelectItem>
            </SelectContent>
          </Select>

          {(filterEstado !== "todos" || filterTipo !== "todos") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterEstado("todos"); setFilterTipo("todos"); }}
              className="text-muted-foreground"
            >
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
            </div>
          ) : pagos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Sin registros de pago</p>
              <p className="text-xs text-muted-foreground mt-1">Usá el botón "Agregar pago" para registrar el primero.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Paciente</TableHead>
                  <TableHead className="font-semibold">Monto</TableHead>
                  <TableHead className="font-semibold">Mes</TableHead>
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold">Fecha</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagos.map(pago => (
                  <TableRow key={pago.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium">{pago.patientName}</TableCell>
                    <TableCell className="font-mono font-semibold">{formatMonto(pago.monto)}</TableCell>
                    <TableCell className="text-muted-foreground">{mesLabel(pago.mes)}</TableCell>
                    <TableCell>
                      {pago.tipo === "obra_social" ? (
                        <div>
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            Obra social
                          </span>
                          {pago.nombreObraSocial && (
                            <p className="text-xs text-muted-foreground mt-0.5">{pago.nombreObraSocial}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                          Particular
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(pago.fecha + "T12:00:00").toLocaleDateString("es-CL")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          pago.estado === "pagado"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 font-medium"
                            : "border-amber-200 bg-amber-50 text-amber-700 font-medium"
                        }
                      >
                        {pago.estado === "pagado" ? "Pagado" : "Pendiente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {pago.estado === "pendiente" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsPaid(pago)}
                            className="h-8 gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            title="Marcar como pagado"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span className="text-xs">Cobrado</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(pago)}
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                          onClick={() => { setDeleteTarget(pago); setDeleteDialogOpen(true); }}
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) { setDialogOpen(false); setEditTarget(null); setForm(emptyForm); } else setDialogOpen(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Editar pago" : "Nuevo pago"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Paciente */}
            <div className="space-y-1.5">
              <Label>Paciente *</Label>
              <Select
                value={form.patientId}
                onValueChange={v => setForm(f => ({ ...f, patientId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar paciente…" />
                </SelectTrigger>
                <SelectContent>
                  {patientsLoading
                    ? <SelectItem value="" disabled>Cargando…</SelectItem>
                    : patients.map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>

            {/* Monto y Fecha */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Monto (CLP) *</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="ej. 30000"
                  value={form.monto}
                  onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={form.fecha}
                  onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                />
              </div>
            </div>

            {/* Mes */}
            <div className="space-y-1.5">
              <Label>Mes al que corresponde *</Label>
              <Select value={form.mes} onValueChange={v => setForm(f => ({ ...f, mes: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Mes…" />
                </SelectTrigger>
                <SelectContent>
                  {mesOptions.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo */}
            <div className="space-y-1.5">
              <Label>Tipo de pago</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v, nombreObraSocial: "" }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="particular">Particular</SelectItem>
                  <SelectItem value="obra_social">Obra social</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nombre obra social */}
            {form.tipo === "obra_social" && (
              <div className="space-y-1.5">
                <Label>Nombre de la obra social</Label>
                <Input
                  placeholder="ej. OSDE, Swiss Medical…"
                  value={form.nombreObraSocial}
                  onChange={e => setForm(f => ({ ...f, nombreObraSocial: e.target.value }))}
                />
              </div>
            )}

            {/* Estado */}
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={v => setForm(f => ({ ...f, estado: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="pagado">Pagado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notas */}
            <div className="space-y-1.5">
              <Label>Notas (opcional)</Label>
              <Input
                placeholder="Observaciones adicionales…"
                value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setDialogOpen(false); setEditTarget(null); setForm(emptyForm); }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {editTarget ? "Guardar cambios" : "Registrar pago"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar pago</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Confirmar eliminación del pago de <strong>{deleteTarget?.patientName}</strong> por{" "}
            <strong>{deleteTarget ? formatMonto(deleteTarget.monto) : ""}</strong>?
            Esta acción no se puede deshacer.
          </p>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
