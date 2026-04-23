import { pgTable, text, serial, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pagosTable = pgTable("pagos", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  monto: numeric("monto", { precision: 10, scale: 2 }).notNull(),
  mes: text("mes").notNull(),
  tipo: text("tipo").notNull().default("particular"),
  nombreObraSocial: text("nombre_obra_social"),
  fecha: text("fecha").notNull(),
  estado: text("estado").notNull().default("pendiente"),
  notas: text("notas"),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPagoSchema = createInsertSchema(pagosTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPago = z.infer<typeof insertPagoSchema>;
export type Pago = typeof pagosTable.$inferSelect;
