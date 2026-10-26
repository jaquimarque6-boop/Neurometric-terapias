import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { boolean, check, date, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { usersTable } from "./users";

const calendarDateSchema = z.string().refine(value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "La fecha debe ser válida y usar el formato AAAA-MM-DD");

export const personalNotesTable = pgTable("personal_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  reminderDate: date("reminder_date", { mode: "string" }),
  isPinned: boolean("is_pinned").notNull().default(false),
  isCompleted: boolean("is_completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, table => [
  check(
    "personal_notes_content_nonempty_check",
    sql`length(trim(${table.content})) between 1 and 10000`,
  ),
  index("personal_notes_user_created_idx").on(table.userId, table.createdAt),
  index("personal_notes_user_reminder_idx").on(table.userId, table.isCompleted, table.reminderDate),
]);

export const insertPersonalNoteSchema = createInsertSchema(personalNotesTable)
  .omit({ id: true, userId: true, createdAt: true, updatedAt: true })
  .extend({
    content: z.string().trim().min(1, "Escribe el contenido de la nota").max(10000),
    reminderDate: calendarDateSchema.nullable().optional(),
  });

export const updatePersonalNoteSchema = insertPersonalNoteSchema
  .partial()
  .strict()
  .refine(value => Object.keys(value).length > 0, "Indica al menos un cambio");

export type PersonalNote = typeof personalNotesTable.$inferSelect;
export type InsertPersonalNote = z.infer<typeof insertPersonalNoteSchema>;
