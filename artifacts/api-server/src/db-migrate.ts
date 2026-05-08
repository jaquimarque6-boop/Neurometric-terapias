import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

export async function runMigrations(): Promise<void> {
  const stmts = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expiry TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_usage_count INTEGER NOT NULL DEFAULT 0`,
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      target_user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
  ];

  for (const stmt of stmts) {
    await db.execute(sql.raw(stmt));
  }

  console.log("[migrate] Schema up to date.");
}
