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

// ─── Discipline detection ─────────────────────────────────────────────────────

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

// ─── Discipline-specific system prompts ──────────────────────────────────────

function buildSystemPrompt(discipline: Discipline): string {
  const base = `Eres un asistente clínico especializado en terapias del neurodesarrollo e intervención infanto-juvenil.
Tu tarea es redactar secciones de un informe clínico de evolución basándote EXCLUSIVAMENTE en los datos reales del paciente que se te proporcionan.
Reglas estrictas:
- Usa SOLO la información contenida en el contexto. NO inventes datos, fechas, porcentajes ni conductas.
- Si algún dato no está disponible, indícalo con "No registrado" o redacta con lo que sí existe.
- Lenguaje: español rioplatense, tercera persona, tono profesional clínico y empático.
- Si hay pocos datos, redacta de forma breve y honesta. No rellenes con texto genérico.
- Responde EXCLUSIVAMENTE con JSON válido, sin markdown, sin texto fuera del JSON.`;

  const disciplines: Record<Discipline, string> = {
    "fonoaudiología": `
Especialidad: FONOAUDIOLOGÍA.
Enfocate en: lenguaje expresivo y comprensivo, articulación y fonología, comunicación funcional, voz y deglución (si aplica).
Terminología a usar: "producción fonológica", "inteligibilidad del habla", "estructuración del lenguaje", "comprensión auditiva", "habilidades pragmáticas", "comunicación intencional", "sistemas de comunicación aumentativa", "patrón articulatorio", "discriminación auditiva", "narrativa oral".
Al describir evolución: mencionar cambios en la claridad del habla, ampliación del vocabulario, longitud de enunciados, uso comunicativo del lenguaje, avances en comprensión de consignas.`,

    "psicopedagogía": `
Especialidad: PSICOPEDAGOGÍA.
Enfocate en: procesos de aprendizaje, atención sostenida y selectiva, memoria operativa, funciones ejecutivas, lectoescritura, comprensión lectora, cálculo.
Terminología a usar: "estrategias cognitivas", "procesos de aprendizaje", "nivel de adquisición", "metacognición", "planificación y organización", "flexibilidad cognitiva", "inhibición de respuestas", "decodificación lectora", "conciencia fonológica", "procesamiento de la información".
Al describir evolución: mencionar cambios en el rendimiento en tareas, estrategias adquiridas, autonomía en la tarea, generalización de habilidades al contexto escolar.`,

    "terapia_ocupacional": `
Especialidad: TERAPIA OCUPACIONAL.
Enfocate en: autonomía personal, actividades de la vida diaria (AVD), motricidad fina y gruesa, integración sensorial, participación en contextos cotidianos.
Terminología a usar: "desempeño ocupacional", "participación", "adaptaciones", "integración sensorial", "umbral sensorial", "coordinación bimanual", "prensión", "modulación sensorial", "rol ocupacional", "AVD básicas e instrumentales", "habilidades de desempeño".
Al describir evolución: mencionar cambios en la independencia funcional, tolerancia sensorial, ejecución de rutinas, calidad de la coordinación motriz, adaptaciones implementadas.`,

    "general": `
Redacta el informe con terminología clínica general apropiada para terapias del neurodesarrollo.
Menciona las áreas de trabajo según los objetivos registrados.`,
  };

  return base + disciplines[discipline];
}

// ─── Range filter ─────────────────────────────────────────────────────────────

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

