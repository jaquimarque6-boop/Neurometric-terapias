import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { goalLibraryTable, goalsTable, patientsTable } from "@workspace/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { generateUniqueCode } from "../utils/code-generator";


const router: IRouter = Router();

// ─── List goal library with filters ──────────────────────────────────────────
router.get("/goal-library", async (req, res) => {
  const { area, subarea, franja, nivel, estado, q, franjaMin, franjaMax } = req.query as Record<string, string>;
  const session = (req as any).session;
  const userId: number | undefined = session?.userId;
  const isAdmin = session?.userRole === "admin";

  let items = await db.select().from(goalLibraryTable)
    .orderBy(
      sql`${goalLibraryTable.franjaEtariaMin} ASC NULLS LAST`,
      asc(goalLibraryTable.areaClinica),
      asc(goalLibraryTable.nivelDificultad),
      asc(goalLibraryTable.idObjetivo),
    );

  // Only show custom goals belonging to the current user (or all for admin)
  items = items.filter(i => {
    if (!i.isCustom) return true;
    if (isAdmin) return true;
    return i.createdBy === userId;
  });

  if (area && area !== "all") {
    items = items.filter(i => i.areaClinica === area || i.area === area);
  }
  if (subarea && subarea !== "all") {
    items = items.filter(i => (i.subarea ?? "").toLowerCase() === subarea.toLowerCase());
  }
  if (franja && franja !== "all") {
    items = items.filter(i => i.franjaEtaria === franja);
  }
  if (franjaMin) {
    const min = parseInt(franjaMin);
    items = items.filter(i =>
      (i.franjaEtariaMax ?? i.franjaEtariaMin ?? 99) >= min
    );
  }
  if (franjaMax) {
    const max = parseInt(franjaMax);
    items = items.filter(i =>
      (i.franjaEtariaMin ?? 0) <= max
    );
  }
  if (nivel && nivel !== "all") {
    items = items.filter(i => i.nivelDificultad === nivel);
  }
  if (estado && estado !== "all") {
    items = items.filter(i => i.estadoBanco === estado);
  }
  if (q) {
    const lower = q.toLowerCase();
    items = items.filter(i =>
      (i.nombreObjetivo ?? "").toLowerCase().includes(lower) ||
      (i.idObjetivo ?? "").toLowerCase().includes(lower) ||
      (i.area ?? "").toLowerCase().includes(lower) ||
      (i.areaClinica ?? "").toLowerCase().includes(lower) ||
      (i.subarea ?? "").toLowerCase().includes(lower) ||
      (i.definicionOperativa ?? "").toLowerCase().includes(lower) ||
      (i.habilidadesRelacionadas ?? "").toLowerCase().includes(lower)
    );
  }

  res.json(items.map(i => ({
    ...i,
    createdAt: i.createdAt.toISOString(),
  })));
});

