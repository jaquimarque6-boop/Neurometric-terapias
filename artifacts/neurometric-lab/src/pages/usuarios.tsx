import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Users, Plus, UserCheck, UserX, Edit2, X, Check,
  ArrowLeft, ShieldCheck, Stethoscope, Eye, EyeOff, KeyRound,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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

type AppUser = {
  id: number;
  email: string;
  name: string;
  role: string;
  specialty: string | null;
  active: boolean;
  createdAt: string;
};

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

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<AppUser & { password: string }>>({});
  const [showEditPwd, setShowEditPwd] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/users`, { credentials: "include" });
      if (r.ok) {
        setUsers(await r.json());
      } else {
        const err = await r.json().catch(() => ({}));
        console.error(`[usuarios] GET /api/users → ${r.status}`, err);
        toast({
          title: `Error al cargar usuarios (${r.status})`,
          description: err.error ?? "Verificá que tengas rol administrador.",
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error("[usuarios] fetch error:", e);
      toast({ title: "Error de conexión al servidor", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: "Nombre y email son obligatorios", variant: "destructive" });
      return;
    }
    if (!form.password.trim()) {
      toast({ title: "La contraseña es obligatoria", variant: "destructive" });
      return;
    }
    if (form.password.trim().length < 6) {
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
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          specialty: form.specialty || null,
          password: form.password.trim(),
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast({ title: err.error ?? "Error al crear usuario", variant: "destructive" });
        return;
      }
      toast({ title: "Usuario creado correctamente" });
      setForm(emptyForm);
      setShowForm(false);
      await fetchUsers();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: AppUser) => {
    const r = await fetch(`${API_BASE}/api/users/${u.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    if (r.ok) {
      toast({ title: u.active ? "Usuario desactivado" : "Usuario activado" });
      await fetchUsers();
    }
  };

  const startEdit = (u: AppUser) => {
    setEditingId(u.id);
    setEditForm({ name: u.name, email: u.email, role: u.role as any, specialty: u.specialty ?? "", password: "" });
    setShowEditPwd(false);
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); setShowEditPwd(false); };

  const saveEdit = async (id: number) => {
    if (editForm.password && editForm.password.trim().length < 6) {
      toast({ title: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        specialty: editForm.specialty || null,
      };
      if (editForm.password?.trim()) payload.password = editForm.password.trim();

      const r = await fetch(`${API_BASE}/api/users/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (r.ok) {
        toast({ title: "Usuario actualizado" });
        cancelEdit();
        await fetchUsers();
      } else {
        const err = await r.json().catch(() => ({}));
        toast({ title: err.error ?? "Error al actualizar", variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  const activeUsers = users.filter(u => u.active);
  const inactiveUsers = users.filter(u => !u.active);

  return (
    <AppLayout>
      <div className="flex flex-col gap-5 animate-in fade-in duration-400">
        {/* Back */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground/80 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al panel
        </button>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Usuarios</h1>
              <p className="text-sm text-muted-foreground">{activeUsers.length} usuario{activeUsers.length !== 1 ? "s" : ""} activo{activeUsers.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm(v => !v)}
            className="gap-2 bg-gradient-to-br from-primary to-primary/80 text-white"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancelar" : "Nuevo usuario"}
          </Button>
        </div>

        {/* Create form */}
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
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                  Contraseña <span className="text-primary/60">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPwd ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={form.password}
                    onChange={e => set("password", e.target.value)}
                    className="bg-muted/30 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Confirmar contraseña <span className="text-primary/60">*</span></label>
                <div className="relative">
                  <Input
                    type={showPwd ? "text" : "password"}
                    placeholder="Repite la contraseña"
                    value={form.confirmPassword}
                    onChange={e => set("confirmPassword", e.target.value)}
                    className={`bg-muted/30 pr-10 ${form.confirmPassword && form.password !== form.confirmPassword ? "border-destructive/50 focus-visible:ring-destructive/30" : ""}`}
                  />
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-[11px] text-destructive">Las contraseñas no coinciden</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Rol</label>
                <select
                  value={form.role}
                  onChange={e => set("role", e.target.value)}
                  className="w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="professional">Profesional</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Especialidad</label>
                <select
                  value={form.specialty}
                  onChange={e => set("specialty", e.target.value)}
                  className="w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Sin especificar</option>
                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-border/40">
              <Button variant="outline" onClick={() => { setShowForm(false); setForm(emptyForm); setShowPwd(false); }}>Cancelar</Button>
              <Button
                onClick={handleCreate}
                disabled={saving || !form.name.trim() || !form.email.trim() || !form.password.trim() || form.password !== form.confirmPassword}
                className="bg-gradient-to-br from-accent to-accent/80 text-white gap-2"
              >
                {saving ? "Guardando…" : "Crear usuario"}
              </Button>
            </div>
          </div>
        )}

        {/* Users list */}
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {users.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">No hay usuarios registrados.</div>
            )}
            {users.map(u => (
              <div
                key={u.id}
                className={`rounded-2xl border border-border/60 bg-card shadow-sm p-4 transition-opacity ${!u.active ? "opacity-60" : ""}`}
              >
                {editingId === u.id ? (
                  /* Inline edit form */
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Nombre</label>
                        <Input
                          value={editForm.name ?? ""}
                          onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                          className="bg-muted/30 h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Email</label>
                        <Input
                          value={editForm.email ?? ""}
                          onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                          className="bg-muted/30 h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Rol</label>
                        <select
                          value={editForm.role ?? "professional"}
                          onChange={e => setEditForm(f => ({ ...f, role: e.target.value as any }))}
                          className="w-full rounded-md border border-input bg-muted/30 px-3 py-1.5 text-sm"
                        >
                          <option value="professional">Profesional</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Especialidad</label>
                        <select
                          value={editForm.specialty ?? ""}
                          onChange={e => setEditForm(f => ({ ...f, specialty: e.target.value }))}
                          className="w-full rounded-md border border-input bg-muted/30 px-3 py-1.5 text-sm"
                        >
                          <option value="">Sin especificar</option>
                          {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <KeyRound className="h-3 w-3" /> Nueva contraseña (dejar en blanco para no cambiar)
                        </label>
                        <div className="relative">
                          <Input
                            type={showEditPwd ? "text" : "password"}
                            placeholder="Nueva contraseña (opcional)"
                            value={editForm.password ?? ""}
                            onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                            className="bg-muted/30 h-8 text-sm pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowEditPwd(v => !v)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            tabIndex={-1}
                          >
                            {showEditPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={cancelEdit}><X className="h-3 w-3 mr-1" />Cancelar</Button>
                      <Button size="sm" onClick={() => saveEdit(u.id)} disabled={saving} className="bg-accent text-white gap-1">
                        <Check className="h-3 w-3" />Guardar
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* View row */
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground truncate">{u.name}</span>
                          {u.role === "admin" ? (
                            <Badge variant="outline" className="text-xs gap-1 border-primary/40 text-primary">
                              <ShieldCheck className="h-3 w-3" />Admin
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs gap-1 border-accent/40 text-accent">
                              <Stethoscope className="h-3 w-3" />Profesional
                            </Badge>
                          )}
                          {!u.active && <Badge variant="outline" className="text-xs text-muted-foreground">Inactivo</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        {u.specialty && <p className="text-xs text-muted-foreground">{u.specialty}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(u)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(u)}
                          className={`h-8 w-8 p-0 ${u.active ? "text-rose-500 hover:text-rose-600" : "text-emerald-500 hover:text-emerald-600"}`}
                          title={u.active ? "Desactivar usuario" : "Activar usuario"}
                        >
                          {u.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
