import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Users, Plus, UserCheck, UserX, Edit2, X, Check,
  ArrowLeft, ShieldCheck, Stethoscope, Eye, EyeOff, KeyRound,
  History, UserCircle, ClipboardList, Trash2, RotateCcw,
  CalendarDays, Activity, Search, CreditCard, DollarSign, FileText,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { API_BASE } from "@/lib/api";

const SPECIALTIES = [
  "Fonoaudiología",
  "Psicopedagogía",
  "Psicología",
  "Terapia Ocupacional",
  "Kinesiología",
  "Neurología",
  "Otro",
];

type UserStats = {
  pacientesAsignados: number;
  sesionesRegistradas: number;
  pacientesConSesion: number;
  sesionesEsteMes: number;
  ultimaActividad: string | null;
};

type CommercialStatus = "trial" | "paying" | "overdue" | "courtesy" | "churned";

type AppUser = {
  id: number;
  email: string;
  name: string;
  role: string;
  specialty: string | null;
  active: boolean;
  createdAt: string;
  commercialStatus: CommercialStatus;
  trialStartDate: string | null;
  trialEndDate: string | null;
  lastPaymentDate: string | null;
  nextDueDate: string | null;
  monthlyAmount: string | null;
  paymentMethod: string | null;
  internalNotes: string | null;
  stats?: UserStats;
};

const COMMERCIAL_META: Record<CommercialStatus, { label: string; className: string }> = {
  trial:    { label: "En prueba",    className: "border-sky-500/40 text-sky-600" },
  paying:   { label: "Pagando",      className: "border-emerald-500/40 text-emerald-600" },
  overdue:  { label: "Pago vencido", className: "border-rose-500/40 text-rose-600" },
  courtesy: { label: "Cortesía",     className: "border-violet-500/40 text-violet-600" },
  churned:  { label: "Baja",         className: "border-muted-foreground/40 text-muted-foreground" },
};

const COMMERCIAL_OPTIONS: { value: CommercialStatus; label: string }[] = [
  { value: "trial", label: "En prueba" },
  { value: "paying", label: "Pagando" },
  { value: "overdue", label: "Pago vencido" },
  { value: "courtesy", label: "Cortesía" },
  { value: "churned", label: "Baja" },
];

function isWithinDays(iso: string | null, days: number): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return false;
  const delta = Date.now() - t;
  return delta >= 0 && delta <= days * 24 * 60 * 60 * 1000;
}

function isOverdue(u: AppUser): boolean {
  if (u.commercialStatus === "overdue") return true;
  if (u.nextDueDate) {
    const due = new Date(`${u.nextDueDate}T23:59:59`).getTime();
    if (!isNaN(due) && due < Date.now()) return true;
  }
  return false;
}

const EMPTY_STATS: UserStats = {
  pacientesAsignados: 0,
  sesionesRegistradas: 0,
  pacientesConSesion: 0,
  sesionesEsteMes: 0,
  ultimaActividad: null,
};

type ActivityFilter =
  | "todos"
  | "con-pacientes"
  | "sin-pacientes"
  | "con-sesiones-mes"
  | "sin-sesiones-mes"
  | "activos-30"
  | "inactivos-30"
  | "pagando"
  | "en-prueba"
  | "vencidos"
  | "cortesia"
  | "dados-de-baja";

