import { Router, type IRouter } from "express";
import { recordUserActivityEvent } from "../lib/usage-audit-db";
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
import { formatEdad, splitDiagnosis } from "../lib/edad";
import {
  resolveClinicalSpecialty,
  type ClinicalSpecialty,
} from "@workspace/clinical-specialty";
import { canAccessPatient } from "./access-policy";
import { requireAiConsent } from "../lib/consents";
import { selectClinicalPeriod, validClinicalDay } from "./report-period";
import {
  buildSessionContext,
  documentedAreaSources,
  MAX_REPORT_CONTEXT_CHARS,
  normalizeReportAreas,
  reportContextLength,
} from "./report-context";

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

// ─── Discipline detection ─────────────────────────────────────────────────────

// ─── Discipline-specific system prompts ──────────────────────────────────────

function buildSystemPrompt(discipline: ClinicalSpecialty): string {
  const assistantRole =
    discipline === "psicologia" || discipline === "general"
      ? "Eres un asistente clínico de propósito general."
      : "Eres un asistente clínico especializado en terapias del neurodesarrollo e intervención infanto-juvenil.";
  const base = `${assistantRole}
Tu tarea es redactar secciones de un informe clínico de evolución basándote EXCLUSIVAMENTE en los datos reales del paciente que se te proporcionan.
Reglas estrictas:
- Usa SOLO la información contenida en el contexto. NO inventes datos, fechas, porcentajes ni conductas.
- Si algún dato no está disponible, indícalo con "No registrado" o redacta con lo que sí existe.
- Lenguaje: español rioplatense, tercera persona, tono profesional clínico y empático.
- Si hay pocos datos, redacta de forma breve y honesta. No rellenes con texto genérico ni recomendaciones no registradas.
- Distingue siempre entre una actividad realizada y un resultado obtenido. Describe el resultado únicamente cuando esté explícitamente registrado.
- Sintetiza las notas breves, coloquiales, con errores o abreviaturas en redacción clínica profesional. No las copies literalmente ni incluyas fragmentos textuales extensos.
- No conviertas estados de objetivos en porcentajes. Usa porcentajes únicamente cuando estén registrados como progressPct.
- Evita repetir el nombre del paciente. Describe solo registros presentes en el período; un registro en el período no implica que sea la única sesión de toda la historia clínica. Si no hay registros clínicos en el período no afirmes que hubo sesiones ni uses "Durante las sesiones".
- Responde EXCLUSIVAMENTE con JSON válido, sin markdown, sin texto fuera del JSON.`;

  const neutralGuidance = `
Especialidad reconocida sin guía específica configurada.
Redacta únicamente con información explícitamente documentada y terminología clínica general. No agregues ejercicios, diagnósticos, categorías ni términos propios de otra especialidad.`;
  const disciplines: Record<ClinicalSpecialty, string> = {
    fonoaudiologia: `
Especialidad: FONOAUDIOLOGÍA.
Enfocate en: lenguaje expresivo y comprensivo, articulación y fonología, comunicación funcional, voz y deglución (si aplica).
Terminología a usar: "producción fonológica", "inteligibilidad del habla", "estructuración del lenguaje", "comprensión auditiva", "habilidades pragmáticas", "comunicación intencional", "sistemas de comunicación aumentativa", "patrón articulatorio", "discriminación auditiva", "narrativa oral".
Al describir evolución: mencionar cambios en la claridad del habla, ampliación del vocabulario, longitud de enunciados, uso comunicativo del lenguaje o comprensión de consignas únicamente si están registrados explícitamente.`,

    psicopedagogia: `
Especialidad: PSICOPEDAGOGÍA.
Enfocate en: procesos de aprendizaje, atención sostenida y selectiva, memoria operativa, funciones ejecutivas, lectoescritura, comprensión lectora, cálculo.
Terminología a usar: "estrategias cognitivas", "procesos de aprendizaje", "nivel de adquisición", "metacognición", "planificación y organización", "flexibilidad cognitiva", "inhibición de respuestas", "decodificación lectora", "conciencia fonológica", "procesamiento de la información".
Al describir evolución: mencionar cambios en el rendimiento, estrategias adquiridas, autonomía o generalización únicamente si están registrados explícitamente.`,

    terapia_ocupacional: `
Especialidad: TERAPIA OCUPACIONAL.
Enfocate en: AVD y autonomía, rutinas y hábitos, procesamiento y regulación sensorial, destreza manual, motricidad, coordinación visomotora, grafomotricidad, juego y participación social/escolar, considerando los apoyos y las adaptaciones del entorno.
Terminología a usar: "desempeño ocupacional", "participación en ocupaciones significativas", "apoyo requerido", "adaptaciones del entorno", "rutina", "destreza manual", "coordinación bimanual", "autonomía en AVD".
Al describir evolución: mencionar cambios en la participación funcional, autonomía, uso de apoyos, ejecución de rutinas o acceso a actividades únicamente si están registrados explícitamente; no reducir la evolución a déficits corporales.`,

    psicologia: neutralGuidance,
    general: neutralGuidance,
  };

  return base + disciplines[discipline];
}

