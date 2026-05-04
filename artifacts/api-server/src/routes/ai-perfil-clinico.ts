import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  patientsTable,
  goalsTable,
  registrosClinicosTable,
  patientProfessionalsTable,
  professionalsTable,
} from "@workspace/db/schema";
import { eq, inArray } from "drizzle-orm";
import OpenAI from "openai";

const router: IRouter = Router();

function getSessionUser(req: any) {
  if (!req.session?.userId) return null;
  return { id: req.session.userId, role: req.session.userRole ?? "professional" };
}

function trunc(s: string | null | undefined, max = 400): string {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

router.post("/ai/perfil-clinico", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const { patientId } = req.body as { patientId: number };
  if (!patientId) return res.status(400).json({ error: "patientId requerido" });

  const [[patient], allGoals, allRC, assignments] = await Promise.all([
    db.select().from(patientsTable).where(eq(patientsTable.id, patientId)),
    db.select().from(goalsTable).where(eq(goalsTable.patientId, patientId)),
    db.select().from(registrosClinicosTable).where(eq(registrosClinicosTable.patientId, patientId)),
    db.select().from(patientProfessionalsTable).where(eq(patientProfessionalsTable.patientId, patientId)),
  ]);

  if (!patient) return res.status(404).json({ error: "Paciente no encontrado" });

  const profIds = assignments.map(a => a.professionalId);
  const professionals = profIds.length > 0
    ? await db.select().from(professionalsTable).where(inArray(professionalsTable.id, profIds))
    : [];

  const lines: string[] = [];

  if (patient.age) lines.push(`Edad: ${patient.age} años`);
  if (patient.franjaEtaria) lines.push(`Franja etaria: ${patient.franjaEtaria}`);
  if (professionals.length > 0)
    lines.push(`Profesional/especialidad: ${professionals.map(p => `${p.name} (${p.specialty})`).join(", ")}`);

  if (patient.motivoConsulta)
    lines.push(`\nMOTIVO DE CONSULTA:\n${trunc(patient.motivoConsulta)}`);
  if (patient.antecedentes)
    lines.push(`\nANTECEDENTES RELEVANTES:\n${trunc(patient.antecedentes)}`);
  if (patient.escolaridad)
    lines.push(`\nESCOLARIDAD / APRENDIZAJE:\n${trunc(patient.escolaridad)}`);
  if (patient.lenguajeComunicacion)
    lines.push(`\nLENGUAJE Y COMUNICACIÓN:\n${trunc(patient.lenguajeComunicacion)}`);
  if (patient.atencionConducta)
    lines.push(`\nATENCIÓN Y CONDUCTA:\n${trunc(patient.atencionConducta)}`);
  if (patient.vozHabla)
    lines.push(`\nVOZ Y HABLA:\n${trunc(patient.vozHabla)}`);
  if (patient.deglucion)
    lines.push(`\nDEGLUCIÓN:\n${trunc(patient.deglucion)}`);
  if (patient.impresionClinica)
    lines.push(`\nIMPRESIÓN CLÍNICA PREVIA (referencia):\n${trunc(patient.impresionClinica)}`);

  const activeGoals = allGoals.filter(g => !["archivado", "suspendido"].includes(g.status));
  if (activeGoals.length > 0) {
    lines.push(
      `\nÁREAS Y OBJETIVOS EN TRABAJO:\n` +
      activeGoals.map(g => `- ${g.title} (${g.areaClinica ?? g.category ?? "—"})`).join("\n")
    );
  }

  const recentRC = [...allRC]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 8);
  if (recentRC.length > 0) {
    lines.push(
      `\nSESIONES RECIENTES (${recentRC.length}):\n` +
      recentRC.map((r, i) => {
        const parts = [`[Sesión ${i + 1} — ${r.fecha}]`];
        if (r.resumenSesion) parts.push(`Resumen: ${trunc(r.resumenSesion, 200)}`);
        if (r.observaciones) parts.push(`Obs: ${trunc(r.observaciones, 150)}`);
        return parts.join(" ");
      }).join("\n")
    );
  }

  const context = lines.join("\n");

  const systemPrompt = `Eres un asistente clínico experto en terapias del neurodesarrollo (fonoaudiología, psicopedagogía, terapia ocupacional).
Tu tarea es generar un PERFIL CLÍNICO FUNCIONAL basado exclusivamente en los datos reales del paciente.

Reglas estrictas:
- NO uses etiquetas diagnósticas rígidas. NO escribas frases como "tiene dislexia", "tiene TEA", "tiene TDAH", "presenta síndrome de X". Usá descripciones funcionales observables.
- Ejemplos correctos: "presenta dificultades en la decodificación lectora", "muestra un procesamiento fonológico reducido", "evidencia dificultades en la regulación atencional".
- Escribí en tono clínico profesional y formal. Tercera persona: "Se observa...", "El/la paciente presenta...", "Se evidencia...".
- Basate EXCLUSIVAMENTE en los datos provistos. No inventes información ni hagas inferencias sin respaldo.
- El texto debe ser útil para interconsultas, informes escolares y planificación terapéutica.
- Responde EXCLUSIVAMENTE con JSON válido. Sin markdown. Sin texto fuera del JSON.`;

  const userPrompt = `Genera un perfil clínico funcional para el siguiente paciente:

${context}

Devuelve EXACTAMENTE este formato JSON (sin campos adicionales):

{
  "perfilClinico": "Párrafo descriptivo (3-5 oraciones) que describe las dificultades funcionales del paciente sin usar etiquetas diagnósticas. Debe ser clínicamente preciso, útil para interconsultas y basado en los datos provistos.",
  "areasAfectadas": [
    { "area": "Nombre corto del área cognitiva/funcional", "descripcion": "Descripción en 1 oración de cómo se manifiesta la dificultad en esta área específica." }
  ],
  "focoIntervencion": "Párrafo (2-3 oraciones) describiendo qué debe priorizarse en el proceso terapéutico, fundamentando brevemente por qué y con qué enfoque general."
}

areasAfectadas: incluí entre 2 y 6 áreas. Solo incluí áreas con evidencia directa en los datos del paciente.`;

  try {
    const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_API_KEY
      ? "https://api.openai.com/v1"
      : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    const model = process.env.OPENAI_API_KEY ? "gpt-4o" : "gpt-5.4";

    if (!apiKey) return res.status(500).json({ error: "No hay clave de API de OpenAI configurada." });

    const openai = new OpenAI({ apiKey, baseURL });
    console.log(`[ai-perfil-clinico] patientId=${patientId} sesiones=${recentRC.length} objetivos=${activeGoals.length} modelo=${model}`);

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.35,
    });

    const text = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error("[ai-perfil-clinico] Error:", error?.message);
    return res.status(500).json({ error: "Error al generar el perfil clínico. Intentá de nuevo." });
  }
});

export default router;
