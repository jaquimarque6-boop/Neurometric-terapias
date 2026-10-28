import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetClinicalProfileQueryKey,
  getListClinicalProfileVersionsQueryKey,
  useGenerateClinicalProfile,
  useGetClinicalProfile,
  useListClinicalProfileVersions,
  useSaveClinicalProfile,
  type ClinicalProfile,
  type ClinicalProfileVersion,
} from "@workspace/api-client-react";
import { AlertCircle, Brain, Check, CheckCircle2, Clock3, Copy, History, Printer, RefreshCw, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const EMPTY_PROFILE: ClinicalProfile = {
  motivoConsulta: "",
  antecedentes: "",
  fortalezas: "",
  dificultades: "",
  areasIntervencion: "",
  objetivosPrioritarios: "",
  resumenProfesional: "",
};

const PROFILE_FIELDS: { key: keyof ClinicalProfile; label: string }[] = [
  { key: "motivoConsulta", label: "Motivo de consulta" },
  { key: "antecedentes", label: "Antecedentes relevantes" },
  { key: "fortalezas", label: "Fortalezas" },
  { key: "dificultades", label: "Dificultades" },
  { key: "areasIntervencion", label: "Áreas de intervención sugeridas" },
  { key: "objetivosPrioritarios", label: "Objetivos prioritarios" },
  { key: "resumenProfesional", label: "Resumen profesional" },
];

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function profileHasContent(profile: ClinicalProfile) {
  return PROFILE_FIELDS.some(({ key }) => profile[key].trim().length > 0);
}

function printProfile(
  patientName: string,
  profile: ClinicalProfile,
  options: { isUnsaved: boolean; versionDate?: string | null; versionLabel?: string },
) {
  const printableFields = PROFILE_FIELDS
    .filter(({ key }) => profile[key].trim())
    .map(({ key, label }) => `<section><h2>${escapeHtml(label)}</h2><p>${escapeHtml(profile[key].trim())}</p></section>`)
    .join("");
  const printDate = new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(new Date());
  const sourceDate = options.versionDate ? new Date(options.versionDate) : null;
  const hasValidSourceDate = sourceDate && !Number.isNaN(sourceDate.getTime());
  const date = hasValidSourceDate
    ? new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(sourceDate)
    : printDate;
  const dateLabel = hasValidSourceDate ? options.versionLabel ?? "Versión guardada" : "Fecha de impresión";
  const note = options.isUnsaved
    ? '<p class="draft-note">Esta impresión refleja cambios sin guardar del editor.</p>'
    : "";
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Perfil clínico — ${escapeHtml(patientName)}</title><style>
    *{box-sizing:border-box}body{font:14px/1.75 Georgia,serif;color:#263b37;max-width:780px;margin:0 auto;padding:48px 56px}
    header{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;border-bottom:2px solid #a8b9ad;padding-bottom:20px;margin-bottom:28px}
    h1{font:600 27px/1.2 system-ui,sans-serif;margin:0 0 7px;color:#29483e}.eyebrow{font:600 10px system-ui,sans-serif;letter-spacing:.15em;text-transform:uppercase;color:#70877b}
    .date{text-align:right;font:12px/1.6 system-ui,sans-serif;color:#708077}.draft-note{background:#f8f0dc;color:#70551e;padding:9px 12px;border-left:3px solid #d8b96d;font:12px system-ui,sans-serif}
    section{margin:0 0 22px;break-inside:avoid}h2{font:700 11px system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#668072;border-bottom:1px solid #e0e7e1;padding-bottom:6px;margin:0 0 8px}
    p{white-space:pre-wrap;margin:0;overflow-wrap:anywhere}footer{margin-top:38px;padding-top:10px;border-top:1px solid #e0e7e1;color:#85948c;font:10px system-ui,sans-serif}
    @media print{body{padding:18mm 15mm}@page{margin:0}}
  </style></head><body><header><div><div class="eyebrow">Neurometric Terapias · Perfil clínico</div><h1>${escapeHtml(patientName)}</h1></div><div class="date">${escapeHtml(dateLabel)}<br><strong>${escapeHtml(date)}</strong></div></header>${note}${printableFields || "<p>No hay campos con contenido para imprimir.</p>"}<footer>Perfil clínico · Documento de trabajo profesional · Impreso: ${escapeHtml(printDate)}</footer><script>window.addEventListener("load",()=>{window.setTimeout(()=>window.print(),150)})</script></body></html>`;
  const printWindow = window.open("", "_blank");
  if (!printWindow) return false;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
}

function formatVersionDate(date: string) {
  try {
    return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
  } catch {
    return date;
  }
}

function toProfile(profile: ClinicalProfile | null | undefined): ClinicalProfile {
  return profile ? { ...EMPTY_PROFILE, ...profile } : { ...EMPTY_PROFILE };
}

export function ClinicalProfileDialog({ patientId, patientName }: { patientId: number; patientName: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editor, setEditor] = useState<ClinicalProfile>({ ...EMPTY_PROFILE });
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(EMPTY_PROFILE));
  const [hasLoadedEditor, setHasLoadedEditor] = useState(false);
  const [reviewedVersion, setReviewedVersion] = useState<ClinicalProfileVersion | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [profileLoadFailed, setProfileLoadFailed] = useState(false);
  const [profileSource, setProfileSource] = useState<"version" | "legacy" | "empty" | "generated">("empty");
  const [copied, setCopied] = useState(false);
  const dirtyRef = useRef(false);
  const loadedPatientIdRef = useRef<number | null>(null);

  const profileQuery = useGetClinicalProfile(patientId, {
    query: {
      queryKey: getGetClinicalProfileQueryKey(patientId),
      enabled: patientId > 0,
      refetchOnMount: "always",
      staleTime: 0,
    },
  });
  const versionsQuery = useListClinicalProfileVersions(patientId, {
    query: {
      queryKey: getListClinicalProfileVersionsQueryKey(patientId),
      enabled: patientId > 0,
      refetchOnMount: "always",
      staleTime: 0,
    },
  });
  const generateProfile = useGenerateClinicalProfile();
  const saveProfile = useSaveClinicalProfile();
  const dirty = JSON.stringify(editor) !== savedSnapshot;
  const versions = useMemo(() => versionsQuery.data ?? [], [versionsQuery.data]);
  dirtyRef.current = dirty;

  useEffect(() => {
    setOpen(false);
    setEditor({ ...EMPTY_PROFILE });
    setSavedSnapshot(JSON.stringify(EMPTY_PROFILE));
    setHasLoadedEditor(false);
    setReviewedVersion(null);
    setProfileLoadFailed(false);
    setProfileSource("empty");
    loadedPatientIdRef.current = null;
  }, [patientId]);

  const openDialog = async () => {
    setOpen(true);
    setReviewedVersion(null);
    setIsOpening(true);
    setProfileLoadFailed(false);
    setCopied(false);
    const preserveDraft = dirtyRef.current && loadedPatientIdRef.current === patientId;
    try {
      const [currentResult] = await Promise.all([profileQuery.refetch(), versionsQuery.refetch()]);
      if (currentResult.isError || !currentResult.data) {
        if (!preserveDraft) {
          setHasLoadedEditor(false);
          setProfileLoadFailed(true);
        }
        return;
      }
      if (preserveDraft) return;

      setProfileSource(currentResult.data.source);
      const next = toProfile(currentResult.data.perfil);
      if (profileHasContent(next)) {
        setEditor(next);
        setSavedSnapshot(JSON.stringify(next));
        setHasLoadedEditor(true);
        loadedPatientIdRef.current = patientId;
      } else {
        setEditor({ ...EMPTY_PROFILE });
        setSavedSnapshot(JSON.stringify(EMPTY_PROFILE));
        setHasLoadedEditor(false);
        loadedPatientIdRef.current = patientId;
      }
    } catch {
      if (!preserveDraft) {
        setHasLoadedEditor(false);
        setProfileLoadFailed(true);
      }
    } finally {
      setIsOpening(false);
    }
  };

  const generate = async () => {
    if (hasLoadedEditor && profileHasContent(editor)
      && !window.confirm("La generación reemplazará el contenido del editor. ¿Quieres continuar?")) return;
    try {
      const result = await generateProfile.mutateAsync({ data: { patientId } });
      const generated: ClinicalProfile = {
        motivoConsulta: result.motivoConsulta ?? "",
        antecedentes: result.antecedentes ?? "",
        fortalezas: result.fortalezas ?? "",
        dificultades: result.dificultades ?? "",
        areasIntervencion: result.areasIntervencion ?? "",
        objetivosPrioritarios: result.objetivosPrioritarios ?? "",
        resumenProfesional: result.resumenProfesional ?? "",
      };
      if (!profileHasContent(generated)) {
        if (!profileHasContent(editor)) {
          setEditor({ ...EMPTY_PROFILE });
          setHasLoadedEditor(false);
          setProfileSource("generated");
          loadedPatientIdRef.current = patientId;
        }
        toast({
          title: "Sin evidencia suficiente",
          description: "No se encontró información suficiente para redactar el perfil. No se reemplazó un perfil existente.",
        });
        return;
      }
      setEditor(generated);
      setHasLoadedEditor(true);
      setProfileSource("generated");
      setProfileLoadFailed(false);
      loadedPatientIdRef.current = patientId;
      setReviewedVersion(null);
      toast({
        title: "Perfil generado",
        description: "Revisa y edita las siete secciones. Guarda el perfil para conservarlo en la ficha.",
      });
    } catch (error) {
      toast({ title: "No se pudo generar el perfil", description: error instanceof Error ? error.message : "Intenta nuevamente.", variant: "destructive" });
    }
  };

  const save = async () => {
    try {
      const result = await saveProfile.mutateAsync({ patientId, data: { perfil: editor } });
      const next = toProfile(result.perfil);
      setEditor(next);
      setSavedSnapshot(JSON.stringify(next));
      setHasLoadedEditor(true);
      setProfileSource("version");
      setProfileLoadFailed(false);
      loadedPatientIdRef.current = patientId;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetClinicalProfileQueryKey(patientId) }),
        queryClient.invalidateQueries({ queryKey: getListClinicalProfileVersionsQueryKey(patientId) }),
      ]);
      await Promise.all([profileQuery.refetch(), versionsQuery.refetch()]);
      toast({ title: "Perfil guardado", description: "El texto quedó guardado en la ficha y las versiones anteriores se conservaron." });
    } catch (error) {
      toast({ title: "No se pudo guardar", description: error instanceof Error ? error.message : "Intenta nuevamente.", variant: "destructive" });
    }
  };

  const copyProfile = async () => {
    if (!profileHasContent(editor)) return;
    const text = PROFILE_FIELDS
      .map(({ key, label }) => `${label.toLocaleUpperCase("es-AR")}\n${editor[key] || "—"}`)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast({ title: "Perfil copiado", description: "El perfil clínico se copió al portapapeles." });
    } catch {
      toast({ title: "No se pudo copiar", description: "Copialo manualmente desde el editor.", variant: "destructive" });
    }
  };

  const printEditor = () => {
    if (!profileHasContent(editor)) {
      toast({ title: "Perfil vacío", description: "Completa al menos un campo antes de imprimir." });
      return;
    }
    if (!printProfile(patientName, editor, {
      isUnsaved: dirty,
      versionDate: dirty ? null : profileQuery.data?.updatedAt ?? profileQuery.data?.createdAt,
    })) {
      toast({ title: "No se pudo abrir la impresión", description: "Permite las ventanas emergentes para elegir Imprimir o Guardar como PDF.", variant: "destructive" });
    }
  };

  const printReviewed = () => {
    if (!reviewedVersion) return;
    if (!printProfile(patientName, toProfile(reviewedVersion.perfil), {
      isUnsaved: false,
      versionDate: reviewedVersion.createdAt,
      versionLabel: `Versión ${reviewedVersion.versionId}`,
    })) {
      toast({ title: "No se pudo abrir la impresión", description: "Permite las ventanas emergentes para elegir Imprimir o Guardar como PDF.", variant: "destructive" });
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void openDialog()}
        data-testid="button-open-clinical-profile"
        className="h-8 gap-1.5 border-violet-200 text-xs text-violet-600 hover:bg-violet-50"
      >
        <Brain className="h-3.5 w-3.5" />
        Perfil clínico con IA
        {profileQuery.data?.perfil && profileHasContent(toProfile(profileQuery.data.perfil)) && <span className="h-1.5 w-1.5 rounded-full bg-[#668072]" aria-label="Perfil guardado" />}
      </Button>

      <Dialog open={open} onOpenChange={(next) => {
        if (!next && (isOpening || generateProfile.isPending || saveProfile.isPending)) return;
        setOpen(next);
      }}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" data-testid="heading-clinical-profile">
              <Brain className="h-5 w-5 text-violet-600" />
              Perfil clínico con IA
            </DialogTitle>
            <DialogDescription>
              Síntesis generada a partir de la anamnesis, los objetivos y las sesiones registradas. Podés revisar y editar cada sección antes de guardar el perfil.
            </DialogDescription>
          </DialogHeader>

          {isOpening && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground" data-testid="loading-clinical-profile">
              <span className="h-7 w-7 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
              <p className="text-sm">Cargando el último perfil guardado…</p>
            </div>
          )}

          {!isOpening && profileLoadFailed && (
            <div className="flex flex-col items-center gap-3 py-8 text-center" role="alert" data-testid="error-clinical-profile-load">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <p className="text-sm text-muted-foreground">No se pudo cargar el perfil guardado. No se mostrarán campos vacíos para evitar confundir un error con un perfil nuevo.</p>
              <Button type="button" variant="outline" onClick={() => void openDialog()} data-testid="button-retry-clinical-profile">Reintentar</Button>
            </div>
          )}

          {!isOpening && !profileLoadFailed && !hasLoadedEditor && (
            <div className="flex flex-col items-center gap-4 py-8 text-center" data-testid="empty-clinical-profile">
              <p className="max-w-md text-sm text-muted-foreground">
                {profileSource === "generated"
                  ? "No se encontró evidencia suficiente para redactar el perfil. Cuando haya más información clínica documentada, podés volver a intentarlo."
                  : profileSource === "version" || profileSource === "legacy"
                    ? "El último perfil no contiene texto. Podés solicitar una propuesta nueva; el contenido guardado no se modificará hasta que guardes otra versión."
                    : "Todavía no hay un perfil guardado. La anamnesis existente se utilizará como contexto al generar el perfil."}
              </p>
              <Button
                type="button"
                onClick={() => void generate()}
                disabled={generateProfile.isPending || isOpening}
                data-testid="button-generate-clinical-profile"
                className="gap-1.5 bg-violet-600 text-white hover:bg-violet-700"
              >
                <RefreshCw className={`h-4 w-4 ${generateProfile.isPending ? "animate-spin" : ""}`} />
                {generateProfile.isPending ? "Generando…" : "Generar perfil clínico con IA"}
              </Button>
            </div>
          )}

          {!isOpening && !profileLoadFailed && hasLoadedEditor && (
            <div className="space-y-4">
              {profileSource === "legacy" && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900" role="note" data-testid="notice-clinical-profile-legacy">
                  Este perfil anterior se conserva sin modificar. Al guardarlo, se crea una nueva versión en el historial.
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3" data-testid="status-clinical-profile-save">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid="text-clinical-profile-patient">
                  {dirty
                    ? <><AlertCircle className="h-3.5 w-3.5 text-amber-600" /> Cambios sin guardar · {patientName}</>
                    : <><Check className="h-3.5 w-3.5 text-green-600" /> Último perfil guardado · {patientName}</>}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void generate()}
                  disabled={generateProfile.isPending || saveProfile.isPending}
                  data-testid="button-regenerate-clinical-profile"
                  className="gap-1.5 border-violet-200 text-violet-700 hover:bg-violet-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${generateProfile.isPending ? "animate-spin" : ""}`} />
                  {generateProfile.isPending ? "Generando…" : "Regenerar con IA"}
                </Button>
              </div>

              {saveProfile.isError && (
                <p role="alert" data-testid="error-clinical-profile-save" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  No se guardó el perfil. El borrador sigue disponible en el editor.
                </p>
              )}

              <section className="space-y-4" aria-label="Perfil clínico editable">
                {PROFILE_FIELDS.map(({ key, label }) => (
                  <div key={key} className="space-y-1.5" data-testid={`card-clinical-profile-${key}`}>
                    <label htmlFor={`clinical-profile-${key}`} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {label}
                    </label>
                    <Textarea
                      id={`clinical-profile-${key}`}
                      data-testid={`input-clinical-profile-${key}`}
                      value={editor[key]}
                      onChange={(event) => setEditor((current) => ({ ...current, [key]: event.target.value }))}
                      disabled={generateProfile.isPending || saveProfile.isPending}
                      rows={key === "resumenProfesional" ? 5 : 3}
                      maxLength={12000}
                      className="min-h-[80px] text-sm leading-relaxed"
                    />
                  </div>
                ))}
              </section>

              <details className="rounded-md border px-3 py-2" data-testid="panel-clinical-profile-history">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
                  <History className="h-4 w-4 text-violet-600" />
                  Historial de versiones
                  <span className="text-xs font-normal text-muted-foreground">({versions.length})</span>
                </summary>
                <p className="mt-2 text-xs text-muted-foreground">Las versiones anteriores son de solo lectura y no modifican el perfil actual.</p>
                {versionsQuery.isLoading ? (
                  <p className="mt-3 text-xs text-muted-foreground">Cargando historial…</p>
                ) : versionsQuery.isError ? (
                  <div className="mt-3 text-xs text-destructive" role="alert">
                    No se pudo cargar el historial.
                    <button type="button" onClick={() => void versionsQuery.refetch()} data-testid="button-retry-clinical-profile-history" className="ml-2 underline">Reintentar</button>
                  </div>
                ) : versions.length === 0 ? (
                  <p className="mt-3 text-xs text-muted-foreground" data-testid="empty-clinical-profile-history">Todavía no hay versiones anteriores.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {versions.map((version) => (
                      <li key={version.versionId}>
                        <button
                          type="button"
                          onClick={() => setReviewedVersion(version)}
                          data-testid={`button-review-clinical-profile-version-${version.versionId}`}
                          aria-pressed={reviewedVersion?.versionId === version.versionId}
                          className={`w-full rounded-md border px-3 py-2 text-left text-xs ${reviewedVersion?.versionId === version.versionId ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
                        >
                          <span className="flex items-center gap-2 font-medium"><Clock3 className="h-3.5 w-3.5" />{formatVersionDate(version.createdAt)}</span>
                          <span className="ml-5 text-muted-foreground">Versión {version.versionId} · Solo lectura</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </details>

              {reviewedVersion && (
                <section className="space-y-3 rounded-md border p-3" data-testid={`panel-clinical-profile-version-${reviewedVersion.versionId}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold">Versión {reviewedVersion.versionId}</h3>
                      <p className="text-xs text-muted-foreground">{formatVersionDate(reviewedVersion.createdAt)} · Solo lectura</p>
                    </div>
                    <button type="button" aria-label="Cerrar vista histórica" onClick={() => setReviewedVersion(null)} data-testid="button-close-clinical-profile-history" className="rounded p-1 text-muted-foreground hover:bg-muted">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="max-h-[32vh] space-y-3 overflow-y-auto">
                    {PROFILE_FIELDS.filter(({ key }) => reviewedVersion.perfil[key]?.trim()).map(({ key, label }) => (
                      <div key={key} data-testid={`text-history-${key}-${reviewedVersion.versionId}`}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{reviewedVersion.perfil[key]}</p>
                      </div>
                    ))}
                    {!profileHasContent(toProfile(reviewedVersion.perfil)) && <p className="text-xs text-muted-foreground">Esta versión no contiene campos con texto.</p>}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={printReviewed} data-testid="button-print-clinical-profile-version" className="gap-1.5">
                    <Printer className="h-3.5 w-3.5" /> Imprimir esta versión
                  </Button>
                </section>
              )}

              <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t bg-background py-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={saveProfile.isPending || generateProfile.isPending} data-testid="button-close-clinical-profile">
                  Cerrar
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={copyProfile} disabled={!profileHasContent(editor)} data-testid="button-copy-clinical-profile" className="gap-1.5">
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copiado" : "Copiar todo"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={printEditor} disabled={!profileHasContent(editor)} data-testid="button-print-clinical-profile" className="gap-1.5">
                  <Printer className="h-3.5 w-3.5" /> Imprimir / PDF
                </Button>
                <Button type="button" size="sm" onClick={() => void save()} disabled={!dirty || !profileHasContent(editor) || saveProfile.isPending || generateProfile.isPending} data-testid="button-save-clinical-profile" className="gap-1.5 bg-violet-600 text-white hover:bg-violet-700">
                  <Save className="h-3.5 w-3.5" /> {saveProfile.isPending ? "Guardando…" : "Guardar perfil"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
