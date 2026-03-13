import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const goalsTable = pgTable("goals", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  codigo: text("codigo"),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  franjaEtaria: text("franja_etaria"),
  status: text("status").notNull().default("activo"),
  targetDate: text("target_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGoalSchema = createInsertSchema(goalsTable).omit({ id: true, createdAt: true });
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goalsTable.$inferSelect;
