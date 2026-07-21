import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

// Log mínimo de auditoría de eliminaciones definitivas de usuarios.
// No conserva ningún dato clínico: solo quién eliminó, a quién y conteos.
export const deletionLogTable = pgTable("deletion_log", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull(),
  adminName: text("admin_name").notNull(),
  deletedUserId: integer("deleted_user_id").notNull(),
  deletedUserName: text("deleted_user_name").notNull(),
  deletedUserEmail: text("deleted_user_email").notNull(),
  patientsDeleted: integer("patients_deleted").notNull().default(0),
  recordsDeleted: integer("records_deleted").notNull().default(0),
  filesDeleted: integer("files_deleted").notNull().default(0),
  storageErrors: text("storage_errors"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