function trunc(s: string | null | undefined, max = 400): string {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

// ─── Main route ───────────────────────────────────────────────────────────────

router.post("/ai/informe-generate", async (req, res) => {
  if (!await requireAiConsent(req, res)) return;
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const { patientId, rango = "mes" } = req.body as { patientId: number; rango?: string };
  if (!patientId) return res.status(400).json({ error: "patientId requerido" });
  if (!["4", "mes", "3meses", "6meses", "historia"].includes(rango)) return res.status(400).json({ error: "Período inválido" });

  // Resolve and authorize the patient before loading any clinical data.
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId));
  if (!patient) return res.status(404).json({ error: "Paciente no encontrado" });
  if (!canAccessPatient(patient, sess)) {
    return res.status(403).json({ error: "Sin acceso a este paciente" });
  }

  // ── Fetch all data in parallel ─────────────────────────────────────────────
  const [
    allGoals,
    allRegistrosClinicos,
    allRegistros,
    assignments,
  ] = await Promise.all([
    db.select().from(goalsTable).where(eq(goalsTable.patientId, patientId)),
    db.select().from(registrosClinicosTable).where(eq(registrosClinicosTable.patientId, patientId)),
    db.select().from(registrosTable).where(eq(registrosTable.patientId, patientId)),
    db.select().from(patientProfessionalsTable).where(eq(patientProfessionalsTable.patientId, patientId)),
  ]);

  // ── Fetch professionals and goal progress ──────────────────────────────────
  const profIds = assignments.map(a => a.professionalId);
  const [professionals, allGoalProgress] = await Promise.all([
    profIds.length > 0
      ? db.select().from(professionalsTable).where(inArray(professionalsTable.id, profIds))
      : Promise.resolve([] as typeof professionalsTable.$inferSelect[]),
    allGoals.length > 0
      ? db.select().from(goalProgressTable)
          .where(inArray(goalProgressTable.goalId, allGoals.map(g => g.id)))
      : Promise.resolve([] as typeof goalProgressTable.$inferSelect[]),
  ]);

  // ── Detect discipline ──────────────────────────────────────────────────────
  const discipline = resolveClinicalSpecialty(
    sess.specialty,
    professionals.map((professional) => professional.specialty),
  );

  // ── Filter sessions by selected range ─────────────────────────────────────
  const period = selectClinicalPeriod(allRegistrosClinicos, rango);
  const { selected: filteredRC, periodFrom, periodTo } = period;
  const inPeriod = (value: string | Date | null) => {
    if (!value || !periodFrom) return false;
    const date = value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
    if (!validClinicalDay(date) || (typeof value === "string" && !validClinicalDay(value))) return false;
    return date >= periodFrom && date <= periodTo;
  };

  // ── Group goal progress by goalId ─────────────────────────────────────────
  const progressByGoal = new Map<number, typeof allGoalProgress>();
  for (const p of allGoalProgress) {
    if (!progressByGoal.has(p.goalId)) progressByGoal.set(p.goalId, []);
    progressByGoal.get(p.goalId)!.push(p);
  }

  // ── Group legacy registros by objective name ───────────────────────────────
  const registrosByObj = new Map<string, typeof allRegistros>();
  for (const r of allRegistros.filter(r => inPeriod(r.fecha ?? r.createdAt))) {
    const key = r.objetivoNombre ?? "sin_objetivo";
    if (!registrosByObj.has(key)) registrosByObj.set(key, []);
    registrosByObj.get(key)!.push(r);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BUILD PROMPT CONTEXT
  // ══════════════════════════════════════════════════════════════════════════

  // ── 1. Datos clínicos del paciente ────────────────────────────────────────
  const patientContext = [
    `Nombre: ${patient.name}`,
    formatEdad(patient.fechaNacimiento, patient.age) ? `Edad: ${formatEdad(patient.fechaNacimiento, patient.age)}` : null,
    patient.fechaNacimiento ? `Fecha de nacimiento: ${patient.fechaNacimiento}` : null,
    patient.franjaEtaria ? `Franja etaria: ${patient.franjaEtaria}` : null,
    splitDiagnosis(patient.diagnosis).principal ? `Diagnóstico principal: ${splitDiagnosis(patient.diagnosis).principal}` : null,
    splitDiagnosis(patient.diagnosis).asociados.length ? `Diagnósticos asociados: ${splitDiagnosis(patient.diagnosis).asociados.join(", ")}` : null,
    patient.fechaInicio ? `Inicio del tratamiento: ${patient.fechaInicio}` : null,
    patient.escolaridad ? `Escolaridad: ${patient.escolaridad}` : null,
    patient.motivoConsulta ? `Motivo de consulta: ${patient.motivoConsulta}` : null,
    patient.antecedentes ? `Antecedentes: ${patient.antecedentes}` : null,
    patient.historiaFamiliar ? `Historia familiar: ${patient.historiaFamiliar}` : null,
    patient.impresionClinica ? `Impresión clínica inicial: ${patient.impresionClinica}` : null,
    patient.observaciones ? `Observaciones generales: ${patient.observaciones}` : null,
    // Discipline-relevant clinical fields
    patient.lenguajeComunicacion ? `Lenguaje y comunicación (evaluación inicial): ${patient.lenguajeComunicacion}` : null,
    patient.atencionConducta ? `Atención y conducta (evaluación inicial): ${patient.atencionConducta}` : null,
    patient.vozHabla ? `Voz y habla (evaluación inicial): ${patient.vozHabla}` : null,
    patient.deglucion ? `Deglución (evaluación inicial): ${patient.deglucion}` : null,
    patient.rutinasHabitos ? `Rutinas y hábitos: ${patient.rutinasHabitos}` : null,
    patient.entornoParticipacion ? `Entorno y participación: ${patient.entornoParticipacion}` : null,
  ].filter(Boolean).join("\n");

  // ── 2. Profesionales asignados ────────────────────────────────────────────
  const professionalContext = professionals.length > 0
    ? professionals.map(p => `${p.name} — ${p.specialty}`).join(", ")
    : patient.profesionalNombre ?? "No registrado";

  // ── 3. Objetivos terapéuticos con historial de progreso ──────────────────
  const goalsContext = allGoals.length === 0
    ? "No hay objetivos terapéuticos registrados. Esto no impide generar el informe: utiliza los demás datos clínicos disponibles y no inventes objetivos ni áreas."
    : allGoals.map(g => {
        const progEntries = (progressByGoal.get(g.id) ?? []).filter(p => inPeriod(p.createdAt))
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

        const progressHistory = progEntries.length > 0
          ? progEntries.map(p => {
              const parts = [`  · ${p.createdAt.toISOString().slice(0, 10)}`];
              if (p.statusAnterior && p.statusNuevo && p.statusAnterior !== p.statusNuevo)
                parts.push(`estado: ${p.statusAnterior} → ${p.statusNuevo}`);
              if (p.progressPct != null) parts.push(`progreso: ${p.progressPct}%`);
              if (p.intentos != null) parts.push(`intentos: ${p.intentos}, correctas: ${p.correctas ?? "?"}`);
              if (p.nota) parts.push(`nota: "${trunc(p.nota, 200)}"`);
              return parts.join(" | ");
            }).join("\n")
          : null;

        const lines = [
          `[${g.status.toUpperCase()}] ${g.title}`,
          `  área: ${g.areaClinica ?? g.category}${g.nivelDificultad ? ` | nivel: ${g.nivelDificultad}` : ""}${g.fechaAsignacion ? ` | asignado: ${g.fechaAsignacion}` : ""}`,
        ];
        if (g.progressPct != null) lines[0] += ` — progreso registrado: ${g.progressPct}%`;
        if (g.description) lines.push(`  descripción: ${trunc(g.description, 200)}`);
        if (g.notas) lines.push(`  notas: ${trunc(g.notas, 200)}`);
        if (progressHistory) lines.push(`  historial de progreso:\n${progressHistory}`);
        return lines.join("\n");
      }).join("\n\n");

  // ── 4. Sesiones clínicas del período (registros_clinicos) ─────────────────
  const sortedRC = [...filteredRC].sort((a, b) => {
    const aValid = validClinicalDay(a.fecha);
    const bValid = validClinicalDay(b.fecha);
    if (aValid && bValid) return a.fecha.localeCompare(b.fecha);
    return aValid ? -1 : bValid ? 1 : a.id - b.id;
  });
  const sessionContext = buildSessionContext(sortedRC);

  // ── 5. Registros de desempeño por objetivo (tabla registros) ──────────────
  const perfContext = registrosByObj.size === 0
    ? null
    : Array.from(registrosByObj.entries())
        .slice(0, 20)
        .map(([obj, recs]) => {
          const sorted = [...recs].sort((a, b) =>
            new Date(a.fecha ?? a.createdAt).getTime() - new Date(b.fecha ?? b.createdAt).getTime()
          );
          const rows = sorted.slice(0, 10).map(r => {
            const parts = [r.fecha ?? r.createdAt.toISOString().slice(0, 10)];
            if (r.intentos != null) parts.push(`intentos:${r.intentos}`);
            if (r.correctas != null) parts.push(`correctas:${r.correctas}`);
            if (r.porcentaje) parts.push(`%:${r.porcentaje}`);
            if (r.cumpleMeta) parts.push(`meta:${r.cumpleMeta}`);
            if (r.informeSesion) parts.push(`"${trunc(r.informeSesion, 150)}"`);
            return "  · " + parts.join(" | ");
          });
          return `Objetivo: "${obj}" (área: ${sorted[0]?.areaObjetivo ?? "—"})\n${rows.join("\n")}`;
        })
        .join("\n\n");

  // ── 6. Áreas activas ──────────────────────────────────────────────────────
  const activeGoals = allGoals.filter(g => !["archivado", "suspendido"].includes(g.status));
  const areaGroups: Record<string, typeof allGoals> = {};
  for (const g of activeGoals) {
    const a = g.areaClinica ?? g.category ?? "general";
    if (!areaGroups[a]) areaGroups[a] = [];
    areaGroups[a].push(g);
  }
  // ── Build the user prompt ─────────────────────────────────────────────────
  const availableAreaSources = documentedAreaSources(patient, Object.keys(areaGroups));

  const userPrompt = `Genera el informe clínico de evolución para el siguiente paciente.
Disciplina detectada: ${discipline.toUpperCase()}.
Período analizado: ${periodFrom ?? "sin registros seleccionados"} – ${periodTo}. Registros clínicos incluidos: ${filteredRC.length}. Total de registros clínicos del paciente: ${allRegistrosClinicos.length}. Registros excluidos por fecha inválida o futura: ${period.clinicalRecordsExcludedCount}. Registros de historia completa sin fecha válida, incluidos sin ubicación cronológica: ${period.clinicalRecordsUndatedCount}. Los historiales de progreso y desempeño se limitan al período. No atribuyas al período actividades que no estén registradas allí.

═══════════════════════════════════════
DATOS CLÍNICOS DEL PACIENTE
═══════════════════════════════════════
${patientContext}

Profesional/es: ${professionalContext}

═══════════════════════════════════════
OBJETIVOS TERAPÉUTICOS — ${allGoals.length} registrados
═══════════════════════════════════════
${goalsContext}

═══════════════════════════════════════
SESIONES CLÍNICAS DEL PERÍODO (${sortedRC.length} sesiones; cronológicas, completas y con materiales registrados)
═══════════════════════════════════════
${sessionContext}

${perfContext ? `═══════════════════════════════════════
DESEMPEÑO POR OBJETIVO (registros históricos)
═══════════════════════════════════════
${perfContext}` : ""}

ÁREAS / FUENTES CLÍNICAS DOCUMENTADAS: ${availableAreaSources.join(", ") || "Identifica áreas solo si la anamnesis o las sesiones aportan evidencia explícita."}

═══════════════════════════════════════
INSTRUCCIÓN
═══════════════════════════════════════
Devuelve un JSON con exactamente estas claves. Usa SOLO los datos anteriores. Los objetivos son opcionales. En "areas", reemplaza el objeto vacío por claves dinámicas para las áreas que tengan evidencia en anamnesis, evaluaciones o sesiones, aunque no haya objetivos; déjalo vacío solo si esas fuentes no documentan áreas. Incluye solo áreas respaldadas; la anamnesis es contexto inicial, no prueba de evolución. Integra cronológicamente las intervenciones, respuestas observadas, avances explícitos y dificultades persistentes. Distingue siempre actividad realizada de resultado.
{
  "resumen": "Motivo de intervención y síntesis del proceso basada en la información clínica disponible. Menciona la cantidad de sesiones y las áreas u objetivos solo cuando estén registrados. Diferencia actividades realizadas de resultados explícitamente documentados. Si no hay datos para afirmar evolución, indícalo sin completar con frases genéricas.",
  "conducta": "Síntesis de la conducta en sesión únicamente cuando existan observaciones registradas: atención, disposición, respuesta a consignas, necesidad de apoyo y autonomía. Si no hay observaciones, indica No registrado.",
  "areas": {},
  "sugerencias": "Recomendaciones para la familia únicamente a partir de recomendaciones registradas o de actividades explícitamente documentadas. No agregues recomendaciones clínicas nuevas. Si no hay recomendaciones registradas, indica No registrado."
}`;

  const promptChars = reportContextLength(buildSystemPrompt(discipline), userPrompt);
  if (promptChars > MAX_REPORT_CONTEXT_CHARS) {
    return res.status(413).json({
      error: `La historia clínica seleccionada excede el límite seguro de contexto (${promptChars.toLocaleString("es")} caracteres). No se omitieron sesiones ni se realizó una llamada a IA. Elegí un período más breve.`,
      clinicalRecordsUsedCount: filteredRC.length,
      maxContextChars: MAX_REPORT_CONTEXT_CHARS,
    });
  }

  // ── Call OpenAI ───────────────────────────────────────────────────────────
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

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: buildSystemPrompt(discipline) },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const text = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text);

    const result = {
      resumen: parsed.resumen ?? "",
      conducta: parsed.conducta ?? "",
      areas: normalizeReportAreas(parsed.areas),
      sugerencias: parsed.sugerencias ?? "",
      periodKind: period.periodKind,
      periodFrom: period.periodFrom,
      periodTo: period.periodTo,
      clinicalRecordsUsedCount: period.clinicalRecordsUsedCount,
      clinicalRecordsTotalCount: period.clinicalRecordsTotalCount,
      clinicalRecordsExcludedCount: period.clinicalRecordsExcludedCount,
      clinicalRecordsUndatedCount: period.clinicalRecordsUndatedCount,
      // Keep exactly the records that informed this generation with its draft.
      // A later range change or clinical edit must not silently change the saved evidence.
      clinicalSnapshot: filteredRC.map(r => ({
        id: r.id, patientId: r.patientId, patientName: r.patientName,
        professionalId: r.professionalId, professionalName: r.professionalName,
        fecha: r.fecha, resumenSesion: r.resumenSesion, observaciones: r.observaciones,
        recomendacionesHogar: r.recomendacionesHogar,
        materialesActividades: (r.materialesActividades ?? []).map(m => ({ id: m.id, nombre: m.nombre })),
        createdAt: r.createdAt,
      })),
      _meta: { discipline, sessions: sortedRC.length, goals: allGoals.length },
    };
    recordUserActivityEvent(sess.id, "ai_used");
    return res.json(result);
  } catch (error: any) {
    console.error("[ai-informe] Error:", error?.message);
    return res.status(500).json({ error: "Error al generar el informe con IA. Intenta de nuevo." });
  }
});

export default router;
