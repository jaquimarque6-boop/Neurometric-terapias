import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const citasTable = pgTable("citas", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id"),
  professionalId: integer("professional_id"),
  titulo: text("titulo").notNull(),
  fecha: text("fecha").notNull(),
  horaInicio: text("hora_inicio").notNull(),
  horaFin: text("hora_fin").notNull(),
  tipo: text("tipo").notNull().default("sesion"),
  status: text("status").notNull().default("programada"),
  asistencia: text("asistencia").notNull().default("pendiente"),
  notas: text("notas"),
  userId: integer("user_id"),
  serieId: text("serie_id"),
  repetirSemanal: boolean("repetir_semanal").notNull().default(false),
  repetirHasta: text("repetir_hasta"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCitaSchema = createInsertSchema(citasTable).omit({ id: true, createdAt: true });
export type InsertCita = z.infer<typeof insertCitaSchema>;
export type Cita = typeof citasTable.$inferSelect;
