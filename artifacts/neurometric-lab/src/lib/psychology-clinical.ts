import { calcularEdad, formatEdad } from "../utils/edad";

export type PsychologyAnamnesisSectionStatus = "not_explored" | "draft" | "recorded";
export type PsychologyAnamnesisSection = {
  status: PsychologyAnamnesisSectionStatus;
  text: string;
};
export type PsychologyAnamnesisSections = Record<
  | "reasonAndExpectations"
  | "personalFamilyHistory"
  | "developmentalHistory"
  | "emotionalRegulation"
  | "behaviorDailyFunctioning"
  | "relationshipsSupport"
  | "lifeContext"
  | "sleepHabitsRoutines"
  | "strengthsInterestsResources"
  | "previousTreatmentsStrategies"
  | "riskAndProtection",
  PsychologyAnamnesisSection
>;
export type PsychologyEvaluationAreas = Record<
  | "emotionalAffective"
  | "behavioral"
  | "cognitiveExecutive"
  | "socialRelational"
  | "autonomyDailyFunctioning"
  | "copingEmotionalRegulation"
  | "strengthsResources",
  string
>;
export type PsychologyInterview = {
  id: string;
  date: string | null;
  participant: string;
  notes: string;
};
export type PsychologyInstrument = {
  id: string;
  name: string;
  version: string;
  date: string | null;
  results: string;
  interpretation: string;
};
export type PsychologyEvaluation = {
  id: string;
  title: string;
  date: string | null;
  status: "draft" | "completed";
  areas: PsychologyEvaluationAreas;
  interviews: PsychologyInterview[];
  instruments: PsychologyInstrument[];
  professionalInterpretation: string;
};
export type PsychologyClinicalData = {
  schemaVersion: 1;
  anamnesis: { sections: PsychologyAnamnesisSections };
  evaluations: PsychologyEvaluation[];
};

export type PsychologyAgeStage =
  | "primera_infancia"
  | "ninez"
  | "adolescencia"
  | "adultez"
  | "adultez_mayor"
  | "desconocida";

export const ANAMNESIS_FIELDS: {
  key: keyof PsychologyAnamnesisSections;
  title: string;
  prompt: (stage: PsychologyAgeStage) => string;
}[] = [
  {
    key: "reasonAndExpectations",
    title: "Motivo y expectativas",
    prompt: () => "¿Qué trae a consulta? ¿Qué espera la persona de este espacio?",
  },
  {
    key: "personalFamilyHistory",
    title: "Antecedentes personales y familiares",
    prompt: (stage) =>
      stage === "adultez" || stage === "adultez_mayor"
        ? "Antecedentes relevantes referidos por la persona, si desea compartirlos."
        : "Antecedentes personales y familiares relevantes, según lo compartido por la persona o sus cuidadores.",
  },
  {
    key: "developmentalHistory",
    title: "Historia del desarrollo",
    prompt: (stage) =>
      stage === "adultez" || stage === "adultez_mayor"
        ? "Hitos o experiencias del desarrollo relevantes, si corresponde."
        : "Hitos del desarrollo y contexto de crianza, según la etapa y la información disponible.",
  },
  {
    key: "emotionalRegulation",
    title: "Experiencia emocional y regulación",
    prompt: () => "Situaciones, emociones y recursos que la persona identifica.",
  },
  {
    key: "behaviorDailyFunctioning",
    title: "Conducta y funcionamiento cotidiano",
    prompt: (stage) =>
      stage === "adultez" || stage === "adultez_mayor"
        ? "Rutinas, actividades cotidianas y aspectos que la persona considera importantes."
        : "Rutinas y funcionamiento en los contextos cotidianos relevantes.",
  },
  {
    key: "relationshipsSupport",
    title: "Vínculos y apoyos",
    prompt: (stage) =>
      stage === "adultez" || stage === "adultez_mayor"
        ? "Vínculos y apoyos significativos, solo si la persona desea incluirlos."
        : "Vínculos significativos y apoyos disponibles, de acuerdo con la edad y el contexto.",
  },
  {
    key: "lifeContext",
    title: "Contexto de vida",
    prompt: (stage) =>
      stage === "ninez" || stage === "adolescencia"
        ? "Contextos relevantes para la persona; puede incluir hogar y escuela si corresponde."
        : "Contextos cotidianos relevantes para la persona.",
  },
  {
    key: "sleepHabitsRoutines",
    title: "Sueño, hábitos y rutinas",
    prompt: () => "Hábitos y rutinas que la persona considera relevantes.",
  },
  {
    key: "strengthsInterestsResources",
    title: "Fortalezas, intereses y recursos",
    prompt: () => "Intereses, capacidades y recursos personales o del entorno.",
  },
  {
    key: "previousTreatmentsStrategies",
    title: "Atenciones previas y estrategias",
    prompt: () => "Experiencias previas y estrategias que la persona reconoce como útiles.",
  },
  {
    key: "riskAndProtection",
    title: "Factores de riesgo y protección",
    prompt: () => "Registrar únicamente información explorada y pertinente, con lenguaje descriptivo.",
  },
];

