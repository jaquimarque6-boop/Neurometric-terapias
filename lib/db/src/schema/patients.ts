import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";

export const patientsTable = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age"),
  fechaNacimiento: text("fecha_nacimiento"),
  diagnosis: text("diagnosis"),
  profesionalNombre: text("profesional_nombre"),
  assignedProfessionalId: integer("assigned_professional_id"),
  franjaEtaria: text("franja_etaria"),
  fechaInicio: text("fecha_inicio"),
  progreso: text("progreso"),
  promedioDesempeno: real("promedio_desempeno"),
  semaforo: text("semaforo"),
  observaciones: text("observaciones"),
  motivoConsulta: text("motivo_consulta"),
  antecedentes: text("antecedentes"),
  historiaFamiliar: text("historia_familiar"),
  escolaridad: text("escolaridad"),
  informeEvolucion: text("informe_evolucion"),
  informeFamilia: text("informe_familia"),
  informeMensual: text("informe_mensual"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Patient = typeof patientsTable.$inferSelect;
export type InsertPatient = typeof patientsTable.$inferInsert;
