import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { patientsTable, goalsTable, registrosClinicosTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

const router: IRouter = Router();

function getSessionUser(req: any) {
  if (!req.session?.userId) return null;
  return { id: req.session.userId, role: req.session.userRole ?? "professional" };
}

function filterByRango(
  registros: Array<{ fecha: string; createdAt: Date }>,
  rango: string
) {
  const sorted = [...registros].sort(
    (a, b) => new Date(b.fecha || b.createdAt.toISOString()).getTime()
           - new Date(a.fecha || a.createdAt.toISOString()).getTime()
  );
  if (rango === "4") return sorted.slice(0, 4);
  const dias = rango === "mes" ? 30 : rango === "3meses" ? 90 : 180;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - dias);
  return sorted.filter(r => new Date(r.fecha || r.createdAt) >= cutoff);
}

router.post("/ai/informe-generate", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const { patientId, rango = "mes" } = req.body as { patientId: number; rango?: string };
  if (!patientId) return res.status(400).json({ error: "patientId requerido" });

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId));
  if (!patient) return res.status(404).json({ error: "Paciente no encontrado" });

  const allGoals = await db.select().from(goalsTable).where(eq(goalsTable.patientId, patientId));
  const allRegistros = await db.select().from(registrosClinicosTable).where(eq(registrosClinicosTable.patientId, patientId));

  const filteredRegistros = filterByRango(allRegistros as any, rango);
  const activeGoals = allGoals.filter(g => !["archivado", "suspendido"].includes(g.status));

  const areaGroups: Record<string, typeof allGoals> = {};
  for (const g of activeGoals) {
    const area = g.areaClinica ?? g.category ?? "general";
    if (!areaGroups[area]) areaGroups[area] = [];
    areaGroups[area].push(g);
  }

  const sessionSummaries = (filteredRegistros as any[])
    .slice(0, 12)
    .map((r, i) => {
      const parts: string[] = [];
      if (r.fecha) parts.push(`Fecha: ${r.fecha}`);
      if (r.resumenSesion) parts.push(`Resumen: ${r.resumenSesion}`);
      if (r.observaciones) parts.push(`Observaciones: ${r.observaciones}`);
      if (r.recomendacionesHogar) parts.push(`Recomendaciones hogar: ${r.recomendacionesHogar}`);
      return `Sesión ${i + 1}:\n${parts.join("\n")}`;
    })
    .join("\n\n");

  const goalsContext = allGoals
    .map(g => {
      const pct = g.progressPct ?? (g.status === "logrado" ? 100 : g.status === "en progreso" ? 55 : 20);
      return `- [${g.status}] ${g.title} (área: ${g.areaClinica ?? g.category}, progreso: ${pct}%)`;
    })
    .join("\n");

  const areaKeys = Object.keys(areaGroups);
  const areasJsonShape = areaKeys.length > 0
    ? `{\n${areaKeys.map(a => `  "${a}": "Descripción del desempeño y evolución clínica en el área de ${a}. 80-140 palabras."`).join(",\n")}\n}`
    : "{}";

  const systemPrompt = `Eres un asistente clínico especializado en fonoaudiología, psicopedagogía y terapias del neurodesarrollo.
Tu tarea es generar secciones de un informe clínico de evolución basándote EXCLUSIVAMENTE en los datos reales del paciente.
El informe debe estar redactado en español, en tercera persona, con lenguaje técnico-clínico profesional, preciso y empático.
NO inventes datos. Si la información es escasa, redacta de forma honesta y general, sin fabricar detalles.
Responde EXCLUSIVAMENTE con un JSON válido. Sin markdown. Sin texto adicional fuera del JSON.`;

  const userPrompt = `Genera el informe clínico de evolución con los siguientes datos:

DATOS DEL PACIENTE:
- Nombre: ${patient.name}
- Edad: ${patient.age ?? "No registrada"} años
- Diagnóstico: ${patient.diagnosis ?? "No registrado"}
- Fecha de inicio de tratamiento: ${patient.fechaInicio ?? "No registrada"}
- Motivo de consulta: ${patient.motivoConsulta ?? "No registrado"}
- Impresión clínica inicial: ${patient.impresionClinica ?? "No registrada"}
- Observaciones generales: ${patient.observaciones ?? "Sin observaciones"}

OBJETIVOS TERAPÉUTICOS (${allGoals.length} total):
${goalsContext || "Sin objetivos registrados."}

REGISTRO DE SESIONES DEL PERÍODO (${filteredRegistros.length} de ${allRegistros.length} sesiones totales):
${sessionSummaries || "Sin sesiones registradas en este período."}

ÁREAS DE TRABAJO ACTIVAS: ${areaKeys.join(", ") || "No identificadas"}

Devuelve un JSON con exactamente estas claves:
{
  "resumen": "Evolución general del proceso: cantidad de sesiones, áreas trabajadas, logros alcanzados, estado actual. 150-250 palabras.",
  "conducta": "Comportamiento, actitud, disposición y conducta del/la paciente durante las sesiones. 100-180 palabras.",
  "areas": ${areasJsonShape},
  "sugerencias": "Recomendaciones concretas para la familia usando viñetas con •. Lenguaje claro y accesible. 100-200 palabras."
}`;

  try {
    const openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const text = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text);

    return res.json({
      resumen: parsed.resumen ?? "",
      conducta: parsed.conducta ?? "",
      areas: parsed.areas ?? {},
      sugerencias: parsed.sugerencias ?? "",
    });
  } catch (error: any) {
    console.error("[ai-informe] Error:", error?.message);
    return res.status(500).json({ error: "Error al generar el informe con IA. Intenta de nuevo." });
  }
});

export default router;
