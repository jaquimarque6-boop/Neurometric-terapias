import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { patientsTable, registrosClinicosTable } from "@workspace/db/schema";
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

function esc(v: unknown): string {
  if (v === null || v === undefined) return "";
  // Preserve newlines inside fields by wrapping in quotes; only escape quotes.
  // Normalize bare CR/LF to CRLF so spreadsheet apps render multi-line cells.
  const raw = String(v).replace(/\r\n?/g, "\n");
  const needsQuote = /[",\n]/.test(raw);
  const escaped = raw.replace(/"/g, '""');
  return needsQuote ? `"${escaped.replace(/\n/g, "\r\n")}"` : escaped;
}

function row(...cells: unknown[]): string {
  return cells.map(esc).join(",");
}

/**
 * GET /api/export/my-data
 *
 * Read-only export of the LOGGED-IN user's own data.
 *  - Patients are filtered by patientsTable.assignedProfessionalId === session.userId
 *  - Sessions (registros_clinicos) are filtered by userId === session.userId
 *    PLUS any session belonging to a patient assigned to them (covers historical
 *    records that may not have userId stamped). All other sessions are excluded.
 *
 * Security:
 *  - The professional id is taken ONLY from the server-side session. Any value
 *    in the request body / query is ignored.
 *  - No writes, no deletes. Pure read.
 *  - Returns 204 No Content when the user has nothing to export, so the
 *    frontend can show a friendly empty-state message.
 */
router.get("/export/my-data", async (req, res) => {
  const sess = getSessionUser(req);
  if (!sess) return res.status(401).json({ error: "No autenticado" });

  // Patients owned by this user. Note: even admins only export the patients
  // explicitly assigned to them — admins cannot use this endpoint to dump
  // the entire database.
  const patients = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.assignedProfessionalId, sess.id))
    .orderBy(patientsTable.name);

  const patientIds = patients.map((p) => p.id);

  // Sessions stamped with this user
  const myRegistros = await db
    .select()
    .from(registrosClinicosTable)
    .where(eq(registrosClinicosTable.userId, sess.id));

  // Legacy fallback: sessions for the user's own patients that have NO userId
  // stamped (older records created before userId tracking). Sessions authored
  // by ANOTHER professional (userId != sess.id) are intentionally excluded to
  // prevent cross-professional data leakage when a patient is shared.
  let legacyRegistros: typeof registrosClinicosTable.$inferSelect[] = [];
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

  // Deduplicate by id, then sort by fecha asc
  const seen = new Set<number>();
  const registros: typeof registrosClinicosTable.$inferSelect[] = [];
  for (const r of [...myRegistros, ...legacyRegistros]) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    registros.push(r);
  }
  registros.sort((a, b) =>
    a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.id - b.id,
  );

  if (patients.length === 0 && registros.length === 0) {
    console.log(
      `[GET /api/export/my-data] userId=${sess.id} role=${sess.role} → sin datos`,
    );
    return res.status(204).end();
  }

  const today = new Date().toISOString().slice(0, 10);
  const patientNameById = new Map(patients.map((p) => [p.id, p.name]));

  const lines: string[] = [];
  lines.push("Respaldo de datos — Neurometric Lab");
  lines.push(`Usuario,${esc(sess.userName)}`);
  lines.push(`Generado,${esc(today)}`);
  lines.push("");
  lines.push("PACIENTES");
  lines.push(
    row(
      "id",
      "nombre",
      "edad",
      "fecha_nacimiento",
      "diagnostico",
      "fecha_inicio",
      "observaciones",
      "motivo_consulta",
      "antecedentes",
      "impresion_clinica",
      "informe_evolucion",
      "creado",
    ),
  );
  for (const p of patients) {
    lines.push(
      row(
        p.id,
        p.name,
        p.age,
        p.fechaNacimiento,
        p.diagnosis,
        p.fechaInicio,
        p.observaciones,
        p.motivoConsulta,
        p.antecedentes,
        p.impresionClinica,
        p.informeEvolucion,
        p.createdAt.toISOString().slice(0, 10),
      ),
    );
  }
  lines.push("");
  lines.push("SESIONES");
  lines.push(
    row(
      "id",
      "fecha",
      "paciente_id",
      "paciente",
      "resumen_sesion",
      "observaciones",
      "recomendaciones_hogar",
      "creado",
    ),
  );
  for (const r of registros) {
    lines.push(
      row(
        r.id,
        r.fecha,
        r.patientId,
        patientNameById.get(r.patientId) ?? r.patientName ?? "",
        r.resumenSesion,
        r.observaciones,
        r.recomendacionesHogar,
        r.createdAt.toISOString().slice(0, 10),
      ),
    );
  }

  // UTF-8 BOM so Excel opens accented characters correctly
  const csv = "\uFEFF" + lines.join("\r\n") + "\r\n";

  console.log(
    `[GET /api/export/my-data] userId=${sess.id} role=${sess.role} → ${patients.length} pacientes, ${registros.length} sesiones`,
  );

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="neurometric-respaldo-mis-datos-${today}.csv"`,
  );
  res.setHeader("Cache-Control", "no-store");
  res.send(csv);
});

export default router;