function trunc(s: string | null | undefined, max = 400): string {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

// ─── Main route ───────────────────────────────────────────────────────────────

router.post("/ai/informe-generate", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  const { patientId, rango = "mes" } = req.body as { patientId: number; rango?: string };
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
      : Promise.resolve([]),
    allGoals.length > 0
      ? db.select().from(goalProgressTable)
          .where(inArray(goalProgressTable.goalId, allGoals.map(g => g.id)))
      : Promise.resolve([]),
  ]);

  // ── Detect discipline ──────────────────────────────────────────────────────
  const specialties = professionals.map(p => p.specialty).join(" ");
  const goalAreas = allGoals.map(g => g.areaClinica ?? g.category ?? "");
  const discipline = detectDiscipline((specialties || patient.profesionalNombre) ?? "", goalAreas);

  // ── Filter sessions by selected range ─────────────────────────────────────
  const filteredRC = filterByRango(allRegistrosClinicos as any, rango) as typeof allRegistrosClinicos;

  // ── Group goal progress by goalId ─────────────────────────────────────────
  const progressByGoal = new Map<number, typeof allGoalProgress>();
  for (const p of allGoalProgress) {
    if (!progressByGoal.has(p.goalId)) progressByGoal.set(p.goalId, []);
    progressByGoal.get(p.goalId)!.push(p);
  }

  // ── Group legacy registros by objective name ───────────────────────────────
  const registrosByObj = new Map<string, typeof allRegistros>();
  for (const r of allRegistros) {
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
    patient.age ? `Edad: ${patient.age} años` : null,
    patient.fechaNacimiento ? `Fecha de nacimiento: ${patient.fechaNacimiento}` : null,
    patient.franjaEtaria ? `Franja etaria: ${patient.franjaEtaria}` : null,
    patient.diagnosis ? `Diagnóstico: ${patient.diagnosis}` : null,
    patient.fechaInicio ? `Inicio del tratamiento: ${patient.fechaInicio}` : null,
    patient.escolaridad ? `Escolaridad: ${trunc(patient.escolaridad, 200)}` : null,
    patient.motivoConsulta ? `Motivo de consulta: ${trunc(patient.motivoConsulta, 400)}` : null,
    patient.antecedentes ? `Antecedentes: ${trunc(patient.antecedentes, 400)}` : null,
    patient.historiaFamiliar ? `Historia familiar: ${trunc(patient.historiaFamiliar, 300)}` : null,
    patient.impresionClinica ? `Impresión clínica inicial: ${trunc(patient.impresionClinica, 400)}` : null,
    patient.observaciones ? `Observaciones generales: ${trunc(patient.observaciones, 300)}` : null,
    // Discipline-relevant clinical fields
    patient.lenguajeComunicacion ? `Lenguaje y comunicación (evaluación inicial): ${trunc(patient.lenguajeComunicacion, 300)}` : null,
    patient.atencionConducta ? `Atención y conducta (evaluación inicial): ${trunc(patient.atencionConducta, 300)}` : null,
    patient.vozHabla ? `Voz y habla (evaluación inicial): ${trunc(patient.vozHabla, 300)}` : null,
    patient.deglucion ? `Deglución (evaluación inicial): ${trunc(patient.deglucion, 200)}` : null,
  ].filter(Boolean).join("\n");

  // ── 2. Profesionales asignados ────────────────────────────────────────────
  const professionalContext = professionals.length > 0
    ? professionals.map(p => `${p.name} — ${p.specialty}`).join(", ")
    : patient.profesionalNombre ?? "No registrado";

  // ── 3. Objetivos terapéuticos con historial de progreso ──────────────────
  const goalsContext = allGoals.length === 0
    ? "Sin objetivos registrados."
    : allGoals.map(g => {
        const pct = g.progressPct ?? (g.status === "logrado" ? 100 : g.status === "en progreso" ? 55 : g.status === "activo" ? 20 : 0);
        const progEntries = (progressByGoal.get(g.id) ?? [])
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
          `[${g.status.toUpperCase()} — ${pct}%] ${g.title}`,
          `  área: ${g.areaClinica ?? g.category}${g.nivelDificultad ? ` | nivel: ${g.nivelDificultad}` : ""}${g.fechaAsignacion ? ` | asignado: ${g.fechaAsignacion}` : ""}`,
        ];
        if (g.description) lines.push(`  descripción: ${trunc(g.description, 200)}`);
        if (g.notas) lines.push(`  notas: ${trunc(g.notas, 200)}`);
        if (progressHistory) lines.push(`  historial de progreso:\n${progressHistory}`);
        return lines.join("\n");
      }).join("\n\n");

  // ── 4. Sesiones clínicas del período (registros_clinicos) ─────────────────
  const sortedRC = [...filteredRC].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );
  const sessionContext = sortedRC.length === 0
    ? "Sin sesiones en el período seleccionado."
    : sortedRC.map((r, i) => {
        const parts = [`[Sesión ${i + 1} — ${r.fecha}]`];
        if (r.professionalName) parts.push(`Profesional: ${r.professionalName}`);
        if (r.resumenSesion) parts.push(`Resumen: ${trunc(r.resumenSesion, 500)}`);
        if (r.observaciones) parts.push(`Observaciones: ${trunc(r.observaciones, 500)}`);
        if (r.recomendacionesHogar) parts.push(`Recomendaciones hogar: ${trunc(r.recomendacionesHogar, 300)}`);
        return parts.join("\n");
      }).join("\n\n");

  // ── 5. Registros de desempeño por objetivo (tabla registros) ──────────────
  const perfContext = allRegistros.length === 0
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
  const areaKeys = Object.keys(areaGroups);

  // ── Build the user prompt ─────────────────────────────────────────────────
  const areasJsonShape = areaKeys.length > 0
    ? `{\n${areaKeys.map(a =>
        `  "${a}": "Análisis clínico detallado del desempeño y evolución en el área de ${a}, basado en los objetivos y sesiones registrados. 80-150 palabras."`
      ).join(",\n")}\n}`
    : "{}";

  const userPrompt = `Genera el informe clínico de evolución para el siguiente paciente.
Disciplina detectada: ${discipline.toUpperCase()}.
Período analizado: ${filteredRC.length} sesiones de ${allRegistrosClinicos.length} totales.

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
SESIONES CLÍNICAS DEL PERÍODO (${sortedRC.length} sesiones)
═══════════════════════════════════════
${sessionContext}

${perfContext ? `═══════════════════════════════════════
DESEMPEÑO POR OBJETIVO (registros históricos)
═══════════════════════════════════════
${perfContext}` : ""}

ÁREAS ACTIVAS: ${areaKeys.join(", ") || "No identificadas"}

═══════════════════════════════════════
INSTRUCCIÓN
═══════════════════════════════════════
Devuelve un JSON con exactamente estas claves. Usa SOLO los datos anteriores:
{
  "resumen": "Motivo de intervención + evolución general del proceso basada en las sesiones registradas. Menciona cantidad de sesiones, áreas abordadas, objetivos logrados y en curso. Refleja el progreso real del historial. 180-280 palabras.",
  "conducta": "Patrones de comportamiento en sesión: nivel atencional, disposición, respuesta a consignas, necesidad de apoyo, autonomía. Basado exclusivamente en las observaciones registradas. 100-180 palabras.",
  "areas": ${areasJsonShape},
  "sugerencias": "Recomendaciones específicas y concretas para la familia, derivadas de los objetivos y áreas de trabajo reales del paciente. Usar viñetas con •. Lenguaje claro y accesible. 120-200 palabras."
}`;

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

    console.log(`[ai-informe] paciente=${patientId} disciplina=${discipline} sesiones=${sortedRC.length} objetivos=${allGoals.length} modelo=${model}`);

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

    return res.json({
      resumen: parsed.resumen ?? "",
      conducta: parsed.conducta ?? "",
      areas: parsed.areas ?? {},
      sugerencias: parsed.sugerencias ?? "",
      _meta: { discipline, sessions: sortedRC.length, goals: allGoals.length },
    });
  } catch (error: any) {
    console.error("[ai-informe] Error:", error?.message);
    return res.status(500).json({ error: "Error al generar el informe con IA. Intenta de nuevo." });
  }
});

export default router;
