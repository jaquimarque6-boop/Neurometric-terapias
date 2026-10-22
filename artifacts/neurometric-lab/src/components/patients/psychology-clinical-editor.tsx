import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetPatientQueryKey,
  useUpdatePatient,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ANAMNESIS_FIELDS,
  EVALUATION_AREAS,
  createPsychologyRecordId,
  createEmptyEvaluation,
  normalizePsychologyData,
  getPsychologyAgeStage,
  type PsychologyAnamnesisSectionStatus,
  type PsychologyClinicalData,
  type PsychologyEvaluation,
  type PsychologyInterview,
  type PsychologyInstrument,
  type PsychologyAgeStage,
} from "@/lib/psychology-clinical";

type EditorProps = {
  patientId: number;
  psychologyData?: PsychologyClinicalData | null;
  fechaNacimiento?: string | null;
  age?: number | null;
};

type SavePanelProps = {
  dirty: boolean;
  isPending: boolean;
  onSave: () => void;
};

const statusLabels: Record<PsychologyAnamnesisSectionStatus, string> = {
  not_explored: "Sin explorar",
  draft: "Borrador",
  recorded: "Registrado",
};

const statusTone: Record<PsychologyAnamnesisSectionStatus, string> = {
  not_explored: "border-stone-200 bg-stone-50 text-stone-600",
  draft: "border-amber-200 bg-amber-50 text-amber-800",
  recorded: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

function SaveBar({ dirty, isPending, onSave }: SavePanelProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-stone-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-stone-600" role="status" data-testid="status-psychology-save">
        {isPending
          ? "Guardando información clínica…"
          : dirty
            ? "Hay cambios sin guardar. Puedes guardar un borrador incompleto."
            : "Los cambios guardados se mantienen en la ficha privada."}
      </p>
      <Button
        type="button"
        onClick={onSave}
        disabled={!dirty || isPending}
        data-testid="button-save-psychology"
        className="min-h-10 w-full bg-[#57766a] text-white hover:bg-[#456257] sm:w-auto"
      >
        {isPending ? "Guardando…" : "Guardar cambios"}
      </Button>
    </div>
  );
}

