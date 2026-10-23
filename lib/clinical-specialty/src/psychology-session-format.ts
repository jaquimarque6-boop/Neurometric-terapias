export type PsychologySessionFields = {
  focus: string;
  objectives: string;
  interventions: string;
  participation: string;
  evolution: string;
  nextSteps: string;
};

export type PsychologySessionArea = {
  id: string;
  label: string;
};

export type StructuredPsychologySession = {
  version: 1;
  areas: PsychologySessionArea[];
  fields: PsychologySessionFields;
};

export const PSYCHOLOGY_SESSION_SECTION_LABELS: {
  key: keyof PsychologySessionFields;
  label: string;
}[] = [
  { key: "focus", label: "Foco terapéutico" },
  { key: "objectives", label: "Objetivos de la sesión" },
  { key: "interventions", label: "Intervenciones" },
  { key: "participation", label: "Participación y respuesta" },
  { key: "evolution", label: "Evolución observada" },
  { key: "nextSteps", label: "Próximos pasos" },
];

const SESSION_START = "[[NEUROMETRIC:PSICOLOGIA:V1:INICIO]]";
const SESSION_END = "[[NEUROMETRIC:PSICOLOGIA:V1:FIN]]";

function isFields(value: unknown): value is PsychologySessionFields {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return PSYCHOLOGY_SESSION_SECTION_LABELS.every(
    ({ key }) => typeof candidate[key] === "string",
  );
}

function isAreas(value: unknown): value is PsychologySessionArea[] {
  return Array.isArray(value) && value.every(
    (area) =>
      !!area &&
      typeof area === "object" &&
      typeof area.id === "string" &&
      typeof area.label === "string",
  );
}

export function serializePsychologySessionSummary(
  areas: readonly PsychologySessionArea[],
  fields: PsychologySessionFields,
): string {
  const payload: StructuredPsychologySession = {
    version: 1,
    areas: areas.map(({ id, label }) => ({ id, label })),
    fields: { ...fields },
  };
  return `${SESSION_START}\n${JSON.stringify(payload)}\n${SESSION_END}`;
}

export function parsePsychologySessionSummary(
  summary: string | null | undefined,
): StructuredPsychologySession | null {
  if (typeof summary !== "string") return null;
  const start = `${SESSION_START}\n`;
  const end = `\n${SESSION_END}`;
  if (!summary.startsWith(start) || !summary.endsWith(end)) return null;

  try {
    const payloadText = summary.slice(start.length, -end.length);
    const payload: unknown = JSON.parse(payloadText);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return null;
    }
    const candidate = payload as Record<string, unknown>;
    if (
      candidate.version !== 1 ||
      !isAreas(candidate.areas) ||
      !isFields(candidate.fields)
    ) {
      return null;
    }
    return {
      version: 1,
      areas: candidate.areas,
      fields: candidate.fields,
    };
  } catch {
    return null;
  }
}

export function formatPsychologySessionSummary(
  summary: string | null | undefined,
): string {
  if (typeof summary !== "string" || !summary) return "";
  const parsed = parsePsychologySessionSummary(summary);
  if (!parsed) return summary;

  const sections: string[] = [];
  if (parsed.areas.length > 0) {
    sections.push(`Áreas trabajadas: ${parsed.areas.map((area) => area.label).join(", ")}`);
  }
  for (const { key, label } of PSYCHOLOGY_SESSION_SECTION_LABELS) {
    const value = parsed.fields[key];
    if (value !== "") sections.push(`${label}: ${value}`);
  }
  return sections.join("\n\n");
}
