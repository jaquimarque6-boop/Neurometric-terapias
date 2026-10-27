import { Router, type IRouter } from "express";
import { recordUserActivityEvent } from "../lib/usage-audit-db";
import { db } from "@workspace/db";
import {
  patientsTable,
  patientReportsTable,
  registrosClinicosTable,
  usersTable,
} from "@workspace/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { canAccessPatient } from "./access-policy";
import { validClinicalDay } from "./report-period";

const router: IRouter = Router();

async function authorize(req: any, res: any, patientId: number) {
  if (!req.session?.userId) {
    res.status(401).json({ error: "No autenticado" });
    return null;
  }
  if (!Number.isSafeInteger(patientId) || patientId < 1) {
    res.status(400).json({ error: "Paciente inválido" });
    return null;
  }
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, patientId));
  if (!patient) {
    res.status(404).json({ error: "Paciente no encontrado" });
    return null;
  }
  if (!canAccessPatient(patient, { id: req.session.userId, role: req.session.userRole ?? "professional" })) {
    res.status(403).json({ error: "Sin acceso a este paciente" });
    return null;
  }
  return patient;
}

function metadata(body: any) {
  const day = (value: unknown) => value == null || value === "" ? null :
    typeof value === "string" && validClinicalDay(value) ? value : NaN;
  const count = (value: unknown) => value == null ? null :
    typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : NaN;
  const periodFrom = day(body.periodFrom);
  const periodTo = day(body.periodTo);
  const clinicalRecordsUsedCount = count(body.clinicalRecordsUsedCount);
  const clinicalRecordsTotalCount = count(body.clinicalRecordsTotalCount);
  if (Number.isNaN(periodFrom) || Number.isNaN(periodTo) || Number.isNaN(clinicalRecordsUsedCount)
    || Number.isNaN(clinicalRecordsTotalCount) || (periodFrom && periodTo && periodFrom > periodTo)
    || (clinicalRecordsUsedCount !== null && clinicalRecordsTotalCount !== null && clinicalRecordsUsedCount > clinicalRecordsTotalCount)
    || (body.periodKind != null && (typeof body.periodKind !== "string" || body.periodKind.length > 50))) return null;
  return {
    periodKind: body.periodKind || null,
    periodFrom: periodFrom as string | null,
    periodTo: periodTo as string | null,
    clinicalRecordsUsedCount: clinicalRecordsUsedCount as number | null,
    clinicalRecordsTotalCount: clinicalRecordsTotalCount as number | null,
  };
}

const validContent = (body: any) => body && typeof body === "object" && !Array.isArray(body)
  && JSON.stringify(body).length < 200_000 && Object.keys(body).length > 0
  && (!Object.prototype.hasOwnProperty.call(body, "clinicalSnapshot") || Array.isArray(body.clinicalSnapshot));

