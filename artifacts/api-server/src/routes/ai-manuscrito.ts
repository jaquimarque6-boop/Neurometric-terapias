import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { db } from "@workspace/db";
import { eq } from "drizzle-orm";
import { patientsTable } from "@workspace/db/schema";

const router: IRouter = Router();

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const QUALITY_VALUES = new Set(["good", "fair", "poor"]);

function getSessionUser(req: any): { id: number; role: string } | null {
  if (!req.session?.userId) return null;
  return { id: req.session.userId, role: req.session.userRole ?? "professional" };
}

function decodeImageData(imageData: unknown, mimeType: unknown): Buffer | null {
  if (typeof imageData !== "string" || typeof mimeType !== "string") return null;
  if (!ALLOWED_MIME.has(mimeType)) return null;

  const prefix = `data:${mimeType};base64,`;
  if (!imageData.startsWith(prefix)) return null;

  const base64 = imageData.slice(prefix.length).replace(/\s/g, "");
  if (!base64 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) return null;

  const buffer = Buffer.from(base64, "base64");
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) return null;
  return buffer;
}

function normalizeWarnings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((warning): warning is string => typeof warning === "string")
    .map(warning => warning.trim())
    .filter(Boolean)
    .slice(0, 10);
}

router.post("/ai/manuscrito-transcribe", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const patientId = Number(req.body?.patientId);
  if (!Number.isInteger(patientId) || patientId <= 0) {
    return res.status(400).json({ error: "Paciente inválido" });
  }

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId));
  if (!patient) return res.status(404).json({ error: "Paciente no encontrado" });
  if (sess.role !== "admin" && patient.assignedProfessionalId !== sess.id) {
    return res.status(403).json({ error: "Sin acceso a este paciente" });
  }

  const mimeType = req.body?.mimeType;
  const image = decodeImageData(req.body?.imageData, mimeType);
  if (!image) {
    return res.status(400).json({
      error: "La imagen no es válida o supera el tamaño máximo de 8 MB.",
    });
  }

  const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_API_KEY
    ? "https://api.openai.com/v1"
    : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const model = process.env.OPENAI_API_KEY ? "gpt-4o" : "gpt-5.4";

  if (!apiKey) {
    return res.status(503).json({ error: "La transcripción con IA no está configurada." });
  }

  const imageDataUrl = `data:${mimeType};base64,${image.toString("base64")}`;
  const openai = new OpenAI({ apiKey, baseURL });

  try {
    const response = await openai.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: `Eres un transcriptor de imágenes manuscritas. Tu única tarea es transcribir lo que aparece en la imagen.

Reglas obligatorias:
- Transcribe fielmente, sin redactar ni resumir.
- Conserva palabras, abreviaturas, números, orden y signos identificables.
- No expandas abreviaturas.
- No corrijas términos dudosos usando contexto clínico.
- No inventes texto, diagnósticos, objetivos, resultados, recomendaciones ni información del paciente.
- Si una palabra o fragmento no se identifica con seguridad, escribe exactamente "[texto poco legible]" o "[palabra no identificada]".
- No uses contexto externo ni datos del paciente. Solo observa la imagen.
- Devuelve exclusivamente JSON válido con esta forma:
{"transcription":"texto transcripto","warnings":["advertencia"],"quality":"good|fair|poor"}
- quality debe ser "poor" si la imagen es borrosa, está muy oscura, cortada o gran parte es ilegible.
- Incluye warnings breves si hay problemas de legibilidad, orientación, iluminación o recorte.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Transcribe esta única imagen. No interpretes clínicamente ni completes información faltante.",
            },
            {
              type: "image_url",
              image_url: { url: imageDataUrl, detail: "high" },
            },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error("La IA no devolvió una transcripción.");

    const parsed = JSON.parse(raw) as {
      transcription?: unknown;
      warnings?: unknown;
      quality?: unknown;
    };
    const transcription = typeof parsed.transcription === "string"
      ? parsed.transcription.trim()
      : "";
    const quality = typeof parsed.quality === "string" && QUALITY_VALUES.has(parsed.quality)
      ? parsed.quality
      : "fair";

    if (!transcription) {
      return res.status(422).json({
        error: "No se pudo leer texto suficiente en la imagen.",
        transcription: "",
        warnings: [...normalizeWarnings(parsed.warnings), "No se detectó una transcripción confiable."],
        quality: "poor",
      });
    }

    return res.json({
      transcription,
      warnings: normalizeWarnings(parsed.warnings),
      quality,
    });
  } catch (error: any) {
    console.error("[ai-manuscrito] Error:", error?.message);
    return res.status(502).json({
      error: "No se pudo transcribir la imagen. Probá con una foto más clara.",
    });
  }
});

export default router;