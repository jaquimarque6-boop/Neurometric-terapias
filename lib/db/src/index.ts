import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

function buildPool(): pg.Pool {
  if (process.env.PGHOST && process.env.PGDATABASE) {
    const isLocal = process.env.PGHOST === "helium" || process.env.PGHOST === "localhost" || process.env.PGHOST === "127.0.0.1";
    return new Pool({
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT ?? "5432"),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    });
  }
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

export const pool = buildPool();
export const db = drizzle(pool, { schema });

export * from "./schema";
