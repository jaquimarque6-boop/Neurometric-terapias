import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Activity, Eye, EyeOff, Gift, LogIn, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { clearAuthToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_COMMERCIAL_NUMBER ?? "").replace(/\D/g, "");

function getReferralCode() {
  const ref = new URLSearchParams(window.location.search).get("ref")?.trim().toLowerCase();
  return ref === "kilead" || ref === "anggy" ? ref : null;
}

function buildWhatsAppUrl(message: string) {
  if (!WHATSAPP_NUMBER) return null;
  const referral = getReferralCode();
  const messageWithReferral = referral ? `${message}\n\nReferencia: ${referral}` : message;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(messageWithReferral)}`;
}

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whatsappNotice, setWhatsappNotice] = useState<string | null>(null);

  // On mount: wipe any leftover invalid token so the next login starts clean.
  // Stale "Sesión expirada" / "Reconectando…" toasts auto-dismiss via their
  // own duration; we don't call dismiss() here because useToast.dismiss is a
  // fresh function each render (would loop) and a global DISMISS_TOAST dispatch
  // re-triggers onOpenChange → dismiss → re-dispatch.
  useEffect(() => {
    try { clearAuthToken(); } catch { /* ignore */ }
    console.info("[login] página montada — token viejo eliminado");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailTrimmed = email.trim();
    const passwordVal  = password;

    console.info("[login] click Ingresar", {
      hasEmail: !!emailTrimmed,
      hasPassword: !!passwordVal,
      ua: navigator.userAgent.slice(0, 80),
    });

    if (!emailTrimmed || !passwordVal) {
      setError("Ingresa tu email y contraseña.");
      console.warn("[login] abortado: faltan credenciales");
      return;
    }

    setLoading(true);
    try {
      console.info("[login] POST /api/auth/login → enviando");
      await login(emailTrimmed, passwordVal);
      console.info("[login] ✓ login OK — redirigiendo a /seleccion");
      setLocation("/seleccion");
    } catch (err: any) {
      const msg = err?.message ?? "Error al iniciar sesión";
      console.warn("[login] ✗ fallo:", msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = (message: string) => {
    const url = buildWhatsAppUrl(message);
    if (!url) {
      setWhatsappNotice(
        "WhatsApp comercial no configurado. Debe definirse VITE_WHATSAPP_COMMERCIAL_NUMBER en las variables de entorno del frontend."
      );
      return;
    }
    setWhatsappNotice(null);
    window.open(url, "_blank", "noopener,noreferrer");
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

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Correo electrónico
              </label>
              <Input
                id="login-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="profesional@clinica.cl"
                autoFocus
                className="h-10 bg-muted/40"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  id="login-password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 pr-10 bg-muted/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="bg-destructive/8 border border-destructive/20 text-destructive text-sm rounded-xl px-3.5 py-2.5"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
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

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>o</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">¿Todavía no tenés acceso?</p>
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
              onClick={() =>
                openWhatsApp(
                  "Hola Jacqueline 😊 Quiero probar Neurometric Terapias durante 15 días. Mi nombre es ___ y soy ___."
                )
              }
            >
              <Gift className="h-4 w-4" />
              Solicitar 15 días gratis
            </Button>
          </div>

          <button
            type="button"
            className="mt-5 flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            onClick={() =>
              openWhatsApp("Hola Jacqueline 😊 Estoy teniendo problemas para ingresar a Neurometric Terapias.")
            }
          >
            <MessageCircle className="h-3.5 w-3.5" />
            ¿Tenés problemas para ingresar? Contactanos por WhatsApp
          </button>

          {whatsappNotice && (
            <p role="status" className="mt-3 text-center text-xs text-muted-foreground">
              {whatsappNotice}
            </p>
          )}
        </div>

      </div>

    </div>
  );
}
