import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
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
import { Plus, Pencil, Wallet, TrendingUp, Receipt, Trash2 } from "lucide-react";

import { API_BASE } from "@/lib/api"; // cross-origin backend URL

const MESES_ES: Record<string, string> = {
  "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
  "05": "Mayo", "06": "Junio", "07": "Julio", "08": "Agosto",
  "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre",
};

function mesLabel(mes: string) {
  if (!mes || !mes.includes("-")) return mes;
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
  for (let i = -6; i <= 3; i++) {
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
  notas?: string | null;
};

type Patient = { id: number; name: string };

type Gasto = {
  id: number;
  fecha: string;
  monto: string;
  observacion?: string | null;
};

const emptyGastoForm = {
  fecha: new Date().toISOString().slice(0, 10),
  monto: "",
  observacion: "",
};

const emptyForm = {
  patientId: "",
  monto: "",
  mes: getCurrentMes(),
  tipo: "particular",
  nombreObraSocial: "",
  fecha: new Date().toISOString().slice(0, 10),
  notas: "",
};

export default function RegistroPagos() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [filterMes, setFilterMes] = useState<string>(getCurrentMes());
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  // "mes" = filtrar por mes abonado (campo mes) · "fecha" = filtrar por fecha de ingreso (campo fecha)
  const [filterCriterio, setFilterCriterio] = useState<"mes" | "fecha">("mes");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Pago | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Pago | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<"pagos" | "gastos">("pagos");
  const [gastoDialogOpen, setGastoDialogOpen] = useState(false);
  const [gastoEditTarget, setGastoEditTarget] = useState<Gasto | null>(null);
  const [gastoForm, setGastoForm] = useState(emptyGastoForm);
  const [gastoDeleteTarget, setGastoDeleteTarget] = useState<Gasto | null>(null);

  // Acceso directo desde la agenda: /agenda-pagos?patientId=5&nuevo=1 preselecciona
  // el paciente y abre el formulario de registro de pago.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("patientId");
    if (params.get("nuevo") === "1" && pid) {
      setEditTarget(null);
      setForm({ ...emptyForm, patientId: pid });
      setDialogOpen(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

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
    queryKey: ["pagos", filterTipo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterTipo !== "todos") params.set("tipo", filterTipo);
      const r = await fetch(`${API_BASE}/api/pagos?${params}`, { credentials: "include" });
      if (!r.ok) throw new Error("Error");
      return r.json();
    },
  });

  // El período (mes seleccionado) se aplica en el cliente según el criterio elegido:
  // - "mes abonado" → compara contra el campo `mes` ("YYYY-MM")
  // - "fecha de ingreso" → compara contra el mes del campo `fecha` ("YYYY-MM-DD")
  const pagosFiltrados = useMemo(() => {
    if (!filterMes || filterMes === "todos") return pagos;
    return pagos.filter(p =>
      filterCriterio === "fecha"
        ? (p.fecha ?? "").slice(0, 7) === filterMes
        : p.mes === filterMes
    );
  }, [pagos, filterMes, filterCriterio]);

  // Instantly update the query cache for all active "pagos" queries,
  // then refetch in background to stay in sync with the server.
  function patchCache(updater: (old: Pago[]) => Pago[]) {
    qc.setQueriesData<Pago[]>({ queryKey: ["pagos"] }, (old) => updater(old ?? []));
    qc.invalidateQueries({ queryKey: ["pagos"] });
  }

  const createMutation = useMutation({
    mutationFn: async (data: typeof emptyForm): Promise<Pago> => {
      const r = await fetch(`${API_BASE}/api/pagos`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: parseInt(data.patientId),
          monto: parseFloat(data.monto),
          mes: data.mes,
          tipo: data.tipo,
          nombreObraSocial: data.nombreObraSocial || null,
          fecha: data.fecha,
          notas: data.notas || null,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Error");
      return r.json();
    },
    onSuccess: (newPago) => {
      // Add the new pago to the cache immediately — no waiting for a refetch
      patchCache(old => [...old, newPago].sort((a, b) => a.fecha.localeCompare(b.fecha)));
      toast({ title: "Pago registrado" });
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof emptyForm> }): Promise<Pago> => {
      const r = await fetch(`${API_BASE}/api/pagos/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: data.patientId ? parseInt(data.patientId) : undefined,
          monto: data.monto !== undefined ? parseFloat(data.monto) : undefined,
          mes: data.mes,
          tipo: data.tipo,
          nombreObraSocial: data.nombreObraSocial || null,
          fecha: data.fecha,
          notas: data.notas || null,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Error");
      return r.json();
    },
    onSuccess: (updated) => {
      // Replace the edited row in cache immediately
      patchCache(old => old.map(p => p.id === updated.id ? updated : p));
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
    onSuccess: (_, deletedId) => {
      // Remove the row from cache immediately
      patchCache(old => old.filter(p => p.id !== deletedId));
      toast({ title: "Pago eliminado" });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // ─── Gastos ────────────────────────────────────────────────────────────────
  const { data: gastos = [], isLoading: gastosLoading } = useQuery<Gasto[]>({
    queryKey: ["gastos"],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/gastos`, { credentials: "include" });
      if (!r.ok) throw new Error("Error");
      return r.json();
    },
  });

  const gastosFiltrados = useMemo(() => {
    if (!filterMes || filterMes === "todos") return gastos;
    return gastos.filter(g => (g.fecha ?? "").slice(0, 7) === filterMes);
  }, [gastos, filterMes]);

  function patchGastosCache(updater: (old: Gasto[]) => Gasto[]) {
    qc.setQueriesData<Gasto[]>({ queryKey: ["gastos"] }, (old) => updater(old ?? []));
    qc.invalidateQueries({ queryKey: ["gastos"] });
  }

  const createGastoMutation = useMutation({
    mutationFn: async (data: typeof emptyGastoForm): Promise<Gasto> => {
      const r = await fetch(`${API_BASE}/api/gastos`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: data.fecha,
          monto: parseFloat(data.monto),
          observacion: data.observacion || null,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Error");
      return r.json();
    },
    onSuccess: (nuevo) => {
      patchGastosCache(old => [...old, nuevo].sort((a, b) => a.fecha.localeCompare(b.fecha)));
      toast({ title: "Gasto registrado" });
      setGastoDialogOpen(false);
      setGastoForm(emptyGastoForm);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateGastoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof emptyGastoForm }): Promise<Gasto> => {
      const r = await fetch(`${API_BASE}/api/gastos/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: data.fecha,
          monto: parseFloat(data.monto),
          observacion: data.observacion || null,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Error");
      return r.json();
    },
    onSuccess: (updated) => {
      patchGastosCache(old => old.map(g => g.id === updated.id ? updated : g));
      toast({ title: "Gasto actualizado" });
      setGastoDialogOpen(false);
      setGastoEditTarget(null);
      setGastoForm(emptyGastoForm);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteGastoMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`${API_BASE}/api/gastos/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error((await r.json()).error ?? "Error");
      return r.json();
    },
    onSuccess: (_, deletedId) => {
      patchGastosCache(old => old.filter(g => g.id !== deletedId));
      toast({ title: "Gasto eliminado" });
      setGastoDeleteTarget(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function openCreateGasto() {
    setGastoEditTarget(null);
    setGastoForm(emptyGastoForm);
    setGastoDialogOpen(true);
  }

  function openEditGasto(g: Gasto) {
    setGastoEditTarget(g);
    setGastoForm({ fecha: g.fecha, monto: g.monto, observacion: g.observacion ?? "" });
    setGastoDialogOpen(true);
  }

  function handleGastoSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(gastoForm.monto);
    if (!gastoForm.fecha || !gastoForm.monto || !isFinite(n) || n <= 0) {
      toast({ title: "Campos incompletos", description: "Ingresá fecha y un monto mayor a 0.", variant: "destructive" });
      return;
    }
    if (gastoEditTarget) {
      updateGastoMutation.mutate({ id: gastoEditTarget.id, data: gastoForm });
    } else {
      createGastoMutation.mutate(gastoForm);
    }
  }

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
      notas: pago.notas ?? "",
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditTarget(null);
    setForm(emptyForm);
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

  const totalCobrado = pagosFiltrados.reduce((acc, p) => acc + parseFloat(p.monto), 0);
  const countParticular = pagosFiltrados.filter(p => p.tipo === "particular").length;
  const countObraSocial = pagosFiltrados.filter(p => p.tipo === "obra_social").length;
  const totalGastos = gastosFiltrados.reduce((acc, g) => acc + parseFloat(g.monto), 0);
  const saldo = totalCobrado - totalGastos;

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              {activeTab === "pagos" ? (
                <>
                  <Wallet className="h-6 w-6 text-primary" />
                  💰 Ingresos
                </>
              ) : (
                <>
                  <Receipt className="h-6 w-6 text-primary" />
                  🧾 Gastos
                </>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filterMes && filterMes !== "todos" ? mesLabel(filterMes) : "Todos los meses"}
              {activeTab === "pagos" && (
                <>
                  {" · "}
                  {filterCriterio === "fecha" ? "por fecha de ingreso" : "por mes abonado"}
                </>
              )}
              {" · "}
              {activeTab === "pagos"
                ? "Cobros registrados de los pacientes."
                : "Gastos registrados del profesional."}
            </p>
          </div>
          {activeTab === "pagos" ? (
            <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Registrar pago
            </Button>
          ) : (
            <Button onClick={openCreateGasto} className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Registrar gasto
            </Button>
          )}
        </div>

        {/* Resumen del mes — el contenido se adapta a la pestaña activa */}
        {activeTab === "pagos" ? (
          <div className="grid grid-cols-3 gap-3 rounded-xl border bg-card p-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Cobrado del mes</p>
              <p className="font-bold text-base sm:text-lg text-emerald-600 leading-tight">{formatMonto(totalCobrado)}</p>
            </div>
            <div className="text-center border-x border-border/60">
              <p className="text-xs text-muted-foreground">Gastos del mes</p>
              <p className="font-bold text-base sm:text-lg text-rose-600 leading-tight">{formatMonto(totalGastos)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className={`font-bold text-base sm:text-lg leading-tight ${saldo >= 0 ? "text-foreground" : "text-rose-600"}`}>
                {formatMonto(saldo)}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-4">
            <div className="text-center border-r border-border/60">
              <p className="text-xs text-muted-foreground">Gastos del mes</p>
              <p className="font-bold text-base sm:text-lg text-rose-600 leading-tight">{formatMonto(totalGastos)}</p>
              <p className="text-xs text-muted-foreground">{gastosFiltrados.length} gasto{gastosFiltrados.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Saldo del mes</p>
              <p className={`font-bold text-base sm:text-lg leading-tight ${saldo >= 0 ? "text-foreground" : "text-rose-600"}`}>
                {formatMonto(saldo)}
              </p>
              <p className="text-xs text-muted-foreground">Cobrado − Gastos</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-muted/60 border border-border/60 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab("pagos")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "pagos" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Ingresos
          </button>
          <button
            onClick={() => setActiveTab("gastos")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "gastos" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Gastos
          </button>
        </div>

        {activeTab === "gastos" ? (
          <div className="space-y-4">
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
            </div>

            <div className="rounded-xl border bg-card overflow-hidden">
              {gastosLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
                </div>
              ) : gastosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <Receipt className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">Sin gastos registrados</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Usá el botón "Registrar gasto" para ingresar un gasto.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-semibold">Fecha</TableHead>
                      <TableHead className="font-semibold">Monto</TableHead>
                      <TableHead className="font-semibold">Observación</TableHead>
                      <TableHead className="font-semibold text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gastosFiltrados.map(g => (
                      <TableRow key={g.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="text-sm">
                          {new Date(g.fecha + "T12:00:00").toLocaleDateString("es-CL")}
                        </TableCell>
                        <TableCell className="font-mono font-semibold text-foreground">
                          {formatMonto(g.monto)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[18rem] truncate">
                          {g.observacion || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => openEditGasto(g)}
                              title="Editar"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                              onClick={() => setGastoDeleteTarget(g)}
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
        ) : (
        <>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total cobrado</p>
              <p className="font-bold text-lg text-foreground leading-tight">{formatMonto(totalCobrado)}</p>
              <p className="text-xs text-muted-foreground">{pagosFiltrados.length} registro{pagosFiltrados.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
              <Receipt className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Particular</p>
              <p className="font-bold text-lg text-foreground leading-tight">
                {formatMonto(pagosFiltrados.filter(p => p.tipo === "particular").reduce((a, p) => a + parseFloat(p.monto), 0))}
              </p>
              <p className="text-xs text-muted-foreground">{countParticular} pago{countParticular !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Obra social</p>
              <p className="font-bold text-lg text-foreground leading-tight">
                {formatMonto(pagosFiltrados.filter(p => p.tipo === "obra_social").reduce((a, p) => a + parseFloat(p.monto), 0))}
              </p>
              <p className="text-xs text-muted-foreground">{countObraSocial} pago{countObraSocial !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={filterCriterio} onValueChange={(v) => setFilterCriterio(v as "mes" | "fecha")}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Filtrar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">Filtrar por mes abonado</SelectItem>
              <SelectItem value="fecha">Filtrar por fecha de ingreso</SelectItem>
            </SelectContent>
          </Select>

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

          {filterTipo !== "todos" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterTipo("todos")}
              className="text-muted-foreground"
            >
              Limpiar filtro
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
            </div>
          ) : pagosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Wallet className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Sin cobros registrados</p>
              <p className="text-xs text-muted-foreground mt-1">
                {filterMes && filterMes !== "todos"
                  ? `No hay pagos ${filterCriterio === "fecha" ? "ingresados" : "correspondientes"} a ${mesLabel(filterMes)}.`
                  : 'Usá el botón "Registrar pago" para ingresar un cobro realizado.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Paciente</TableHead>
                  <TableHead className="font-semibold">Monto</TableHead>
                  <TableHead className="font-semibold">Mes abonado</TableHead>
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold">Fecha de ingreso</TableHead>
                  <TableHead className="font-semibold text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagosFiltrados.map(pago => (
                  <TableRow key={pago.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium">{pago.patientName}</TableCell>
                    <TableCell className="font-mono font-semibold text-foreground">
                      {formatMonto(pago.monto)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{mesLabel(pago.mes)}</TableCell>
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
                      <div className="flex items-center justify-end gap-1">
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
        </>
        )}
      </div>

      {/* Add / Edit Gasto Dialog */}
      <Dialog open={gastoDialogOpen} onOpenChange={open => { if (!open) { setGastoDialogOpen(false); setGastoEditTarget(null); setGastoForm(emptyGastoForm); } else setGastoDialogOpen(true); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{gastoEditTarget ? "Editar gasto" : "Registrar gasto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGastoSubmit} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={gastoForm.fecha}
                  onChange={e => setGastoForm(f => ({ ...f, fecha: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Monto (CLP) *</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="ej. 15000"
                  value={gastoForm.monto}
                  onChange={e => setGastoForm(f => ({ ...f, monto: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observación (opcional)</Label>
              <Input
                placeholder="ej. materiales, impresiones…"
                value={gastoForm.observacion}
                onChange={e => setGastoForm(f => ({ ...f, observacion: e.target.value }))}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => { setGastoDialogOpen(false); setGastoEditTarget(null); setGastoForm(emptyGastoForm); }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createGastoMutation.isPending || updateGastoMutation.isPending}>
                {gastoEditTarget ? "Guardar cambios" : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Gasto confirm */}
      <Dialog open={!!gastoDeleteTarget} onOpenChange={open => { if (!open) setGastoDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar gasto</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar el gasto de {gastoDeleteTarget ? formatMonto(gastoDeleteTarget.monto) : ""} del{" "}
            {gastoDeleteTarget ? new Date(gastoDeleteTarget.fecha + "T12:00:00").toLocaleDateString("es-CL") : ""}?
            Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGastoDeleteTarget(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => gastoDeleteTarget && deleteGastoMutation.mutate(gastoDeleteTarget.id)}
              disabled={deleteGastoMutation.isPending}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) closeDialog(); else setDialogOpen(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Editar pago" : "Registrar pago"}</DialogTitle>
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
                    ? <SelectItem value="__loading__" disabled>Cargando…</SelectItem>
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
                <Label>Fecha de ingreso *</Label>
                <Input
                  type="date"
                  value={form.fecha}
                  onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                />
                <p className="text-[11px] text-muted-foreground leading-tight">Día real en que se recibió el dinero.</p>
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
              <Select
                value={form.tipo}
                onValueChange={v => setForm(f => ({ ...f, tipo: v, nombreObraSocial: "" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="particular">Particular</SelectItem>
                  <SelectItem value="obra_social">Obra social</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nombre obra social (conditional) */}
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
              <Button type="button" variant="outline" onClick={closeDialog}>
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
            ¿Confirmar eliminación del pago de{" "}
            <strong>{deleteTarget?.patientName}</strong> por{" "}
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
