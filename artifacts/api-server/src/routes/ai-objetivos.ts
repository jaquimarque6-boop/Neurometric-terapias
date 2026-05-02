import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  patientsTable,
  goalsTable,
  goalProgressTable,
  registrosClinicosTable,
  registrosTable,
  professionalsTable,
  patientProfessionalsTable,
} from "@workspace/db/schema";
import { eq, inArray } from "drizzle-orm";
import OpenAI from "openai";

const router: IRouter = Router();

type Discipline = "fonoaudiología" | "psicopedagogía" | "terapia_ocupacional" | "general";

function getSessionUser(req: any) {
  if (!req.session?.userId) return null;
  return { id: req.session.userId, role: req.session.userRole ?? "professional" };
}

function detectDiscipline(specialty: string, goalAreas: string[]): Discipline {
  const sp = specialty.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/fono|fonoaudio|speech|lenguaje|habla|voz|degluc/.test(sp)) return "fonoaudiología";
  if (/psicoped|aprendiz|cognitiv|educati|neuropsico/.test(sp)) return "psicopedagogía";
  if (/ocup|terapia.?ocup|^to$|avd|sensori|ergot/.test(sp)) return "terapia_ocupacional";
  const areasStr = goalAreas.join(" ").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/lenguaje|habla|fonolog|articulac|pragmat|comunicac|voz|degluc/.test(areasStr)) return "fonoaudiología";
  if (/atenci|memoria|ejecutiv|lectoescrit|comprens|aprendiz|cognic/.test(areasStr)) return "psicopedagogía";
  if (/autonomi|avd|sensori|motricidad|ocup|participac/.test(areasStr)) return "terapia_ocupacional";
  return "general";
}

function buildDisciplineGuidance(discipline: Discipline): string {
  const map: Record<Discipline, string> = {
    "fonoaudiología": `Disciplina: FONOAUDIOLOGÍA.
Áreas a considerar: fonología, lenguaje expresivo, lenguaje comprensivo, articulación, pragmática, comunicación funcional, voz, deglución.
Redacta los objetivos usando términos como: "producción fonológica", "inteligibilidad del habla", "estructuras sintácticas", "vocabulario funcional", "comprensión auditiva", "habilidades pragmáticas", "comunicación intencional", "discriminación auditiva", "narración oral".
Indicadores de logro: expresados en producciones correctas por intento (ej. "8/10 en denominación de imágenes").`,

    "psicopedagogía": `Disciplina: PSICOPEDAGOGÍA.
Áreas a considerar: atención sostenida y selectiva, memoria de trabajo, funciones ejecutivas (planificación, inhibición, flexibilidad), lectoescritura, comprensión lectora, cálculo, estrategias metacognitivas.
Redacta los objetivos usando términos como: "estrategias cognitivas", "nivel de adquisición", "autorregulación", "secuenciación de tareas", "procesamiento de la información", "conciencia fonológica", "decodificación lectora", "producción escrita".
Indicadores de logro: expresados en porcentaje de aciertos, ítems completados o tiempo de atención sostenida.`,

    "terapia_ocupacional": `Disciplina: TERAPIA OCUPACIONAL.
Áreas a considerar: actividades de la vida diaria (AVD), motricidad fina, coordinación visomotora, integración sensorial, modulación sensorial, prensión, coordinación bimanual, autonomía personal, habilidades de desempeño.
Redacta los objetivos usando términos como: "desempeño ocupacional", "participación", "adaptaciones ambientales", "tolerancia sensorial", "coordinación bimanual", "prensión funcional", "secuencia de actividad", "independencia en AVD".
Indicadores de logro: expresados en ejecución independiente de pasos, tiempo de tolerancia o calidad de la prensión.`,

    "general": `Disciplina: GENERAL / sin determinar.
Redacta objetivos clínicamente válidos adaptados a las áreas de trabajo detectadas en los objetivos actuales del paciente.
Indicadores de logro: expresados con criterio observable y cuantificable.`,
  };
  return map[discipline];
}

