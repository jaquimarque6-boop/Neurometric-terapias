import { Router, type IRouter } from "express";
import { db, collaboratorsTable, referralAttributionsTable, saasReceiptsTable, saasStatusEventsTable, usersTable } from "@workspace/db";
import { and, eq, inArray, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { activeReferral, businessDate, businessMonth, centsString, changeCommercialStatus, decimalCents, normalizeCode, validCode } from "../lib/collaborators";

const router: IRouter = Router();
const statuses = ["trial", "paying", "overdue", "courtesy", "churned"];
const percentOk = (v: unknown) => typeof v === "string" && /^(?:100(?:\.0{1,2})?|(?:0|[1-9]\d?)(?:\.\d{1,2})?)$/.test(v);
const dateOk = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`)) && new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v;
const referenceOk = (value: unknown) => value === undefined || (typeof value === "string" && value.trim().length > 0 && value.trim().length <= 256);
const requireAdmin = (req: any, res: any) => {
  if (!req.session?.userId) { res.status(401).json({ error: "No autenticado" }); return false; }
  if (req.session.userRole !== "admin") { res.status(403).json({ error: "Solo administradores" }); return false; }
  return true;
};
const idOf = (v: unknown) => typeof v === "string" && /^[1-9]\d*$/.test(v) && Number.isSafeInteger(Number(v)) ? Number(v) : null;
const receiptJson = (r: typeof saasReceiptsTable.$inferSelect) => ({
  ...r, paidAt: r.paidAt?.toISOString() ?? null, createdAt: r.createdAt.toISOString(),
});

router.get("/referrals/:code", async (req, res) => {
  const code = normalizeCode(req.params.code);
  return res.json({ valid: !!await activeReferral(code), code });
});

router.get("/collaborators", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  return res.json(await db.select().from(collaboratorsTable).orderBy(collaboratorsTable.createdAt));
});

router.post("/collaborators", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { name, email, password, country, commissionPercent, existingUserId } = req.body ?? {};
  const code = normalizeCode(req.body?.code);
  const linking = existingUserId !== undefined;
  if (![name, country].every(v => typeof v === "string" && v.trim()) ||
    !validCode(code) || !percentOk(commissionPercent) || req.body?.active !== undefined) {
    return res.status(400).json({ error: "Datos de colaboradora inválidos" });
  }
  if (linking
    ? !Number.isSafeInteger(existingUserId) || existingUserId < 1 || email !== undefined || password !== undefined
    : typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Seleccioná un profesional existente o ingresá email y contraseña para el nuevo acceso" });
  }
  try {
    const hash = linking ? null : await bcrypt.hash(password, 10);
    const collaborator = await db.transaction(async tx => {
      let userId: number;
      if (linking) {
        await tx.execute(sql`SELECT id FROM users WHERE id = ${existingUserId} FOR UPDATE`);
        const [user] = await tx.select({ id: usersTable.id, role: usersTable.role }).from(usersTable).where(eq(usersTable.id, existingUserId));
        if (!user || user.role !== "professional") return null;
        userId = user.id;
      } else {
        const [user] = await tx.insert(usersTable).values({
          email: email.trim().toLowerCase(), passwordHash: hash!, name: name.trim(), role: "collaborator",
          professionalId: null, active: false,
        }).returning();
        userId = user.id;
      }
      const [record] = await tx.insert(collaboratorsTable).values({
        userId, name: name.trim(), country: country.trim(), code,
        commissionPercent, active: false,
      }).returning();
      return record;
    });
    if (!collaborator) return res.status(404).json({ error: "Profesional no encontrado" });
    return res.status(201).json(collaborator);
  } catch (error: any) {
    if (error?.code === "23505" || error?.cause?.code === "23505") return res.status(409).json({ error: "Email, código o usuario ya existe" });
    throw error;
  }
});

router.patch("/collaborators/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const id = idOf(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });
  const body = req.body ?? {};
  if (!Object.keys(body).length || Object.keys(body).some(k => !["name", "country", "code", "commissionPercent", "active"].includes(k)) ||
    (body.name !== undefined && (typeof body.name !== "string" || !body.name.trim())) ||
    (body.country !== undefined && (typeof body.country !== "string" || !body.country.trim())) ||
    (body.commissionPercent !== undefined && !percentOk(body.commissionPercent)) ||
    (body.active !== undefined && typeof body.active !== "boolean")) return res.status(400).json({ error: "Datos inválidos" });
  const code = body.code === undefined ? undefined : normalizeCode(body.code);
  if (code !== undefined && !validCode(code)) return res.status(400).json({ error: "Código inválido" });
  try {
    const result = await db.transaction(async tx => {
      await tx.execute(sql`SELECT id FROM collaborators WHERE id = ${id} FOR UPDATE`);
      const [previous] = await tx.select().from(collaboratorsTable).where(eq(collaboratorsTable.id, id));
      if (!previous) return null;
      if (code !== undefined && code !== previous.code) {
        const [attr] = await tx.select({ id: referralAttributionsTable.id }).from(referralAttributionsTable).where(eq(referralAttributionsTable.collaboratorId, id)).limit(1);
        const [receipt] = await tx.select({ id: saasReceiptsTable.id }).from(saasReceiptsTable).where(eq(saasReceiptsTable.collaboratorId, id)).limit(1);
        if (attr || receipt) return "locked";
      }
      const [updated] = await tx.update(collaboratorsTable).set({
        name: body.name?.trim(), country: body.country?.trim(), code,
        commissionPercent: body.commissionPercent, active: body.active,
      }).where(eq(collaboratorsTable.id, id)).returning();
      if (body.active !== undefined || body.name !== undefined) {
        await tx.update(usersTable).set({ ...(body.active !== undefined ? { active: body.active } : {}), ...(body.name !== undefined ? { name: body.name.trim() } : {}) })
          .where(and(eq(usersTable.id, previous.userId), eq(usersTable.role, "collaborator")));
      }
      return updated;
    });
    if (!result) return res.status(404).json({ error: "Colaboradora no encontrada" });
    if (result === "locked") return res.status(409).json({ error: "Código bloqueado por historial" });
    return res.json(result);
  } catch (error: any) {
    if (error?.code === "23505") return res.status(409).json({ error: "Código ya existe" });
    throw error;
  }
});

const associatedCollaboratorError = "Esta colaboradora ya tiene información asociada. Para conservar el historial, podés desactivarla pero no eliminarla.";
router.delete("/collaborators/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const id = idOf(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });
  if (!req.body || Object.keys(req.body).length !== 1 || req.body.confirm !== "ELIMINAR") {
    return res.status(400).json({ error: "Confirmación inválida" });
  }
  try {
    const result = await db.transaction(async tx => {
      const locked = await tx.execute(sql`SELECT id FROM collaborators WHERE id = ${id} FOR UPDATE`);
      if (!locked.rows.length) return "missing";
      const [attribution] = await tx.select({ id: referralAttributionsTable.id }).from(referralAttributionsTable).where(eq(referralAttributionsTable.collaboratorId, id)).limit(1);
      const [receipt] = await tx.select({ id: saasReceiptsTable.id }).from(saasReceiptsTable).where(eq(saasReceiptsTable.collaboratorId, id)).limit(1);
      if (attribution || receipt) return "associated";
      await tx.delete(collaboratorsTable).where(eq(collaboratorsTable.id, id));
      return "deleted";
    });
    if (result === "missing") return res.status(404).json({ error: "Colaboradora no encontrada" });
    if (result === "associated") return res.status(409).json({ error: associatedCollaboratorError });
    return res.json({ deleted: true });
  } catch (error: any) {
    if (error?.code === "23503" || error?.cause?.code === "23503") return res.status(409).json({ error: associatedCollaboratorError });
    throw error;
  }
});

router.get("/saas/receipts", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  return res.json((await db.select().from(saasReceiptsTable).orderBy(saasReceiptsTable.createdAt)).map(receiptJson));
});

router.post("/saas/receipts", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { professionalUserId, amount, currency, periodFrom, periodTo, receivedAt, reference, idempotencyKey } = req.body ?? {};
  const cents = decimalCents(amount);
  if (!Number.isSafeInteger(professionalUserId) || professionalUserId < 1 || cents === null || cents <= 0n ||
      cents > 9999999999999999n || typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency) ||
      !dateOk(periodFrom) || !dateOk(periodTo) || periodFrom > periodTo ||
      !dateOk(receivedAt) || !referenceOk(reference) ||
      typeof idempotencyKey !== "string" || !/^[A-Za-z0-9:_-]{8,128}$/.test(idempotencyKey) ||
      Object.keys(req.body ?? {}).some(k => !["professionalUserId", "amount", "currency", "periodFrom", "periodTo", "receivedAt", "reference", "idempotencyKey"].includes(k))) {
    return res.status(400).json({ error: "Cobro inválido" });
  }
  const normalized = centsString(cents);
  const referenceValue = reference?.trim() ?? null;
  const matches = (r: typeof saasReceiptsTable.$inferSelect) => r.professionalUserId === professionalUserId &&
    r.amount === normalized && r.currency === currency && r.receivedAt === receivedAt &&
    r.periodFrom === periodFrom && r.periodTo === periodTo && r.reference === referenceValue;
  // Unique key and transaction-scoped advisory lock serialize identical retries.
  const result = await db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${idempotencyKey}, 0))`);
    const [existing] = await tx.select().from(saasReceiptsTable).where(eq(saasReceiptsTable.idempotencyKey, idempotencyKey));
    if (existing) return { receipt: existing, status: matches(existing) ? 200 : 409 };
    await tx.execute(sql`SELECT id FROM users WHERE id = ${professionalUserId} FOR UPDATE`);
    const [user] = await tx.select().from(usersTable).where(eq(usersTable.id, professionalUserId));
    if (!user || user.role !== "professional") return { receipt: null, status: 404 };
    const [attribution] = await tx.select().from(referralAttributionsTable).where(eq(referralAttributionsTable.professionalUserId, professionalUserId));
    // A row-share lock serializes the rate snapshot with admin PATCH updates.
    // Never read the rate before acquiring this lock, even for inactive partners.
    if (attribution) await tx.execute(sql`SELECT id FROM collaborators WHERE id = ${attribution.collaboratorId} FOR SHARE`);
    const [collaborator] = attribution ? await tx.select().from(collaboratorsTable).where(eq(collaboratorsTable.id, attribution.collaboratorId)) : [];
    const pct = collaborator?.commissionPercent;
    const basisPoints = pct ? decimalCents(pct)! : null;
    const commission = basisPoints === null ? null : centsString((cents * basisPoints + 5000n) / 10000n);
    const [receipt] = await tx.insert(saasReceiptsTable).values({
      professionalUserId, amount: normalized, currency, periodFrom, periodTo, receivedAt,
      reference: referenceValue, idempotencyKey, createdByUserId: req.session.userId!,
      collaboratorId: collaborator?.id ?? null,
      commissionPercentSnapshot: pct ?? null, commissionAmount: commission,
    }).returning();
    return { receipt, status: 201 };
  });
  if (result.status === 409) return res.status(409).json({ error: "Clave de idempotencia reutilizada con datos diferentes" });
  if (!result.receipt) return res.status(404).json({ error: "Profesional no encontrado" });
  return res.status(result.status).json(receiptJson(result.receipt));
});

