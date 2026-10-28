import { Router, type IRouter } from "express";
import { recordUserActivityEvent } from "../lib/usage-audit-db";
import { db } from "@workspace/db";
import {
  patientsTable,
  goalsTable,
  goalProgressTable,
  registrosClinicosTable,
  patientReportsTable,
  professionalsTable,
  patientProfessionalsTable,
} from "@workspace/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  GenerateClinicalProfileBody,
  GenerateClinicalProfileResponse,
  GetClinicalProfileParams,
  GetClinicalProfileResponse,
  ListClinicalProfileVersionsParams,
  ListClinicalProfileVersionsResponse,
  SaveClinicalProfileBody,
} from "@workspace/api-zod";
import OpenAI from "openai";
import { formatEdad, splitDiagnosis } from "../lib/edad";
import {
  formatPsychologySessionSummary,
  resolveClinicalSpecialty,
  type ClinicalSpecialty,
} from "@workspace/clinical-specialty";
import { canAccessPatient } from "./access-policy";
import { requireAiConsent } from "../lib/consents";

const router: IRouter = Router();

// ─── Types ────────────────────────────────────────────────────────────────────

function getSessionUser(req: any) {
  if (!req.session?.userId) return null;
  return {
    id: req.session.userId,
    role: req.session.userRole ?? "professional",
    specialty: req.session.userSpecialty ?? null,
  };
}

// ─── Discipline-specific prompt ───────────────────────────────────────────────

function buildSystemPrompt(discipline: ClinicalSpecialty): string {
  const assistantRole =
    discipline === "psicologia" || discipline === "general"
      ? "Eres un asistente clínico de propósito general."
      : "Eres un asistente clínico especializado en terapias del neurodesarrollo e intervención infanto-juvenil.";
  const base = `${assistantRole}
Tu tarea es redactar un PERFIL CLÍNICO de síntesis del paciente, basándote EXCLUSIVAMENTE en los datos reales que se te proporcionan (anamnesis, objetivos, sesiones y desempeño).
Reglas estrictas:
- Usa SOLO la información contenida en el contexto. NO inventes datos, fechas, porcentajes ni conductas.
- Si algún apartado no tiene evidencia suficiente, devuelve una cadena vacía. No uses "No registrado" ni rellenes con texto genérico.
- Lenguaje: español rioplatense, tercera persona, tono profesional clínico y empático.
- Elabora una síntesis desarrollada, organizada y clínicamente útil. Prioriza integrar la información disponible antes que resumirla en frases mínimas.
- Aprovecha la anamnesis y las evaluaciones ya incluidas en el contexto; no solicites que el profesional vuelva a escribirlas.
- Mantén la diferencia entre información referida, observación clínica, evaluación profesional y evolución registrada.
- No afirmes relaciones causales, diagnósticos, cambios ni conclusiones que no estén expresamente documentados.
- Usa la extensión sugerida para cada sección solo cuando la evidencia alcance; no agregues texto para completar una cantidad de palabras.
- El perfil es una herramienta de trabajo editable para el profesional, no un informe formal para terceros.
- Los estados de objetivos no son porcentajes. Incluye porcentajes solo si están explícitamente registrados en progressPct.
- Responde EXCLUSIVAMENTE con JSON válido, sin markdown, sin texto fuera del JSON.`;

  const neutralGuidance = `
Especialidad reconocida sin guía específica configurada. Resume solo información explícitamente registrada y usa terminología clínica general; no agregues diagnósticos, actividades ni categorías propias de otra especialidad.`;
  const disciplines: Record<ClinicalSpecialty, string> = {
    fonoaudiologia: `
Especialidad: FONOAUDIOLOGÍA. Enfocate en lenguaje expresivo y comprensivo, articulación y fonología, comunicación funcional, voz y deglución (si aplica).`,
    psicopedagogia: `
Especialidad: PSICOPEDAGOGÍA. Enfocate en procesos de aprendizaje, atención, memoria operativa, funciones ejecutivas, lectoescritura y comprensión.`,
    terapia_ocupacional: `
Especialidad: TERAPIA OCUPACIONAL. Enfocate en desempeño funcional, autonomía, rutinas, regulación sensorial, juego, participación social/escolar y ajustes del entorno. Prioriza los apoyos y ocupaciones relevantes para la persona; no infieras cambios que no estén registrados.`,
    psicologia: `
Especialidad: PSICOLOGÍA. Integra anamnesis y evaluaciones psicológicas estructuradas, distinguiendo información referida, observaciones y evaluación profesional. Conserva el estado de borrador cuando corresponda. No conviertas contenido psicológico en diagnósticos ni conclusiones que no estén documentados.`,
    general: neutralGuidance,
  };

  return base + disciplines[discipline];
}

