import { pgTable, serial, integer, text, timestamp, unique, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./users";

export const userConsentAcceptancesTable = pgTable("user_consent_acceptances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  consentType: text("consent_type").notNull(),
  version: text("version").notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }).notNull().defaultNow(),
  acceptedByUserId: integer("accepted_by_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
}, table => [
  unique("user_consent_acceptances_user_type_version_unique").on(table.userId, table.consentType, table.version),
  check("user_consent_acceptances_consent_type_check", sql`${table.consentType} in ('terms', 'privacy', 'ai')`),
  check("user_consent_acceptances_actor_is_owner", sql`${table.acceptedByUserId} = ${table.userId}`),
]);

export type UserConsentAcceptance = typeof userConsentAcceptancesTable.$inferSelect;