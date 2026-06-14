import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const patientFilesTable = pgTable("patient_files", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  uploadedBy: integer("uploaded_by").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  storagePath: text("storage_path").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPatientFileSchema = createInsertSchema(patientFilesTable).omit({ id: true, createdAt: true });
export type InsertPatientFile = z.infer<typeof insertPatientFileSchema>;
export type PatientFile = typeof patientFilesTable.$inferSelect;
