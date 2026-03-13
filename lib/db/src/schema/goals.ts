import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const goalsTable = pgTable("goals", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  goalLibraryId: integer("goal_library_id"),
  codigo: text("codigo"),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  areaClinica: text("area_clinica"),
  franjaEtaria: text("franja_etaria"),
  nivelDificultad: text("nivel_dificultad"),
  // status: activo | en progreso | logrado | archivado
  status: text("status").notNull().default("activo"),
  fechaAsignacion: text("fecha_asignacion"),
  targetDate: text("target_date"),
  notas: text("notas"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const goalProgressTable = pgTable("goal_progress", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull(),
  nota: text("nota"),
  statusAnterior: text("status_anterior"),
  statusNuevo: text("status_nuevo"),
  registroClinicoId: integer("registro_clinico_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGoalSchema = createInsertSchema(goalsTable).omit({ id: true, createdAt: true });
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goalsTable.$inferSelect;
export type GoalProgress = typeof goalProgressTable.$inferSelect;
