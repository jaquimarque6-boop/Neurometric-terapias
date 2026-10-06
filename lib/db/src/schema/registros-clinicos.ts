import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export type RegistroClinicoMaterialPhoto = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  uploaded: boolean;
};

export type RegistroClinicoMaterial = {
  id: string;
  nombre: string;
  fotos: RegistroClinicoMaterialPhoto[];
};

export const registrosClinicosTable = pgTable("registros_clinicos", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  patientName: text("patient_name"),
  professionalId: integer("professional_id"),
  professionalName: text("professional_name"),
  userId: integer("user_id"),
  fecha: text("fecha").notNull(),
  diagnostico: text("diagnostico"),
  resumenSesion: text("resumen_sesion"),
  observaciones: text("observaciones"),
  recomendacionesHogar: text("recomendaciones_hogar"),
  materialesActividades: jsonb("materiales_actividades").$type<RegistroClinicoMaterial[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type RegistroClinico = typeof registrosClinicosTable.$inferSelect;
export type InsertRegistroClinico = typeof registrosClinicosTable.$inferInsert;
