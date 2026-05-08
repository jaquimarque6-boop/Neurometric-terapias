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

// process.argv[1] = absolute path of the running script (Node always resolves it)
// e.g. /opt/render/project/src/artifacts/api-server/dist/index.cjs
// 2 niveles arriba de dist/ → artifacts/ → neurometric-lab/dist
const _scriptDir = path.dirname(path.resolve(process.argv[1] ?? ""));
const _frontendByScript = path.resolve(_scriptDir, "..", "..", "neurometric-lab", "dist");
// fallback: cwd (funciona si Root Directory = raíz del repo)
const _frontendByCwd = path.resolve(process.cwd(), "artifacts", "neurometric-lab", "dist");

const frontendDist = fs.existsSync(path.join(_frontendByScript, "index.html"))
  ? _frontendByScript
  : _frontendByCwd;

console.log("[static] script dir:", _scriptDir);
console.log("[static] cwd:", process.cwd());
console.log("[static] serving frontend from", frontendDist);
console.log("[static] index.html exists?", fs.existsSync(path.join(frontendDist, "index.html")));

app.use(express.static(frontendDist));

app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next();

  res.sendFile(path.join(frontendDist, "index.html"), (err) => {
    if (err && !res.headersSent) {
      console.error("[static] sendFile error:", err.message, "| path:", frontendDist);
      res.status(503).send("Frontend no disponible: " + err.message);
    }
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
