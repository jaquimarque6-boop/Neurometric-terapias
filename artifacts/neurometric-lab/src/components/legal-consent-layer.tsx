import { useCallback, useEffect, useState, type ReactNode } from "react";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type ConsentStatus = {
  versions: { terms: string; privacy: string; ai: string };
  accepted: { terms: boolean; privacy: boolean; ai: boolean };
};

type AiConsentRequest = {
  version: string;
  resolve: (accepted: boolean) => void;
};

async function postAcceptance(types: string[]) {
  const response = await fetch(`${API_BASE}/api/consents/accept`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ types }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? "No se pudo registrar la aceptación.");
}

function DraftDocument({ title, version }: { title: string; version: string }) {
  return (
    <details className="rounded-xl border border-border bg-background p-4">
      <summary className="cursor-pointer font-medium">{title} · versión {version}</summary>
      <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
        Texto provisional de interfaz. No es el documento legal definitivo. Debe ser reemplazado y aprobado antes de publicar esta versión.
      </p>
    </details>
  );
}

export function LegalConsentLayer({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [status, setStatus] = useState<ConsentStatus | null>(null);
  const [statusReady, setStatusReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [aiRequest, setAiRequest] = useState<AiConsentRequest | null>(null);
  const [aiChecked, setAiChecked] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiError, setAiError] = useState("");

  const refresh = useCallback(async () => {
    if (!user) {
      setStatus(null);
      setStatusReady(false);
      return;
    }
    setStatusReady(false);
    try {
      const response = await fetch(`${API_BASE}/api/consents/status`, { credentials: "include" });
      if (!response.ok) throw new Error("No se pudo comprobar el estado.");
      setStatus(await response.json());
    } catch {
      // Consent status outages must not take the existing authentication path down.
      setStatus(null);
    } finally {
      setStatusReady(true);
    }
  }, [user?.id]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    const onRequired = (event: Event) => {
      const request = (event as CustomEvent<AiConsentRequest>).detail;
      setAiRequest(request);
      setAiChecked(false);
      setAiError("");
    };
    window.addEventListener("nm:ai-consent-required", onRequired);
    return () => window.removeEventListener("nm:ai-consent-required", onRequired);
  }, []);

  const acceptCore = async () => {
    if (!checked || saving) return;
    setSaving(true);
    setError("");
    try {
      await postAcceptance(["terms", "privacy"]);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo registrar la aceptación.");
    } finally {
      setSaving(false);
    }
  };

  const acceptAi = async () => {
    if (!aiChecked || !aiRequest || aiSaving) return;
    setAiSaving(true);
    setAiError("");
    try {
      await postAcceptance(["ai"]);
      aiRequest.resolve(true);
      setAiRequest(null);
    } catch (cause) {
      setAiError(cause instanceof Error ? cause.message : "No se pudo registrar la aceptación.");
    } finally {
      setAiSaving(false);
    }
  };

  const declineAi = () => {
    aiRequest?.resolve(false);
    setAiRequest(null);
  };

  const needsCore = !!status && (!status.accepted.terms || !status.accepted.privacy);
  if (user && statusReady && needsCore) {
    return (
      <main className="min-h-screen bg-background px-4 py-10">
        <section className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-primary">Aceptación requerida</p>
          <h1 className="text-2xl font-bold">Antes de continuar</h1>
          <p>Cuenta autenticada: <strong>{user.name}</strong> · {user.email}</p>
          <p className="text-sm text-muted-foreground">Revisá los documentos y confirmá individualmente tu aceptación. Esta acción se registra en tu propia cuenta.</p>
          {status && <>
            {!status.accepted.terms && <DraftDocument title="Términos y Condiciones" version={status.versions.terms} />}
            {!status.accepted.privacy && <DraftDocument title="Política de Privacidad" version={status.versions.privacy} />}
          </>}
          <label className="flex items-start gap-3 text-sm leading-6">
            <Checkbox checked={checked} onCheckedChange={value => setChecked(value === true)} aria-label="Acepto los Términos y la Política de Privacidad" />
            <span>Acepto los Términos y Condiciones y la Política de Privacidad indicados arriba.</span>
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void acceptCore()} disabled={!checked || saving}>{saving ? "Guardando…" : "Aceptar y continuar"}</Button>
            <Button variant="outline" onClick={() => void logout()}>Cerrar sesión</Button>
          </div>
        </section>
      </main>
    );
  }

  return <>
    {children}
    {aiRequest && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" role="presentation">
        <section role="dialog" aria-modal="true" aria-labelledby="ai-consent-title" className="w-full max-w-lg space-y-4 rounded-2xl bg-card p-6 shadow-xl">
          <p className="text-sm font-semibold text-primary">Aviso de uso de IA · versión {aiRequest.version}</p>
          <h2 id="ai-consent-title" className="text-xl font-bold">Antes de usar esta función</h2>
          <p className="text-sm text-muted-foreground">Aviso provisional: esta función puede enviar el texto, la imagen o los datos clínicos que elegiste procesar a un proveedor externo de IA para generar un resultado. Revisá y reemplazá este aviso con el texto aprobado antes de publicar.</p>
          <label className="flex items-start gap-3 text-sm leading-6">
            <Checkbox checked={aiChecked} onCheckedChange={value => setAiChecked(value === true)} aria-label="Acepto el aviso de uso de IA" />
            <span>Acepto el aviso provisional de uso de IA para esta versión.</span>
          </label>
          {aiError && <p role="alert" className="text-sm text-destructive">{aiError}</p>}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={declineAi} disabled={aiSaving}>Cancelar</Button>
            <Button onClick={() => void acceptAi()} disabled={!aiChecked || aiSaving}>{aiSaving ? "Guardando…" : "Aceptar y continuar"}</Button>
          </div>
        </section>
      </div>
    )}
  </>;
}