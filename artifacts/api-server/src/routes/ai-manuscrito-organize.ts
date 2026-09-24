import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();
const MAX_TEXT_LENGTH = 40_000;

type OrganizedFields = {
  diagnostico: string;
  resumenSesion: string;
  observaciones: string;
  recomendacionesHogar: string;
};

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

router.post("/ai/manuscrito-organize", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!text) return res.status(400).json({ error: "El texto revisado es obligatorio." });
  if (text.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({ error: "El texto revisado es demasiado extenso." });
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
          content: `Organizás texto clínico ya revisado por una profesional en campos de un registro de sesión.

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
{"diagnostico":"","resumenSesion":"","observaciones":"","recomendacionesHogar":""}`,
        },
        {
          role: "user",
          content: `Organizá únicamente este texto revisado, sin completar información faltante:\n\n${text}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error("La IA no devolvió una propuesta.");
    return res.json(normalizeResponse(JSON.parse(raw)));
  } catch (error: any) {
    console.error("[ai-manuscrito-organize] Error:", error?.message);
    return res.status(502).json({
      error: "No se pudo organizar la transcripción. Revisá el texto e intentá nuevamente.",
    });
  }
});

export default router;