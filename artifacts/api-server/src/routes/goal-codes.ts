import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { goalLibraryTable, goalsTable } from "@workspace/db/schema";
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

router.use("/goal-codes", (req, res, next) => {
  if (!req.session?.userId) return res.status(401).json({ error: "No autenticado" });
  if (req.session.userRole !== "professional") {
    return res.status(403).json({ error: "Acceso reservado a profesionales" });
  }
  return next();
});

// ─── Get all mapping tables for professional tools ────────────────────────────
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

  return res.json({
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

  return res.json({
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
router.post("/goal-codes/migrate", (_req, res) => {
  return res.status(403).json({ error: "La migración de códigos está deshabilitada" });
});

export default router;