// ─── Create goal in library ───────────────────────────────────────────────────
router.post("/goal-library", async (req, res) => {
  const body = req.body;
  const session = (req as any).session;
  const userId: number | undefined = session?.userId;

  let idObjetivo = body.idObjetivo || undefined;
  if (!idObjetivo) {
    const existing = await db.select({ codigo: goalLibraryTable.idObjetivo }).from(goalLibraryTable);
    const existingCodes = existing.map(g => g.codigo).filter(Boolean) as string[];
    const result = generateUniqueCode({
      areaClinica: body.areaClinica ?? body.area ?? "lenguaje",
      franjaEtariaMin: body.franjaEtariaMin != null ? parseInt(String(body.franjaEtariaMin)) : null,
      franjaEtariaMax: body.franjaEtariaMax != null ? parseInt(String(body.franjaEtariaMax)) : null,
      subarea: body.subarea ?? null,
      nivelDificultad: body.nivelDificultad ?? "básico",
    }, existingCodes);
    idObjetivo = result.code;
  }

  const resolvedArea = body.area ?? body.areaClinica ?? "lenguaje";
  const [item] = await db.insert(goalLibraryTable).values({
    idObjetivo,
    nombreObjetivo: body.nombreObjetivo,
    modulo: body.modulo ?? "Neurolengua",
    area: resolvedArea,
    areaClinica: body.areaClinica ?? resolvedArea,
    subarea: body.subarea ?? null,
    franjaEtaria: body.franjaEtaria ?? null,
    franjaEtariaMin: body.franjaEtariaMin ?? null,
    franjaEtariaMax: body.franjaEtariaMax ?? null,
    nivelDificultad: body.nivelDificultad ?? "básico",
    estadoBanco: body.estadoBanco ?? "activo",
    isCustom: body.isCustom === true,
    createdBy: body.isCustom === true ? (userId ?? null) : null,
    definicionOperativa: body.definicionOperativa ?? null,
    actividadesClinicas: body.actividadesClinicas ?? null,
    actividadesFamilia: body.actividadesFamilia ?? null,
    habilidadesRelacionadas: body.habilidadesRelacionadas ?? null,
    prerequisitos: body.prerequisitos ?? null,
    metaPorcentaje: body.metaPorcentaje ?? null,
    intentosSugeridos: body.intentosSugeridos ?? null,
    recomendacionClinica: body.recomendacionClinica ?? null,
    indicadorTipo: body.indicadorTipo ?? null,
    marcoConceptual: body.marcoConceptual ?? null,
    nivel1Descripcion: body.nivel1Descripcion ?? null,
    nivel2Descripcion: body.nivel2Descripcion ?? null,
    nivel3Descripcion: body.nivel3Descripcion ?? null,
  }).returning();
  res.status(201).json({ ...item, createdAt: item.createdAt.toISOString() });
});

// ─── Update goal in library ───────────────────────────────────────────────────
router.patch("/goal-library/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = req.body;
  const updates: Record<string, any> = {};
  if (body.estadoBanco !== undefined) updates.estadoBanco = body.estadoBanco;
  if (body.nivelDificultad !== undefined) updates.nivelDificultad = body.nivelDificultad;
  if (body.nombreObjetivo !== undefined) updates.nombreObjetivo = body.nombreObjetivo;
  if (body.definicionOperativa !== undefined) updates.definicionOperativa = body.definicionOperativa;
  if (body.habilidadesRelacionadas !== undefined) updates.habilidadesRelacionadas = body.habilidadesRelacionadas;
  if (body.prerequisitos !== undefined) updates.prerequisitos = body.prerequisitos;
  if (body.actividadesClinicas !== undefined) updates.actividadesClinicas = body.actividadesClinicas;
  if (body.actividadesFamilia !== undefined) updates.actividadesFamilia = body.actividadesFamilia;
  if (body.metaPorcentaje !== undefined) updates.metaPorcentaje = body.metaPorcentaje;
  if (body.intentosSugeridos !== undefined) updates.intentosSugeridos = body.intentosSugeridos;
  if (body.indicadorTipo !== undefined) updates.indicadorTipo = body.indicadorTipo;
  if (body.recomendacionClinica !== undefined) updates.recomendacionClinica = body.recomendacionClinica;
  if (body.marcoConceptual !== undefined) updates.marcoConceptual = body.marcoConceptual;
  if (body.nivel1Descripcion !== undefined) updates.nivel1Descripcion = body.nivel1Descripcion;
  if (body.nivel2Descripcion !== undefined) updates.nivel2Descripcion = body.nivel2Descripcion;
  if (body.nivel3Descripcion !== undefined) updates.nivel3Descripcion = body.nivel3Descripcion;
  const [item] = await db.update(goalLibraryTable).set(updates).where(eq(goalLibraryTable.id, id)).returning();
  if (!item) return res.status(404).json({ error: "Goal not found" });
  return res.json({ ...item, createdAt: item.createdAt.toISOString() });
});

