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

// ─── Types ────────────────────────────────────────────────────────────────────

type Discipline = "fonoaudiología" | "psicopedagogía" | "terapia_ocupacional" | "general";

function getSessionUser(req: any) {
  if (!req.session?.userId) return null;
  return { id: req.session.userId, role: req.session.userRole ?? "professional" };
}

// ─── Discipline detection (mirror ai-informe.ts) ──────────────────────────────

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

function buildSystemPrompt(discipline: Discipline): string {
  const base = `Eres un asistente clínico especializado en terapias del neurodesarrollo e intervención infanto-juvenil.
Tu tarea es redactar un PERFIL CLÍNICO de síntesis del paciente, basándote EXCLUSIVAMENTE en los datos reales que se te proporcionan (anamnesis, objetivos, sesiones y desempeño).
Reglas estrictas:
- Usa SOLO la información contenida en el contexto. NO inventes datos, fechas, porcentajes ni conductas.
- Si algún dato no está disponible, indícalo con "No registrado" o redacta con lo que sí existe.
- Lenguaje: español rioplatense, tercera persona, tono profesional clínico y empático.
- Si hay pocos datos, redacta de forma breve y honesta. No rellenes con texto genérico.
- El perfil es una herramienta de trabajo editable para el profesional, no un informe formal para terceros.
- Responde EXCLUSIVAMENTE con JSON válido, sin markdown, sin texto fuera del JSON.`;

  const disciplines: Record<Discipline, string> = {
    "fonoaudiología": `
Especialidad: FONOAUDIOLOGÍA. Enfocate en lenguaje expresivo y comprensivo, articulación y fonología, comunicación funcional, voz y deglución (si aplica).`,
    "psicopedagogía": `
Especialidad: PSICOPEDAGOGÍA. Enfocate en procesos de aprendizaje, atención, memoria operativa, funciones ejecutivas, lectoescritura y comprensión.`,
    "terapia_ocupacional": `
Especialidad: TERAPIA OCUPACIONAL. Enfocate en autonomía personal, AVD, motricidad fina y gruesa, integración sensorial y participación.`,
    "general": `
Redacta con terminología clínica general apropiada para terapias del neurodesarrollo, según las áreas de los objetivos registrados.`,
  };

  return base + disciplines[discipline];
}

function trunc(s: string | null | undefined, max = 400): string {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

// ─── Persistence: load / save the clinical profile ────────────────────────────

type PerfilIA = {
  motivoConsulta: string;
  antecedentes: string;
  fortalezas: string;
  dificultades: string;
  areasIntervencion: string;
  objetivosPrioritarios: string;
  resumenProfesional: string;
};

const PERFIL_KEYS: (keyof PerfilIA)[] = [
  "motivoConsulta",
  "antecedentes",
  "fortalezas",
  "dificultades",
  "areasIntervencion",
  "objetivosPrioritarios",
  "resumenProfesional",
];

function normalizePerfil(input: any): PerfilIA {
  const out = {} as PerfilIA;
  for (const k of PERFIL_KEYS) {
    out[k] = typeof input?.[k] === "string" ? input[k] : "";
  }
  return out;
}

// GET the last saved clinical profile for a patient
router.get("/ai/perfil/:patientId", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const patientId = Number(req.params.patientId);
  if (!patientId) return res.status(400).json({ error: "patientId inválido" });

  const [patient] = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.id, patientId));
  if (!patient) return res.status(404).json({ error: "Paciente no encontrado" });

  let perfil: PerfilIA | null = null;
  if (patient.perfilIa) {
    try {
      perfil = normalizePerfil(JSON.parse(patient.perfilIa));
    } catch {
      perfil = null;
    }
  }

  return res.json({
    perfil,
    createdAt: patient.perfilIaCreatedAt ? patient.perfilIaCreatedAt.toISOString() : null,
    updatedAt: patient.perfilIaUpdatedAt ? patient.perfilIaUpdatedAt.toISOString() : null,
  });
});

// SAVE (create/update) the clinical profile for a patient
router.put("/ai/perfil/:patientId", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const patientId = Number(req.params.patientId);
  if (!patientId) return res.status(400).json({ error: "patientId inválido" });

  const perfil = normalizePerfil((req.body as any)?.perfil);

  const [patient] = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.id, patientId));
  if (!patient) return res.status(404).json({ error: "Paciente no encontrado" });

  const now = new Date();
  const createdAt = patient.perfilIaCreatedAt ?? now;

  const [updated] = await db
    .update(patientsTable)
    .set({
      perfilIa: JSON.stringify(perfil),
      perfilIaCreatedAt: createdAt,
      perfilIaUpdatedAt: now,
    })
    .where(eq(patientsTable.id, patientId))
    .returning();

  return res.json({
    ok: true,
    createdAt: updated.perfilIaCreatedAt ? updated.perfilIaCreatedAt.toISOString() : null,
    updatedAt: updated.perfilIaUpdatedAt ? updated.perfilIaUpdatedAt.toISOString() : null,
  });
});

