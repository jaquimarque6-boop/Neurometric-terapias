import { Router, type IRouter } from "express";
import ExcelJS from "exceljs";
import { db } from "@workspace/db";
import {
  patientsTable,
  registrosClinicosTable,
  goalsTable,
} from "@workspace/db/schema";
import { and, eq, inArray, isNull } from "drizzle-orm";

const router: IRouter = Router();

function getSessionUser(req: any): {
  id: number;
  role: string;
  userName: string;
} | null {
  if (!req.session?.userId) return null;
  return {
    id: req.session.userId,
    role: req.session.userRole ?? "professional",
    userName: req.session.userName ?? "",
  };
}

/**
 * Defensive date formatter. The export historically crashed in production with
 * `createdAt.toISOString()` when a row's timestamp came back null/undefined or
 * as a plain string (migrated/legacy data). This never throws.
 */
function fmtDate(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  if (v instanceof Date) {
    return isNaN(v.getTime()) ? "" : v.toISOString().slice(0, 10);
  }
  const d = new Date(v as any);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  // Fall back to the raw string (e.g. already "2026-01-31").
  return String(v);
}

function cell(v: unknown): string | number {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return v;
  return String(v);
}

type SheetSpec = {
  name: string;
  columns: { header: string; key: string; width?: number }[];
  rows: Record<string, unknown>[];
};

function addSheet(wb: ExcelJS.Workbook, spec: SheetSpec) {
  const ws = wb.addWorksheet(spec.name, {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  ws.columns = spec.columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width ?? 22,
  }));
  // Header styling
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF81B29A" },
  };
  headerRow.alignment = { vertical: "middle" };
  for (const r of spec.rows) {
    const normalized: Record<string, string | number> = {};
    for (const c of spec.columns) normalized[c.key] = cell(r[c.key]);
    ws.addRow(normalized);
  }
}

/**
 * GET /api/export/my-data
 *
 * Read-only export of the LOGGED-IN user's own clinical information as a real
 * .xlsx workbook with one sheet per entity:
 *   - Pacientes (incluye anamnesis, diagnóstico, informes y observaciones)
 *   - Registros clínicos / Sesiones (resumen, observaciones, recomendaciones)
 *   - Objetivos terapéuticos (plan terapéutico)
 *
 * Security:
 *  - The professional id is taken ONLY from the server-side session. Any value
 *    in the request body / query is ignored.
 *  - Patients are filtered by assignedProfessionalId === session.userId.
 *  - Sessions are filtered by userId === session.userId PLUS legacy sessions
 *    (userId IS NULL) belonging to the user's own patients. Sessions authored
 *    by another professional are excluded.
 *  - Goals are scoped to the user's own patients.
 *  - No writes, no deletes. Pure read.
 *  - Returns 204 No Content when there is nothing to export.
 */
