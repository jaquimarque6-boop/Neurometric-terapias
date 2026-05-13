import { useState } from "react";
import { useLocation } from "wouter";
import { Activity, Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      setLocation("/");
    } catch (err: any) {
      setError(err.message ?? "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo mark */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary shadow-md shadow-primary/30 mb-5">
            <Activity className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground font-display tracking-tight">
            Neurometric Terapias
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">Plataforma clínica de intervención terapéutica</p>
        </div>

        {/* Login card */}
        <div className="bg-card rounded-2xl border border-card-border shadow-sm p-7">
          <h2 className="text-base font-semibold text-foreground mb-5">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Correo electrónico
              </label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="profesional@clinica.cl"
                required
                autoFocus
                className="h-10 bg-muted/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-10 pr-10 bg-muted/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/8 border border-destructive/20 text-destructive text-sm rounded-xl px-3.5 py-2.5">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-10 mt-1"
            >
              {loading ? (
                <span className="animate-pulse">Iniciando sesión…</span>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Ingresar
                </>
              )}
            </Button>
          </form>
        </div>

      </div>

    </div>
  );
}
