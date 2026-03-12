import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const goalLibraryTable = pgTable("goal_library", {
  id: serial("id").primaryKey(),
  goalId: text("goal_id").notNull().unique(),
  module: text("module").notNull(),
  ageRangeMin: integer("age_range_min"),
  ageRangeMax: integer("age_range_max"),
  area: text("area").notNull(),
  subarea: text("subarea").notNull(),
  goalName: text("goal_name").notNull(),
  clinicalDescription: text("clinical_description").notNull(),
  successIndicator: text("success_indicator").notNull(),
  suggestedActivities: text("suggested_activities"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGoalLibrarySchema = createInsertSchema(goalLibraryTable).omit({ id: true, createdAt: true });
export type InsertGoalLibrary = z.infer<typeof insertGoalLibrarySchema>;
export type GoalLibrary = typeof goalLibraryTable.$inferSelect;