// ─── Diagnosis → area keywords ────────────────────────────────────────────────
const DIAG_KEYWORDS: Record<string, string[]> = {
  "lenguaje":              ["TEL", "TDL", "retraso del lenguaje", "retraso madurativo", "disfasia", "lenguaje", "léxico", "narrativo", "expresivo", "comprensivo"],
  "habla":                 ["trastorno fonológico", "dislalia", "tsh", "trastornos de los sonidos", "apraxia", "disartria", "tartamudez", "fluidez", "articulación", "habla", "TEL", "TDL"],
  "pragmática":            ["TEA", "TDL", "autismo", "pragmática", "social", "conducta"],
  "cognición":             ["TDAH", "TEA", "atención", "memoria", "ejecutivas", "funciones ejecutivas", "dificultades atencionales", "cognitivo", "discalculia"],
  "lectoescritura":        ["dislexia", "lectura", "escritura", "lectoescritura", "disgrafía", "discalculia", "comprensión lectora", "dificultades de aprendizaje"],
  "motricidad oral":       ["deglución", "orofacial", "praxis", "tono", "respiración", "dislalia", "tsh", "trastornos de los sonidos", "apraxia", "disartria", "deglución atípica"],
  "motricidad orofacial":  ["deglución", "orofacial", "praxis", "tono", "respiración", "dislalia", "tsh", "trastornos de los sonidos", "apraxia", "disartria", "deglución atípica"],
  "estimulación temprana": ["retraso madurativo", "retraso del desarrollo", "estimulación", "temprana", "bebé", "TEL", "TDL"],
  "voz":                   ["voz", "disfonía", "nódulos", "fonación"],
};

// ─── Age group definitions ─────────────────────────────────────────────────────
const AGE_GROUPS = [
  { min: 0,  max: 2,  label: "0–2"   },
  { min: 3,  max: 5,  label: "3–5"   },
  { min: 6,  max: 8,  label: "6–8"   },
  { min: 9,  max: 12, label: "9–12"  },
  { min: 13, max: 16, label: "13–16" },
  { min: 17, max: 99, label: "17+"   },
] as const;

function getPatientGroupIdx(age: number): number {
  for (let i = 0; i < AGE_GROUPS.length; i++) {
    if (age >= AGE_GROUPS[i].min && age <= AGE_GROUPS[i].max) return i;
  }
  return AGE_GROUPS.length - 1;
}

function getGoalGroupIdx(gMin: number | null, gMax: number | null): number {
  if (gMin === null || gMax === null) return -1;
  const mid = (gMin + gMax) / 2;
  for (let i = 0; i < AGE_GROUPS.length; i++) {
    if (mid >= AGE_GROUPS[i].min && mid <= AGE_GROUPS[i].max) return i;
  }
  return -1;
}

function computeAgeTier(
  goalGroupIdx: number,
  patientGroupIdx: number,
): "adecuado" | "inferior" | "superior" | null {
  if (goalGroupIdx === -1) return null;       // goal has no franja — handled separately
  if (patientGroupIdx === -1) return null;   // patient has no age — no tier
  const diff = goalGroupIdx - patientGroupIdx;
  if (diff === 0)  return "adecuado";
  if (diff === -1) return "inferior";
  if (diff === 1)  return "superior";
  return null; // too far away
}

