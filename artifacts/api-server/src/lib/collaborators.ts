import { db, collaboratorsTable, referralAttributionsTable, usersTable, saasStatusEventsTable } from "@workspace/db";
import { and, eq, inArray, sql } from "drizzle-orm";
import { logCommercialChange } from "./commercial-service";

export const normalizeCode = (value: unknown) => typeof value === "string" ? value.trim().toUpperCase() : "";
export const validCode = (value: string) => /^[A-Z0-9]{2,32}$/.test(value);
export const businessMonth = (value: Date) =>
  `${new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric" }).format(value)}-${new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Buenos_Aires", month: "2-digit" }).format(value)}`;
export const businessDate = (value: Date) =>
  `${businessMonth(value)}-${new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Buenos_Aires", day: "2-digit" }).format(value)}`;

export async function activeReferral(code: unknown, tx: any = db) {
  const normalized = normalizeCode(code);
  if (!validCode(normalized)) return null;
  const [record] = await tx.select().from(collaboratorsTable).where(eq(collaboratorsTable.code, normalized));
  return record?.active ? record : null;
}

export async function attributeReferral(
  tx: any,
  userId: number,
  code: unknown,
  source: "public_register" | "admin_user_create" | "admin_manual_assignment",
  createdByUserId: number | null,
) {
  if (code === undefined || code === null || code === "") return;
  const normalized = normalizeCode(code);
  if (!validCode(normalized)) throw new Error("Código de referido inválido o inactivo");
  await tx.execute(sql`SELECT id FROM collaborators WHERE code = ${normalized} FOR SHARE`);
  const collaborator = await activeReferral(code, tx);
  if (!collaborator) throw new Error("Código de referido inválido o inactivo");
  await tx.insert(referralAttributionsTable).values({
    professionalUserId: userId, collaboratorId: collaborator.id, codeUsed: normalized,
    source, createdByUserId,
  });
}

// Lock a user row to serialize concurrent status changes across both admin entry points.
export async function changeCommercialStatus(tx: any, userId: number, status: string, actorUserId: number, effectiveDate = businessDate(new Date()), audit = true) {
  await tx.execute(sql`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`);
  const [user] = await tx.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || user.role !== "professional") throw new Error("Profesional no encontrado");
  const [prior] = await tx.select({ id: saasStatusEventsTable.id }).from(saasStatusEventsTable)
    .where(and(eq(saasStatusEventsTable.professionalUserId, userId),
      inArray(saasStatusEventsTable.event, ["baseline", "first_paid", "cancellation", "reactivation"]))).limit(1);
  // Existing paying/overdue/churned records predate event tracking: do not
  // infer a brand-new signup when they return to paying.
  const hadPaidHistory = !!prior || ["paying", "overdue", "churned"].includes(user.commercialStatus);
  if (!prior && hadPaidHistory) {
    await tx.insert(saasStatusEventsTable).values({ professionalUserId: userId, event: "baseline", actorUserId, effectiveDate });
  }
  let event: "first_paid" | "cancellation" | "reactivation" | null = null;
  if (status !== user.commercialStatus) {
    if (status === "paying") {
      event = hadPaidHistory ? "reactivation" : "first_paid";
    } else if (status === "churned" && (user.commercialStatus === "paying" || user.commercialStatus === "overdue")) {
      event = "cancellation";
    }
    await tx.update(usersTable).set({
      commercialStatus: status,
      ...(status !== "trial" ? { trialStartPending: false } : {}),
    }).where(eq(usersTable.id, userId));
    if (audit) await logCommercialChange(tx, userId, actorUserId, "commercial_status_changed",
      { commercialStatus: user.commercialStatus }, { commercialStatus: status });
    if (event) await tx.insert(saasStatusEventsTable).values({ professionalUserId: userId, event, actorUserId, effectiveDate });
  }
  return event;
}

export function decimalCents(value: unknown): bigint | null {
  if (typeof value !== "string" || !/^(?:0|[1-9]\d{0,13})(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
}
export function centsString(value: bigint): string {
  return `${value / 100n}.${(value % 100n).toString().padStart(2, "0")}`;
}