router.post("/saas/receipts/:id/paid", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const id = idOf(req.params.id);
  const paymentReference = req.body?.paymentReference;
  if (!id || !referenceOk(paymentReference) || Object.keys(req.body ?? {}).some(k => k !== "paymentReference")) return res.status(400).json({ error: "Solicitud inválida" });
  const normalizedReference = paymentReference?.trim() ?? null;
  const result = await db.transaction(async tx => {
    await tx.execute(sql`SELECT id FROM saas_receipts WHERE id = ${id} FOR UPDATE`);
    const [receipt] = await tx.select().from(saasReceiptsTable).where(eq(saasReceiptsTable.id, id));
    if (!receipt || !receipt.commissionAmount || receipt.paidAt) return receipt;
    const [updated] = await tx.update(saasReceiptsTable).set({
      paidAt: new Date(), paidByUserId: req.session.userId!, paymentReference: normalizedReference,
    }).where(eq(saasReceiptsTable.id, id)).returning();
    return updated;
  });
  if (!result) return res.status(404).json({ error: "Cobro no encontrado" });
  if (!result.commissionAmount) return res.status(409).json({ error: "Cobro sin comisión" });
  if (result.paymentReference !== normalizedReference) return res.status(409).json({ error: "Comisión ya pagada con otra referencia" });
  return res.json(receiptJson(result));
});