function trunc(s: string | null | undefined, max = 400): string {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function buildPsychologyContext(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const data = value as {
    anamnesis?: { sections?: Record<string, { status?: string; text?: string }> };
    evaluations?: Array<{
      title?: string;
      date?: string | null;
      status?: string;
      areas?: Record<string, string>;
      interviews?: Array<{ date?: string | null; participant?: string; notes?: string }>;
      instruments?: Array<{ name?: string; version?: string; date?: string | null; results?: string; interpretation?: string }>;
      professionalInterpretation?: string;
    }>;
  };
  const lines: string[] = [];
  const anamnesisLabels: Record<string, string> = {
    reasonAndExpectations: "Motivo y expectativas",
    personalFamilyHistory: "Antecedentes personales y familiares",
    developmentalHistory: "Historia del desarrollo",
    emotionalRegulation: "Experiencia emocional y regulación",
    behaviorDailyFunctioning: "Conducta y funcionamiento cotidiano",
    relationshipsSupport: "Vínculos y apoyos",
    lifeContext: "Contexto de vida",
    sleepHabitsRoutines: "Sueño, hábitos y rutinas",
    strengthsInterestsResources: "Fortalezas, intereses y recursos",
    previousTreatmentsStrategies: "Atenciones previas y estrategias",
    riskAndProtection: "Factores de riesgo y protección",
  };

  for (const [key, section] of Object.entries(data.anamnesis?.sections ?? {})) {
    const text = typeof section?.text === "string" ? section.text.trim() : "";
    if (!text) continue;
    const status = section.status === "draft" ? "borrador" : section.status === "recorded" ? "registrado" : "estado no especificado";
    lines.push(`Anamnesis psicológica — ${anamnesisLabels[key] ?? key} (${status}): ${trunc(text, 700)}`);
  }

  const evaluations = Array.isArray(data.evaluations) ? data.evaluations.slice(-8) : [];
  for (const evaluation of evaluations) {
    const label = [
      evaluation.title?.trim() || "Evaluación",
      evaluation.date || "",
      evaluation.status === "completed" ? "completada" : "borrador",
    ].filter(Boolean).join(" — ");
    lines.push(`Evaluación psicológica: ${label}`);

    for (const [area, text] of Object.entries(evaluation.areas ?? {})) {
      if (typeof text === "string" && text.trim()) {
        lines.push(`  ${area}: ${trunc(text.trim(), 500)}`);
      }
    }
    for (const interview of (evaluation.interviews ?? []).slice(0, 5)) {
      if (interview.notes?.trim()) {
        lines.push(`  Entrevista${interview.date ? ` (${interview.date})` : ""}${interview.participant ? ` — ${trunc(interview.participant, 100)}` : ""}: ${trunc(interview.notes, 500)}`);
      }
    }
    for (const instrument of (evaluation.instruments ?? []).slice(0, 5)) {
      const details = [
        instrument.name?.trim(),
        instrument.version?.trim(),
        instrument.date,
        instrument.results?.trim() ? `Resultados: ${trunc(instrument.results, 400)}` : "",
        instrument.interpretation?.trim() ? `Interpretación profesional: ${trunc(instrument.interpretation, 400)}` : "",
      ].filter(Boolean);
      if (details.length) lines.push(`  Instrumento: ${details.join(" — ")}`);
    }
    if (evaluation.professionalInterpretation?.trim()) {
      lines.push(`  Interpretación profesional: ${trunc(evaluation.professionalInterpretation, 700)}`);
    }
  }

  return lines.join("\n").slice(0, 14_000);
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

const CLINICAL_PROFILE_REPORT_TYPE = "clinical-profile";

function perfilFromVersion(content: unknown): PerfilIA {
  if (!content || typeof content !== "object" || Array.isArray(content)) return normalizePerfil(null);
  return normalizePerfil((content as Record<string, unknown>).perfil);
}

function perfilFromLegacy(value: string | null): PerfilIA | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return normalizePerfil(parsed);
  } catch {
    return null;
  }
}

