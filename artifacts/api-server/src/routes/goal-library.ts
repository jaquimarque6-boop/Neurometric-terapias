import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { goalLibraryTable, goalsTable, patientsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { generateUniqueCode } from "../utils/code-generator";
import { normalizarFranja, normalizarPorNumeros } from "../utils/franja";

const router: IRouter = Router();

// ─── List goal library with filters ──────────────────────────────────────────
router.get("/goal-library", async (req, res) => {
  const { area, subarea, franja, nivel, estado, q, franjaMin, franjaMax } = req.query as Record<string, string>;

  let items = await db.select().from(goalLibraryTable)
    .orderBy(goalLibraryTable.areaClinica, goalLibraryTable.nivelDificultad, goalLibraryTable.idObjetivo);

  if (area && area !== "all") {
    items = items.filter(i => i.areaClinica === area || i.area === area);
  }
  if (subarea && subarea !== "all") {
    items = items.filter(i => (i.subarea ?? "").toLowerCase() === subarea.toLowerCase());
  }
  if (franja && franja !== "all") {
    const franjaTarget = normalizarFranja(franja) ?? franja;
    items = items.filter(i => {
      const norm = normalizarPorNumeros(i.franjaEtariaMin, i.franjaEtariaMax)
                ?? normalizarFranja(i.franjaEtaria);
      return norm === franjaTarget;
    });
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
    franjaNormalizada: normalizarPorNumeros(i.franjaEtariaMin, i.franjaEtariaMax)
                    ?? normalizarFranja(i.franjaEtaria),
  })));
});

// ─── Create goal in library ───────────────────────────────────────────────────
router.post("/goal-library", async (req, res) => {
  const body = req.body;

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
    estadoBanco: "activo",
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
  res.json({ ...item, createdAt: item.createdAt.toISOString() });
});

// ─── Smart suggestions for a patient ─────────────────────────────────────────
router.get("/patients/:id/suggested-goals", async (req, res) => {
  const patientId = parseInt(req.params.id);
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId));
  if (!patient) return res.status(404).json({ error: "Patient not found" });

  const existingGoals = await db.select().from(goalsTable).where(eq(goalsTable.patientId, patientId));
  const assignedLibraryIds = new Set(existingGoals.map(g => g.goalLibraryId).filter(Boolean));

  const allLibraryGoals = await db.select().from(goalLibraryTable)
    .where(eq(goalLibraryTable.estadoBanco, "activo"));

  const patientAge = patient.age ? parseInt(String(patient.age)) : null;
  const franjaRaw = patient.franjaEtaria ?? "";
  const [franjaMin, franjaMax] = franjaRaw.split("-").map(Number);

  const diagnosis = (patient.diagnosis ?? "").toLowerCase();

  const scored = allLibraryGoals
    .filter(g => !assignedLibraryIds.has(g.id))
    .map(g => {
      let score = 0;

      // Age match — prefer min/max integers if available, fall back to parsed text
      const gMin = g.franjaEtariaMin ?? (g.franjaEtaria ? parseInt(g.franjaEtaria.split("-")[0]) : null);
      const gMax = g.franjaEtariaMax ?? (g.franjaEtaria ? parseInt(g.franjaEtaria.split("-")[1]) : null);

      if (gMin !== null && gMax !== null && !isNaN(gMin) && !isNaN(gMax)) {
        if (patientAge !== null && patientAge >= gMin && patientAge <= gMax) {
          score += 4;
        } else if (!isNaN(franjaMin) && !isNaN(franjaMax)) {
          const overlapMin = Math.max(franjaMin, gMin);
          const overlapMax = Math.min(franjaMax, gMax);
          if (overlapMax >= overlapMin) score += 3;
        }
      }

      // Diagnosis keyword match per area
      const diagKeywords: Record<string, string[]> = {
        "lenguaje":             ["TEL", "retraso del lenguaje", "disfasia", "lenguaje", "léxico", "narrativo", "expresivo", "comprensivo"],
        "habla":                ["trastorno fonológico", "dislalia", "tartamudez", "fluidez", "articulación", "habla"],
        "pragmática":           ["TEA", "autismo", "pragmática", "social", "conducta"],
        "lectoescritura":       ["dislexia", "lectura", "escritura", "lectoescritura", "disgrafía"],
        "cognición":            ["TDAH", "atención", "memoria", "ejecutivas", "cognitivo"],
        "motricidad orofacial": ["deglución", "orofacial", "praxis", "tono", "respiración"],
        "estimulación temprana":["retraso madurativo", "retraso del desarrollo", "estimulación", "temprana", "bebé"],
      };

      for (const [area, keywords] of Object.entries(diagKeywords)) {
        if ((g.areaClinica ?? "").toLowerCase() === area) {
          for (const kw of keywords) {
            if (diagnosis.includes(kw.toLowerCase())) { score += 3; break; }
          }
        }
      }

      // Prefer básico for young patients
      if (patientAge !== null && patientAge <= 4 && g.nivelDificultad === "básico") score += 1;

      return { ...g, _score: score };
    })
    .filter(g => g._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 8)
    .map(({ _score, ...g }) => ({ ...g, createdAt: g.createdAt.toISOString() }));

  res.json(scored);
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

  res.status(201).json({
    ...goal,
    patientName: patient?.name ?? "",
    createdAt: goal.createdAt.toISOString(),
  });
});

export default router;
