import { pgTable, text, serial, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";

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
  lenguajeComunicacion: text("lenguaje_comunicacion"),
  atencionConducta: text("atencion_conducta"),
  vozHabla: text("voz_habla"),
  deglucion: text("deglucion"),
  impresionClinica: text("impresion_clinica"),
  informeEvolucion: text("informe_evolucion"),
  informeFamilia: text("informe_familia"),
  informeMensual: text("informe_mensual"),
  archived: boolean("archived").notNull().default(false),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Patient = typeof patientsTable.$inferSelect;
export type InsertPatient = typeof patientsTable.$inferInsert;
