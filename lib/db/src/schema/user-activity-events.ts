import { sql } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, check } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const USER_ACTIVITY_EVENT_TYPES = [
  "login",
  "clinical_record_saved",
  "patient_saved",
  "goal_saved",
  "report_saved",
  "ai_used",
] as const;

export type UserActivityEventType = (typeof USER_ACTIVITY_EVENT_TYPES)[number];

export const userActivityEventsTable = pgTable("user_activity_events", {
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  eventType: text("event_type").$type<UserActivityEventType>().notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  check(
    "user_activity_events_event_type_check",
    sql`${table.eventType} in ('login', 'clinical_record_saved', 'patient_saved', 'goal_saved', 'report_saved', 'ai_used')`,
  ),
  index("user_activity_events_user_type_time_idx").on(table.userId, table.eventType, table.occurredAt),
  index("user_activity_events_time_idx").on(table.occurredAt),
]);