// GET the latest saved profile for the current professional; legacy data stays untouched.
router.get("/ai/perfil/:patientId", async (req, res): Promise<void> => {
  const params = GetClinicalProfileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "patientId inválido" });
    return;
  }
  const sess = getSessionUser(req);
  if (!sess) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  const patientId = params.data.patientId;

  const [patient] = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.id, patientId));
  if (!patient) {
    res.status(404).json({ error: "Paciente no encontrado" });
    return;
  }
  if (!canAccessPatient(patient, sess)) {
    res.status(403).json({ error: "Sin acceso a este paciente" });
    return;
  }

  const [version] = await db.select().from(patientReportsTable)
    .where(and(
      eq(patientReportsTable.patientId, patientId),
      eq(patientReportsTable.authorUserId, sess.id),
      eq(patientReportsTable.reportType, CLINICAL_PROFILE_REPORT_TYPE),
    ))
    .orderBy(desc(patientReportsTable.createdAt))
    .limit(1);

  if (version) {
    res.json(GetClinicalProfileResponse.parse({
      perfil: perfilFromVersion(version.content),
      createdAt: version.createdAt,
      updatedAt: version.updatedAt,
      versionId: version.id,
      source: "version",
    }));
    return;
  }

  const legacyPerfil = perfilFromLegacy(patient.perfilIa);
  res.json(GetClinicalProfileResponse.parse({
    perfil: legacyPerfil,
    createdAt: legacyPerfil ? patient.perfilIaCreatedAt : null,
    updatedAt: legacyPerfil ? patient.perfilIaUpdatedAt : null,
    versionId: null,
    source: legacyPerfil ? "legacy" : "empty",
  }));
});

// Profile edits are append-only versions. Never overwrite a saved version or legacy patient data.
router.put("/ai/perfil/:patientId", async (req, res): Promise<void> => {
  const params = GetClinicalProfileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "patientId inválido" });
    return;
  }
  const sess = getSessionUser(req);
  if (!sess) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  const patientId = params.data.patientId;

  const [patient] = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.id, patientId));
  if (!patient) {
    res.status(404).json({ error: "Paciente no encontrado" });
    return;
  }
  if (!canAccessPatient(patient, sess)) {
    res.status(403).json({ error: "Sin acceso a este paciente" });
    return;
  }

  const body = SaveClinicalProfileBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Perfil clínico inválido" });
    return;
  }
  const perfil = normalizePerfil(body.data.perfil);

  const now = new Date();
  const [version] = await db.insert(patientReportsTable).values({
    patientId,
    reportType: CLINICAL_PROFILE_REPORT_TYPE,
    title: "Perfil clínico",
    content: { v: 1, perfil },
    authorUserId: sess.id,
    updatedByUserId: sess.id,
    createdAt: now,
    updatedAt: now,
  }).returning();

  const response = GetClinicalProfileResponse.parse({
    perfil,
    createdAt: version.createdAt,
    updatedAt: version.updatedAt,
    versionId: version.id,
    source: "version",
  });
  recordUserActivityEvent(sess.id, "patient_saved");
  res.status(201).json(response);
});