function trunc(s: string | null | undefined, max = 300): string {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

router.post("/ai/objetivos-suggest", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const { patientId, mode = "plan" } = req.body as { patientId: number; mode?: "plan" | "sesion" };
  if (!patientId) return res.status(400).json({ error: "patientId requerido" });
  const isSesion = mode === "sesion";

  // ── Fetch all data in parallel ──────────────────────────────────────────
  const [
    [patient],
    allGoals,
    allRegistrosClinicos,
    allRegistros,
    assignments,
  ] = await Promise.all([
    db.select().from(patientsTable).where(eq(patientsTable.id, patientId)),
    db.select().from(goalsTable).where(eq(goalsTable.patientId, patientId)),
    db.select().from(registrosClinicosTable).where(eq(registrosClinicosTable.patientId, patientId)),
    db.select().from(registrosTable).where(eq(registrosTable.patientId, patientId)),
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

  // ── Detect discipline ──────────────────────────────────────────────────
  const specialties = professionals.map(p => p.specialty).join(" ");
  const goalAreas = allGoals.map(g => g.areaClinica ?? g.category ?? "");
  const discipline = detectDiscipline((specialties || patient.profesionalNombre) ?? "", goalAreas);

  // ── Build context ──────────────────────────────────────────────────────
  const patientCtx = [
    `Nombre: ${patient.name}`,
    patient.age ? `Edad: ${patient.age} años` : null,
    patient.franjaEtaria ? `Franja etaria: ${patient.franjaEtaria}` : null,
    patient.diagnosis ? `Diagnóstico: ${patient.diagnosis}` : null,
    patient.motivoConsulta ? `Motivo de consulta: ${trunc(patient.motivoConsulta)}` : null,
    patient.impresionClinica ? `Impresión clínica: ${trunc(patient.impresionClinica)}` : null,
    patient.lenguajeComunicacion ? `Lenguaje/comunicación (evaluación): ${trunc(patient.lenguajeComunicacion)}` : null,
    patient.atencionConducta ? `Atención/conducta (evaluación): ${trunc(patient.atencionConducta)}` : null,
    patient.vozHabla ? `Voz/habla (evaluación): ${trunc(patient.vozHabla)}` : null,
    patient.deglucion ? `Deglución (evaluación): ${trunc(patient.deglucion)}` : null,
    patient.escolaridad ? `Escolaridad: ${trunc(patient.escolaridad, 200)}` : null,
  ].filter(Boolean).join("\n");

  // Current goals (to avoid duplicating)
  const activeGoals = allGoals.filter(g => !["archivado", "suspendido"].includes(g.status));
  const goalsCtx = activeGoals.length > 0
    ? activeGoals.map(g => {
        const pct = g.progressPct ?? (g.status === "logrado" ? 100 : g.status === "en progreso" ? 55 : 20);
        return `- [${g.status} ${pct}%] "${g.title}" (área: ${g.areaClinica ?? g.category})`;
      }).join("\n")
    : "Sin objetivos activos actualmente.";

  // Recent sessions (last 10 for clinical context)
  const recentRC = [...allRegistrosClinicos]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 10);

  const sessionsCtx = recentRC.length > 0
    ? recentRC.map((r, i) => {
        const parts = [`[Sesión ${i + 1} — ${r.fecha}]`];
        if (r.resumenSesion) parts.push(`Resumen: ${trunc(r.resumenSesion, 300)}`);
        if (r.observaciones) parts.push(`Observaciones: ${trunc(r.observaciones, 300)}`);
        return parts.join("\n");
      }).join("\n\n")
    : "Sin sesiones registradas.";

  // Goal progress for level assessment
  const progressByGoal = new Map<number, typeof allGoalProgress>();
  for (const p of allGoalProgress) {
    if (!progressByGoal.has(p.goalId)) progressByGoal.set(p.goalId, []);
    progressByGoal.get(p.goalId)!.push(p);
  }

  const progressCtx = activeGoals.length > 0
    ? activeGoals.map(g => {
        const entries = (progressByGoal.get(g.id) ?? [])
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .slice(-4);
        if (entries.length === 0) return null;
        const rows = entries.map(e => {
          const parts = [e.createdAt.toISOString().slice(0, 10)];
          if (e.progressPct != null) parts.push(`progreso: ${e.progressPct}%`);
          if (e.intentos != null) parts.push(`intentos: ${e.intentos}`);
          if (e.correctas != null) parts.push(`correctas: ${e.correctas}`);
          if (e.nota) parts.push(`"${trunc(e.nota, 100)}"`);
          return parts.join(" | ");
        }).join("\n  ");
        return `"${g.title}": ${rows}`;
      }).filter(Boolean).join("\n")
    : null;

  // Legacy performance records
  const recentRegistros = [...allRegistros]
    .sort((a, b) => new Date(b.fecha ?? b.createdAt).getTime() - new Date(a.fecha ?? a.createdAt).getTime())
    .slice(0, 20);
  const perfCtx = recentRegistros.length > 0
    ? recentRegistros.map(r => {
        const parts = [`"${r.objetivoNombre ?? "—"}" (${r.areaObjetivo ?? "—"}) — ${r.fecha ?? "?"}`];
        if (r.porcentaje) parts.push(`${r.porcentaje}%`);
        if (r.cumpleMeta) parts.push(`meta: ${r.cumpleMeta}`);
        if (r.informeSesion) parts.push(`"${trunc(r.informeSesion, 120)}"`);
        return parts.join(" | ");
      }).join("\n")
    : null;

  // ── Build the prompt ───────────────────────────────────────────────────
  const sharedContext = `═══════════════════════════════════════
DATOS DEL PACIENTE
═══════════════════════════════════════
${patientCtx}
Profesional: ${professionals.map(p => `${p.name} (${p.specialty})`).join(", ") || patient.profesionalNombre || "No registrado"}

═══════════════════════════════════════
OBJETIVOS ACTIVOS EN EL PLAN
═══════════════════════════════════════
${goalsCtx}

═══════════════════════════════════════
SESIONES RECIENTES (${recentRC.length} de ${allRegistrosClinicos.length} total)
═══════════════════════════════════════
${sessionsCtx}

${progressCtx ? `═══════════════════════════════════════
HISTORIAL DE PROGRESO POR OBJETIVO
═══════════════════════════════════════
${progressCtx}` : ""}

${perfCtx ? `═══════════════════════════════════════
DESEMPEÑO POR OBJETIVO EN SESIONES
═══════════════════════════════════════
${perfCtx}` : ""}`;

  const systemPrompt = isSesion
    ? `Eres un asistente clínico especializado en terapias del neurodesarrollo.
Tu tarea es sugerir entre 1 y 3 objetivos PRÁCTICOS para trabajar HOY en sesión, basándote EXCLUSIVAMENTE en el historial real del paciente.
${buildDisciplineGuidance(discipline)}

Reglas estrictas:
- Los objetivos deben ser directamente trabajables en la sesión de HOY — no son de largo plazo.
- Priorizá objetivos "en progreso" o que necesitan refuerzo según el historial reciente.
- Si hay objetivos con bajo desempeño reciente, sugería continuar con esos.
- Si los objetivos activos tienen buen progreso, podés sugerir el siguiente paso lógico.
- No inventes datos que no estén en el contexto.
- Responde EXCLUSIVAMENTE con JSON válido. Sin markdown. Sin texto fuera del JSON.`
    : `Eres un asistente clínico especializado en terapias del neurodesarrollo.
Tu tarea es proponer objetivos terapéuticos nuevos, clínicamente válidos y medibles, basados EXCLUSIVAMENTE en los datos reales del paciente.
${buildDisciplineGuidance(discipline)}

Reglas estrictas:
- No repitas objetivos que ya están activos en el plan.
- No inventes datos que no estén en el contexto.
- Los objetivos deben ser específicos, funcionales y directamente aplicables en sesión.
- Calibra la dificultad según el nivel de desempeño actual del paciente.
- Propón objetivos para el PRÓXIMO PASO lógico en el proceso terapéutico.
- Responde EXCLUSIVAMENTE con JSON válido. Sin markdown. Sin texto fuera del JSON.`;

  const userPrompt = isSesion
    ? `Sugerí entre 1 y 3 objetivos prácticos para trabajar HOY en sesión con este paciente.

${sharedContext}

═══════════════════════════════════════
INSTRUCCIÓN
═══════════════════════════════════════
Devuelve entre 1 y 3 objetivos prácticos para HOY. Deben ser concretos y trabajables en una sola sesión.
Prioridad: objetivos en progreso con bajo desempeño reciente > objetivos activos sin trabajar recientemente > siguiente paso lógico.

Para cada objetivo devuelve exactamente este JSON:

{
  "objetivos": [
    {
      "title": "Objetivo corto, concreto y trabajable hoy. Describe la conducta observable.",
      "areaClinica": "fonología",
      "category": "habla",
      "nivelDificultad": "inicial",
      "rationale": "Breve justificación clínica (1 oración) de por qué trabajar esto HOY basada en el historial."
    }
  ]
}

nivelDificultad debe ser exactamente uno de: "inicial", "intermedio", "avanzado".
areaClinica y category: en minúsculas, acordes a la disciplina.
NO incluyas campos adicionales. Máximo 3 objetivos.`
    : `Propón objetivos terapéuticos nuevos para el siguiente paciente.

${sharedContext}

═══════════════════════════════════════
INSTRUCCIÓN
═══════════════════════════════════════
Propón entre 4 y 6 objetivos terapéuticos nuevos y apropiados para el nivel actual del paciente.
Para cada objetivo devuelve exactamente este formato JSON:

{
  "objetivos": [
    {
      "title": "Objetivo claro, específico y funcional. Debe describir el comportamiento observable.",
      "description": "Definición operativa: condición, conducta esperada y criterio. 1-2 oraciones.",
      "indicadorLogro": "Criterio de logro cuantificable. Ej: '8/10 respuestas correctas en 2 sesiones consecutivas'.",
      "intentosSugeridos": 10,
      "sesionesEstimadas": 8,
      "nivelDificultad": "inicial",
      "areaClinica": "fonología",
      "category": "habla",
      "notas": "Estrategias o materiales sugeridos para trabajar este objetivo."
    }
  ]
}

nivelDificultad debe ser exactamente uno de: "inicial", "intermedio", "avanzado".
intentosSugeridos: número entero entre 5 y 20.
sesionesEstimadas: número entero entre 4 y 24.
areaClinica y category: en minúsculas, acordes a la disciplina.`;

  // ── Call OpenAI ────────────────────────────────────────────────────────
  try {
    const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_API_KEY
      ? "https://api.openai.com/v1"
      : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    const model = process.env.OPENAI_API_KEY ? "gpt-4o" : "gpt-5.4";

    if (!apiKey) return res.status(500).json({ error: "No hay clave de API de OpenAI configurada." });

    const openai = new OpenAI({ apiKey, baseURL });

    console.log(`[ai-objetivos] paciente=${patientId} modo=${mode} disciplina=${discipline} sesiones=${recentRC.length} objetivos_actuales=${activeGoals.length} modelo=${model}`);

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const text = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text);
    const objetivos = Array.isArray(parsed.objetivos) ? parsed.objetivos : [];

    return res.json({ objetivos, discipline });
  } catch (error: any) {
    console.error("[ai-objetivos] Error:", error?.message);
    return res.status(500).json({ error: "Error al generar objetivos con IA. Intenta de nuevo." });
  }
});

export default router;
