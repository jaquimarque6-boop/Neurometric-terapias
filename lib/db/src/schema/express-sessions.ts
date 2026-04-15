import { pgTable, varchar, json, timestamp } from "drizzle-orm/pg-core";

export const expressSessionsTable = pgTable("express_sessions", {
  sid: varchar("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire").notNull(),
});