function serialize(row: typeof patientReportsTable.$inferSelect, authorName: string | null) {
  return { ...row, authorName, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

async function authorizedSessionIds(patientId: number, userId: number): Promise<Set<number>> {
  const rows = await db.select({ id: registrosClinicosTable.id })
    .from(registrosClinicosTable)
    .where(and(
      eq(registrosClinicosTable.patientId, patientId),
      eq(registrosClinicosTable.userId, userId),
    ));
  return new Set(rows.map(row => row.id));
}

function sanitizeReportSnapshot(
  row: typeof patientReportsTable.$inferSelect,
  allowedSessionIds: Set<number>,
) {
  if (!Object.prototype.hasOwnProperty.call(row.content, "clinicalSnapshot")) return { row, changed: false };
  const original = row.content.clinicalSnapshot;
  const safeSnapshot = Array.isArray(original)
    ? original.filter((entry: any) => entry && Number.isSafeInteger(entry.id) && allowedSessionIds.has(entry.id))
    : [];
  const changed = !Array.isArray(original) || safeSnapshot.length !== original.length;
  return {
    row: {
      ...row,
      content: { ...row.content, clinicalSnapshot: safeSnapshot },
      ...(changed ? {
        clinicalRecordsUsedCount: safeSnapshot.length,
        clinicalRecordsTotalCount: null,
      } : {}),
    },
    changed,
  };
}

router.get("/patients/:patientId/reports", async (req, res) => {
  const patientId = Number(req.params.patientId);
  const patient = await authorize(req, res, patientId);
  if (!patient) return;
  const userId = req.session.userId as number;
  const rows = await db.select({ report: patientReportsTable, authorName: usersTable.name })
    .from(patientReportsTable).innerJoin(usersTable, eq(patientReportsTable.authorUserId, usersTable.id))
    .where(and(
      eq(patientReportsTable.patientId, patientId),
      eq(patientReportsTable.authorUserId, userId),
    )).orderBy(desc(patientReportsTable.createdAt));
  const hasSnapshots = rows.some(({ report }) =>
    Array.isArray(report.content?.clinicalSnapshot) && report.content.clinicalSnapshot.length > 0);
  const allowedSessionIds = hasSnapshots ? await authorizedSessionIds(patientId, userId) : new Set<number>();
  return res.json(rows.map(({ report, authorName }) =>
    serialize(sanitizeReportSnapshot(report, allowedSessionIds).row, authorName)));
});

router.post("/patients/:patientId/reports", async (req, res) => {
  const patientId = Number(req.params.patientId);
  const patient = await authorize(req, res, patientId);
  if (!patient) return;
  const body = req.body;
  const meta = metadata(body ?? {});
  if (!body || !["evolution", "family"].includes(body.reportType)
    || typeof body.title !== "string" || !body.title.trim() || body.title.length > 200
    || !validContent(body.content) || !meta) return res.status(400).json({ error: "Informe inválido" });
  const userId = req.session.userId as number;
  const hasSnapshot = Array.isArray(body.content.clinicalSnapshot);
  const allowedSessionIds = hasSnapshot && body.content.clinicalSnapshot.length > 0
    ? await authorizedSessionIds(patientId, userId)
    : new Set<number>();
  const sanitized = sanitizeReportSnapshot({
    content: body.content,
  } as typeof patientReportsTable.$inferSelect, allowedSessionIds);
  // Keep the minimal identity snapshot needed to print an historical document
  // if the current patient name later changes.
  const content: Record<string, any> = { ...sanitized.row.content, patientSnapshot: {
    ...(typeof sanitized.row.content.patientSnapshot === "object" && sanitized.row.content.patientSnapshot ? sanitized.row.content.patientSnapshot : {}),
    name: patient.name, fechaNacimiento: patient.fechaNacimiento,
  } };
  const safeMeta = sanitized.changed
    ? { ...meta, clinicalRecordsUsedCount: Array.isArray(content.clinicalSnapshot) ? content.clinicalSnapshot.length : 0, clinicalRecordsTotalCount: null }
    : meta;
  const [report] = await db.insert(patientReportsTable).values({
    patientId, reportType: body.reportType, title: body.title.trim(), content,
    authorUserId: userId, updatedByUserId: userId, ...safeMeta,
  }).returning();
  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId));
  const response = serialize(report, user?.name ?? null);
  recordUserActivityEvent(userId, "report_saved");
  return res.status(201).json(response);
});

router.get("/patients/:patientId/reports/:reportId", async (req, res) => {
  const patientId = Number(req.params.patientId);
  const patient = await authorize(req, res, patientId);
  if (!patient) return;
  const userId = req.session.userId as number;
  const reportId = Number(req.params.reportId);
  if (!Number.isSafeInteger(reportId) || reportId < 1) return res.status(400).json({ error: "Informe inválido" });
  const [row] = await db.select({ report: patientReportsTable, authorName: usersTable.name })
    .from(patientReportsTable).innerJoin(usersTable, eq(patientReportsTable.authorUserId, usersTable.id))
    .where(and(
      eq(patientReportsTable.id, reportId),
      eq(patientReportsTable.patientId, patientId),
      eq(patientReportsTable.authorUserId, userId),
    ));
  if (!row) return res.status(404).json({ error: "Informe no encontrado" });
  const hasSnapshot = Array.isArray(row.report.content?.clinicalSnapshot)
    && row.report.content.clinicalSnapshot.length > 0;
  const allowedSessionIds = hasSnapshot ? await authorizedSessionIds(patientId, userId) : new Set<number>();
  return res.json(serialize(sanitizeReportSnapshot(row.report, allowedSessionIds).row, row.authorName));
});

