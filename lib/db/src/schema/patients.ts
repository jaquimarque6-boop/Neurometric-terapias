import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";

export const patientsTable = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age"),
  fechaNacimiento: text("fecha_nacimiento"),
  diagnosis: text("diagnosis"),
  profesionalNombre: text("profesional_nombre"),
  franjaEtaria: text("franja_etaria"),
  fechaInicio: text("fecha_inicio"),
  progreso: text("progreso"),
  promedioDesempeno: real("promedio_desempeno"),
  semaforo: text("semaforo"),
  observaciones: text("observaciones"),
  informeEvolucion: text("informe_evolucion"),
  informeMensual: text("informe_mensual"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Patient = typeof patientsTable.$inferSelect;
export type InsertPatient = typeof patientsTable.$inferInsert;
