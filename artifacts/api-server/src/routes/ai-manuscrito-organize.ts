import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { requireAiConsent } from "../lib/consents";

const router: IRouter = Router();
const MAX_TEXT_LENGTH = 40_000;

type OrganizedFields = {
  diagnostico: string;
  resumenSesion: string;
  observaciones: string;
  recomendacionesHogar: string;
};

type AnamnesisFields = {
  motivoConsulta: string;
  antecedentes: string;
  historiaFamiliar: string;
  escolaridad: string;
  observaciones: string;
  lenguajeComunicacion: string;
  atencionConducta: string;
  vozHabla: string;
  deglucion: string;
  impresionClinica: string;
  rutinasHabitos: string;
  entornoParticipacion: string;
};

const ANAMNESIS_FIELD_KEYS: Array<keyof AnamnesisFields> = [
  "motivoConsulta", "antecedentes", "historiaFamiliar", "escolaridad",
  "observaciones", "lenguajeComunicacion", "atencionConducta", "vozHabla",
  "deglucion", "impresionClinica", "rutinasHabitos", "entornoParticipacion",
];

function getSessionUser(req: any): { id: number; role: string } | null {
  if (!req.session?.userId) return null;
  return { id: req.session.userId, role: req.session.userRole ?? "professional" };
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, MAX_TEXT_LENGTH) : "";
}

function normalizeResponse(value: unknown): OrganizedFields {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    diagnostico: asText(source.diagnostico),
    resumenSesion: asText(source.resumenSesion),
    observaciones: asText(source.observaciones),
    recomendacionesHogar: asText(source.recomendacionesHogar),
  };
}

function normalizeAnamnesisResponse(value: unknown): AnamnesisFields {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries(
    ANAMNESIS_FIELD_KEYS.map(key => [key, asText(source[key])]),
  ) as AnamnesisFields;
}

const SESSION_ORGANIZE_PROMPT = `Organizás texto clínico ya revisado por una profesional en campos de un registro de sesión.

Tu única fuente es el texto recibido. Podés ordenar, redactar, agrupar, eliminar repeticiones y mejorar claridad, pero no podés agregar información.

Reglas obligatorias:
- diagnóstico: completar solamente si aparece escrito explícitamente en el texto; nunca inferirlo.
- resumenSesion: organizar qué se trabajó solamente con información presente.
- observaciones: incluir respuestas, dificultades, ayudas, participación u otras observaciones solamente si están mencionadas.
- recomendacionesHogar: completar solamente si la profesional escribió explícitamente una indicación o recomendación para el hogar.
- Si un campo no tiene información explícita, devolver "".
- No inventar actividades, respuestas, evolución, logros, dificultades ni recomendaciones.
- No crear objetivos, modificar porcentajes ni asociar información a objetivos.
- No usar información externa ni datos del paciente.
- Devolver exclusivamente JSON válido con exactamente estas claves:
{"diagnostico":"","resumenSesion":"","observaciones":"","recomendacionesHogar":""}`;

const ANAMNESIS_ORGANIZE_PROMPT = `Organizás una transcripción obtenida de fotografías manuscritas en los campos existentes de la anamnesis clínica de Neurometric.

Tu única fuente es el texto recibido. Ordená solo la información explícita; no infieras, completes ni inventes datos clínicos.

Asigná únicamente información explícita a estos campos:
- motivoConsulta: motivo expresamente indicado para la consulta o derivación.
- antecedentes: antecedentes explícitos del embarazo, parto, período neonatal, desarrollo o salud.
- historiaFamiliar: composición familiar, dinámica o antecedentes familiares expresamente mencionados.
- escolaridad: nivel, curso, institución, aprendizaje o apoyos escolares mencionados.
- observaciones: observaciones explícitas que no correspondan mejor a otro campo; no dupliques información.
- lenguajeComunicacion: comprensión, expresión, comunicación o interacción mencionadas.
- atencionConducta: atención, conducta o regulación mencionadas.
- vozHabla: voz, articulación, fluidez o habla mencionadas.
- deglucion: deglución o alimentación únicamente cuando se describan explícitamente.
- impresionClinica: una impresión clínica solo si aparece expresamente en el texto; no propongas diagnósticos.
- rutinasHabitos: rutinas o hábitos expresamente descriptos.
- entornoParticipacion: entorno, participación, vínculos o actividades mencionados.
- Si un campo no tiene información explícita, devolvé "".
- No completes datos desde conocimiento general ni uses el nombre, edad, diagnóstico u otra información externa del paciente.
- Devolvé exclusivamente JSON válido con exactamente estas claves:
{"motivoConsulta":"","antecedentes":"","historiaFamiliar":"","escolaridad":"","observaciones":"","lenguajeComunicacion":"","atencionConducta":"","vozHabla":"","deglucion":"","impresionClinica":"","rutinasHabitos":"","entornoParticipacion":""}`;

router.post("/ai/manuscrito-organize", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });
  if (!await requireAiConsent(req, res)) return;

  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!text) return res.status(400).json({ error: "El texto revisado es obligatorio." });
  if (text.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({ error: "El texto revisado es demasiado extenso." });
  }
  const target = req.body?.target ?? "session";
  if (target !== "session" && target !== "anamnesis") {
    return res.status(400).json({ error: "El destino de organización no es válido." });
  }

  const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_API_KEY
    ? "https://api.openai.com/v1"
    : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const model = process.env.OPENAI_API_KEY ? "gpt-4o" : "gpt-5.4";

  if (!apiKey) {
    return res.status(503).json({ error: "La organización con IA no está configurada." });
  }

  const openai = new OpenAI({ apiKey, baseURL });

  try {
    const response = await openai.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: target === "anamnesis" ? ANAMNESIS_ORGANIZE_PROMPT : SESSION_ORGANIZE_PROMPT,
        },
        {
          role: "user",
          content: `Organizá únicamente este texto revisado, sin completar información faltante:\n\n${text}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error("La IA no devolvió una propuesta.");
    const parsed = JSON.parse(raw);
    if (target === "anamnesis") {
      return res.json(normalizeAnamnesisResponse(parsed));
    }
    return res.json(normalizeResponse(parsed));
  } catch (error: any) {
    console.error("[ai-manuscrito-organize] Error:", error?.message);
    return res.status(502).json({
      error: "No se pudo organizar la transcripción. Revisá el texto e intentá nuevamente.",
    });
  }
});

export default router;