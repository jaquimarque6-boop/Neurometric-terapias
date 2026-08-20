import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const professionalFilesTable = pgTable("professional_files", {
  id: serial("id").primaryKey(),
  uploadedBy: integer("uploaded_by").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  storagePath: text("storage_path").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ProfessionalFile = typeof professionalFilesTable.$inferSelect;
export type InsertProfessionalFile = typeof professionalFilesTable.$inferInsert;