// ─── Main route ───────────────────────────────────────────────────────────────

router.post("/ai/perfil-generate", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const { patientId } = req.body as { patientId: number };
  if (!patientId) return res.status(400).json({ error: "patientId requerido" });

  // ── Fetch all data in parallel ─────────────────────────────────────────────
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

  // ── Fetch professionals and goal progress ──────────────────────────────────
  const profIds = assignments.map(a => a.professionalId);
  const [professionals, allGoalProgress] = await Promise.all([
    profIds.length > 0
      ? db.select().from(professionalsTable).where(inArray(professionalsTable.id, profIds))
      : Promise.resolve([] as (typeof professionalsTable.$inferSelect)[]),
    allGoals.length > 0
      ? db.select().from(goalProgressTable)
          .where(inArray(goalProgressTable.goalId, allGoals.map(g => g.id)))
      : Promise.resolve([] as (typeof goalProgressTable.$inferSelect)[]),
  ]);

  // ── Detect discipline ──────────────────────────────────────────────────────
  const specialties = professionals.map(p => p.specialty).join(" ");
  const goalAreas = allGoals.map(g => g.areaClinica ?? g.category ?? "");
  const discipline = detectDiscipline((specialties || patient.profesionalNombre) ?? "", goalAreas);

  // ── Group goal progress by goalId ─────────────────────────────────────────
  const progressByGoal = new Map<number, typeof allGoalProgress>();
  for (const p of allGoalProgress) {
    if (!progressByGoal.has(p.goalId)) progressByGoal.set(p.goalId, []);
    progressByGoal.get(p.goalId)!.push(p);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BUILD PROMPT CONTEXT
  // ══════════════════════════════════════════════════════════════════════════

  // ── 1. Datos clínicos + anamnesis del paciente ────────────────────────────
  const patientContext = [
    `Nombre: ${patient.name}`,
    patient.age ? `Edad: ${patient.age} años` : null,
    patient.fechaNacimiento ? `Fecha de nacimiento: ${patient.fechaNacimiento}` : null,
    patient.franjaEtaria ? `Franja etaria: ${patient.franjaEtaria}` : null,
    patient.diagnosis ? `Diagnóstico: ${patient.diagnosis}` : null,
    patient.fechaInicio ? `Inicio del tratamiento: ${patient.fechaInicio}` : null,
    patient.escolaridad ? `Escolaridad: ${trunc(patient.escolaridad, 250)}` : null,
    patient.motivoConsulta ? `Motivo de consulta: ${trunc(patient.motivoConsulta, 500)}` : null,
    patient.antecedentes ? `Antecedentes: ${trunc(patient.antecedentes, 500)}` : null,
    patient.historiaFamiliar ? `Historia familiar: ${trunc(patient.historiaFamiliar, 400)}` : null,
    patient.impresionClinica ? `Impresión clínica inicial: ${trunc(patient.impresionClinica, 500)}` : null,
    patient.observaciones ? `Observaciones generales: ${trunc(patient.observaciones, 400)}` : null,
    patient.lenguajeComunicacion ? `Lenguaje y comunicación (evaluación inicial): ${trunc(patient.lenguajeComunicacion, 400)}` : null,
    patient.atencionConducta ? `Atención y conducta (evaluación inicial): ${trunc(patient.atencionConducta, 400)}` : null,
    patient.vozHabla ? `Voz y habla (evaluación inicial): ${trunc(patient.vozHabla, 300)}` : null,
    patient.deglucion ? `Deglución (evaluación inicial): ${trunc(patient.deglucion, 250)}` : null,
  ].filter(Boolean).join("\n");

  // ── 2. Profesionales asignados ────────────────────────────────────────────
  const professionalContext = professionals.length > 0
    ? professionals.map(p => `${p.name} — ${p.specialty}`).join(", ")
    : patient.profesionalNombre ?? "No registrado";

  // ── 3. Objetivos terapéuticos con estado y progreso ──────────────────────
  const goalsContext = allGoals.length === 0
    ? "Sin objetivos registrados."
    : allGoals.map(g => {
        const pct = g.progressPct ?? (g.status === "logrado" ? 100 : g.status === "en progreso" ? 55 : g.status === "activo" ? 20 : 0);
        const progEntries = (progressByGoal.get(g.id) ?? [])
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const lastNote = progEntries.length > 0 ? progEntries[progEntries.length - 1].nota : null;
        const lines = [
          `[${g.status.toUpperCase()} — ${pct}%] ${g.title}`,
          `  área: ${g.areaClinica ?? g.category}${g.nivelDificultad ? ` | nivel: ${g.nivelDificultad}` : ""}`,
        ];
        if (g.description) lines.push(`  descripción: ${trunc(g.description, 200)}`);
        if (lastNote) lines.push(`  última nota de progreso: ${trunc(lastNote, 200)}`);
        return lines.join("\n");
      }).join("\n\n");

  // ── 4. Sesiones clínicas recientes (últimas 8) ────────────────────────────
  const sortedRC = [...allRegistrosClinicos].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  ).slice(0, 8);
  const sessionContext = sortedRC.length === 0
    ? "Sin sesiones registradas."
    : sortedRC.map((r) => {
        const parts = [`[${r.fecha}]`];
        if (r.resumenSesion) parts.push(`Resumen: ${trunc(r.resumenSesion, 400)}`);
        if (r.observaciones) parts.push(`Observaciones: ${trunc(r.observaciones, 400)}`);
        return parts.join(" ");
      }).join("\n");

  // ── Áreas activas ─────────────────────────────────────────────────────────
  const activeGoals = allGoals.filter(g => !["archivado", "suspendido"].includes(g.status));
  const areaKeys = Array.from(new Set(activeGoals.map(g => g.areaClinica ?? g.category ?? "general")));

  // ── Build the user prompt ─────────────────────────────────────────────────
  const userPrompt = `Genera el PERFIL CLÍNICO de síntesis para el siguiente paciente.
Disciplina detectada: ${discipline.toUpperCase()}.

═══════════════════════════════════════
DATOS CLÍNICOS Y ANAMNESIS
═══════════════════════════════════════
${patientContext}

Profesional/es: ${professionalContext}

═══════════════════════════════════════
OBJETIVOS TERAPÉUTICOS — ${allGoals.length} registrados
═══════════════════════════════════════
${goalsContext}

═══════════════════════════════════════
SESIONES CLÍNICAS RECIENTES (${sortedRC.length})
═══════════════════════════════════════
${sessionContext}

ÁREAS ACTIVAS: ${areaKeys.join(", ") || "No identificadas"}

═══════════════════════════════════════
INSTRUCCIÓN
═══════════════════════════════════════
Devuelve un JSON con exactamente estas claves. Usa SOLO los datos anteriores:
{
  "motivoConsulta": "Síntesis breve y clara del motivo de consulta y la razón de la intervención. 40-80 palabras.",
  "antecedentes": "Antecedentes relevantes (personales, evolutivos, familiares, escolares) que aporten al perfil. Si no hay datos, indicar 'No registrado'. 60-120 palabras.",
  "fortalezas": "Fortalezas, recursos y aspectos preservados observados en la anamnesis, los objetivos logrados y las sesiones. Usar viñetas con •. 60-120 palabras.",
  "dificultades": "Principales dificultades y áreas comprometidas, derivadas de la anamnesis, objetivos en curso y observaciones de sesión. Usar viñetas con •. 60-120 palabras.",
  "areasIntervencion": "Áreas de intervención sugeridas, priorizadas según las dificultades y los objetivos activos. Usar viñetas con •. 60-120 palabras.",
  "objetivosPrioritarios": "Objetivos prioritarios a corto/mediano plazo, coherentes con los objetivos ya registrados y las áreas activas. Usar viñetas con •. 60-120 palabras.",
  "resumenProfesional": "Resumen profesional integrador del perfil del paciente, con orientación clínica para la continuidad del tratamiento. 120-200 palabras."
}`;

  // ── Call OpenAI (mirror ai-informe.ts env logic) ──────────────────────────
  try {
    const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_API_KEY
      ? "https://api.openai.com/v1"
      : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    const model = process.env.OPENAI_API_KEY ? "gpt-4o" : "gpt-5.4";

    if (!apiKey) {
      return res.status(500).json({ error: "No hay clave de API de OpenAI configurada." });
    }

    const openai = new OpenAI({ apiKey, baseURL });

    console.log(`[ai-perfil] paciente=${patientId} disciplina=${discipline} sesiones=${sortedRC.length} objetivos=${allGoals.length} modelo=${model}`);

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: buildSystemPrompt(discipline) },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const text = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text);

    return res.json({
      motivoConsulta: parsed.motivoConsulta ?? "",
      antecedentes: parsed.antecedentes ?? "",
      fortalezas: parsed.fortalezas ?? "",
      dificultades: parsed.dificultades ?? "",
      areasIntervencion: parsed.areasIntervencion ?? "",
      objetivosPrioritarios: parsed.objetivosPrioritarios ?? "",
      resumenProfesional: parsed.resumenProfesional ?? "",
      _meta: { discipline, sessions: sortedRC.length, goals: allGoals.length },
    });
  } catch (error: any) {
    console.error("[ai-perfil] Error:", error?.message);
    return res.status(500).json({ error: "Error al generar el perfil con IA. Intenta de nuevo." });
  }
});

export default router;
