import type { PsychologyAgeStage } from "./psychology-clinical";
import {
  PSYCHOLOGY_SESSION_SECTION_LABELS,
  serializePsychologySessionSummary,
  type PsychologySessionArea,
  type PsychologySessionFields,
} from "@workspace/clinical-specialty";

export const PSYCHOLOGY_SESSION_AREAS = [
  { id: "emotion", label: "Regulación e identificación emocional" },
  { id: "anxiety", label: "Ansiedad, estrés y afrontamiento" },
  { id: "behavior", label: "Conducta y autorregulación" },
  { id: "self-concept", label: "Autoestima y autoconcepto" },
  { id: "relationships", label: "Relaciones interpersonales y vínculos" },
  { id: "social-skills", label: "Habilidades sociales y comunicación" },
  { id: "cognition", label: "Funciones cognitivas y ejecutivas" },
  { id: "grief", label: "Duelo, adaptación y cambios vitales" },
  { id: "autonomy", label: "Autonomía y funcionamiento cotidiano" },
  { id: "strengths", label: "Recursos personales y fortalezas" },
] as const;

export type PsychologySessionAreaId = (typeof PSYCHOLOGY_SESSION_AREAS)[number]["id"];

export type PsychologySessionDraft = PsychologySessionFields;

export type PsychologySessionSuggestionKey =
  | keyof PsychologySessionDraft
  | "clinicalObservations";

export const PSYCHOLOGY_SESSION_FIELDS = PSYCHOLOGY_SESSION_SECTION_LABELS;

export function createEmptyPsychologySessionDraft(): PsychologySessionDraft {
  return {
    focus: "",
    objectives: "",
    interventions: "",
    participation: "",
    evolution: "",
    nextSteps: "",
  };
}

export function getPsychologySessionSuggestions(
  stage: PsychologyAgeStage,
  selectedAreaIds: readonly string[] = [],
): Record<PsychologySessionSuggestionKey, string> {
  const selectedAreas = PSYCHOLOGY_SESSION_AREAS
    .filter(area => selectedAreaIds.includes(area.id))
    .map(area => area.label);
  const focusContext = selectedAreas.length
    ? `Explorar qué aspectos de ${selectedAreas.join(", ")} son relevantes para la persona hoy y cómo los describe.`
    : "Explorar qué tema de la sesión es relevante para la persona hoy y cómo lo describe.";

  const stageSuggestions: Record<
    PsychologyAgeStage,
    Pick<Record<PsychologySessionSuggestionKey, string>, "focus" | "objectives" | "interventions" | "participation" | "nextSteps">
  > = {
    primera_infancia: {
      focus: `${focusContext} Considerar el juego, la expresión y las señales de comodidad según corresponda.`,
      objectives: "Acordar un objetivo breve y observable, respetando las señales y el ritmo del niño o la niña.",
      interventions: "Registrar los recursos utilizados (por ejemplo, juego, conversación o expresión creativa) y cómo se ajustaron a la respuesta observada.",
      participation: "Describir la participación mediante palabras, gestos, juego o elecciones, sin atribuir estados que no se hayan observado.",
      nextSteps: "Definir un próximo paso acorde a la etapa; incluir a cuidadores solo si resulta pertinente.",
    },
    ninez: {
      focus: `${focusContext} Considerar los contextos cotidianos que la persona señale como significativos.`,
      objectives: "Acordar con el niño o la niña un objetivo concreto y comprensible para este encuentro.",
      interventions: "Registrar los recursos utilizados (por ejemplo, conversación, juego o recursos expresivos) y su relación con el objetivo acordado.",
      participation: "Describir qué expresó la persona, cómo participó y qué apoyos fueron utilizados, si los hubo.",
      nextSteps: "Proponer un paso posible junto con el niño o la niña; considerar a sus referentes solo cuando corresponda.",
    },
    adolescencia: {
      focus: `${focusContext} Priorizar la perspectiva, los intereses y la autonomía de la persona adolescente.`,
      objectives: "Acordar con la persona adolescente un objetivo que considere significativo para la sesión.",
      interventions: "Registrar las estrategias utilizadas y su pertinencia para el objetivo acordado, desde el marco clínico elegido.",
      participation: "Describir la participación y las preferencias expresadas, cuidando el encuadre y la confidencialidad.",
      nextSteps: "Acordar con la persona un próximo paso que resulte viable y respetuoso de su autonomía.",
    },
    adultez: {
      focus: `${focusContext} Partir de las situaciones cotidianas y prioridades que la persona elija.`,
      objectives: "Acordar con la persona un objetivo concreto y significativo para este encuentro.",
      interventions: "Registrar las estrategias o técnicas utilizadas y su relación con el objetivo acordado, desde el marco clínico elegido.",
      participation: "Describir la perspectiva expresada por la persona y cómo participó en el intercambio.",
      nextSteps: "Acordar con la persona un próximo paso que resulte pertinente y viable en su contexto.",
    },
    adultez_mayor: {
      focus: `${focusContext} Considerar las prioridades, preferencias y cambios vitales que la persona decida abordar.`,
      objectives: "Acordar con la persona un objetivo significativo, respetando sus preferencias y ritmo.",
      interventions: "Registrar las estrategias utilizadas y cómo respondieron a las preferencias y necesidades expresadas.",
      participation: "Describir la perspectiva, preferencias y participación de la persona, sin inferir más allá de lo observado.",
      nextSteps: "Acordar con la persona un paso pertinente; considerar su red de apoyo solo si ella lo desea.",
    },
    desconocida: {
      focus: focusContext,
      objectives: "Acordar con la persona un objetivo para el encuentro, ajustado a la información disponible.",
      interventions: "Registrar los recursos utilizados y su relación con el objetivo acordado, desde el marco clínico elegido.",
      participation: "Describir la perspectiva expresada y la participación observada, sin inferir más allá de lo registrado.",
      nextSteps: "Acordar un próximo paso pertinente con la persona.",
    },
  };

  const guidance = stageSuggestions[stage];
  return {
    ...guidance,
    clinicalObservations:
      "Registrar hechos observables y su contexto; diferenciar observación de interpretación.",
    evolution:
      "Describir cambios observados o referidos en relación con información previa disponible; dejarlo en blanco si no corresponde.",
  };
}

export function buildPsychologySessionSummary(
  selectedAreaIds: readonly string[],
  draft: PsychologySessionDraft,
  preservedAreas: readonly PsychologySessionArea[] = [],
): string {
  const knownAreas = selectedAreaIds
    .map(id => PSYCHOLOGY_SESSION_AREAS.find(area => area.id === id))
    .filter((area): area is (typeof PSYCHOLOGY_SESSION_AREAS)[number] => !!area);
  const knownIds = new Set<string>(PSYCHOLOGY_SESSION_AREAS.map(area => area.id));
  const forwardCompatibleAreas = preservedAreas.filter(area => !knownIds.has(area.id));
  return serializePsychologySessionSummary(
    [...knownAreas, ...forwardCompatibleAreas],
    draft,
  );
}

export function hasPsychologySessionContent(
  selectedAreaIds: readonly string[],
  draft: PsychologySessionDraft,
  clinicalObservations: string,
): boolean {
  return selectedAreaIds.length > 0
    || PSYCHOLOGY_SESSION_FIELDS.some(({ key }) => draft[key].trim().length > 0)
    || clinicalObservations.trim().length > 0;
}
