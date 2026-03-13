import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const patientProfessionalsTable = pgTable("patient_professionals", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  professionalId: integer("professional_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PatientProfessional = typeof patientProfessionalsTable.$inferSelect;
export type InsertPatientProfessional = typeof patientProfessionalsTable.$inferInsert;
