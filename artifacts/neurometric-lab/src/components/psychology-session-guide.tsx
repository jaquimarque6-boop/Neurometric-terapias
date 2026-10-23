import { Brain, Check } from "lucide-react";
import { AutoGrowTextarea } from "@/components/ui/auto-grow-textarea";
import {
  getPsychologySessionSuggestions,
  PSYCHOLOGY_SESSION_AREAS,
  PSYCHOLOGY_SESSION_FIELDS,
  type PsychologySessionDraft,
} from "@/lib/psychology-session";
import type { PsychologyAgeStage } from "@/lib/psychology-clinical";

type PsychologySessionGuideProps = {
  stageLabel: string;
  formattedAge: string | null;
  selectedAreaIds: string[];
  onSelectedAreaIdsChange: (ids: string[]) => void;
  showAgeContext?: boolean;
};

export function PsychologySessionGuide({
  stageLabel,
  formattedAge,
  selectedAreaIds,
  onSelectedAreaIdsChange,
  showAgeContext = true,
}: PsychologySessionGuideProps) {
  const toggleArea = (id: string) => {
    onSelectedAreaIdsChange(
      selectedAreaIds.includes(id)
        ? selectedAreaIds.filter(selected => selected !== id)
        : [...selectedAreaIds, id],
    );
  };

  return (
    <section
      aria-labelledby="psychology-session-guide-title"
      data-testid="psychology-session-guide"
      className="overflow-hidden rounded-2xl border shadow-sm"
      style={{ borderColor: "#E8D5C4", background: "#FEFAF6" }}
    >
      <div
        className="flex items-center gap-2 border-b px-5 py-3.5"
        style={{ borderColor: "#E8D5C4", background: "#FDF3E9" }}
      >
        <Brain className="h-4 w-4" style={{ color: "#C4703A" }} />
        <h2 id="psychology-session-guide-title" className="text-sm font-semibold" style={{ color: "#7C3D12" }}>
          Guía de sesión psicológica
        </h2>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {showAgeContext && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold text-orange-900">
              {stageLabel}{formattedAge ? ` · ${formattedAge}` : ""}
            </span>
            <span className="text-xs text-muted-foreground">
              Orientación automática según la edad registrada; no modifica la ficha.
            </span>
          </div>
        )}

        <div className="space-y-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Áreas a considerar</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Seleccioná una o varias según el motivo de consulta y tu criterio profesional.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PSYCHOLOGY_SESSION_AREAS.map(area => {
              const selected = selectedAreaIds.includes(area.id);
              return (
                <button
                  key={area.id}
                  type="button"
                  data-testid={`button-psychology-area-${area.id}`}
                  aria-pressed={selected}
                  onClick={() => toggleArea(area.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
                    selected
                      ? "border-orange-400 bg-orange-100 text-orange-950"
                      : "border-border bg-white text-foreground/80 hover:border-orange-300 hover:bg-orange-50"
                  }`}
                >
                  {selected && <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
                  {area.label}
                </button>
              );
            })}
          </div>
        </div>

        {showAgeContext && (
          <p className="rounded-xl border border-orange-100 bg-white/80 px-3.5 py-3 text-xs leading-relaxed text-orange-950/80">
            Las orientaciones son opcionales. Se pueden adaptar a distintos marcos teóricos y no sustituyen el criterio clínico ni generan diagnósticos.
          </p>
        )}
      </div>
    </section>
  );
}

type PsychologySessionFieldsProps = {
  stage: PsychologyAgeStage;
  selectedAreaIds: string[];
  value: PsychologySessionDraft;
  onChange: (value: PsychologySessionDraft) => void;
  showSuggestions?: boolean;
};

export function PsychologySessionFields({
  stage,
  selectedAreaIds,
  value,
  onChange,
  showSuggestions = true,
}: PsychologySessionFieldsProps) {
  const suggestions = getPsychologySessionSuggestions(stage, selectedAreaIds);

  return (
    <div className="space-y-4">
      {PSYCHOLOGY_SESSION_FIELDS.map(({ key, label }) => (
        <div key={key} className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor={`psychology-session-${key}`} className="text-xs font-medium text-muted-foreground">
              {label} <span className="font-normal">(opcional)</span>
            </label>
            {showSuggestions && (
              <button
                type="button"
                data-testid={`button-use-psychology-guidance-${key}`}
                disabled={Boolean(value[key].trim())}
                onClick={() => onChange({ ...value, [key]: suggestions[key] })}
                className="text-[11px] font-semibold text-orange-800 underline decoration-orange-300 underline-offset-2 hover:text-orange-950 disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
                aria-label={`Usar orientación para ${label}`}
              >
                Usar orientación
              </button>
            )}
          </div>
          <AutoGrowTextarea
            minRows={key === "interventions" || key === "objectives" ? 4 : 3}
            maxRows={16}
            id={`psychology-session-${key}`}
            data-testid={`input-psychology-session-${key}`}
            value={value[key]}
            onChange={event => onChange({ ...value, [key]: event.target.value })}
            className="resize-none bg-muted/30 text-sm"
            placeholder="Podés dejarlo vacío o agregar una nota propia."
          />
        </div>
      ))}
    </div>
  );
}

export function PsychologyObservationSuggestion({
  stage,
  selectedAreaIds,
  value,
  onChange,
}: {
  stage: PsychologyAgeStage;
  selectedAreaIds: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const suggestion = getPsychologySessionSuggestions(stage, selectedAreaIds).clinicalObservations;
  return (
    <button
      type="button"
      disabled={Boolean(value.trim())}
      onClick={() => onChange(suggestion)}
      className="text-[11px] font-semibold text-orange-800 underline decoration-orange-300 underline-offset-2 hover:text-orange-950 disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
      aria-label="Usar orientación para observaciones clínicas"
    >
      Usar orientación para observaciones
    </button>
  );
}