// History is private to the current professional and each saved version is read-only.
router.get("/ai/perfil/:patientId/versions", async (req, res): Promise<void> => {
  const params = ListClinicalProfileVersionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "patientId inválido" });
    return;
  }
  const sess = getSessionUser(req);
  if (!sess) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  const patientId = params.data.patientId;
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId));
  if (!patient) {
    res.status(404).json({ error: "Paciente no encontrado" });
    return;
  }
  if (!canAccessPatient(patient, sess)) {
    res.status(403).json({ error: "Sin acceso a este paciente" });
    return;
  }
  const versions = await db.select().from(patientReportsTable)
    .where(and(
      eq(patientReportsTable.patientId, patientId),
      eq(patientReportsTable.authorUserId, sess.id),
      eq(patientReportsTable.reportType, CLINICAL_PROFILE_REPORT_TYPE),
    ))
    .orderBy(desc(patientReportsTable.createdAt))
    .limit(100);
  res.json(ListClinicalProfileVersionsResponse.parse(versions.map(version => ({
    versionId: version.id,
    perfil: perfilFromVersion(version.content),
    createdAt: version.createdAt,
    updatedAt: version.updatedAt,
  }))));
});

// ─── Main route ───────────────────────────────────────────────────────────────

router.post("/ai/perfil-generate", async (req, res): Promise<void> => {
  if (!await requireAiConsent(req, res)) return;
  const sess = getSessionUser(req);
  if (!sess) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  const input = GenerateClinicalProfileBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "patientId requerido" });
    return;
  }
  const { patientId } = input.data;

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId));
  if (!patient) {
    res.status(404).json({ error: "Paciente no encontrado" });
    return;
  }
  if (!canAccessPatient(patient, sess)) {
    res.status(403).json({ error: "Sin acceso a este paciente" });
    return;
  }

  // ── Fetch all data in parallel ─────────────────────────────────────────────
  const [
    allGoals,
    allRegistrosClinicos,
    assignments,
  ] = await Promise.all([
    db.select().from(goalsTable).where(eq(goalsTable.patientId, patientId)),
    db.select().from(registrosClinicosTable).where(and(
      eq(registrosClinicosTable.patientId, patientId),
      eq(registrosClinicosTable.userId, sess.id),
    )),
    db.select().from(patientProfessionalsTable).where(eq(patientProfessionalsTable.patientId, patientId)),
  ]);

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
  const discipline = resolveClinicalSpecialty(
    sess.specialty,
    professionals.map((professional) => professional.specialty),
  );

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
    formatEdad(patient.fechaNacimiento, patient.age) ? `Edad: ${formatEdad(patient.fechaNacimiento, patient.age)}` : null,
    patient.fechaNacimiento ? `Fecha de nacimiento: ${patient.fechaNacimiento}` : null,
    patient.franjaEtaria ? `Franja etaria: ${patient.franjaEtaria}` : null,
    splitDiagnosis(patient.diagnosis).principal ? `Diagnóstico principal: ${splitDiagnosis(patient.diagnosis).principal}` : null,
    splitDiagnosis(patient.diagnosis).asociados.length ? `Diagnósticos asociados: ${splitDiagnosis(patient.diagnosis).asociados.join(", ")}` : null,
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
    patient.rutinasHabitos ? `Rutinas y hábitos: ${trunc(patient.rutinasHabitos, 400)}` : null,
    patient.entornoParticipacion ? `Entorno y participación: ${trunc(patient.entornoParticipacion, 400)}` : null,
  ].filter(Boolean).join("\n");
  const psychologyContext = discipline === "psicologia"
    ? buildPsychologyContext(patient.psychologyData)
    : "";

  // ── 2. Profesionales asignados ────────────────────────────────────────────
  const professionalContext = professionals.length > 0
    ? professionals.map(p => `${p.name} — ${p.specialty}`).join(", ")
    : patient.profesionalNombre ?? "No registrado";

  // ── 3. Objetivos terapéuticos con estado y progreso ──────────────────────
  const goalsContext = allGoals.length === 0
    ? "Sin objetivos registrados."
    : allGoals.map(g => {
        const pct = g.progressPct;
        const progEntries = (progressByGoal.get(g.id) ?? [])
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const lastNote = progEntries.length > 0 ? progEntries[progEntries.length - 1].nota : null;
        const lines = [
          `[${g.status.toUpperCase()}${pct != null ? ` — progreso registrado: ${pct}%` : ""}] ${g.title}`,
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
        if (r.resumenSesion) parts.push(`Resumen: ${trunc(formatPsychologySessionSummary(r.resumenSesion), 400)}`);
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
${psychologyContext ? `\n\nANAMNESIS Y EVALUACIONES PSICOLÓGICAS ESTRUCTURADAS\n${psychologyContext}` : ""}

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
  "motivoConsulta": "Desarrolla en aproximadamente 40-80 palabras el motivo y la demanda tal como constan en la anamnesis. No atribuyas causas ni agregues expectativas no expresadas. Si no hay evidencia, devuelve una cadena vacía.",
  "antecedentes": "Integra en aproximadamente 60-120 palabras los antecedentes personales, evolutivos, familiares y escolares pertinentes que estén documentados. Distingue lo referido de lo observado y no completes información ausente. Si no hay evidencia, devuelve una cadena vacía.",
  "fortalezas": "Describe en aproximadamente 60-120 palabras los recursos, intereses y capacidades preservadas que estén explícitamente documentados. Organiza los hallazgos con viñetas (•) cuando haya varios. No infieras fortalezas por ausencia de dificultades. Si no hay evidencia, devuelve una cadena vacía.",
  "dificultades": "Desarrolla en aproximadamente 60-120 palabras las dificultades explícitamente consignadas en anamnesis, evaluaciones u observaciones. Organiza los hallazgos con viñetas (•) cuando haya varios; conserva hipótesis como hipótesis y no las conviertas en hechos. Si no hay evidencia, devuelve una cadena vacía.",
  "areasIntervencion": "Presenta en aproximadamente 60-120 palabras las áreas que figuran en objetivos, evaluaciones o intervención documentada, priorizadas según la información disponible. No agregues áreas, déficits ni necesidades nuevas. Usa viñetas (•) si ayuda a organizar varios focos. Si no hay evidencia, devuelve una cadena vacía.",
  "objetivosPrioritarios": "Organiza en aproximadamente 60-120 palabras los objetivos ya registrados y priorizados por el profesional, diferenciando objetivos activos de logrados cuando conste. No inventes objetivos ni reformules estados como porcentajes. Usa viñetas (•) si hay varios. Si no hay evidencia, devuelve una cadena vacía.",
  "resumenProfesional": "Elabora en aproximadamente 120-200 palabras una síntesis integradora y clínicamente útil de la anamnesis, las evaluaciones y la evolución documentada. Distingue los momentos y fuentes; no agregues diagnósticos, explicaciones causales, recomendaciones ni conclusiones que no estén registradas. Si la evidencia no alcanza, redacta menos; si no hay contenido, devuelve una cadena vacía."
}`;

  // ── Call OpenAI (mirror ai-informe.ts env logic) ──────────────────────────
  try {
    const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_API_KEY
      ? "https://api.openai.com/v1"
      : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    const model = process.env.OPENAI_API_KEY ? "gpt-4o" : "gpt-5.4";

    if (!apiKey) {
      res.status(500).json({ error: "No hay clave de API de OpenAI configurada." });
      return;
    }

    const openai = new OpenAI({ apiKey, baseURL });

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

    const result = {
      motivoConsulta: parsed.motivoConsulta ?? "",
      antecedentes: parsed.antecedentes ?? "",
      fortalezas: parsed.fortalezas ?? "",
      dificultades: parsed.dificultades ?? "",
      areasIntervencion: parsed.areasIntervencion ?? "",
      objetivosPrioritarios: parsed.objetivosPrioritarios ?? "",
      resumenProfesional: parsed.resumenProfesional ?? "",
      _meta: { discipline, sessions: sortedRC.length, goals: allGoals.length },
    };
    recordUserActivityEvent(sess.id, "ai_used");
    res.json(GenerateClinicalProfileResponse.parse(result));
  } catch (error: any) {
    console.error("[ai-perfil] Error:", error?.message);
    res.status(500).json({ error: "Error al generar el perfil con IA. Intenta de nuevo." });
  }
});

export default router;
