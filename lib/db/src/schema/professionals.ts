import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const professionalsTable = pgTable("professionals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  specialty: text("specialty").notNull(),
  license: text("license"),
  status: text("status").notNull().default("active"),
  patientCount: integer("patient_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProfessionalSchema = createInsertSchema(professionalsTable).omit({ id: true, createdAt: true, patientCount: true });
export type InsertProfessional = z.infer<typeof insertProfessionalSchema>;
export type Professional = typeof professionalsTable.$inferSelect;