function StatusSelector({
  value,
  onChange,
  id,
}: {
  value: PsychologyAnamnesisSectionStatus;
  onChange: (value: PsychologyAnamnesisSectionStatus) => void;
  id: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Estado de exploración">
      {(Object.keys(statusLabels) as PsychologyAnamnesisSectionStatus[]).map((status) => (
        <button
          key={status}
          type="button"
          aria-pressed={value === status}
          data-testid={`status-${id}-${status}`}
          onClick={() => onChange(status)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#57766a] focus-visible:ring-offset-2 ${
            value === status
              ? statusTone[status]
              : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50"
          }`}
        >
          {statusLabels[status]}
        </button>
      ))}
    </div>
  );
}

export function AnamnesisGuidedEditor({
  sections,
  stage,
  onChange,
}: {
  sections: PsychologyClinicalData["anamnesis"]["sections"];
  stage: PsychologyAgeStage;
  onChange: (key: keyof typeof sections, patch: Partial<(typeof sections)[keyof typeof sections]>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#dce7e1] bg-[#f3f7f4] p-4">
        <p className="text-sm font-medium text-[#365447]">Guía de registro, no una lista obligatoria</p>
        <p className="mt-1 text-sm leading-6 text-stone-600">
          Cada apartado es opcional. Registra solo lo explorado; puedes dejarlo sin explorar o guardar un borrador.
        </p>
      </div>
      {ANAMNESIS_FIELDS.map(({ key, title, prompt }) => {
        const section = sections[key];
        const safeId = `anamnesis-${key}`;
        return (
          <section key={key} className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5" data-testid={`card-anamnesis-${key}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-stone-800">{title}</h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-500">{prompt(stage)}</p>
              </div>
              <span className={`w-fit rounded-full border px-2.5 py-1 text-xs ${statusTone[section.status]}`}>
                {statusLabels[section.status]}
              </span>
            </div>
            <label htmlFor={`${safeId}-text`} className="sr-only">{title}</label>
            <Textarea
              id={`${safeId}-text`}
              data-testid={`input-${safeId}`}
              value={section.text}
              onChange={(event) => onChange(key, { text: event.target.value })}
              placeholder={prompt(stage)}
              maxLength={20000}
              rows={3}
              className="mt-4 resize-y border-stone-200 bg-[#fffefd] text-sm leading-6 placeholder:text-stone-400 focus-visible:ring-[#57766a]"
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <StatusSelector
                id={key}
                value={section.status}
                onChange={(status) => onChange(key, { status })}
              />
              <span className="text-right text-xs tabular-nums text-stone-400">{section.text.length}/20000</span>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function EvaluationEditor({
  evaluation,
  onChange,
  onRemove,
}: {
  evaluation: PsychologyEvaluation;
  onChange: (updated: PsychologyEvaluation) => void;
  onRemove: () => void;
}) {
  const update = (patch: Partial<PsychologyEvaluation>) => onChange({ ...evaluation, ...patch });
  const updateInterview = (id: string, patch: Partial<PsychologyInterview>) =>
    update({ interviews: evaluation.interviews.map((item) => item.id === id ? { ...item, ...patch } : item) });
  const updateInstrument = (id: string, patch: Partial<PsychologyInstrument>) =>
    update({ instruments: evaluation.instruments.map((item) => item.id === id ? { ...item, ...patch } : item) });
  const addInterview = () => {
    if (evaluation.interviews.length >= 30) return;
    update({
      interviews: [...evaluation.interviews, {
        id: createPsychologyRecordId(),
        date: new Date().toISOString().slice(0, 10),
        participant: "",
        notes: "",
      }],
    });
  };
  const addInstrument = () => {
    if (evaluation.instruments.length >= 30) return;
    update({
      instruments: [...evaluation.instruments, {
        id: createPsychologyRecordId(),
        name: "",
        version: "",
        date: null,
        results: "",
        interpretation: "",
      }],
    });
  };

  return (
    <article className="space-y-5 rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_1px_2px_rgba(51,45,38,0.04)] sm:p-6" data-testid={`card-evaluation-${evaluation.id}`}>
      <header className="flex flex-col gap-4 border-b border-stone-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-stone-500" htmlFor={`evaluation-title-${evaluation.id}`}>Título</label>
          <input
            id={`evaluation-title-${evaluation.id}`}
            data-testid={`input-evaluation-title-${evaluation.id}`}
            value={evaluation.title}
            maxLength={200}
            onChange={(event) => update({ title: event.target.value })}
            className="w-full border-0 border-b border-stone-200 bg-transparent px-0 py-2 text-xl font-semibold text-stone-800 outline-none focus:border-[#57766a] focus:ring-0"
            placeholder="Nombre de la evaluación"
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-stone-600" htmlFor={`evaluation-date-${evaluation.id}`}>Fecha</label>
            <input
              id={`evaluation-date-${evaluation.id}`}
              data-testid={`input-evaluation-date-${evaluation.id}`}
              type="date"
              value={evaluation.date ?? ""}
              onChange={(event) => update({ date: event.target.value || null })}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#57766a]"
            />
            <label className="sr-only" htmlFor={`evaluation-status-${evaluation.id}`}>Estado de la evaluación</label>
            <select
              id={`evaluation-status-${evaluation.id}`}
              data-testid={`select-evaluation-status-${evaluation.id}`}
              value={evaluation.status}
              onChange={(event) => update({ status: event.target.value as PsychologyEvaluation["status"] })}
              className="rounded-lg border border-stone-200 bg-[#f8f7f3] px-3 py-2 text-sm text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#57766a]"
            >
              <option value="draft">Borrador</option>
              <option value="completed">Completada</option>
            </select>
          </div>
        </div>
        <Button type="button" variant="ghost" onClick={onRemove} data-testid={`button-remove-evaluation-${evaluation.id}`} className="self-start text-stone-500 hover:bg-rose-50 hover:text-rose-700">
          Quitar evaluación
        </Button>
      </header>

      <section>
        <div className="mb-3">
          <h4 className="font-semibold text-stone-800">Áreas exploradas</h4>
          <p className="mt-1 text-sm text-stone-500">Campos de texto libres; completa solo lo pertinente.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {EVALUATION_AREAS.map(({ key, title, prompt }) => (
            <div key={key} className={key === "strengthsResources" ? "md:col-span-2" : ""}>
              <label htmlFor={`evaluation-${evaluation.id}-${key}`} className="mb-1.5 block text-sm font-medium text-stone-700">{title}</label>
              <Textarea
                id={`evaluation-${evaluation.id}-${key}`}
                data-testid={`input-evaluation-${key}-${evaluation.id}`}
                value={evaluation.areas[key]}
                onChange={(event) => update({ areas: { ...evaluation.areas, [key]: event.target.value } })}
                placeholder={prompt}
                maxLength={6000}
                rows={3}
                className="resize-y border-stone-200 text-sm leading-6 placeholder:text-stone-400 focus-visible:ring-[#57766a]"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-[#f7f6f1] p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h4 className="font-semibold text-stone-800">Entrevistas</h4>
            <p className="mt-1 text-sm text-stone-500">Registro manual. La participación de terceros es opcional y contextual.</p>
          </div>
          <Button type="button" variant="outline" onClick={addInterview} disabled={evaluation.interviews.length >= 30} data-testid={`button-add-interview-${evaluation.id}`} className="border-stone-300 bg-white">Añadir entrevista</Button>
        </div>
        <div className="mt-4 space-y-3">
          {evaluation.interviews.map((interview, index) => (
            <div key={interview.id} className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600" htmlFor={`interview-participant-${interview.id}`}>Participante</label>
                  <input id={`interview-participant-${interview.id}`} data-testid={`input-interview-participant-${interview.id}`} maxLength={120} value={interview.participant} onChange={(event) => updateInterview(interview.id, { participant: event.target.value })} placeholder="Persona entrevistada (opcional)" className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#57766a]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600" htmlFor={`interview-date-${interview.id}`}>Fecha</label>
                  <input id={`interview-date-${interview.id}`} data-testid={`input-interview-date-${interview.id}`} type="date" value={interview.date ?? ""} onChange={(event) => updateInterview(interview.id, { date: event.target.value || null })} className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#57766a]" />
                </div>
                <Button type="button" variant="ghost" onClick={() => update({ interviews: evaluation.interviews.filter((item) => item.id !== interview.id) })} data-testid={`button-remove-interview-${interview.id}`} className="self-end text-stone-500">Quitar</Button>
              </div>
              <label className="sr-only" htmlFor={`interview-notes-${interview.id}`}>Notas de entrevista {index + 1}</label>
              <Textarea id={`interview-notes-${interview.id}`} data-testid={`input-interview-notes-${interview.id}`} maxLength={6000} rows={3} value={interview.notes} onChange={(event) => updateInterview(interview.id, { notes: event.target.value })} placeholder="Notas descriptivas de la entrevista" className="mt-3 border-stone-200 text-sm leading-6" />
            </div>
          ))}
          {evaluation.interviews.length === 0 && <p className="rounded-lg border border-dashed border-stone-300 px-4 py-5 text-center text-sm text-stone-500">Aún no se han añadido entrevistas.</p>}
        </div>
      </section>

      <section className="rounded-xl bg-[#f7f6f1] p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h4 className="font-semibold text-stone-800">Instrumentos y registros manuales</h4>
            <p className="mt-1 text-sm text-stone-500">No se calculan puntuaciones ni se generan interpretaciones automáticamente.</p>
          </div>
          <Button type="button" variant="outline" onClick={addInstrument} disabled={evaluation.instruments.length >= 30} data-testid={`button-add-instrument-${evaluation.id}`} className="border-stone-300 bg-white">Añadir instrumento</Button>
        </div>
        <div className="mt-4 space-y-3">
          {evaluation.instruments.map((instrument) => (
            <div key={instrument.id} className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr_180px_auto]">
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600" htmlFor={`instrument-name-${instrument.id}`}>Nombre</label>
                  <input id={`instrument-name-${instrument.id}`} data-testid={`input-instrument-name-${instrument.id}`} maxLength={200} value={instrument.name} onChange={(event) => updateInstrument(instrument.id, { name: event.target.value })} placeholder="Nombre del instrumento" className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#57766a]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600" htmlFor={`instrument-version-${instrument.id}`}>Versión</label>
                  <input id={`instrument-version-${instrument.id}`} data-testid={`input-instrument-version-${instrument.id}`} maxLength={120} value={instrument.version} onChange={(event) => updateInstrument(instrument.id, { version: event.target.value })} placeholder="Versión (opcional)" className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#57766a]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600" htmlFor={`instrument-date-${instrument.id}`}>Fecha</label>
                  <input id={`instrument-date-${instrument.id}`} data-testid={`input-instrument-date-${instrument.id}`} type="date" value={instrument.date ?? ""} onChange={(event) => updateInstrument(instrument.id, { date: event.target.value || null })} className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#57766a]" />
                </div>
                <Button type="button" variant="ghost" onClick={() => update({ instruments: evaluation.instruments.filter((item) => item.id !== instrument.id) })} data-testid={`button-remove-instrument-${instrument.id}`} className="self-end text-stone-500">Quitar</Button>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600" htmlFor={`instrument-results-${instrument.id}`}>Resultados registrados</label>
                  <Textarea id={`instrument-results-${instrument.id}`} data-testid={`input-instrument-results-${instrument.id}`} maxLength={6000} rows={3} value={instrument.results} onChange={(event) => updateInstrument(instrument.id, { results: event.target.value })} placeholder="Transcripción manual de resultados" className="border-stone-200 text-sm leading-6" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600" htmlFor={`instrument-interpretation-${instrument.id}`}>Interpretación profesional</label>
                  <Textarea id={`instrument-interpretation-${instrument.id}`} data-testid={`input-instrument-interpretation-${instrument.id}`} maxLength={6000} rows={3} value={instrument.interpretation} onChange={(event) => updateInstrument(instrument.id, { interpretation: event.target.value })} placeholder="Registro manual del profesional" className="border-stone-200 text-sm leading-6" />
                </div>
              </div>
            </div>
          ))}
          {evaluation.instruments.length === 0 && <p className="rounded-lg border border-dashed border-stone-300 px-4 py-5 text-center text-sm text-stone-500">Aún no se han añadido instrumentos.</p>}
        </div>
      </section>

      <section>
        <label htmlFor={`professional-interpretation-${evaluation.id}`} className="mb-2 block font-semibold text-stone-800">Interpretación profesional</label>
        <p className="mb-3 text-sm text-stone-500">Campo de registro del profesional; no se genera contenido clínico automáticamente.</p>
        <Textarea
          id={`professional-interpretation-${evaluation.id}`}
          data-testid={`input-professional-interpretation-${evaluation.id}`}
          value={evaluation.professionalInterpretation}
          maxLength={12000}
          onChange={(event) => update({ professionalInterpretation: event.target.value })}
          rows={5}
          placeholder="Escribe aquí tu interpretación profesional, si corresponde."
          className="resize-y border-stone-200 text-sm leading-6"
        />
      </section>
    </article>
  );
}

export function PsychologyClinicalEditor({
  patientId,
  psychologyData,
  fechaNacimiento,
  age,
}: EditorProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"anamnesis" | "evaluations">("anamnesis");
  const [data, setData] = useState(() => normalizePsychologyData(psychologyData));
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(normalizePsychologyData(psychologyData)));
  const initializedPatientId = useRef(patientId);
  const hasHydrated = useRef(psychologyData !== undefined);
  const updatePatient = useUpdatePatient();
  const ageInfo = getPsychologyAgeStage(fechaNacimiento, age);
  const dirty = JSON.stringify(data) !== savedSnapshot;

  // Hydrate once when patient data arrives; refetches never replace local edits.
  useEffect(() => {
    if (initializedPatientId.current !== patientId) {
      const next = normalizePsychologyData(psychologyData);
      setData(next);
      setSavedSnapshot(JSON.stringify(next));
      initializedPatientId.current = patientId;
      hasHydrated.current = psychologyData !== undefined;
      return;
    }
    if (!hasHydrated.current && psychologyData !== undefined) {
      const next = normalizePsychologyData(psychologyData);
      setData(next);
      setSavedSnapshot(JSON.stringify(next));
      hasHydrated.current = true;
    }
  }, [patientId, psychologyData]);

  const changeSection = (
    key: keyof PsychologyClinicalData["anamnesis"]["sections"],
    patch: Partial<PsychologyClinicalData["anamnesis"]["sections"][typeof key]>,
  ) => {
    setData((current) => ({
      ...current,
      anamnesis: {
        ...current.anamnesis,
        sections: {
          ...current.anamnesis.sections,
          [key]: { ...current.anamnesis.sections[key], ...patch },
        },
      },
    }));
  };

  const save = async () => {
    try {
      const payload = normalizePsychologyData(data);
      await updatePatient.mutateAsync({
        id: patientId,
        data: { psychologyData: payload } as unknown as Parameters<typeof updatePatient.mutateAsync>[0]["data"],
      } as Parameters<typeof updatePatient.mutateAsync>[0]);
      await queryClient.invalidateQueries({ queryKey: getGetPatientQueryKey(patientId) });
      setSavedSnapshot(JSON.stringify(payload));
      toast({ title: "Registro de Psicología guardado", description: "La ficha se actualizó correctamente." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible guardar los cambios.";
      toast({ title: "No se pudo guardar", description: message, variant: "destructive" });
    }
  };

  const addEvaluation = () => {
    if (data.evaluations.length >= 50) return;
    setData((current) => ({
      ...current,
      evaluations: [...current.evaluations, createEmptyEvaluation()],
    }));
    setActiveTab("evaluations");
  };

  return (
    <section className="space-y-5" aria-labelledby="psychology-record-heading" data-testid="panel-psychology-record">
      <header className="rounded-2xl border border-[#dce7e1] bg-[#f5f8f5] p-5 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#e3ede7] px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#456257]">Psicología</span>
              <span className="text-sm text-stone-500">{ageInfo.label}{ageInfo.formattedAge ? ` · ${ageInfo.formattedAge}` : ""}</span>
            </div>
            <h2 id="psychology-record-heading" className="text-2xl font-semibold tracking-tight text-stone-800">Historia clínica psicológica</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Registro estructurado y editable para acompañar el criterio profesional. No establece diagnósticos ni genera recomendaciones clínicas.
            </p>
          </div>
          {activeTab === "evaluations" && (
            <Button type="button" onClick={addEvaluation} disabled={data.evaluations.length >= 50} data-testid="button-add-psychology-evaluation" className="min-h-10 shrink-0 bg-[#57766a] text-white hover:bg-[#456257]">
              Nueva evaluación
            </Button>
          )}
        </div>
        {ageInfo.stage === "desconocida" && (
          <p className="mt-4 rounded-lg border border-stone-200 bg-white/80 px-3 py-2.5 text-sm leading-5 text-stone-600" data-testid="notice-psychology-age-unknown">
            Edad no disponible. Las orientaciones se mantienen neutrales; completa únicamente los apartados pertinentes.
          </p>
        )}
      </header>

      <div className="flex gap-2 border-b border-stone-200" role="tablist" aria-label="Secciones de Psicología">
        <button type="button" role="tab" aria-selected={activeTab === "anamnesis"} onClick={() => setActiveTab("anamnesis")} data-testid="tab-psychology-anamnesis" className={`border-b-2 px-4 py-3 text-sm font-medium ${activeTab === "anamnesis" ? "border-[#57766a] text-[#365447]" : "border-transparent text-stone-500 hover:text-stone-800"}`}>
          Anamnesis guiada
        </button>
        <button type="button" role="tab" aria-selected={activeTab === "evaluations"} onClick={() => setActiveTab("evaluations")} data-testid="tab-psychology-evaluations" className={`border-b-2 px-4 py-3 text-sm font-medium ${activeTab === "evaluations" ? "border-[#57766a] text-[#365447]" : "border-transparent text-stone-500 hover:text-stone-800"}`}>
          Evaluaciones <span className="ml-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs tabular-nums">{data.evaluations.length}</span>
        </button>
      </div>

      {activeTab === "anamnesis" ? (
        <div role="tabpanel" aria-labelledby="tab-psychology-anamnesis" className="space-y-5">
          <AnamnesisGuidedEditor sections={data.anamnesis.sections} stage={ageInfo.stage} onChange={changeSection} />
          <SaveBar dirty={dirty} isPending={updatePatient.isPending} onSave={save} />
        </div>
      ) : (
        <div role="tabpanel" aria-labelledby="tab-psychology-evaluations" className="space-y-5">
          {data.evaluations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-[#fbfaf7] px-5 py-10 text-center">
              <p className="font-medium text-stone-700">Todavía no hay evaluaciones</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">Puedes crear una evaluación y guardar un borrador en cualquier momento. Todos los campos son opcionales.</p>
              <Button type="button" onClick={addEvaluation} data-testid="button-create-first-evaluation" className="mt-5 bg-[#57766a] text-white hover:bg-[#456257]">Crear evaluación</Button>
            </div>
          ) : (
            data.evaluations.map((evaluation) => (
              <EvaluationEditor
                key={evaluation.id}
                evaluation={evaluation}
                onChange={(updated) => setData((current) => ({
                  ...current,
                  evaluations: current.evaluations.map((item) => item.id === evaluation.id ? updated : item),
                }))}
                onRemove={() => {
                  if (window.confirm("¿Quitar esta evaluación del borrador?")) {
                    setData((current) => ({
                      ...current,
                      evaluations: current.evaluations.filter((item) => item.id !== evaluation.id),
                    }));
                  }
                }}
              />
            ))
          )}
          <SaveBar dirty={dirty} isPending={updatePatient.isPending} onSave={save} />
        </div>
      )}
      {updatePatient.isError && (
        <p role="alert" data-testid="error-psychology-save" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          No se guardaron los cambios. Conservamos el contenido escrito en esta pantalla; vuelve a intentarlo.
        </p>
      )}
    </section>
  );
}
