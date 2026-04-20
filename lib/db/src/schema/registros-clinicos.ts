import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const registrosClinicosTable = pgTable("registros_clinicos", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  patientName: text("patient_name"),
  professionalId: integer("professional_id"),
  professionalName: text("professional_name"),
  userId: integer("user_id"),
  fecha: text("fecha").notNull(),
  resumenSesion: text("resumen_sesion"),
  observaciones: text("observaciones"),
  recomendacionesHogar: text("recomendaciones_hogar"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type RegistroClinico = typeof registrosClinicosTable.$inferSelect;
export type InsertRegistroClinico = typeof registrosClinicosTable.$inferInsert;