router.post("/saas/status", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { professionalUserId, status, effectiveDate } = req.body ?? {};
  if (!Number.isSafeInteger(professionalUserId) || professionalUserId < 1 || !statuses.includes(status) ||
    (effectiveDate !== undefined && !dateOk(effectiveDate)) ||
    Object.keys(req.body ?? {}).some(k => !["professionalUserId", "status", "effectiveDate"].includes(k))) return res.status(400).json({ error: "Estado inválido" });
  try {
    const event = await db.transaction(tx => changeCommercialStatus(tx, professionalUserId, status, req.session.userId!, effectiveDate));
    return res.json({ professionalUserId, status, event });
  } catch (error: any) {
    if (error.message === "Profesional no encontrado") return res.status(404).json({ error: error.message });
    throw error;
  }
});

async function dashboard(id: number) {
  const [collaborator] = await db.select().from(collaboratorsTable).where(eq(collaboratorsTable.id, id));
  if (!collaborator) return null;
  const attributions = await db.select().from(referralAttributionsTable).where(eq(referralAttributionsTable.collaboratorId, id));
  const receipts = await db.select().from(saasReceiptsTable).where(eq(saasReceiptsTable.collaboratorId, id));
  const ownUserIds = attributions.map(a => a.professionalUserId);
  const allEvents = ownUserIds.length ? await db.select().from(saasStatusEventsTable).where(inArray(saasStatusEventsTable.professionalUserId, ownUserIds)) : [];
  const ownIds = new Set(attributions.map(a => a.professionalUserId));
  const events = allEvents.filter(e => ownIds.has(e.professionalUserId));
  const users = ownUserIds.length ? await db.select({ id: usersTable.id, commercialStatus: usersTable.commercialStatus }).from(usersTable).where(inArray(usersTable.id, ownUserIds)) : [];
  const month = businessMonth(new Date());
  type Totals = Record<string, string>;
  const add = (bag: Totals, currency: string, amount: string) => {
    bag[currency] = centsString((decimalCents(bag[currency] ?? "0.00") ?? 0n) + (decimalCents(amount) ?? 0n));
  };
  const history = new Map<string, { month: string; referrals: number; newSubscriptions: number; cancellations: number; generated: Totals; pending: Totals; paid: Totals }>();
  const row = (key: string) => {
    if (!history.has(key)) history.set(key, { month: key, referrals: 0, newSubscriptions: 0, cancellations: 0, generated: {}, pending: {}, paid: {} });
    return history.get(key)!;
  };
  for (const a of attributions) row(businessMonth(a.createdAt)).referrals++;
  for (const e of events) {
    if (e.event === "baseline") continue;
    const r = row(e.effectiveDate.slice(0, 7));
    if (e.event === "first_paid") r.newSubscriptions++;
    if (e.event === "cancellation") r.cancellations++;
  }
  const pending: Totals = {}, paid: Totals = {};
  for (const receipt of receipts) {
    if (!receipt.commissionAmount) continue;
    const r = row(receipt.receivedAt.slice(0, 7));
    add(r.generated, receipt.currency, receipt.commissionAmount);
    if (receipt.paidAt) {
      add(paid, receipt.currency, receipt.commissionAmount);
      add(row(businessMonth(receipt.paidAt)).paid, receipt.currency, receipt.commissionAmount);
    } else {
      add(pending, receipt.currency, receipt.commissionAmount);
      add(r.pending, receipt.currency, receipt.commissionAmount);
    }
  }
  const current = row(month);
  return {
    name: collaborator.name, code: collaborator.code,
    link: `https://neurometricterapias.com/?ref=${collaborator.code.toLowerCase()}`,
    commissionPercent: collaborator.commissionPercent, referrals: attributions.length,
    activeSubscriptions: users.filter(u => ownIds.has(u.id) && u.commercialStatus === "paying").length,
    newSubscriptionsThisMonth: current.newSubscriptions, cancellationsThisMonth: current.cancellations,
    generatedThisMonth: current.generated, pending, paid,
    history: [...history.values()].sort((a, b) => b.month.localeCompare(a.month)),
  };
}

router.get("/collaborators/:id/dashboard", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const id = idOf(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });
  const result = await dashboard(id);
  return result ? res.json(result) : res.status(404).json({ error: "Colaboradora no encontrada" });
});
router.get("/collaborator/dashboard", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "No autenticado" });
  if (req.session.userRole !== "collaborator" && req.session.userRole !== "professional") return res.status(403).json({ error: "Solo colaboradoras" });
  const [collaborator] = await db.select({ id: collaboratorsTable.id }).from(collaboratorsTable).where(eq(collaboratorsTable.userId, req.session.userId));
  if (!collaborator) return res.status(403).json({ error: "Colaboradora no encontrada" });
  return res.json(await dashboard(collaborator.id));
});

export default router;