router.put("/patients/:patientId/reports/:reportId", async (req, res) => {
  const patientId = Number(req.params.patientId);
  const patient = await authorize(req, res, patientId);
  if (!patient) return;
  const userId = req.session.userId as number;
  const reportId = Number(req.params.reportId);
  if (!Number.isSafeInteger(reportId) || reportId < 1) return res.status(400).json({ error: "Informe inválido" });
  const body = req.body;
  if (!body || typeof body.title !== "string" || !body.title.trim() || body.title.length > 200
    || !validContent(body.content) || typeof body.updatedAt !== "string" ||
    Number.isNaN(Date.parse(body.updatedAt))) return res.status(400).json({ error: "Informe inválido" });
  const [existing] = await db.select().from(patientReportsTable)
    .where(and(
      eq(patientReportsTable.id, reportId),
      eq(patientReportsTable.patientId, patientId),
      eq(patientReportsTable.authorUserId, userId),
    ));
  if (!existing) return res.status(404).json({ error: "Informe no encontrado" });
  const hasSnapshot = Array.isArray(body.content.clinicalSnapshot);
  const allowedSessionIds = hasSnapshot && body.content.clinicalSnapshot.length > 0
    ? await authorizedSessionIds(patientId, userId)
    : new Set<number>();
  const sanitized = sanitizeReportSnapshot({
    content: body.content,
  } as typeof patientReportsTable.$inferSelect, allowedSessionIds);
  const [report] = await db.update(patientReportsTable).set({
    title: body.title.trim(),
    content: { ...sanitized.row.content, patientSnapshot: existing.content.patientSnapshot },
    updatedAt: new Date(),
    updatedByUserId: userId,
    ...(sanitized.changed ? {
      clinicalRecordsUsedCount: Array.isArray(sanitized.row.content.clinicalSnapshot)
        ? sanitized.row.content.clinicalSnapshot.length
        : 0,
      clinicalRecordsTotalCount: null,
    } : {}),
  }).where(and(eq(patientReportsTable.id, reportId), eq(patientReportsTable.patientId, patientId),
    eq(patientReportsTable.authorUserId, userId),
    eq(patientReportsTable.updatedAt, new Date(body.updatedAt)))).returning();
  if (!report) return res.status(409).json({ error: "Este informe fue modificado en otra pestaña. Volvé a abrirlo antes de guardar." });
  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, report.authorUserId));
  const response = serialize(report, user?.name ?? null);
  recordUserActivityEvent(req.session.userId as number, "report_saved");
  return res.json(response);
});

router.delete("/patients/:patientId/reports/:reportId", async (req, res): Promise<void> => {
  const patientId = Number(req.params.patientId);
  const patient = await authorize(req, res, patientId);
  if (!patient) return;
  const reportId = Number(req.params.reportId);
  if (!Number.isSafeInteger(reportId) || reportId < 1) {
    res.status(400).json({ error: "Informe inválido" });
    return;
  }
  const userId = req.session.userId as number;
  const [deleted] = await db.delete(patientReportsTable)
    .where(and(
      eq(patientReportsTable.id, reportId),
      eq(patientReportsTable.patientId, patientId),
      eq(patientReportsTable.authorUserId, userId),
    ))
    .returning({ id: patientReportsTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Informe no encontrado" });
    return;
  }
  res.status(204).end();
});

export default router;