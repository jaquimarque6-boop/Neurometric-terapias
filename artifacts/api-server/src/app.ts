import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import path from "path";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";
import router from "./routes";
import { seedAdminIfNeeded, ensureJaquiAdmin, ensureTempAdmin } from "./routes/auth";
import { seedGoalLibraryIfNeeded } from "./seeds/goal-library-seed";
import { seedFromSupabaseIfNeeded } from "./seeds/supabase-migration-seed";
import { runMigrations } from "./db-migrate";

const PgSession = connectPgSimple(session);

const isProduction = process.env.NODE_ENV === "production";

const app: Express = express();

app.set("trust proxy", 1);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  store: new PgSession({
    pool,
    tableName: "express_sessions",
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET ?? "neurometric-secret-key-2024",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: "lax",
  },
}));

app.use("/api", router);

const frontendDist = path.resolve(process.cwd(), "../neurometric-lab/dist");
console.log("[static] serving frontend from", frontendDist);
app.use(express.static(frontendDist));
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(frontendDist, "index.html"));
});

(async () => {
  try {
    await runMigrations();
  } catch (e) {
    console.error("[migrate] Error running migrations:", e);
  }
  seedAdminIfNeeded().catch(console.error);
  ensureJaquiAdmin().catch(console.error);
  ensureTempAdmin().catch(console.error);
  seedGoalLibraryIfNeeded().catch(console.error);
  seedFromSupabaseIfNeeded().catch(console.error);
})();

export default app;
