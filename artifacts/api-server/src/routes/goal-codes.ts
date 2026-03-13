import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { goalLibraryTable, goalsTable } from "@workspace/db/schema";
import { isNull, or, eq } from "drizzle-orm";
import {
  buildCodePrefix,
  buildFullCode,
  generateUniqueCode,
  isValidCodeFormat,
  getAllAreaOptions,
  getAllSubareaOptions,
  AREA_PREFIXES,
  SUBAREA_CODES,
  DIFFICULTY_CODES,
} from "../utils/code-generator";

const router: IRouter = Router();

// ─── Get all mapping tables (for admin UI) ────────────────────────────────────
router.get("/goal-codes/mappings", (_req, res) => {
  res.json({
    areaPrefixes:  getAllAreaOptions(),
    subareaCodes:  getAllSubareaOptions(),
    difficultyCodes: Object.entries(DIFFICULTY_CODES).map(([label, code]) => ({ label, code })),
  });
});

// ─── Generate a suggested code ────────────────────────────────────────────────
router.post("/goal-codes/generate", async (req, res) => {
  const { areaClinica, franjaEtariaMin, franjaEtariaMax, subarea, nivelDificultad, scope = "library" } = req.body;
  if (!areaClinica) return res.status(400).json({ error: "areaClinica is required" });

  const params = {
    areaClinica,
    franjaEtariaMin: franjaEtariaMin != null ? parseInt(String(franjaEtariaMin)) : null,
    franjaEtariaMax: franjaEtariaMax != null ? parseInt(String(franjaEtariaMax)) : null,
    subarea: subarea ?? null,
    nivelDificultad: nivelDificultad ?? "básico",
  };

  // Collect all existing codes from both tables
  const [libraryGoals, patientGoals] = await Promise.all([
    db.select({ codigo: goalLibraryTable.idObjetivo }).from(goalLibraryTable),
    db.select({ codigo: goalsTable.codigo }).from(goalsTable),
  ]);

  const existingCodes: string[] = [
    ...libraryGoals.map(g => g.codigo).filter(Boolean) as string[],
    ...patientGoals.map(g => g.codigo).filter(Boolean) as string[],
  ];

  const result = generateUniqueCode(params, existingCodes);

  res.json({
    ...result,
    params,
    existingWithSamePrefix: existingCodes.filter(c => c.startsWith(result.prefix + "-")).length,
  });
});

// ─── Check code uniqueness and format ─────────────────────────────────────────
router.get("/goal-codes/check", async (req, res) => {
  const { code, excludeId, scope = "library" } = req.query as Record<string, string>;
  if (!code) return res.status(400).json({ error: "code is required" });

  const isValid = isValidCodeFormat(code);

  // Check library goals
  const libraryMatches = await db.select({ id: goalLibraryTable.id, idObjetivo: goalLibraryTable.idObjetivo })
    .from(goalLibraryTable);

  const patientGoalMatches = await db.select({ id: goalsTable.id, codigo: goalsTable.codigo })
    .from(goalsTable);

  const libraryConflicts = libraryMatches.filter(g =>
    g.idObjetivo === code && (!excludeId || String(g.id) !== excludeId)
  );
  const patientConflicts = patientGoalMatches.filter(g =>
    g.codigo === code && (!excludeId || String(g.id) !== excludeId)
  );

  const isUnique = libraryConflicts.length === 0 && patientConflicts.length === 0;

  res.json({
    code,
    isValid,
    isUnique,
    conflicts: {
      library: libraryConflicts.length,
      patients: patientConflicts.length,
    },
  });
});

// ─── Migrate goals without codes ──────────────────────────────────────────────
router.post("/goal-codes/migrate", async (req, res) => {
  // Collect all existing codes first
  const [libraryGoals, patientGoals] = await Promise.all([
    db.select().from(goalLibraryTable),
    db.select().from(goalsTable),
  ]);

  const existingCodes: string[] = [
    ...libraryGoals.map(g => g.idObjetivo).filter(Boolean) as string[],
    ...patientGoals.map(g => g.codigo).filter(Boolean) as string[],
  ];

  const usedCodes = new Set(existingCodes);
  const results: { id: number; type: string; oldCode: string | null; newCode: string }[] = [];

  // Migrate library goals with missing/null idObjetivo
  for (const goal of libraryGoals) {
    if (!goal.idObjetivo || goal.idObjetivo.trim() === "") {
      const { code, prefix } = generateUniqueCode({
        areaClinica: goal.areaClinica ?? goal.area ?? "lenguaje",
        franjaEtariaMin: goal.franjaEtariaMin ?? null,
        franjaEtariaMax: goal.franjaEtariaMax ?? null,
        subarea: goal.subarea ?? null,
        nivelDificultad: goal.nivelDificultad ?? "básico",
      }, Array.from(usedCodes));

      await db.update(goalLibraryTable).set({ idObjetivo: code }).where(eq(goalLibraryTable.id, goal.id));
      usedCodes.add(code);
      results.push({ id: goal.id, type: "library", oldCode: goal.idObjetivo, newCode: code });
    }
  }

  // Migrate patient goals with missing codigo
  for (const goal of patientGoals) {
    if (!goal.codigo || goal.codigo.trim() === "") {
      const { code } = generateUniqueCode({
        areaClinica: goal.areaClinica ?? goal.category ?? "lenguaje",
        franjaEtariaMin: null,
        franjaEtariaMax: null,
        subarea: null,
        nivelDificultad: goal.nivelDificultad ?? "básico",
      }, Array.from(usedCodes));

      await db.update(goalsTable).set({ codigo: code }).where(eq(goalsTable.id, goal.id));
      usedCodes.add(code);
      results.push({ id: goal.id, type: "patient-goal", oldCode: goal.codigo, newCode: code });
    }
  }

  res.json({
    migrated: results.length,
    results,
  });
});

export default router;
