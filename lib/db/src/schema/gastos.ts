import { pgTable, text, serial, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gastosTable = pgTable("gastos", {
  id: serial("id").primaryKey(),
  fecha: text("fecha").notNull(),
  monto: numeric("monto", { precision: 10, scale: 2 }).notNull(),
  observacion: text("observacion"),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertGastoSchema = createInsertSchema(gastosTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGasto = z.infer<typeof insertGastoSchema>;
export type Gasto = typeof gastosTable.$inferSelect;
