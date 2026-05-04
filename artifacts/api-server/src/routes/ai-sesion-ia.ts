import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  patientsTable,
  goalsTable,
  goalProgressTable,
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

function trunc(s: string | null | undefined, max = 300): string {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

router.post("/ai/sesion-ia", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const {
    patientId,
    focoTerapeutico,
    sessionDiagnosis,
    observaciones,
    selectedArea,
  } = req.body as {
    patientId: number;
    focoTerapeutico?: string;
    sessionDiagnosis?: string;
    observaciones?: string;
    selectedArea?: string;
  };

  if (!patientId) return res.status(400).json({ error: "patientId requerido" });

  const [
    [patient],
    allGoals,
    allRegistrosClinicos,
    assignments,
  ] = await Promise.all([
    db.select().from(patientsTable).where(eq(patientsTable.id, patientId)),
    db.select().from(goalsTable).where(eq(goalsTable.patientId, patientId)),
    db.select().from(registrosClinicosTable).where(eq(registrosClinicosTable.patientId, patientId)),
    db.select().from(patientProfessionalsTable).where(eq(patientProfessionalsTable.patientId, patientId)),
  ]);

  if (!patient) return res.status(404).json({ error: "Paciente no encontrado" });

  const profIds = assignments.map(a => a.professionalId);
  const [professionals, allGoalProgress] = await Promise.all([
    profIds.length > 0
      ? db.select().from(professionalsTable).where(inArray(professionalsTable.id, profIds))
      : Promise.resolve([]),
    allGoals.length > 0
      ? db.select().from(goalProgressTable)
          .where(inArray(goalProgressTable.goalId, allGoals.map(g => g.id)))
      : Promise.resolve([]),
  ]);

  const activeGoals = allGoals.filter(g => !["archivado", "suspendido"].includes(g.status));

  const recentRC = [...allRegistrosClinicos]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 8);

  const progressByGoal = new Map<number, typeof allGoalProgress>();
  for (const p of allGoalProgress) {
    if (!progressByGoal.has(p.goalId)) progressByGoal.set(p.goalId, []);
    progressByGoal.get(p.goalId)!.push(p);
  }

  const patientCtx = [
    `Nombre: ${patient.name}`,
    patient.age ? `Edad: ${patient.age} años` : null,
    patient.franjaEtaria ? `Franja etaria: ${patient.franjaEtaria}` : null,
    patient.diagnosis ? `Diagnóstico registrado: ${patient.diagnosis}` : null,
    patient.motivoConsulta ? `Motivo de consulta: ${trunc(patient.motivoConsulta)}` : null,
    patient.impresionClinica ? `Impresión clínica: ${trunc(patient.impresionClinica)}` : null,
    patient.lenguajeComunicacion ? `Lenguaje/comunicación: ${trunc(patient.lenguajeComunicacion)}` : null,
    patient.atencionConducta ? `Atención/conducta: ${trunc(patient.atencionConducta)}` : null,
    patient.vozHabla ? `Voz/habla: ${trunc(patient.vozHabla)}` : null,
    patient.deglucion ? `Deglución: ${trunc(patient.deglucion)}` : null,
    patient.escolaridad ? `Escolaridad: ${trunc(patient.escolaridad, 200)}` : null,
    patient.antecedentes ? `Antecedentes: ${trunc(patient.antecedentes)}` : null,
    patient.historiaFamiliar ? `Historia familiar: ${trunc(patient.historiaFamiliar)}` : null,
  ].filter(Boolean).join("\n");

  const goalsCtx = activeGoals.length > 0
    ? activeGoals.map(g => {
        const entries = (progressByGoal.get(g.id) ?? [])
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .slice(-3);
        const lastPct = entries.length > 0 ? entries[entries.length - 1].progressPct : null;
        const pct = lastPct ?? g.progressPct ?? (g.status === "logrado" ? 100 : g.status === "en progreso" ? 55 : 20);
        return `- [${g.status} ${pct}%] "${g.title}" (área: ${g.areaClinica ?? g.category})`;
      }).join("\n")
    : "Sin objetivos activos actualmente.";

  const sessionsCtx = recentRC.length > 0
    ? recentRC.map((r, i) => {
        const parts = [`[Sesión ${i + 1} — ${r.fecha}]`];
        if (r.resumenSesion) parts.push(`Resumen: ${trunc(r.resumenSesion, 250)}`);
        if (r.observaciones) parts.push(`Observaciones: ${trunc(r.observaciones, 200)}`);
        return parts.join("\n");
      }).join("\n\n")
    : "Sin sesiones registradas.";

  const sessionContext = [
    sessionDiagnosis ? `Diagnóstico de sesión indicado por el terapeuta: ${sessionDiagnosis}` : null,
    selectedArea ? `Área seleccionada para hoy: ${selectedArea}` : null,
    focoTerapeutico ? `Foco terapéutico indicado: ${focoTerapeutico}` : null,
    observaciones ? `Observaciones previas del terapeuta: ${observaciones}` : null,
  ].filter(Boolean).join("\n");

  const systemPrompt = `Sos un asistente clínico especializado en terapias del neurodesarrollo (fonoaudiología, psicopedagogía, terapia ocupacional).
Tu tarea es generar un análisis clínico breve para orientar la sesión de hoy.

Reglas estrictas:
- NO uses etiquetas diagnósticas como TEA, TDAH, TEL, etc. Describí funcionalmente.
- Basate EXCLUSIVAMENTE en los datos provistos — no inventés información.
- El análisis debe ser práctico y orientado a la sesión de hoy.
- Todo el contenido en español argentino (voseo, rioplatense).
- Responde EXCLUSIVAMENTE con JSON válido. Sin markdown. Sin texto fuera del JSON.`;

  const userPrompt = `Generá un análisis clínico para orientar la sesión de HOY con este paciente.

═══════════════════════════════════════
DATOS DEL PACIENTE
═══════════════════════════════════════
${patientCtx}
Profesional: ${professionals.map(p => `${p.name} (${p.specialty})`).join(", ") || patient.profesionalNombre || "No registrado"}

═══════════════════════════════════════
OBJETIVOS ACTIVOS
═══════════════════════════════════════
${goalsCtx}

═══════════════════════════════════════
SESIONES RECIENTES
═══════════════════════════════════════
${sessionsCtx}

${sessionContext ? `═══════════════════════════════════════
CONTEXTO DE ESTA SESIÓN
═══════════════════════════════════════
${sessionContext}` : ""}

═══════════════════════════════════════
INSTRUCCIÓN
═══════════════════════════════════════
Devolvé exactamente este JSON:

{
  "perfilClinico": "Párrafo breve (2-3 oraciones) describiendo el perfil funcional actual del paciente sin etiquetas diagnósticas. Mencioná edad, áreas de fortaleza y áreas de dificultad observadas.",
  "objetivos": [
    {
      "title": "Objetivo concreto y trabajable en esta sesión",
      "areaClinica": "área en minúsculas",
      "nivelDificultad": "inicial|intermedio|avanzado",
      "rationale": "Una oración justificando por qué trabajar esto hoy"
    }
  ],
  "actividades": [
    "Descripción breve de actividad práctica para realizar en sesión hoy"
  ],
  "recomendaciones": "1-2 oraciones con orientaciones para el terapeuta o la familia, basadas en el perfil y los objetivos propuestos."
}

Reglas:
- perfilClinico: sin etiquetas diagnósticas, funcional y descriptivo.
- objetivos: entre 2 y 3. Deben ser trabajables en UNA sesión.
- actividades: exactamente 3. Concretas, breves, directamente aplicables hoy.
- recomendaciones: breves, prácticas, orientadas al contexto real del paciente.
- nivelDificultad: exactamente "inicial", "intermedio" o "avanzado".`;

  try {
    const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_API_KEY
      ? "https://api.openai.com/v1"
      : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    const model = process.env.OPENAI_API_KEY ? "gpt-4o" : "gpt-5.4";

    if (!apiKey) return res.status(500).json({ error: "No hay clave de API de OpenAI configurada." });

    const openai = new OpenAI({ apiKey, baseURL });

    console.log(`[ai-sesion-ia] paciente=${patientId} area=${selectedArea ?? "—"} diagnóstico=${sessionDiagnosis ?? "—"} modelo=${model}`);

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.45,
    });

    const text = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text);

    return res.json({
      perfilClinico: parsed.perfilClinico ?? "",
      objetivos: Array.isArray(parsed.objetivos) ? parsed.objetivos : [],
      actividades: Array.isArray(parsed.actividades) ? parsed.actividades : [],
      recomendaciones: parsed.recomendaciones ?? "",
    });
  } catch (error: any) {
    console.error("[ai-sesion-ia] Error:", error?.message);
    return res.status(500).json({ error: "Error al generar el análisis con IA. Intenta de nuevo." });
  }
});

export default router;