router.get("/export/my-data", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  try {
    // ── Patients owned by this user ────────────────────────────────────────
    const patients = await db
      .select()
      .from(patientsTable)
      .where(eq(patientsTable.assignedProfessionalId, sess.id))
      .orderBy(patientsTable.name);

    const patientIds = patients.map((p) => p.id);
    const patientNameById = new Map(patients.map((p) => [p.id, p.name]));

    // ── Sessions / registros clínicos ──────────────────────────────────────
    const myRegistros = await db
      .select()
      .from(registrosClinicosTable)
      .where(eq(registrosClinicosTable.userId, sess.id));

    let legacyRegistros: (typeof registrosClinicosTable.$inferSelect)[] = [];
    if (patientIds.length > 0) {
      legacyRegistros = await db
        .select()
        .from(registrosClinicosTable)
        .where(
          and(
            inArray(registrosClinicosTable.patientId, patientIds),
            isNull(registrosClinicosTable.userId),
          ),
        );
    }

    const seen = new Set<number>();
    const registros: (typeof registrosClinicosTable.$inferSelect)[] = [];
    for (const r of [...myRegistros, ...legacyRegistros]) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      registros.push(r);
    }
    registros.sort((a, b) =>
      a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.id - b.id,
    );

    // ── Objetivos terapéuticos (scoped to the user's own patients) ─────────
    let goals: (typeof goalsTable.$inferSelect)[] = [];
    if (patientIds.length > 0) {
      goals = await db
        .select()
        .from(goalsTable)
        .where(inArray(goalsTable.patientId, patientIds));
      goals.sort((a, b) =>
        a.patientId - b.patientId || a.id - b.id,
      );
    }

    if (patients.length === 0 && registros.length === 0 && goals.length === 0) {
      console.log(
        `[GET /api/export/my-data] userId=${sess.id} role=${sess.role} → sin datos`,
      );
      return res.status(204).end();
    }

    const today = new Date().toISOString().slice(0, 10);

    // ── Build workbook ─────────────────────────────────────────────────────
    const wb = new ExcelJS.Workbook();
    wb.creator = "Neurometric Lab";
    wb.created = new Date();

    addSheet(wb, {
      name: "Pacientes",
      columns: [
        { header: "ID", key: "id", width: 8 },
        { header: "Nombre", key: "name", width: 26 },
        { header: "Edad", key: "age", width: 8 },
        { header: "Fecha nacimiento", key: "fechaNacimiento", width: 16 },
        { header: "Diagnóstico", key: "diagnosis", width: 26 },
        { header: "Fecha inicio", key: "fechaInicio", width: 14 },
        { header: "Escolaridad", key: "escolaridad", width: 20 },
        { header: "Motivo de consulta", key: "motivoConsulta", width: 36 },
        { header: "Antecedentes", key: "antecedentes", width: 36 },
        { header: "Historia familiar", key: "historiaFamiliar", width: 36 },
        { header: "Lenguaje / comunicación", key: "lenguajeComunicacion", width: 30 },
        { header: "Atención / conducta", key: "atencionConducta", width: 30 },
        { header: "Voz / habla", key: "vozHabla", width: 24 },
        { header: "Deglución", key: "deglucion", width: 20 },
        { header: "Impresión clínica", key: "impresionClinica", width: 36 },
        { header: "Informe de evolución", key: "informeEvolucion", width: 36 },
        { header: "Informe a la familia", key: "informeFamilia", width: 36 },
        { header: "Informe mensual", key: "informeMensual", width: 36 },
        { header: "Observaciones", key: "observaciones", width: 36 },
        { header: "Creado", key: "creado", width: 14 },
      ],
      rows: patients.map((p) => ({
        id: p.id,
        name: p.name,
        age: p.age,
        fechaNacimiento: p.fechaNacimiento,
        diagnosis: p.diagnosis,
        fechaInicio: p.fechaInicio,
        escolaridad: p.escolaridad,
        motivoConsulta: p.motivoConsulta,
        antecedentes: p.antecedentes,
        historiaFamiliar: p.historiaFamiliar,
        lenguajeComunicacion: p.lenguajeComunicacion,
        atencionConducta: p.atencionConducta,
        vozHabla: p.vozHabla,
        deglucion: p.deglucion,
        impresionClinica: p.impresionClinica,
        informeEvolucion: p.informeEvolucion,
        informeFamilia: p.informeFamilia,
        informeMensual: p.informeMensual,
        observaciones: p.observaciones,
        creado: fmtDate(p.createdAt),
      })),
    });

    addSheet(wb, {
      name: "Registros clínicos",
      columns: [
        { header: "ID", key: "id", width: 8 },
        { header: "Fecha", key: "fecha", width: 14 },
        { header: "Paciente ID", key: "patientId", width: 12 },
        { header: "Paciente", key: "paciente", width: 26 },
        { header: "Profesional", key: "profesional", width: 24 },
        { header: "Resumen de sesión", key: "resumenSesion", width: 44 },
        { header: "Observaciones", key: "observaciones", width: 44 },
        { header: "Recomendaciones para el hogar", key: "recomendacionesHogar", width: 44 },
        { header: "Creado", key: "creado", width: 14 },
      ],
      rows: registros.map((r) => ({
        id: r.id,
        fecha: r.fecha,
        patientId: r.patientId,
        paciente: patientNameById.get(r.patientId) ?? r.patientName ?? "",
        profesional: r.professionalName ?? sess.userName,
        resumenSesion: r.resumenSesion,
        observaciones: r.observaciones,
        recomendacionesHogar: r.recomendacionesHogar,
        creado: fmtDate(r.createdAt),
      })),
    });

    addSheet(wb, {
      name: "Objetivos terapéuticos",
      columns: [
        { header: "ID", key: "id", width: 8 },
        { header: "Paciente ID", key: "patientId", width: 12 },
        { header: "Paciente", key: "paciente", width: 26 },
        { header: "Código", key: "codigo", width: 16 },
        { header: "Objetivo", key: "title", width: 40 },
        { header: "Descripción", key: "description", width: 44 },
        { header: "Categoría", key: "category", width: 20 },
        { header: "Área clínica", key: "areaClinica", width: 22 },
        { header: "Nivel de dificultad", key: "nivelDificultad", width: 18 },
        { header: "Estado", key: "status", width: 16 },
        { header: "Progreso (%)", key: "progressPct", width: 12 },
        { header: "Fecha asignación", key: "fechaAsignacion", width: 16 },
        { header: "Fecha objetivo", key: "targetDate", width: 16 },
        { header: "Notas", key: "notas", width: 44 },
        { header: "Creado", key: "creado", width: 14 },
      ],
      rows: goals.map((g) => ({
        id: g.id,
        patientId: g.patientId,
        paciente: patientNameById.get(g.patientId) ?? "",
        codigo: g.codigo,
        title: g.title,
        description: g.description,
        category: g.category,
        areaClinica: g.areaClinica,
        nivelDificultad: g.nivelDificultad,
        status: g.status,
        progressPct: g.progressPct,
        fechaAsignacion: g.fechaAsignacion,
        targetDate: g.targetDate,
        notas: g.notas,
        creado: fmtDate(g.createdAt),
      })),
    });

    const buffer = await wb.xlsx.writeBuffer();

    console.log(
      `[GET /api/export/my-data] userId=${sess.id} role=${sess.role} → ${patients.length} pacientes, ${registros.length} registros, ${goals.length} objetivos`,
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="neurometric-respaldo-mis-datos-${today}.xlsx"`,
    );
    res.setHeader("Cache-Control", "no-store");
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("[GET /api/export/my-data] error generando respaldo:", err);
    return res
      .status(500)
      .json({ error: "No fue posible generar el respaldo." });
  }
});

export default router;
