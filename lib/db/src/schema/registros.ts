import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";

export const registrosTable = pgTable("registros", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  patientName: text("patient_name"),
  sesionNumero: integer("sesion_numero"),
  objetivoNombre: text("objetivo_nombre"),
  goalLibraryId: integer("goal_library_id"),
  areaObjetivo: text("area_objetivo"),
  fecha: text("fecha"),
  estado: text("estado"),
  intentos: integer("intentos"),
  intentosSugeridos: integer("intentos_sugeridos"),
  correctas: integer("correctas"),
  porcentaje: text("porcentaje"),
  cumpleMeta: text("cumple_meta"),
  recomendacionClinica: text("recomendacion_clinica"),
  informeSesion: text("informe_sesion"),
  actClinicasObj: text("act_clinicas_obj"),
  actFamiliaObj: text("act_familia_obj"),
  franjaPaciente: text("franja_paciente"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Registro = typeof registrosTable.$inferSelect;
export type InsertRegistro = typeof registrosTable.$inferInsert;
