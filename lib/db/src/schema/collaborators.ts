import { pgTable, serial, integer, text, boolean, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const collaboratorsTable = pgTable("collaborators", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id).unique(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  code: text("code").notNull().unique(),
  commissionPercent: numeric("commission_percent", { precision: 5, scale: 2 }).notNull(),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const referralAttributionsTable = pgTable("referral_attributions", {
  id: serial("id").primaryKey(),
  professionalUserId: integer("professional_user_id").notNull().references(() => usersTable.id).unique(),
  collaboratorId: integer("collaborator_id").notNull().references(() => collaboratorsTable.id),
  codeUsed: text("code_used").notNull(),
  source: text("source").notNull(),
  createdByUserId: integer("created_by_user_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const saasReceiptsTable = pgTable("saas_receipts", {
  id: serial("id").primaryKey(),
  professionalUserId: integer("professional_user_id").notNull().references(() => usersTable.id),
  amount: numeric("amount", { precision: 16, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  periodFrom: date("period_from", { mode: "string" }).notNull(),
  periodTo: date("period_to", { mode: "string" }).notNull(),
  receivedAt: date("received_at", { mode: "string" }).notNull(),
  reference: text("reference"),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  createdByUserId: integer("created_by_user_id").notNull().references(() => usersTable.id),
  collaboratorId: integer("collaborator_id").references(() => collaboratorsTable.id),
  commissionPercentSnapshot: numeric("commission_percent_snapshot", { precision: 5, scale: 2 }),
  commissionAmount: numeric("commission_amount", { precision: 16, scale: 2 }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  paidByUserId: integer("paid_by_user_id").references(() => usersTable.id),
  paymentReference: text("payment_reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const saasStatusEventsTable = pgTable("saas_status_events", {
  id: serial("id").primaryKey(),
  professionalUserId: integer("professional_user_id").notNull().references(() => usersTable.id),
  event: text("event").notNull(),
  actorUserId: integer("actor_user_id").notNull().references(() => usersTable.id),
  effectiveDate: date("effective_date", { mode: "string" }).notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
});