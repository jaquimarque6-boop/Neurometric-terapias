import { useState } from "react";
import { useLocation } from "wouter";
import { Activity, Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary/5 to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary shadow-lg shadow-primary/30 mb-4">
            <Activity className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground font-display tracking-tight">
            Neurometric Terapias
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Plataforma clínica de intervención terapéutica</p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardContent className="p-8">
            <h2 className="text-lg font-semibold text-foreground mb-6">Iniciar sesión</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">Correo electrónico</label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="profesional@clinica.cl"
                  required
                  autoFocus
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">Contraseña</label>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground/70"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2.5">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-10 bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/20"
              >
                {loading ? (
                  <span className="animate-pulse">Iniciando sesión…</span>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Ingresar
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                Cuenta de demostración: <span className="font-mono text-foreground/70">admin@neurometric.cl</span> / <span className="font-mono text-foreground/70">admin1234</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
