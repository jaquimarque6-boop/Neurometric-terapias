import { useState } from "react";
import { UserCircle, Mail, Shield, Save, KeyRound } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

export default function Usuario() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName]         = useState(user?.name ?? "");
  const [isSaving, setIsSaving] = useState(false);

  if (!user) return null;

  const initial = user.name.charAt(0).toUpperCase();
  const roleLabel = user.role === "admin" ? "Administrador" : "Profesional";

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
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

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto w-full space-y-6 animate-in fade-in duration-400">

        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Mi perfil</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Información de tu cuenta</p>
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

            {/* Edit form */}
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
                <Input
                  value={roleLabel}
                  disabled
                  className="bg-muted/30 text-muted-foreground"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving || !name.trim()}
                className="w-full gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Guardando…" : "Guardar cambios"}
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* Info note */}
        <p className="text-[11px] text-muted-foreground text-center px-4">
          Para cambiar tu contraseña o correo, contacta al administrador del sistema.
        </p>

      </div>
    </AppLayout>
  );
}
