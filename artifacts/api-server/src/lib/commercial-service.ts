import { db, usersTable, saasStatusEventsTable } from "@workspace/db";
import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { addDays, commercialToday } from "./commercial-policy";

export const commercialFields = ["commercialStatus", "trialStartDate", "trialEndDate",
  "lastPaymentDate", "nextDueDate", "monthlyAmount", "paymentMethod", "internalNotes"] as const;
export function commercialSnapshot(user: any) {
  return Object.fromEntries(commercialFields.map(key => [key, user[key] ?? null]));
}
export function commercialRevision(user: any): string {
  return createHash("sha256").update(JSON.stringify(commercialSnapshot(user))).digest("hex");
}
export async function logCommercialChange(tx: any, userId: number, actorUserId: number,
  event: string, before: Record<string, unknown>, after: Record<string, unknown>,
  extra: Record<string, unknown> = {}) {
  if (JSON.stringify(before) === JSON.stringify(after)) return;
  await tx.insert(saasStatusEventsTable).values({
    professionalUserId: userId, actorUserId, event, effectiveDate: commercialToday(),
    details: { before, after, ...extra },
  });
}
// Called only after credentials have been validated. A row lock makes multiple
// simultaneous device logins start exactly one trial. Existing users default false.
export async function startNewAccountTrial(userId: number) {
  return db.transaction(async tx => {
    await tx.execute(sql`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`);
    const [user] = await tx.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user || !user.active || user.role !== "professional" || !user.trialStartPending ||
        user.commercialStatus !== "trial" || user.trialStartDate || user.trialEndDate) return;
    const start = commercialToday();
    const [updated] = await tx.update(usersTable).set({
      trialStartDate: start, trialEndDate: addDays(start, 14), trialStartPending: false,
    }).where(eq(usersTable.id, user.id)).returning();
    await logCommercialChange(tx, user.id, user.id, "trial_started",
      commercialSnapshot(user), commercialSnapshot(updated));
  });
}
