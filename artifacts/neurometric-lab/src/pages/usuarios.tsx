import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import {
  Users, Plus, UserCheck, UserX, Edit2, X, Check,
  ArrowLeft, ShieldCheck, Stethoscope, Eye, EyeOff, KeyRound,
  History, UserCircle, Trash2, RotateCcw,
  CalendarDays, Activity, Search, CreditCard, DollarSign, FileText,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { responseErrorMessage } from "@/lib/api-error";
import { useAuth } from "@/contexts/auth-context";
import { API_BASE } from "@/lib/api";
import { normalizeReferralCode } from "@/lib/referral";
import { useReferral, validateReferralCode } from "@/providers/referral-provider";
import { ShieldAlert, Receipt } from "lucide-react";
import { Link } from "wouter";
import { useInvalidateCommercial, type CommercialReview } from "@/hooks/use-commercial";
import { VerificationPanel } from "@/components/commercial/verification-panel";
import { ClinicalUserCounts } from "@/components/commercial/clinical-user-counts";
import { CommercialHistoryDialog } from "@/components/commercial/commercial-history-dialog";

const SPECIALTIES = [
  "Fonoaudiología",
  "Psicopedagogía",
  "Psicología",
  "Terapia Ocupacional",
  "Kinesiología",
  "Neurología",
  "Otro",
];

type CommercialStatus = "trial" | "paying" | "overdue" | "courtesy" | "churned";
type EditReferralInfo = {
  userId: number;
  currentCode: string | null;
  activeCodes: string[];
  loading: boolean;
  error: string | null;
};
type EditReferralCheck = {
  userId: number;
  code: string;
  status: "idle" | "checking" | "valid" | "invalid" | "error";
};

const PRIMARY_ADMIN_EMAIL = "admin@neurometric.com";

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
  patientCount?: number | null;
  clinicalSessionCount?: number | null;
  trialStartPending?: boolean;
  commercialReview?: CommercialReview;
  commercialRevision?: string;
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

function isOverdue(u: AppUser): boolean {
  if (u.commercialStatus === "overdue") return true;
  if (u.nextDueDate) {
    const due = new Date(`${u.nextDueDate}T23:59:59`).getTime();
    if (!isNaN(due) && due < Date.now()) return true;
  }
  return false;
}

type ActivityFilter =
  | "todos"
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
  referralCode: "",
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
  const [editReferralInfo, setEditReferralInfo] = useState<EditReferralInfo | null>(null);
  const [editReferralDraft, setEditReferralDraft] = useState("");
  const [editReferralCheck, setEditReferralCheck] = useState<EditReferralCheck | null>(null);
  const [savingReferral, setSavingReferral] = useState(false);
  const referralRequestId = useRef(0);

  const [resettingId, setResettingId]   = useState<number | null>(null);
  const [resetPwd, setResetPwd]         = useState("");
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [savingReset, setSavingReset]   = useState(false);

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("usuarios");
  const [historyUser, setHistoryUser] = useState<{ id: number; name: string } | null>(null);
  const [changeReason, setChangeReason] = useState("");
  const invalidateCommercial = useInvalidateCommercial();
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("todos");

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const canManageReferral =
    currentUser?.role === "admin" &&
    currentUser.email.trim().toLowerCase() === PRIMARY_ADMIN_EMAIL;

  // ── Código de referido (opcional, solo profesionales) ──────────────────────
  // El código se valida contra el servidor antes de enviarlo; el servidor lo
  // vuelve a validar al crear la cuenta. El "código de este navegador" solo
  // existe si el enlace ?ref= se abrió en ESTE navegador (no se comparte).
  const { referral: browserReferral } = useReferral();
  const [refState, setRefState] = useState<{ code: string; status: "idle" | "checking" | "valid" | "invalid" | "error" }>({ code: "", status: "idle" });
  const setReferralInput = (v: string) => { set("referralCode", v.toUpperCase()); setRefState({ code: "", status: "idle" }); };
  const checkReferral = async (raw: string) => {
    const code = normalizeReferralCode(raw);
    if (!code) { setRefState({ code: raw, status: "invalid" }); return; }
    setRefState({ code, status: "checking" });
    try {
      const r = await validateReferralCode(code);
      setRefState({ code: r.code, status: r.valid ? "valid" : "invalid" });
      if (r.valid) setForm(f => ({ ...f, referralCode: r.code }));
    } catch {
      setRefState({ code, status: "error" });
    }
  };

  const loadAll = async () => {
    setLoading(true);
    invalidateCommercial();
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
    let pagando = 0;
    let enPrueba = 0;
    let vencidos = 0;
    let cortesia = 0;

    const activos = users.filter(u => u.active);
    for (const u of activos) {
      if (u.commercialStatus === "paying") pagando++;
      else if (u.commercialStatus === "trial") enPrueba++;
      else if (u.commercialStatus === "courtesy") cortesia++;
      if (isOverdue(u)) vencidos++;
    }

    const activosCount = activos.length;
    const dadosDeBaja = users.length - activosCount;
    const hayDatos = users.length > 0;
    return {
      pagando, enPrueba, vencidos, cortesia, activosCount, dadosDeBaja, hayDatos,
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
    const wantsReferral = form.role === "professional" && form.referralCode.trim() !== "";
    const refCode = normalizeReferralCode(form.referralCode);
    if (wantsReferral && (refState.status !== "valid" || refState.code !== refCode)) {
      toast({ title: "Validá el código de referido antes de crear", description: "O dejá el campo vacío.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = { name: form.name.trim(), email: form.email.trim(), role: form.role, specialty: form.specialty || null, password: form.password.trim() };
      if (wantsReferral && refCode) body.referralCode = refCode;
      const r = await fetch(`${API_BASE}/api/users`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); toast({ title: e.error ?? "Error al crear", variant: "destructive" }); return; }
      toast({ title: "Usuario creado" });
      setForm(emptyForm); setShowForm(false); setRefState({ code: "", status: "idle" });
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

  // ── Inline edit ────────────────────────────────────────────────────────────
  const loadReferralInfo = async (userId: number, requestId: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}/referral-attribution`, {
        credentials: "include",
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "No se pudo cargar el código de referido");
      if (requestId !== referralRequestId.current) return;
      setEditReferralInfo({
        userId,
        currentCode: typeof data?.attribution?.code === "string" ? data.attribution.code : null,
        activeCodes: Array.isArray(data?.activeCodes) ? data.activeCodes : [],
        loading: false,
        error: null,
      });
      setEditReferralDraft(typeof data?.attribution?.code === "string" ? data.attribution.code : "");
      setEditReferralCheck(null);
    } catch (error) {
      if (requestId !== referralRequestId.current) return;
      setEditReferralInfo({
        userId,
        currentCode: null,
        activeCodes: [],
        loading: false,
        error: error instanceof Error ? error.message : "No se pudo cargar el código de referido",
      });
    }
  };

  const checkEditReferral = async (userId: number) => {
    const code = normalizeReferralCode(editReferralDraft);
    if (!code) {
      setEditReferralCheck({ userId, code: editReferralDraft, status: "invalid" });
      return;
    }
    setEditReferralCheck({ userId, code, status: "checking" });
    try {
      const result = await validateReferralCode(code);
      setEditReferralCheck({ userId, code: result.code, status: result.valid ? "valid" : "invalid" });
      if (result.valid) setEditReferralDraft(result.code);
    } catch {
      setEditReferralCheck({ userId, code, status: "error" });
    }
  };

  const saveEditReferral = async (userId: number) => {
    const code = normalizeReferralCode(editReferralDraft);
    if (!code || editReferralCheck?.userId !== userId ||
      editReferralCheck.code !== code || editReferralCheck.status !== "valid") {
      toast({ title: "Validá un código de referido activo antes de asignarlo", variant: "destructive" });
      return;
    }

    setSavingReferral(true);
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}/referral-attribution`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        toast({
          title: data?.error ?? "No se pudo asignar el código",
          description: data?.code ? `Código ya asociado: ${data.code}` : undefined,
          variant: "destructive",
        });
        if (response.status === 409 && typeof data?.code === "string") {
          setEditReferralInfo(info => info?.userId === userId
            ? { ...info, currentCode: data.code }
            : info);
        }
        return;
      }

      setEditReferralInfo(info => info?.userId === userId
        ? { ...info, currentCode: data.code }
        : info);
      setEditReferralDraft(data.code);
      setEditReferralCheck({ userId, code: data.code, status: "valid" });
      toast({ title: "Código de referido asignado", description: data.code });
    } catch {
      toast({ title: "Error de conexión al asignar el código", variant: "destructive" });
    } finally {
      setSavingReferral(false);
    }
  };

  const startEdit = (u: AppUser) => {
    const requestId = ++referralRequestId.current;
    setEditingId(u.id);
    setEditForm({
      name: u.name, email: u.email, specialty: u.specialty ?? "", password: "",
      commercialStatus: u.commercialStatus,
      commercialRevision: u.commercialRevision,
      trialStartDate: u.trialStartDate ?? "",
      trialEndDate: u.trialEndDate ?? "",
      lastPaymentDate: u.lastPaymentDate ?? "",
      nextDueDate: u.nextDueDate ?? "",
      monthlyAmount: u.monthlyAmount ?? "",
      paymentMethod: u.paymentMethod ?? "",
      internalNotes: u.internalNotes ?? "",
    });
    setShowEditPwd(false);
    setChangeReason("");
    setEditReferralInfo(null);
    setEditReferralDraft("");
    setEditReferralCheck(null);
    if (canManageReferral && u.role === "professional") {
      setEditReferralInfo({
        userId: u.id,
        currentCode: null,
        activeCodes: [],
        loading: true,
        error: null,
      });
      void loadReferralInfo(u.id, requestId);
    }
  };
  const cancelEdit = () => {
    referralRequestId.current += 1;
    setEditingId(null);
    setEditForm({});
    setShowEditPwd(false);
    setChangeReason("");
    setEditReferralInfo(null);
    setEditReferralDraft("");
    setEditReferralCheck(null);
  };

  const saveEdit = async (id: number) => {
    if (editForm.password && editForm.password.trim().length < 6) {
      toast({ title: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: editForm.name, email: editForm.email, specialty: editForm.specialty || null,
        commercialStatus: editForm.commercialStatus,
        expectedCommercialRevision: editForm.commercialRevision,
        trialStartDate: editForm.trialStartDate || null,
        trialEndDate: editForm.trialEndDate || null,
        lastPaymentDate: editForm.lastPaymentDate || null,
        nextDueDate: editForm.nextDueDate || null,
        monthlyAmount: editForm.monthlyAmount ?? "",
        paymentMethod: editForm.paymentMethod || null,
        internalNotes: editForm.internalNotes || null,
      };
      if (editForm.password?.trim()) payload.password = editForm.password.trim();
      if (changeReason.trim()) payload.commercialChangeReason = changeReason.trim().slice(0, 500);
      const r = await fetch(`${API_BASE}/api/users/${id}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (r.ok) { toast({ title: "Usuario actualizado" }); cancelEdit(); await loadAll(); }
      else {
        toast({ title: await responseErrorMessage(r, "Error al actualizar"), variant: "destructive" });
        if (r.status === 409) await loadAll();
      }
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
      // Los dados de baja se muestran solo en su propio filtro; el resto de los
      // filtros operan únicamente sobre usuarios activos.
      if (activityFilter === "dados-de-baja") {
        if (u.active) return false;
      } else {
        if (!u.active) return false;
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
    { value: "todos",            label: "Activos",                count: summary.activosCount },
    { value: "dados-de-baja",    label: "Dados de baja",           count: summary.dadosDeBaja },
  ];

  const commercialFilterOptions: { value: ActivityFilter; label: string; count: number }[] = [
    { value: "pagando",       label: "Pagando",       count: summary.pagando },
    { value: "en-prueba",     label: "En prueba",     count: summary.enPrueba },
    { value: "vencidos",      label: "Vencidos",      count: summary.vencidos },
    { value: "cortesia",      label: "Cortesía",      count: summary.cortesia },
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

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-card border border-border/50 p-1 rounded-xl shadow-sm h-auto gap-1">
            <TabsTrigger value="usuarios" className="rounded-lg text-sm flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Usuarios
              {users.length > 0 && (
                <span className="ml-0.5 bg-primary/10 text-primary text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">{users.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="verificacion" className="rounded-lg text-sm flex items-center gap-1.5" data-testid="tab-verificacion">
              <ShieldAlert className="h-3.5 w-3.5" /> Verificación
              {users.some(u => u.commercialReview?.needsReview) && (
                <span className="ml-0.5 bg-amber-500/15 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">{users.filter(u => u.commercialReview?.needsReview).length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="auditoria" className="rounded-lg text-sm flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" /> Historial de cuentas
            </TabsTrigger>
            <TabsTrigger value="mi-perfil" className="rounded-lg text-sm flex items-center gap-1.5">
              <UserCircle className="h-3.5 w-3.5" /> Mi perfil
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* Usuarios tab                                                        */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="usuarios" className="mt-5 space-y-4">

            {/* ── Resumen administrativo y comercial ── */}
            {!loading && summary.hayDatos && (
              <div className="space-y-3">
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
                  {form.role === "professional" && (
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-sm font-medium">Código de referido <span className="text-muted-foreground font-normal">(opcional)</span></label>
                      <div className="flex gap-2">
                        <Input placeholder="Ej. CODIGO" value={form.referralCode} onChange={e => setReferralInput(e.target.value)} className="bg-muted/30 font-mono uppercase" />
                        <Button type="button" variant="outline" disabled={!form.referralCode.trim() || refState.status === "checking"} onClick={() => checkReferral(form.referralCode)}>
                          {refState.status === "checking" ? "Validando…" : "Validar"}
                        </Button>
                      </div>
                      {refState.status === "valid" && <p className="text-[11px] text-emerald-700">Código válido: {refState.code}. La atribución queda fija al crear la cuenta.</p>}
                      {refState.status === "invalid" && <p className="text-[11px] text-destructive">Código inexistente o inactivo.</p>}
                      {refState.status === "error" && <p className="text-[11px] text-destructive">No se pudo validar. Reintentá.</p>}
                      {browserReferral && !form.referralCode && (
                        <button type="button" onClick={() => { set("referralCode", browserReferral.code); checkReferral(browserReferral.code); }} className="text-[11px] text-primary underline-offset-2 hover:underline">
                          Usar el código detectado en este navegador: {browserReferral.code}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-border/40">
                  <Button variant="outline" onClick={() => { setShowForm(false); setForm(emptyForm); setShowPwd(false); setRefState({ code: "", status: "idle" }); }}>Cancelar</Button>
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
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-2 mr-1">Cuenta</span>
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
                                  onClick={() => toast({
                                    title: "Eliminación definitiva temporalmente deshabilitada",
                                    description: "Podés dar de baja el acceso del usuario sin eliminar su información clínica.",
                                  })}
                                  className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-colors"
                                  title="Eliminación definitiva temporalmente deshabilitada"
                                  aria-label="Eliminación definitiva temporalmente deshabilitada"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Stats strip */}
                          <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-5 flex-wrap">
                            <ClinicalUserCounts
                              userId={u.id}
                              role={u.role}
                              patientCount={u.patientCount}
                              clinicalSessionCount={u.clinicalSessionCount}
                              className="mr-auto"
                            />
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
                              <label className="text-xs font-medium text-muted-foreground">Especialidad</label>
                              <select value={editForm.specialty ?? ""} onChange={e => setEditForm(f => ({ ...f, specialty: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm">
                                <option value="">Sin especificar</option>
                                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                            {canManageReferral && u.role === "professional" && (
                              <div className="space-y-2 sm:col-span-2 rounded-lg border border-border/60 bg-background p-3" data-testid={`admin-referral-attribution-${u.id}`}>
                                <label htmlFor={`edit-referral-code-${u.id}`} className="text-xs font-medium text-muted-foreground">
                                  Código de referido
                                </label>
                                {editReferralInfo?.userId !== u.id || editReferralInfo.loading ? (
                                  <p className="text-xs text-muted-foreground">Cargando atribución…</p>
                                ) : editReferralInfo.error ? (
                                  <p className="text-xs text-destructive">{editReferralInfo.error}</p>
                                ) : editReferralInfo.currentCode ? (
                                  <p className="text-sm">
                                    Código actualmente asociado: <code className="font-mono font-semibold">{editReferralInfo.currentCode}</code>
                                    <span className="block mt-1 text-xs text-muted-foreground">
                                      La atribución queda fija y no se reemplaza desde esta pantalla.
                                    </span>
                                  </p>
                                ) : (
                                  <>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                      <Input
                                        id={`edit-referral-code-${u.id}`}
                                        list={`edit-referral-options-${u.id}`}
                                        placeholder="Escribí o elegí un código activo"
                                        autoComplete="off"
                                        value={editReferralDraft}
                                        onChange={e => {
                                          setEditReferralDraft(e.target.value.toUpperCase());
                                          setEditReferralCheck({ userId: u.id, code: "", status: "idle" });
                                        }}
                                        className="bg-background h-8 text-sm font-mono uppercase"
                                        data-testid={`input-edit-referral-code-${u.id}`}
                                      />
                                      <datalist id={`edit-referral-options-${u.id}`}>
                                        {editReferralInfo.activeCodes.map(code => <option key={code} value={code} />)}
                                      </datalist>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={!editReferralDraft.trim() || editReferralCheck?.status === "checking"}
                                        onClick={() => checkEditReferral(u.id)}
                                        data-testid={`button-validate-edit-referral-${u.id}`}
                                      >
                                        {editReferralCheck?.userId === u.id && editReferralCheck.status === "checking" ? "Validando…" : "Validar"}
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        disabled={
                                          savingReferral ||
                                          editReferralCheck?.userId !== u.id ||
                                          editReferralCheck.code !== normalizeReferralCode(editReferralDraft) ||
                                          editReferralCheck.status !== "valid"
                                        }
                                        onClick={() => saveEditReferral(u.id)}
                                        data-testid={`button-assign-edit-referral-${u.id}`}
                                      >
                                        {savingReferral ? "Asignando…" : "Asignar código"}
                                      </Button>
                                    </div>
                                    {editReferralCheck?.userId === u.id && editReferralCheck.status === "valid" && (
                                      <p className="text-[11px] text-emerald-700">Código válido: {editReferralCheck.code}.</p>
                                    )}
                                    {editReferralCheck?.userId === u.id && editReferralCheck.status === "invalid" && (
                                      <p className="text-[11px] text-destructive">Código inexistente, inactivo o con formato inválido.</p>
                                    )}
                                    {editReferralCheck?.userId === u.id && editReferralCheck.status === "error" && (
                                      <p className="text-[11px] text-destructive">No se pudo validar. Reintentá.</p>
                                    )}
                                    <p className="text-[11px] text-muted-foreground">
                                      Solo se asignan códigos activos. Una atribución existente no se duplica ni reemplaza.
                                    </p>
                                  </>
                                )}
                              </div>
                            )}
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
                                <label className="text-xs font-medium text-muted-foreground">Motivo del cambio comercial (opcional, queda en el historial)</label>
                                <Input maxLength={500} placeholder="Ej. corrección según comprobante de transferencia" value={changeReason} onChange={e => setChangeReason(e.target.value)} className="bg-background h-8 text-sm" data-testid="input-commercial-change-reason" />
                              </div>
                              <div className="sm:col-span-2 flex flex-wrap gap-2 text-xs">
                                <button type="button" onClick={() => setHistoryUser({ id: u.id, name: u.name })} className="inline-flex items-center gap-1 text-primary hover:underline" data-testid={`button-commercial-history-${u.id}`}><History className="h-3 w-3" /> Ver historial comercial</button>
                                {u.role === "professional" && (
                                  <Link href={`/colaboradoras?tab=cobros&pro=${u.id}`} className="inline-flex items-center gap-1 text-primary hover:underline" data-testid={`link-register-receipt-${u.id}`}><Receipt className="h-3 w-3" /> Registrar cobro recibido</Link>
                                )}
                                <span className="text-muted-foreground">Editar aquí no registra dinero recibido.</span>
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

          <TabsContent value="verificacion" className="mt-5">
            {loading ? (
              <div className="space-y-2 animate-pulse">{[0, 1, 2].map(i => <div key={i} className="h-20 rounded-2xl bg-muted/60" />)}</div>
            ) : (
              <VerificationPanel
                users={users}
                onEdit={id => { const u = users.find(x => x.id === id); if (u) { setTab("usuarios"); setActivityFilter(u.active ? "todos" : "dados-de-baja"); setSearch(""); startEdit(u); } }}
                onHistory={u => setHistoryUser({ id: u.id, name: u.name })}
              />
            )}
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* Auditoría tab                                                       */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="auditoria" className="mt-5 space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Historial administrativo de cuentas</h2>
                <span className="ml-auto text-xs text-muted-foreground">{users.length} cuentas</span>
              </div>
              <div className="divide-y divide-border/40">
                {loading ? (
                  <div className="px-5 py-4 text-sm text-muted-foreground">Cargando…</div>
                ) : (
                  [...users]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map(u => (
                      <div key={u.id} className="flex flex-col gap-2 px-5 py-3 hover:bg-muted/30 transition-colors sm:flex-row sm:items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${u.role === "admin" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                            <Badge variant="outline" className={u.role === "admin" ? "text-[10px] border-primary/40 text-primary" : "text-[10px] border-accent/40 text-accent"}>
                              {u.role === "admin" ? "Admin" : "Profesional"}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {u.active ? "Cuenta activa" : "Cuenta inactiva"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:justify-end">
                          <span>Estado comercial: {COMMERCIAL_META[u.commercialStatus]?.label ?? u.commercialStatus}</span>
                          <span>Cuenta creada: {formatDate(u.createdAt)}</span>
                        </div>
                      </div>
                    ))
                )}
              </div>
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
                        <p className="text-2xl font-bold text-muted-foreground">{summary.pagando}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Pagando</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
        <CommercialHistoryDialog user={historyUser} onClose={() => setHistoryUser(null)} />
      </div>

    </AppLayout>
  );
}
