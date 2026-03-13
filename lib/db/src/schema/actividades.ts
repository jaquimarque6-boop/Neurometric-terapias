import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const actividadesTable = pgTable("actividades", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  descripcion: text("descripcion"),
  tipo: text("tipo").notNull().default("clinica"),
  area: text("area"),
  subarea: text("subarea"),
  franjaEtaria: text("franja_etaria"),
  recursos: text("recursos"),
  goalLibraryId: integer("goal_library_id"),
  objetivoNombre: text("objetivo_nombre"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Actividad = typeof actividadesTable.$inferSelect;
export type InsertActividad = typeof actividadesTable.$inferInsert;
