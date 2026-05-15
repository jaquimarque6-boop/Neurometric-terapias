import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";
import router from "./routes";
import { seedAdminIfNeeded, ensureJaquiAdmin, ensureTempAdmin } from "./routes/auth";
import { seedGoalLibraryIfNeeded } from "./seeds/goal-library-seed";
import { seedFromSupabaseIfNeeded } from "./seeds/supabase-migration-seed";

const PgSession = connectPgSimple(session);

// Always use SameSite=None; Secure for cross-origin cookie support.
// This is required for Netlify (frontend) ↔ Render (backend) communication.
//
// Why always-on is safe:
//   - Render: HTTPS only → Secure flag works ✓
//   - Netlify: cross-origin requests carry cookies with SameSite=None ✓
//   - Chrome localhost: treats localhost as a secure context even over HTTP ✓
//   - Firefox localhost: allows Secure cookies from http://localhost ✓
//
// Previous approach (detecting RENDER env var) was unreliable because
// RENDER is NOT automatically injected by Render's platform.
console.log(`[app] cookieSameSite=none cookieSecure=true NODE_ENV=${process.env.NODE_ENV ?? "unset"}`);

// ─── Dynamic CORS — NO hardcoded list ────────────────────────────────────────
// Any origin is allowed if it matches one of the patterns below.
// Adding a new domain never requires a code change or redeploy of this file.
const CORS_PATTERNS: RegExp[] = [
  // Any subdomain or apex of neurometricterapias.com
  //   ✓ https://neurometricterapias.com
  //   ✓ https://www.neurometricterapias.com
  //   ✓ https://app.neurometricterapias.com
  /^https:\/\/([\w-]+\.)*neurometricterapias\.com$/,

  // Any Netlify deploy URL
  //   ✓ https://neurometrict.netlify.app
  //   ✓ https://neurometricterapias.netlify.app
  /^https:\/\/[\w-]+\.netlify\.app$/,

  // Render backend self-requests
  /^https:\/\/[\w-]+\.onrender\.com$/,

  // Replit preview / published domains
  /^https:\/\/[\w-]+\.(replit\.dev|replit\.app)$/,

  // Local development — any port
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
];

// Optional extra origins from env (comma-separated) — escape hatch for ops.
// Example: EXTRA_ORIGINS=https://staging.example.com
const EXTRA_ORIGINS: string[] = (process.env.EXTRA_ORIGINS ?? "")
  .split(",").map(s => s.trim()).filter(Boolean);

function isOriginAllowed(origin: string): boolean {
  if (EXTRA_ORIGINS.includes(origin)) return true;
  return CORS_PATTERNS.some(re => re.test(origin));
}

console.log(`[cors] dynamic origin matching active`);
console.log(`[cors] patterns: *.neurometricterapias.com | *.netlify.app | *.onrender.com | localhost`);

const app: Express = express();

// Required on Render (behind a reverse proxy) so Express sees the real HTTPS
// protocol and sets req.secure = true, which allows Secure cookies to be set.
app.set("trust proxy", 1);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    console.warn(`[cors] blocked origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pgSessionStore = new PgSession({
  pool,
  tableName: "express_sessions",
  createTableIfMissing: true,
  errorLog: (...args: unknown[]) => console.error("[session-store ERROR]", ...args),
});

pgSessionStore.on?.("disconnect", () => console.error("[session-store] PostgreSQL disconnected"));
pgSessionStore.on?.("connect",    () => console.log("[session-store] PostgreSQL connected"));

app.use(session({
  store: pgSessionStore,
  secret: process.env.SESSION_SECRET ?? "neurometric-secret-key-2024",
  resave: false,
  saveUninitialized: false,
  // proxy: true — explicitly trust X-Forwarded-Proto from Render's reverse proxy.
  // Belt-and-suspenders alongside app.set("trust proxy", 1).
  // Without this, express-session may NOT emit Set-Cookie when secure:true
  // because it sees the raw HTTP connection to Render's container (not HTTPS).
  proxy: true,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: "none",
  },
}));

app.use("/api", router);

seedAdminIfNeeded().catch(console.error);
ensureJaquiAdmin().catch(console.error);
ensureTempAdmin().catch(console.error);
seedGoalLibraryIfNeeded().catch(console.error);
seedFromSupabaseIfNeeded().catch(console.error);

export default app;
