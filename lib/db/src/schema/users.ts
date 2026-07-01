import { pgTable, text, serial, integer, timestamp, boolean, date, numeric } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("professional"),
  professionalId: integer("professional_id"),
  name: text("name").notNull(),
  specialty: text("specialty"),
  active: boolean("active").notNull().default(true),
  // Estado comercial (metadatos administrativos, independientes del login `active`
  // y del módulo de pagos clínicos): trial | paying | overdue | courtesy | churned.
  commercialStatus: text("commercial_status").notNull().default("trial"),
  trialStartDate: date("trial_start_date"),
  trialEndDate: date("trial_end_date"),
  lastPaymentDate: date("last_payment_date"),
  nextDueDate: date("next_due_date"),
  monthlyAmount: numeric("monthly_amount"),
  paymentMethod: text("payment_method"),
  internalNotes: text("internal_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
