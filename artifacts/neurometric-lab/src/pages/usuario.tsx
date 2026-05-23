import { useState } from "react";
import { UserCircle, Mail, Shield, Save, KeyRound, Eye, EyeOff, Lock, Download } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { API_BASE } from "@/lib/api";

export default function Usuario() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [name, setName]               = useState(user?.name ?? "");
  const [isSaving, setIsSaving]       = useState(false);

  const [newPwd, setNewPwd]           = useState("");
  const [confirmPwd, setConfirmPwd]   = useState("");
  const [showPwd, setShowPwd]         = useState(false);
  const [isSavingPwd, setIsSavingPwd] = useState(false);

  const [isExporting, setIsExporting] = useState(false);

  if (!user) return null;

  const initial    = user.name.charAt(0).toUpperCase();
  const roleLabel  = user.role === "admin" ? "Administrador" : "Profesional";

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Nombre actualizado correctamente" });
    } catch {
      toast({ title: "Error al guardar los cambios", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!newPwd.trim() || newPwd.trim().length < 6) {
      toast({ title: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (newPwd !== confirmPwd) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    setIsSavingPwd(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPwd.trim() }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Contraseña actualizada correctamente" });
      setNewPwd("");
      setConfirmPwd("");
    } catch {
      toast({ title: "Error al cambiar la contraseña", variant: "destructive" });
    } finally {
      setIsSavingPwd(false);
    }
  };

  const pwdMismatch = confirmPwd.length > 0 && newPwd !== confirmPwd;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`${API_BASE}/api/export/my-data`, {
        credentials: "include",
      });
      if (res.status === 204) {
        toast({ title: "Todavía no tenés datos cargados para exportar." });
        return;
      }
      if (!res.ok) throw new Error();

      const blob = await res.blob();
      const today = new Date().toISOString().slice(0, 10);
      const filename = `neurometric-respaldo-mis-datos-${today}.csv`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Respaldo descargado correctamente" });
    } catch {
      toast({ title: "Error al generar el respaldo", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto w-full space-y-6 animate-in fade-in duration-400">

        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Mi perfil</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Información y configuración de tu cuenta</p>
        </div>

        {/* Profile card */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6 space-y-6">

            {/* Avatar + identity */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-primary">{initial}</span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                  <Mail className="h-3 w-3 shrink-0" /> {user.email}
                </p>
                <Badge variant="outline" className="mt-1.5 text-[10px] gap-1">
                  <Shield className="h-2.5 w-2.5" /> {roleLabel}
                </Badge>
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Edit name */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <UserCircle className="h-3.5 w-3.5 text-muted-foreground" /> Nombre
                </label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="bg-muted/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Correo electrónico
                </label>
                <Input
                  value={user.email}
                  disabled
                  className="bg-muted/30 text-muted-foreground"
                />
                <p className="text-[11px] text-muted-foreground">El correo no puede cambiarse desde aquí.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-muted-foreground" /> Rol
                </label>
                <select
                  disabled
                  className="w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed opacity-70"
                >
                  <option value={user.role}>{roleLabel}</option>
                </select>
                <p className="text-[11px] text-muted-foreground">El rol es asignado por un administrador.</p>
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving || !name.trim()}
                className="w-full gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Guardando…" : "Guardar nombre"}
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* Change password card */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" /> Cambiar contraseña
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Nueva contraseña</label>
              <div className="relative">
                <Input
                  type={showPwd ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  className="bg-muted/20 pr-10"
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
              <label className="text-sm font-medium text-foreground">Confirmar nueva contraseña</label>
              <Input
                type={showPwd ? "text" : "password"}
                placeholder="Repite la contraseña"
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                className={`bg-muted/20 ${pwdMismatch ? "border-destructive/50 focus-visible:ring-destructive/30" : ""}`}
              />
              {pwdMismatch && (
                <p className="text-[11px] text-destructive">Las contraseñas no coinciden</p>
              )}
            </div>

            <Button
              onClick={handleSavePassword}
              disabled={isSavingPwd || !newPwd.trim() || newPwd !== confirmPwd}
              variant="outline"
              className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
            >
              <Lock className="h-4 w-4" />
              {isSavingPwd ? "Guardando…" : "Cambiar contraseña"}
            </Button>
          </CardContent>
        </Card>

        {/* Data backup card */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Download className="h-4 w-4 text-primary" /> Respaldo de mis datos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Descargá una copia en CSV de tus pacientes y sesiones. El archivo se abre directamente en Excel o Google Sheets.
            </p>
            <p className="text-[11px] text-muted-foreground">
              Solo se exportan los datos asociados a tu cuenta. No se modifica ni elimina nada.
            </p>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              variant="outline"
              className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Generando…" : "Descargar mis datos"}
            </Button>
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}
