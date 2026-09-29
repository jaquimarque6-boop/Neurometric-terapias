import { pgTable, serial, integer, text, jsonb, timestamp, date, index } from "drizzle-orm/pg-core";
import { patientsTable } from "./patients";
import { usersTable } from "./users";

export const patientReportsTable = pgTable("patient_reports", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  reportType: text("report_type").notNull(),
  title: text("title").notNull(),
  content: jsonb("content").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  authorUserId: integer("author_user_id").notNull().references(() => usersTable.id),
  updatedByUserId: integer("updated_by_user_id").notNull().references(() => usersTable.id),
  periodKind: text("period_kind"),
  periodFrom: date("period_from", { mode: "string" }),
  periodTo: date("period_to", { mode: "string" }),
  clinicalRecordsUsedCount: integer("clinical_records_used_count"),
  clinicalRecordsTotalCount: integer("clinical_records_total_count"),
}, (table) => [index("patient_reports_patient_created_idx").on(table.patientId, table.createdAt)]);

export type PatientReport = typeof patientReportsTable.$inferSelect;