// ─── Smart suggestions for a patient ─────────────────────────────────────────
router.get("/patients/:id/suggested-goals", async (req, res) => {
  const patientId = parseInt(req.params.id);
  const { diagnosis: diagnosisOverride, limit: limitParam } = req.query as Record<string, string>;

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId));
  if (!patient) return res.status(404).json({ error: "Patient not found" });

  const existingGoals = await db.select().from(goalsTable).where(eq(goalsTable.patientId, patientId));
  const assignedLibraryIds = new Set(existingGoals.map(g => g.goalLibraryId).filter(Boolean));

  const allLibraryGoals = await db.select().from(goalLibraryTable)
    .where(eq(goalLibraryTable.estadoBanco, "activo"));

  const patientAge = patient.age ? parseInt(String(patient.age)) : null;
  const patientGroupIdx = patientAge !== null ? getPatientGroupIdx(patientAge) : -1;

  // Allow caller to override the stored diagnosis
  const diagnosis = (diagnosisOverride ?? patient.diagnosis ?? "").toLowerCase();
  const limitPerTier = limitParam ? Math.ceil(parseInt(limitParam) / 3) : 8;

  // Tag each goal with age tier + diagnosis score
  const tagged = allLibraryGoals
    .filter(g => !assignedLibraryIds.has(g.id))
    .map(g => {
      const gMin = g.franjaEtariaMin ?? (g.franjaEtaria ? parseInt(g.franjaEtaria.split("-")[0]) : null);
      const gMax = g.franjaEtariaMax ?? (g.franjaEtaria ? parseInt(g.franjaEtaria.split("-")[1]) : null);
      const goalGroupIdx = getGoalGroupIdx(gMin, gMax);
      const hasNoFranja = gMin === null && gMax === null;

      // Age tier: goals with no franja are age-neutral → "adecuado" if diagnosis matches
      const ageTier = hasNoFranja
        ? "adecuado" as const
        : computeAgeTier(goalGroupIdx, patientGroupIdx);

      // Diagnosis relevance score
      let diagScore = 0;
      if (diagnosis) {
        const area = (g.areaClinica ?? g.area ?? "").toLowerCase();
        const keywords = DIAG_KEYWORDS[area] ?? [];
        for (const kw of keywords) {
          if (diagnosis.includes(kw.toLowerCase())) { diagScore = 1; break; }
        }
      }

      return { ...g, ageTier, diagScore, _hasNoFranja: hasNoFranja };
    })
    .filter(g => {
      // Must match diagnosis if one is provided (skip if no diagnosis: show age-tier only)
      if (diagnosis && g.diagScore === 0) return false;
      // Must have a valid age tier
      return g.ageTier !== null;
    });

  // Sort within each tier: diagnosis match first, then by nivelDificultad order
  const NIVEL_ORDER: Record<string, number> = { "básico": 0, "intermedio": 1, "avanzado": 2 };
  const sorted = tagged.sort((a, b) => {
    // Tier order: adecuado → inferior → superior
    const TIER_ORDER: Record<string, number> = { "adecuado": 0, "inferior": 1, "superior": 2 };
    const tierDiff = (TIER_ORDER[a.ageTier!] ?? 3) - (TIER_ORDER[b.ageTier!] ?? 3);
    if (tierDiff !== 0) return tierDiff;
    // Within tier: higher diagnosis score first
    if (b.diagScore !== a.diagScore) return b.diagScore - a.diagScore;
    // Then by difficulty level
    return (NIVEL_ORDER[a.nivelDificultad] ?? 1) - (NIVEL_ORDER[b.nivelDificultad] ?? 1);
  });

  // Cap per tier
  const tierCounts: Record<string, number> = {};
  const result = sorted
    .filter(g => {
      const tier = g.ageTier!;
      tierCounts[tier] = (tierCounts[tier] ?? 0) + 1;
      return tierCounts[tier] <= limitPerTier;
    })
    .map(({ diagScore, _hasNoFranja, ...g }) => ({
      ...g,
      createdAt: g.createdAt.toISOString(),
    }));

  return res.json(result);
});

// ─── Assign goal to patient ───────────────────────────────────────────────────
router.post("/goal-library/:id/assign", async (req, res) => {
  const libraryId = parseInt(req.params.id);
  const body = req.body;

  const [libraryGoal] = await db.select().from(goalLibraryTable).where(eq(goalLibraryTable.id, libraryId));
  if (!libraryGoal) return res.status(404).json({ error: "Library goal not found" });

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, body.patientId));

  const today = new Date().toISOString().split("T")[0];

  const [goal] = await db.insert(goalsTable).values({
    patientId: body.patientId,
    goalLibraryId: libraryId,
    codigo: libraryGoal.idObjetivo,
    title: libraryGoal.nombreObjetivo,
    description: libraryGoal.definicionOperativa ?? "",
    category: libraryGoal.areaClinica ?? libraryGoal.area,
    areaClinica: libraryGoal.areaClinica ?? libraryGoal.area,
    franjaEtaria: libraryGoal.franjaEtaria ?? null,
    nivelDificultad: libraryGoal.nivelDificultad ?? "básico",
    status: "activo",
    fechaAsignacion: today,
    targetDate: body.targetDate ?? null,
  }).returning();

  return res.status(201).json({
    ...goal,
    patientName: patient?.name ?? "",
    createdAt: goal.createdAt.toISOString(),
  });
});

export default router;
