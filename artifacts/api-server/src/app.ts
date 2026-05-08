import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import path from "path";
import fs from "fs";
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

const frontendDist = path.resolve(process.cwd(), "artifacts/neurometric-lab/dist");
const indexHtml = path.join(frontendDist, "index.html");
console.log("[static] cwd:", process.cwd());
console.log("[static] serving frontend from", frontendDist);
console.log("[static] index exists?", fs.existsSync(indexHtml));
console.log("[static] assets exist?", fs.existsSync(path.join(frontendDist, "assets")));

app.use(express.static(frontendDist));

app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  if (!fs.existsSync(indexHtml)) {
    console.error("[static] index.html NOT FOUND at", indexHtml);
    res.status(503).send(
      `<h1>Frontend no compilado</h1><p>Buscando en: ${indexHtml}</p>` +
      `<p>cwd: ${process.cwd()}</p>`
    );
    return;
  }
  fs.readFile(indexHtml, (err, data) => {
    if (err) {
      console.error("[static] readFile error:", err.message);
      res.status(500).send(`<h1>Error leyendo index.html</h1><p>${err.message}</p>`);
      return;
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.end(data);
  });
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
