import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const goalLibraryTable = pgTable("goal_library", {
  id: serial("id").primaryKey(),
  idObjetivo: text("id_objetivo").notNull().unique(),
  nombreObjetivo: text("nombre_objetivo").notNull(),
  modulo: text("modulo").notNull(),
  area: text("area").notNull(),
  areaClinica: text("area_clinica"),
  subarea: text("subarea"),
  franjaEtaria: text("franja_etaria"),
  franjaEtariaMin: integer("franja_etaria_min"),
  franjaEtariaMax: integer("franja_etaria_max"),
  nivelDificultad: text("nivel_dificultad").notNull().default("básico"),
  estadoBanco: text("estado_banco").notNull().default("activo"),
  definicionOperativa: text("definicion_operativa"),
  actividadesClinicas: text("actividades_clinicas"),
  actividadesFamilia: text("actividades_familia"),
  habilidadesRelacionadas: text("habilidades_relacionadas"),
  prerequisitos: text("prerequisitos"),
  metaPorcentaje: text("meta_porcentaje"),
  indicadorTipo: text("indicador_tipo"),
  intentosSugeridos: text("intentos_sugeridos"),
  marcoConceptual: text("marco_conceptual"),
  nivel1Descripcion: text("nivel_1_descripcion"),
  nivel2Descripcion: text("nivel_2_descripcion"),
  nivel3Descripcion: text("nivel_3_descripcion"),
  recomendacionClinica: text("recomendacion_clinica"),
  informeTecnico: text("informe_tecnico"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type GoalLibrary = typeof goalLibraryTable.$inferSelect;
export type InsertGoalLibrary = typeof goalLibraryTable.$inferInsert;