export const EVALUATION_AREAS: {
  key: keyof PsychologyEvaluationAreas;
  title: string;
  prompt: string;
}[] = [
  { key: "emotionalAffective", title: "Área emocional y afectiva", prompt: "Observaciones descriptivas, según la evaluación profesional." },
  { key: "behavioral", title: "Área conductual", prompt: "Conductas observadas o referidas y su contexto." },
  { key: "cognitiveExecutive", title: "Área cognitiva y ejecutiva", prompt: "Aspectos explorados; registrar observaciones sin inferencias automáticas." },
  { key: "socialRelational", title: "Área social y relacional", prompt: "Interacciones y vínculos relevantes para esta evaluación." },
  { key: "autonomyDailyFunctioning", title: "Autonomía y funcionamiento diario", prompt: "Describir el contexto y las actividades pertinentes; participación opcional." },
  { key: "copingEmotionalRegulation", title: "Afrontamiento y regulación emocional", prompt: "Recursos y estrategias observados o referidos." },
  { key: "strengthsResources", title: "Fortalezas y recursos", prompt: "Capacidades, intereses y apoyos identificados." },
];

export function createPsychologyRecordId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    return (character === "x" ? random : (random & 0x3) | 0x8).toString(16);
  });
}

const blankSection = (): PsychologyAnamnesisSection => ({
  status: "not_explored",
  text: "",
});

export function createEmptyAnamnesisSections(): PsychologyAnamnesisSections {
  return Object.fromEntries(
    ANAMNESIS_FIELDS.map(({ key }) => [key, blankSection()]),
  ) as PsychologyAnamnesisSections;
}

export function createEmptyEvaluation(): PsychologyEvaluation {
  return {
    id: createPsychologyRecordId(),
    title: "Nueva evaluación",
    date: new Date().toISOString().slice(0, 10),
    status: "draft",
    areas: {
      emotionalAffective: "",
      behavioral: "",
      cognitiveExecutive: "",
      socialRelational: "",
      autonomyDailyFunctioning: "",
      copingEmotionalRegulation: "",
      strengthsResources: "",
    },
    interviews: [],
    instruments: [],
    professionalInterpretation: "",
  };
}

export function createEmptyPsychologyData(): PsychologyClinicalData {
  return {
    schemaVersion: 1,
    anamnesis: { sections: createEmptyAnamnesisSections() },
    evaluations: [],
  };
}

export function normalizePsychologyData(
  value?: PsychologyClinicalData | null,
): PsychologyClinicalData {
  const empty = createEmptyPsychologyData();
  if (!value) return empty;
  return {
    schemaVersion: 1,
    anamnesis: {
      sections: {
        ...empty.anamnesis.sections,
        ...(value.anamnesis?.sections ?? {}),
      },
    },
    evaluations: Array.isArray(value.evaluations) ? value.evaluations : [],
  };
}

export function getPsychologyAgeStage(
  birthDate?: string | null,
  manualAge?: number | string | null,
): { stage: PsychologyAgeStage; age: number | null; label: string; formattedAge: string | null } {
  const calculated = calcularEdad(birthDate, manualAge);
  const age = calculated?.anios ?? null;
  const formattedAge = formatEdad(birthDate, manualAge);

  if (age === null) return { stage: "desconocida", age: null, label: "Edad no disponible", formattedAge: null };
  if (age <= 5) return { stage: "primera_infancia", age, label: "Primera infancia", formattedAge };
  if (age <= 11) return { stage: "ninez", age, label: "Niñez", formattedAge };
  if (age <= 17) return { stage: "adolescencia", age, label: "Adolescencia", formattedAge };
  if (age <= 64) return { stage: "adultez", age, label: "Adultez", formattedAge };
  return { stage: "adultez_mayor", age, label: "Adultez mayor", formattedAge };
}