function normalizeText(s: string | null | undefined) {
  return (s ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function roleLabel(role: string) {
  if (role === "admin") return "admin administrador";
  if (role === "professional") return "professional profesional";
  return role;
}

const emptyForm = {
  name: "",
  email: "",
  role: "professional" as "admin" | "professional",
  specialty: "",
  password: "",
  confirmPassword: "",
};

export default function Usuarios() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [users, setUsers]       = useState<AppUser[]>([]);
  const [loading, setLoading]   = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [saving, setSaving]     = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  const [editingId, setEditingId]   = useState<number | null>(null);
  const [editForm, setEditForm]     = useState<Partial<AppUser & { password: string }>>({});
  const [showEditPwd, setShowEditPwd] = useState(false);

  const [resettingId, setResettingId]   = useState<number | null>(null);
  const [resetPwd, setResetPwd]         = useState("");
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [savingReset, setSavingReset]   = useState(false);

  const [search, setSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("todos");

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const loadAll = async () => {
    setLoading(true);
    try {
      const uRes = await fetch(`${API_BASE}/api/users`, { credentials: "include" });
      if (uRes.ok) setUsers(await uRes.json());
      else toast({ title: "Error al cargar usuarios", variant: "destructive" });
    } catch {
      toast({ title: "Error de conexión", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // ── Resumen general ─────────────────────────────────────────────────────────
  // El resumen y los conteos consideran solo usuarios activos; los dados de baja
  // (active = false) se cuentan y se listan por separado.
  const summary = useMemo(() => {
    let activosEsteMes = 0;
    let conPacientes = 0;
    let conSesiones = 0;
    let sinPacientes = 0;
    let sinActividad = 0;
    let conSesionesMes = 0;
    let activos30 = 0;
    let pagando = 0;
    let enPrueba = 0;
    let vencidos = 0;
    let cortesia = 0;

    const activos = users.filter(u => u.active);
    for (const u of activos) {
      const s = u.stats ?? EMPTY_STATS;
      if (s.sesionesEsteMes > 0) { activosEsteMes++; conSesionesMes++; }
      if (s.pacientesAsignados > 0) conPacientes++;
      if (s.sesionesRegistradas > 0) conSesiones++;
      if (s.pacientesAsignados === 0) sinPacientes++;
      if (s.pacientesAsignados === 0 && s.sesionesRegistradas === 0) sinActividad++;
      if (isWithinDays(s.ultimaActividad, 30)) activos30++;
      if (u.commercialStatus === "paying") pagando++;
      else if (u.commercialStatus === "trial") enPrueba++;
      else if (u.commercialStatus === "courtesy") cortesia++;
      if (isOverdue(u)) vencidos++;
    }

    // Total de sesiones considerando a todos los usuarios (para "Mi perfil").
    let totalSesiones = 0;
    for (const u of users) totalSesiones += u.stats?.sesionesRegistradas ?? 0;

    const activosCount = activos.length;
    const dadosDeBaja = users.length - activosCount;
    const hayDatos = users.length > 0;
    return {
      activosEsteMes, conPacientes, conSesiones, sinPacientes, sinActividad,
      conSesionesMes, activos30, pagando, enPrueba, vencidos, cortesia,
      totalSesiones, activosCount, dadosDeBaja, hayDatos,
    };
  }, [users]);

  // ── Create user ────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: "Nombre y email son obligatorios", variant: "destructive" });
      return;
    }
    if (!form.password.trim() || form.password.trim().length < 6) {
      toast({ title: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE}/api/users`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), role: form.role, specialty: form.specialty || null, password: form.password.trim() }),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); toast({ title: e.error ?? "Error al crear", variant: "destructive" }); return; }
      toast({ title: "Usuario creado" });
      setForm(emptyForm); setShowForm(false);
      await loadAll();
    } finally { setSaving(false); }
  };

  // ── Toggle active ──────────────────────────────────────────────────────────
  const handleToggleActive = async (u: AppUser) => {
    const r = await fetch(`${API_BASE}/api/users/${u.id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    if (r.ok) { toast({ title: u.active ? "Usuario desactivado" : "Usuario activado" }); await loadAll(); }
  };

  // ── Delete user ────────────────────────────────────────────────────────────
  const handleDelete = async (u: AppUser) => {
    if (!window.confirm(`¿Desactivar permanentemente a ${u.name}?`)) return;
    const r = await fetch(`${API_BASE}/api/users/${u.id}`, { method: "DELETE", credentials: "include" });
    if (r.ok) { toast({ title: "Usuario desactivado" }); await loadAll(); }
    else toast({ title: "Error al eliminar usuario", variant: "destructive" });
  };

  // ── Inline edit ────────────────────────────────────────────────────────────
  const startEdit = (u: AppUser) => {
    setEditingId(u.id);
    setEditForm({
      name: u.name, email: u.email, role: u.role as any, specialty: u.specialty ?? "", password: "",
      commercialStatus: u.commercialStatus,
      trialStartDate: u.trialStartDate ?? "",
      trialEndDate: u.trialEndDate ?? "",
      lastPaymentDate: u.lastPaymentDate ?? "",
      nextDueDate: u.nextDueDate ?? "",
      monthlyAmount: u.monthlyAmount ?? "",
      paymentMethod: u.paymentMethod ?? "",
      internalNotes: u.internalNotes ?? "",
    });
    setShowEditPwd(false);
  };
  const cancelEdit = () => { setEditingId(null); setEditForm({}); setShowEditPwd(false); };

  const saveEdit = async (id: number) => {
    if (editForm.password && editForm.password.trim().length < 6) {
      toast({ title: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: editForm.name, email: editForm.email, role: editForm.role, specialty: editForm.specialty || null,
        commercialStatus: editForm.commercialStatus,
        trialStartDate: editForm.trialStartDate || null,
        trialEndDate: editForm.trialEndDate || null,
        lastPaymentDate: editForm.lastPaymentDate || null,
        nextDueDate: editForm.nextDueDate || null,
        monthlyAmount: editForm.monthlyAmount ?? "",
        paymentMethod: editForm.paymentMethod || null,
        internalNotes: editForm.internalNotes || null,
      };
      if (editForm.password?.trim()) payload.password = editForm.password.trim();
      const r = await fetch(`${API_BASE}/api/users/${id}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (r.ok) { toast({ title: "Usuario actualizado" }); cancelEdit(); await loadAll(); }
      else { const e = await r.json().catch(() => ({})); toast({ title: e.error ?? "Error al actualizar", variant: "destructive" }); }
    } finally { setSaving(false); }
  };

  // ── Reset password ─────────────────────────────────────────────────────────
  const startReset = (u: AppUser) => { setResettingId(u.id); setResetPwd(""); setShowResetPwd(false); if (editingId) cancelEdit(); };
  const cancelReset = () => { setResettingId(null); setResetPwd(""); };

  const saveReset = async (id: number) => {
    if (!resetPwd.trim() || resetPwd.trim().length < 6) {
      toast({ title: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" }); return;
    }
    setSavingReset(true);
    try {
      const r = await fetch(`${API_BASE}/api/users/${id}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPwd.trim() }),
      });
      if (r.ok) { toast({ title: "Contraseña restablecida" }); cancelReset(); }
      else toast({ title: "Error al restablecer contraseña", variant: "destructive" });
    } finally { setSavingReset(false); }
  };

  const activeUsers   = users.filter(u => u.active);
  const inactiveUsers = users.filter(u => !u.active);

  // Filtered list shown in the Usuarios tab. Searches by name, email,
  // specialty and role (both internal value and Spanish label).
  const filteredUsers = useMemo(() => {
    const q = normalizeText(search);
    return users.filter(u => {
      const s = u.stats ?? EMPTY_STATS;

      // Los dados de baja se muestran solo en su propio filtro; el resto de los
      // filtros operan únicamente sobre usuarios activos.
      if (activityFilter === "dados-de-baja") {
        if (u.active) return false;
      } else {
        if (!u.active) return false;
        if (activityFilter === "con-pacientes" && !(s.pacientesAsignados > 0)) return false;
        if (activityFilter === "sin-pacientes" && s.pacientesAsignados !== 0) return false;
        if (activityFilter === "con-sesiones-mes" && !(s.sesionesEsteMes > 0)) return false;
        if (activityFilter === "sin-sesiones-mes" && s.sesionesEsteMes !== 0) return false;
        if (activityFilter === "activos-30" && !isWithinDays(s.ultimaActividad, 30)) return false;
        if (activityFilter === "inactivos-30" && isWithinDays(s.ultimaActividad, 30)) return false;
        if (activityFilter === "pagando" && u.commercialStatus !== "paying") return false;
        if (activityFilter === "en-prueba" && u.commercialStatus !== "trial") return false;
        if (activityFilter === "vencidos" && !isOverdue(u)) return false;
        if (activityFilter === "cortesia" && u.commercialStatus !== "courtesy") return false;
      }

      // Text search
      if (q) {
        const haystack = [
          u.name,
          u.email,
          u.specialty ?? "",
          roleLabel(u.role),
          COMMERCIAL_META[u.commercialStatus]?.label ?? "",
        ].map(normalizeText).join(" ");
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [users, search, activityFilter]);

  const activityFilterOptions: { value: ActivityFilter; label: string; count: number }[] = [
    { value: "todos",            label: "Todos",                  count: summary.activosCount },
    { value: "con-pacientes",    label: "Con pacientes",          count: summary.conPacientes },
    { value: "sin-pacientes",    label: "Sin pacientes",          count: summary.sinPacientes },
    { value: "con-sesiones-mes", label: "Con sesiones este mes",  count: summary.conSesionesMes },
    { value: "sin-sesiones-mes", label: "Sin sesiones este mes",  count: summary.activosCount - summary.conSesionesMes },
    { value: "activos-30",       label: "Activos últimos 30 días", count: summary.activos30 },
    { value: "inactivos-30",     label: "Inactivos +30 días",     count: summary.activosCount - summary.activos30 },
  ];

  const commercialFilterOptions: { value: ActivityFilter; label: string; count: number }[] = [
    { value: "pagando",       label: "Pagando",       count: summary.pagando },
    { value: "en-prueba",     label: "En prueba",     count: summary.enPrueba },
    { value: "vencidos",      label: "Vencidos",      count: summary.vencidos },
    { value: "cortesia",      label: "Cortesía",      count: summary.cortesia },
    { value: "dados-de-baja", label: "Dados de baja", count: summary.dadosDeBaja },
  ];

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });

  // Fechas «solo día» (columnas date, formato YYYY-MM-DD) sin corrimiento de zona.
  const formatDateOnly = (d: string | null) =>
    d ? new Date(`${d}T00:00:00`).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const formatMoney = (v: string | null) => {
    if (v == null || v === "") return "—";
    const n = Number(v);
    if (isNaN(n)) return v;
    return `$${n.toLocaleString("es-CL")}`;
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-5 animate-in fade-in duration-400 max-w-4xl mx-auto">

        {/* Back */}
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground/80 transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" /> Volver al panel
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Panel de usuarios</h1>
            <p className="text-sm text-muted-foreground">
              {activeUsers.length} usuario{activeUsers.length !== 1 ? "s" : ""} activo{activeUsers.length !== 1 ? "s" : ""}
              {inactiveUsers.length > 0 && ` · ${inactiveUsers.length} inactivo${inactiveUsers.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <Tabs defaultValue="usuarios">
          <TabsList className="bg-card border border-border/50 p-1 rounded-xl shadow-sm h-auto gap-1">
            <TabsTrigger value="usuarios" className="rounded-lg text-sm flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Usuarios
              {users.length > 0 && (
                <span className="ml-0.5 bg-primary/10 text-primary text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">{users.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="auditoria" className="rounded-lg text-sm flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" /> Auditoría
            </TabsTrigger>
            <TabsTrigger value="mi-perfil" className="rounded-lg text-sm flex items-center gap-1.5">
              <UserCircle className="h-3.5 w-3.5" /> Mi perfil
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* Usuarios tab                                                        */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="usuarios" className="mt-5 space-y-4">

            {/* ── Resumen de uso (solo usuarios activos) ── */}
            {!loading && summary.hayDatos && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" /> Activos este mes
                    </div>
                    <p className="mt-1 text-2xl font-display font-bold text-foreground">{summary.activosEsteMes}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5 text-primary" /> Con pacientes
                    </div>
                    <p className="mt-1 text-2xl font-display font-bold text-foreground">{summary.conPacientes}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ClipboardList className="h-3.5 w-3.5 text-primary" /> Con sesiones
                    </div>
                    <p className="mt-1 text-2xl font-display font-bold text-foreground">{summary.conSesiones}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <UserX className="h-3.5 w-3.5 text-muted-foreground" /> Sin actividad
                    </div>
                    <p className="mt-1 text-2xl font-display font-bold text-foreground">{summary.sinActividad}</p>
                  </div>
                </div>

                {/* Resumen comercial */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/40 shadow-sm p-4">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                      <CreditCard className="h-3.5 w-3.5" /> Pagando
                    </div>
                    <p className="mt-1 text-2xl font-display font-bold text-emerald-700">{summary.pagando}</p>
                  </div>
                  <div className="rounded-2xl border border-sky-500/30 bg-sky-50/40 shadow-sm p-4">
                    <div className="flex items-center gap-1.5 text-xs text-sky-700">
                      <CalendarDays className="h-3.5 w-3.5" /> En prueba
                    </div>
                    <p className="mt-1 text-2xl font-display font-bold text-sky-700">{summary.enPrueba}</p>
                  </div>
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-50/40 shadow-sm p-4">
                    <div className="flex items-center gap-1.5 text-xs text-rose-700">
                      <DollarSign className="h-3.5 w-3.5" /> Pago vencido
                    </div>
                    <p className="mt-1 text-2xl font-display font-bold text-rose-700">{summary.vencidos}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <UserX className="h-3.5 w-3.5 text-muted-foreground" /> Dados de baja
                    </div>
                    <p className="mt-1 text-2xl font-display font-bold text-foreground">{summary.dadosDeBaja}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-muted-foreground">
                {activeUsers.length} activo{activeUsers.length !== 1 ? "s" : ""} · {inactiveUsers.length} inactivo{inactiveUsers.length !== 1 ? "s" : ""}
              </p>
              <Button onClick={() => setShowForm(v => !v)} className="gap-2 bg-gradient-to-br from-primary to-primary/80 text-white">
                {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {showForm ? "Cancelar" : "Nuevo usuario"}
              </Button>
            </div>

            {/* ── Create form ── */}
            {showForm && (
              <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-5 space-y-4">
                <h2 className="font-semibold text-foreground">Crear nuevo usuario</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nombre completo <span className="text-primary/60">*</span></label>
                    <Input placeholder="Nombre" value={form.name} onChange={e => set("name", e.target.value)} className="bg-muted/30" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Email <span className="text-primary/60">*</span></label>
                    <Input type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={e => set("email", e.target.value)} className="bg-muted/30" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5 text-muted-foreground" />Contraseña <span className="text-primary/60">*</span></label>
                    <div className="relative">
                      <Input type={showPwd ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={form.password} onChange={e => set("password", e.target.value)} className="bg-muted/30 pr-10" />
                      <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Confirmar contraseña <span className="text-primary/60">*</span></label>
                    <Input type={showPwd ? "text" : "password"} placeholder="Repite la contraseña" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} className={`bg-muted/30 ${form.confirmPassword && form.password !== form.confirmPassword ? "border-destructive/50" : ""}`} />
                    {form.confirmPassword && form.password !== form.confirmPassword && <p className="text-[11px] text-destructive">Las contraseñas no coinciden</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Rol</label>
                    <select value={form.role} onChange={e => set("role", e.target.value)} className="w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="professional">Profesional</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Especialidad</label>
                    <select value={form.specialty} onChange={e => set("specialty", e.target.value)} className="w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">Sin especificar</option>
                      {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-border/40">
                  <Button variant="outline" onClick={() => { setShowForm(false); setForm(emptyForm); setShowPwd(false); }}>Cancelar</Button>
                  <Button onClick={handleCreate} disabled={saving || !form.name.trim() || !form.email.trim() || !form.password.trim() || form.password !== form.confirmPassword} className="bg-gradient-to-br from-accent to-accent/80 text-white gap-2">
                    {saving ? "Guardando…" : "Crear usuario"}
                  </Button>
                </div>
              </div>
            )}

            {/* ── Search ── */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre, email, especialidad o rol…"
                className="pl-9 pr-9 h-11 bg-card border-border focus-visible:border-primary"
                aria-label="Buscar usuarios"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {(search.trim() || activityFilter !== "todos") && !loading && (
                <p className="text-xs text-muted-foreground mt-2 px-1">
                  Mostrando {filteredUsers.length} de {users.length} usuario{users.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* ── Filtros rápidos ── */}
            {!loading && users.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-2 mr-1">Actividad</span>
                  {activityFilterOptions.map(f => {
                    const active = activityFilter === f.value;
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setActivityFilter(f.value)}
                        aria-pressed={active}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? "bg-primary text-white border-primary shadow-sm"
                            : "bg-card text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        {f.label}
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full leading-none ${active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                          {f.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-start gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-2 mr-1">Comercial</span>
                  {commercialFilterOptions.map(f => {
                    const active = activityFilter === f.value;
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setActivityFilter(f.value)}
                        aria-pressed={active}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? "bg-primary text-white border-primary shadow-sm"
                            : "bg-card text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        {f.label}
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full leading-none ${active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                          {f.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Users list ── */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-muted/40 animate-pulse" />)}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground rounded-2xl border border-dashed border-border">
                No hay usuarios registrados.
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground rounded-2xl border border-dashed border-border">
                No se encontraron usuarios.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map(u => {
                  const stats  = u.stats ?? EMPTY_STATS;
                  const sinActividad = stats.pacientesAsignados === 0 && stats.sesionesRegistradas === 0;
                  const isEditing   = editingId === u.id;
                  const isResetting = resettingId === u.id;

                  return (
                    <div key={u.id} className={`rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden transition-opacity ${!u.active ? "opacity-60" : ""}`}>

                      {/* ── View row ── */}
                      {!isEditing && !isResetting && (
                        <div className="p-4">
                          {/* Top: avatar + info + actions */}
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 font-bold text-base ${u.role === "admin" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-foreground">{u.name}</span>
                                {u.role === "admin" ? (
                                  <Badge variant="outline" className="text-xs gap-1 border-primary/40 text-primary py-0">
                                    <ShieldCheck className="h-3 w-3" />Admin
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs gap-1 border-accent/40 text-accent py-0">
                                    <Stethoscope className="h-3 w-3" />Profesional
                                  </Badge>
                                )}
                                {!u.active && <Badge variant="outline" className="text-xs text-muted-foreground py-0">Inactivo</Badge>}
                                <Badge variant="outline" className={`text-xs gap-1 py-0 ${COMMERCIAL_META[u.commercialStatus]?.className ?? ""}`}>
                                  <CreditCard className="h-3 w-3" />{COMMERCIAL_META[u.commercialStatus]?.label ?? u.commercialStatus}
                                </Badge>
                                {stats.pacientesAsignados > 0 && (
                                  <Badge variant="outline" className="text-xs gap-1 border-emerald-500/40 text-emerald-600 py-0">
                                    <Users className="h-3 w-3" />Tiene pacientes
                                  </Badge>
                                )}
                                {stats.sesionesRegistradas > 0 && (
                                  <Badge variant="outline" className="text-xs gap-1 border-sky-500/40 text-sky-600 py-0">
                                    <ClipboardList className="h-3 w-3" />Tiene sesiones
                                  </Badge>
                                )}
                                {sinActividad && (
                                  <Badge variant="outline" className="text-xs gap-1 border-muted-foreground/30 text-muted-foreground py-0">
                                    <Activity className="h-3 w-3" />Sin actividad
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{u.email}</p>
                              {u.specialty && (
                                <p className="text-xs text-foreground/60 mt-0.5">{u.specialty}</p>
                              )}
                            </div>

                            {/* Action icons */}
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                onClick={() => startEdit(u)}
                                className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                                title="Editar usuario"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => startReset(u)}
                                className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                title="Restablecer contraseña"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleActive(u)}
                                className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors ${u.active ? "text-muted-foreground hover:text-rose-500 hover:bg-rose-50" : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"}`}
                                title={u.active ? "Desactivar usuario" : "Activar usuario"}
                              >
                                {u.active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                              </button>
                              {u.id !== currentUser?.id && (
                                <button
                                  onClick={() => handleDelete(u)}
                                  className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                                  title="Eliminar usuario"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Stats strip */}
                          <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-5 flex-wrap">
                            {sinActividad ? (
                              <span className="flex items-center gap-1.5 text-xs text-muted-foreground/70 italic">
                                <Activity className="h-3 w-3 text-muted-foreground/50" />
                                Sin actividad registrada
                              </span>
                            ) : (
                              <>
                                {stats.pacientesAsignados > 0 && (
                                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Users className="h-3 w-3 text-muted-foreground/60" />
                                    <span className="font-semibold text-foreground">{stats.pacientesAsignados}</span> paciente{stats.pacientesAsignados !== 1 ? "s" : ""} asignado{stats.pacientesAsignados !== 1 ? "s" : ""}
                                  </span>
                                )}
                                {stats.sesionesRegistradas > 0 && (
                                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <ClipboardList className="h-3 w-3 text-muted-foreground/60" />
                                    <span className="font-semibold text-foreground">{stats.sesionesRegistradas}</span> sesión{stats.sesionesRegistradas !== 1 ? "es" : ""} registrada{stats.sesionesRegistradas !== 1 ? "s" : ""}
                                  </span>
                                )}
                                {stats.ultimaActividad && (
                                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Activity className="h-3 w-3 text-muted-foreground/60" />
                                    <span className="text-muted-foreground/60">Última actividad:</span>
                                    <span className="text-foreground">{formatDate(stats.ultimaActividad)}</span>
                                  </span>
                                )}
                              </>
                            )}
                            {u.monthlyAmount && (
                              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <DollarSign className="h-3 w-3 text-muted-foreground/60" />
                                <span className="text-muted-foreground/60">Mensual:</span>
                                <span className="text-foreground">{formatMoney(u.monthlyAmount)}</span>
                              </span>
                            )}
                            {u.nextDueDate && (
                              <span className={`flex items-center gap-1.5 text-xs ${isOverdue(u) ? "text-rose-600" : "text-muted-foreground"}`}>
                                <CreditCard className="h-3 w-3 opacity-60" />
                                <span className="opacity-60">Próximo venc.:</span>
                                <span className={isOverdue(u) ? "font-semibold" : "text-foreground"}>{formatDateOnly(u.nextDueDate)}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                              <CalendarDays className="h-3 w-3 text-muted-foreground/60" />
                              Miembro desde {formatDate(u.createdAt)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* ── Inline edit form ── */}
                      {isEditing && (
                        <div className="p-4 space-y-3 bg-muted/20">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Editar — {u.name}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">Nombre</label>
                              <Input value={editForm.name ?? ""} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="bg-background h-8 text-sm" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">Email</label>
                              <Input value={editForm.email ?? ""} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="bg-background h-8 text-sm" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">Rol</label>
                              <select value={editForm.role ?? "professional"} onChange={e => setEditForm(f => ({ ...f, role: e.target.value as any }))} className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm">
                                <option value="professional">Profesional</option>
                                <option value="admin">Administrador</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">Especialidad</label>
                              <select value={editForm.specialty ?? ""} onChange={e => setEditForm(f => ({ ...f, specialty: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm">
                                <option value="">Sin especificar</option>
                                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><KeyRound className="h-3 w-3" />Nueva contraseña (dejar en blanco para no cambiar)</label>
                              <div className="relative">
                                <Input type={showEditPwd ? "text" : "password"} placeholder="Nueva contraseña (opcional)" value={editForm.password ?? ""} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} className="bg-background h-8 text-sm pr-10" />
                                <button type="button" onClick={() => setShowEditPwd(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                                  {showEditPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* ── Datos comerciales ── */}
                          <div className="pt-2 mt-1 border-t border-border/40">
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                              <CreditCard className="h-3.5 w-3.5" /> Datos comerciales
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Estado comercial</label>
                                <select value={editForm.commercialStatus ?? "trial"} onChange={e => setEditForm(f => ({ ...f, commercialStatus: e.target.value as CommercialStatus }))} className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm">
                                  {COMMERCIAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" />Monto mensual</label>
                                <Input type="number" inputMode="decimal" placeholder="0" value={editForm.monthlyAmount ?? ""} onChange={e => setEditForm(f => ({ ...f, monthlyAmount: e.target.value }))} className="bg-background h-8 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Inicio de prueba</label>
                                <Input type="date" value={editForm.trialStartDate ?? ""} onChange={e => setEditForm(f => ({ ...f, trialStartDate: e.target.value }))} className="bg-background h-8 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Fin de prueba</label>
                                <Input type="date" value={editForm.trialEndDate ?? ""} onChange={e => setEditForm(f => ({ ...f, trialEndDate: e.target.value }))} className="bg-background h-8 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Último pago</label>
                                <Input type="date" value={editForm.lastPaymentDate ?? ""} onChange={e => setEditForm(f => ({ ...f, lastPaymentDate: e.target.value }))} className="bg-background h-8 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Próximo vencimiento</label>
                                <Input type="date" value={editForm.nextDueDate ?? ""} onChange={e => setEditForm(f => ({ ...f, nextDueDate: e.target.value }))} className="bg-background h-8 text-sm" />
                              </div>
                              <div className="space-y-1 sm:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><CreditCard className="h-3 w-3" />Método de pago</label>
                                <Input placeholder="Transferencia, tarjeta, efectivo…" value={editForm.paymentMethod ?? ""} onChange={e => setEditForm(f => ({ ...f, paymentMethod: e.target.value }))} className="bg-background h-8 text-sm" />
                              </div>
                              <div className="space-y-1 sm:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><FileText className="h-3 w-3" />Observaciones internas</label>
                                <textarea value={editForm.internalNotes ?? ""} onChange={e => setEditForm(f => ({ ...f, internalNotes: e.target.value }))} rows={2} placeholder="Notas internas (no visibles para el profesional)" className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm resize-y" />
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end pt-1">
                            <Button variant="outline" size="sm" onClick={cancelEdit}><X className="h-3 w-3 mr-1" />Cancelar</Button>
                            <Button size="sm" onClick={() => saveEdit(u.id)} disabled={saving} className="bg-primary text-white gap-1">
                              <Check className="h-3 w-3" />Guardar
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* ── Inline reset password ── */}
                      {isResetting && (
                        <div className="p-4 space-y-3 bg-amber-50/60 border-t border-amber-100">
                          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                            <RotateCcw className="h-3.5 w-3.5" /> Restablecer contraseña — {u.name}
                          </p>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Nueva contraseña</label>
                            <div className="relative max-w-xs">
                              <Input
                                type={showResetPwd ? "text" : "password"}
                                placeholder="Mínimo 6 caracteres"
                                value={resetPwd}
                                onChange={e => setResetPwd(e.target.value)}
                                className="bg-background h-8 text-sm pr-10"
                              />
                              <button type="button" onClick={() => setShowResetPwd(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                                {showResetPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={cancelReset}><X className="h-3 w-3 mr-1" />Cancelar</Button>
                            <Button size="sm" onClick={() => saveReset(u.id)} disabled={savingReset || !resetPwd.trim()} className="bg-amber-600 text-white gap-1 hover:bg-amber-700">
                              <Check className="h-3 w-3" />{savingReset ? "Guardando…" : "Establecer contraseña"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* Auditoría tab                                                       */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="auditoria" className="mt-5 space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Registro de usuarios</h2>
                <span className="ml-auto text-xs text-muted-foreground">{users.length} en total</span>
              </div>
              <div className="divide-y divide-border/40">
                {loading ? (
                  <div className="px-5 py-4 text-sm text-muted-foreground">Cargando…</div>
                ) : (
                  [...users]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map(u => {
                      const stats = u.stats ?? EMPTY_STATS;
                      return (
                        <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${u.role === "admin" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                              {u.role === "admin"
                                ? <Badge variant="outline" className="text-[10px] gap-0.5 border-primary/40 text-primary py-0"><ShieldCheck className="h-2.5 w-2.5" />Admin</Badge>
                                : <Badge variant="outline" className="text-[10px] gap-0.5 border-accent/40 text-accent py-0"><Stethoscope className="h-2.5 w-2.5" />Prof.</Badge>}
                              {!u.active && <Badge variant="outline" className="text-[10px] text-muted-foreground py-0">Inactivo</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{u.email}{u.specialty ? ` · ${u.specialty}` : ""}</p>
                          </div>
                          <div className="flex items-center gap-4 shrink-0 text-right">
                            <span className="text-xs text-muted-foreground hidden sm:block">
                              <span className="font-semibold text-foreground">{stats.pacientesAsignados}</span> pac · <span className="font-semibold text-foreground">{stats.sesionesRegistradas}</span> ses
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1 hidden md:flex" title="Última actividad registrada">
                              <Activity className="h-3 w-3" />
                              {stats.ultimaActividad
                                ? <span>{formatDate(stats.ultimaActividad)}</span>
                                : <span className="italic">Sin actividad</span>}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" /> {formatDate(u.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-muted/40 border border-border/40 px-4 py-3">
              <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                El historial clínico detallado (sesiones, objetivos, cambios) está disponible en cada perfil de paciente. El registro de accesos y cambios de configuración estará disponible en una próxima versión.
              </p>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* Mi perfil tab                                                       */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="mi-perfil" className="mt-5">
            <div className="max-w-md space-y-4">
              {currentUser && (
                <>
                  {/* Identity card */}
                  <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-5">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-14 w-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xl font-bold text-primary">{currentUser.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{currentUser.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                        <Badge variant="outline" className="mt-1.5 text-[10px] gap-1 border-primary/40 text-primary">
                          <ShieldCheck className="h-2.5 w-2.5" /> Administrador
                        </Badge>
                      </div>
                    </div>
                    <div className="border-t border-border pt-3">
                      <p className="text-xs text-muted-foreground mb-2">Para editar nombre, contraseña o especialidad:</p>
                      <Button size="sm" variant="outline" onClick={() => navigate("/usuario")} className="gap-1.5">
                        <UserCircle className="h-3.5 w-3.5" /> Ir a Mi perfil completo
                      </Button>
                    </div>
                  </div>

                  {/* System stats */}
                  <div className="rounded-2xl border border-border/60 bg-card shadow-sm p-5 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">Resumen del sistema</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 rounded-xl bg-muted/40 border border-border/40">
                        <p className="text-2xl font-bold text-foreground">{users.length}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Usuarios</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <p className="text-2xl font-bold text-emerald-700">{activeUsers.length}</p>
                        <p className="text-[10px] text-emerald-600 mt-0.5">Activos</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-muted/40 border border-border/40">
                        <p className="text-2xl font-bold text-muted-foreground">{summary.totalSesiones}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Sesiones total</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
