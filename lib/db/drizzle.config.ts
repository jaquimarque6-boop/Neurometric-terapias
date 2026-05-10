import { defineConfig } from "drizzle-kit";
import path from "path";

function getDbUrl(): string {
  if (process.env.PGHOST && process.env.PGDATABASE) {
    const user = encodeURIComponent(process.env.PGUSER ?? "postgres");
    const password = process.env.PGPASSWORD ? encodeURIComponent(process.env.PGPASSWORD) : "";
    const host = process.env.PGHOST;
    const port = process.env.PGPORT ?? "5432";
    const db = process.env.PGDATABASE;
    const auth = password ? `${user}:${password}` : user;
    const isLocal = host === "helium" || host === "localhost" || host === "127.0.0.1";
    const sslMode = isLocal ? "sslmode=disable" : "sslmode=require";
    return `postgresql://${auth}@${host}:${port}/${db}?${sslMode}`;
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL, ensure the database is provisioned");
  }
  return process.env.DATABASE_URL;
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: getDbUrl(),
  },
});
