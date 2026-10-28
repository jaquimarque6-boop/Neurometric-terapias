import { useMemo, useRef, useState } from "react";
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
import { AlertCircle, Brain, Check, Clock3, History, Printer, RefreshCw, Save, X } from "lucide-react";
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

const PROFILE_FIELDS: { key: keyof ClinicalProfile; label: string; hint: string }[] = [
  { key: "motivoConsulta", label: "Motivo de consulta", hint: "Demanda y motivo que orientan el proceso." },
  { key: "antecedentes", label: "Antecedentes relevantes", hint: "Síntesis de antecedentes pertinentes para el abordaje." },
  { key: "fortalezas", label: "Fortalezas", hint: "Recursos, intereses y capacidades observadas." },
  { key: "dificultades", label: "Dificultades", hint: "Aspectos que requieren acompañamiento clínico." },
  { key: "areasIntervencion", label: "Áreas de intervención", hint: "Campos de trabajo priorizados." },
  { key: "objetivosPrioritarios", label: "Objetivos prioritarios", hint: "Focos de trabajo definidos para el proceso." },
  { key: "resumenProfesional", label: "Resumen profesional", hint: "Síntesis elaborada desde el criterio profesional." },
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
  const dirtyRef = useRef(false);

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

  const openDialog = async () => {
    setOpen(true);
    setReviewedVersion(null);
    setIsOpening(true);
    try {
      const [currentResult] = await Promise.all([profileQuery.refetch(), versionsQuery.refetch()]);
      if (!dirtyRef.current && currentResult.data) {
        const next = toProfile(currentResult.data.perfil);
        setEditor(next);
        setSavedSnapshot(JSON.stringify(next));
        setHasLoadedEditor(true);
      }
    } finally {
      setIsOpening(false);
    }
  };

  const generate = async () => {
    if (dirty && profileHasContent(editor) && !window.confirm("La generación reemplazará el borrador actual del editor. ¿Quieres continuar?")) return;
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
      setEditor(generated);
      setHasLoadedEditor(true);
      setReviewedVersion(null);
      toast({ title: "Perfil generado", description: "Revisa el contenido y guarda una nueva versión cuando esté listo." });
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetClinicalProfileQueryKey(patientId) }),
        queryClient.invalidateQueries({ queryKey: getListClinicalProfileVersionsQueryKey(patientId) }),
      ]);
      await Promise.all([profileQuery.refetch(), versionsQuery.refetch()]);
      toast({ title: "Nueva versión guardada", description: "El perfil anterior se conserva en el historial." });
    } catch (error) {
      toast({ title: "No se pudo guardar", description: error instanceof Error ? error.message : "Intenta nuevamente.", variant: "destructive" });
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
        onClick={() => void openDialog()}
        data-testid="button-open-clinical-profile"
        className="gap-2 border-[#d7c8ad] bg-[#fbf8f1] text-[#66543b] hover:bg-[#f4efe4]"
      >
        <Brain className="h-4 w-4" />
        Perfil clínico
        {profileQuery.data?.perfil && <span className="h-1.5 w-1.5 rounded-full bg-[#668072]" aria-label="Perfil guardado" />}
      </Button>

      <Dialog open={open} onOpenChange={(next) => setOpen(next)}>
        <DialogContent className="max-h-[92dvh] max-w-5xl overflow-y-auto border-[#e6dfd1] bg-[#fcfbf7] p-0">
          <div className="border-b border-[#e8e2d6] bg-[#f3f3eb] px-5 py-5 sm:px-7">
            <DialogHeader>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6e8277]">
                <Brain className="h-4 w-4" /> Neurometric · Síntesis de trabajo
              </div>
              <DialogTitle className="mt-2 font-display text-2xl text-[#2f4940]" data-testid="heading-clinical-profile">Perfil clínico</DialogTitle>
              <DialogDescription className="max-w-3xl text-sm leading-6 text-[#6e7770]">
                Síntesis editable para el uso cotidiano. Se conserva separada de la anamnesis original y de los registros estructurados de Psicología.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-6 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_285px] sm:px-7">
            <section className="min-w-0 space-y-4" aria-label="Editor de perfil clínico">
              <div className={`flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${dirty ? "border-[#dec98f] bg-[#fbf5e3]" : "border-[#dce5dc] bg-[#f1f6f1]"}`} data-testid="status-clinical-profile-save">
                <div className="flex items-start gap-2.5">
                  {dirty ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#9b762e]" /> : <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#5b7966]" />}
                  <div>
                    <p className="text-sm font-semibold text-[#435349]">{dirty ? "Cambios sin guardar" : hasLoadedEditor ? "Editor actualizado" : "Editor listo"}</p>
                  <p className="mt-0.5 text-xs leading-5 text-[#747b70]">{isOpening ? "Actualizando el perfil y el historial…" : dirty ? "Cerrar este diálogo no guarda el borrador." : "Cada guardado crea una versión independiente."}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => void generate()} disabled={isOpening || generateProfile.isPending || saveProfile.isPending} data-testid="button-generate-clinical-profile" className="gap-1.5 border-[#cfd9ce] bg-white text-[#456052]">
                    <RefreshCw className={`h-3.5 w-3.5 ${generateProfile.isPending ? "animate-spin" : ""}`} />
                    {generateProfile.isPending ? "Generando…" : "Generar con IA"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={printEditor} disabled={isOpening || !profileHasContent(editor)} data-testid="button-print-clinical-profile" className="gap-1.5 border-[#d7c8ad] bg-white text-[#66543b]">
                    <Printer className="h-3.5 w-3.5" /> Imprimir / PDF
                  </Button>
                  <Button type="button" size="sm" onClick={() => void save()} disabled={isOpening || !dirty || saveProfile.isPending} data-testid="button-save-clinical-profile" className="gap-1.5 bg-[#57766a] text-white hover:bg-[#456257]">
                    <Save className="h-3.5 w-3.5" /> {saveProfile.isPending ? "Guardando…" : "Guardar versión"}
                  </Button>
                </div>
              </div>

              {profileQuery.isError && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert" data-testid="error-clinical-profile-load">
                  <span>No se pudo actualizar el perfil guardado.</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => void profileQuery.refetch()} data-testid="button-retry-clinical-profile">Reintentar</Button>
                </div>
              )}
              {saveProfile.isError && <p role="alert" data-testid="error-clinical-profile-save" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">No se guardó la versión. El borrador sigue disponible en el editor.</p>}
              {profileQuery.data?.source === "legacy" && (
                <div className="rounded-lg border border-[#e4d9bd] bg-[#fbf6e8] px-4 py-3 text-xs leading-5 text-[#6d5a37]" role="note" data-testid="notice-clinical-profile-legacy">
                  Este perfil proviene de un registro anterior sin autoría disponible. No se atribuye a una persona ni aparece como versión del historial. Guardarlo crea una versión nueva sin modificar ese registro.
                </div>
              )}

              <div className="space-y-3">
                {PROFILE_FIELDS.map(({ key, label, hint }, index) => (
                  <div key={key} className="rounded-xl border border-[#e6e1d6] bg-white p-4 shadow-[0_1px_2px_rgba(48,61,51,0.03)]" data-testid={`card-clinical-profile-${key}`}>
                    <div className="mb-2 flex items-start gap-3">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#edf2ec] font-mono text-[10px] text-[#64806d]">{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <label htmlFor={`clinical-profile-${key}`} className="text-sm font-semibold text-[#3b5145]">{label}</label>
                        <p className="mt-0.5 text-xs text-[#858a80]">{hint}</p>
                      </div>
                    </div>
                    <Textarea
                      id={`clinical-profile-${key}`}
                      data-testid={`input-clinical-profile-${key}`}
                      value={editor[key]}
                      onChange={(event) => setEditor((current) => ({ ...current, [key]: event.target.value }))}
                      disabled={isOpening}
                      rows={key === "resumenProfesional" ? 5 : 3}
                      maxLength={12000}
                      placeholder="Escribe una síntesis profesional clara y concreta."
                      className="resize-y border-[#e6e4dc] bg-[#fffefa] text-sm leading-6 placeholder:text-[#afb0a6] focus-visible:ring-[#78917d]"
                    />
                  </div>
                ))}
              </div>
            </section>

            <aside className="space-y-4">
              <section className="rounded-xl border border-[#e1e3d9] bg-[#f5f6f0] p-4" data-testid="panel-clinical-profile-history">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-[#688174]" />
                  <h3 className="text-sm font-semibold text-[#3d5448]">Historial de versiones</h3>
                </div>
                <p className="mt-1 text-xs leading-5 text-[#7a8277]">Historial disponible según el acceso de tu cuenta. Las versiones se consultan sin modificar el editor.</p>
                {versionsQuery.isLoading ? (
                  <div className="mt-4 space-y-2" aria-label="Cargando historial">
                    <div className="h-12 animate-pulse rounded-lg bg-[#e7e9df]" />
                    <div className="h-12 animate-pulse rounded-lg bg-[#e7e9df]" />
                  </div>
                ) : versionsQuery.isError ? (
                  <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800" role="alert">
                    <p>No se pudo cargar el historial.</p>
                    <button type="button" onClick={() => void versionsQuery.refetch()} data-testid="button-retry-clinical-profile-history" className="mt-2 underline">Reintentar</button>
                  </div>
                ) : versions.length === 0 ? (
                  <p className="mt-4 rounded-lg border border-dashed border-[#d8ddd2] px-3 py-4 text-center text-xs leading-5 text-[#858a80]" data-testid="empty-clinical-profile-history">Todavía no hay versiones anteriores.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {versions.map((version) => (
                      <li key={version.versionId}>
                        <button
                          type="button"
                          onClick={() => setReviewedVersion(version)}
                          data-testid={`button-review-clinical-profile-version-${version.versionId}`}
                          aria-pressed={reviewedVersion?.versionId === version.versionId}
                          className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${reviewedVersion?.versionId === version.versionId ? "border-[#7a9783] bg-[#eaf0e8]" : "border-[#e1e3d9] bg-white hover:bg-[#f9f8f3]"}`}
                        >
                          <span className="flex items-center gap-2 text-xs font-semibold text-[#46594c]"><Clock3 className="h-3.5 w-3.5" />{formatVersionDate(version.createdAt)}</span>
                          <span className="mt-1 block text-[11px] text-[#858a80]">Versión {version.versionId} · Solo lectura</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {reviewedVersion && (
                <section className="rounded-xl border border-[#d8e2d8] bg-white p-4" data-testid={`panel-clinical-profile-version-${reviewedVersion.versionId}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6e8277]">Vista de historial</p>
                      <h3 className="mt-1 text-sm font-semibold text-[#3d5448]">Versión {reviewedVersion.versionId}</h3>
                    </div>
                    <button type="button" aria-label="Cerrar vista histórica" onClick={() => setReviewedVersion(null)} data-testid="button-close-clinical-profile-history" className="rounded-md p-1 text-[#7d877d] hover:bg-[#f0f2eb]"><X className="h-4 w-4" /></button>
                  </div>
                  <p className="mt-1 text-xs text-[#858a80]">{formatVersionDate(reviewedVersion.createdAt)}</p>
                  <p className="mt-2 text-[11px] leading-5 text-[#7b8177]">Consulta de solo lectura. El contenido no se copia al editor.</p>
                  <div className="mt-3 max-h-[36vh] space-y-3 overflow-y-auto pr-1">
                    {PROFILE_FIELDS.filter(({ key }) => reviewedVersion.perfil[key]?.trim()).map(({ key, label }) => (
                      <div key={key} data-testid={`text-history-${key}-${reviewedVersion.versionId}`}>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#718477]">{label}</p>
                        <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[#4d5b50]">{reviewedVersion.perfil[key]}</p>
                      </div>
                    ))}
                    {!profileHasContent(toProfile(reviewedVersion.perfil)) && <p className="text-xs text-[#858a80]">Esta versión no contiene campos con texto.</p>}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={printReviewed} data-testid="button-print-clinical-profile-version" className="mt-4 w-full gap-1.5 border-[#d7c8ad] text-[#66543b]">
                    <Printer className="h-3.5 w-3.5" /> Imprimir esta versión
                  </Button>
                </section>
              )}
            </aside>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-[#e8e2d6] bg-[#f8f7f1] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-xs text-[#858a80]" data-testid="text-clinical-profile-patient">{patientName} · {dirty ? "Borrador sin guardar" : "Perfil clínico"}</p>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} data-testid="button-close-clinical-profile" className="gap-1.5 text-[#627168]">
              <X className="h-4 w-4" /> Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
