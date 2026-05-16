import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";
import router from "./routes";
import { seedAdminIfNeeded, ensureJaquiAdmin, ensureTempAdmin } from "./routes/auth";
import { seedGoalLibraryIfNeeded } from "./seeds/goal-library-seed";
import { seedFromSupabaseIfNeeded } from "./seeds/supabase-migration-seed";
import { verifyAuthToken } from "./auth-token";

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

// ─── CORS — pinned exact origins + regex patterns ────────────────────────────
// PINNED_ORIGINS: exact-match strings checked first — guaranteed to pass.
const PINNED_ORIGINS: string[] = [
  "https://neurometricterapias.com",
  "https://www.neurometricterapias.com",
  "https://neurometricterapias.netlify.app",
];

// CORS_PATTERNS: regex catch-all for subdomains, preview URLs, localhost.
const CORS_PATTERNS: RegExp[] = [
  /^https:\/\/[^.]+\.neurometricterapias\.com$/,
  /^https:\/\/[^.]+\.netlify\.app$/,
  /^https:\/\/[^.]+\.onrender\.com$/,
  /^https:\/\/[^.]+\.(replit\.dev|replit\.app)$/,
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
];

// Optional extra origins from env (comma-separated) — escape hatch for ops.
const EXTRA_ORIGINS: string[] = (process.env.EXTRA_ORIGINS ?? "")
  .split(",").map(s => s.trim()).filter(Boolean);

function isOriginAllowed(origin: string): boolean {
  if (PINNED_ORIGINS.includes(origin)) return true;
  if (EXTRA_ORIGINS.includes(origin)) return true;
  return CORS_PATTERNS.some(re => re.test(origin));
}

console.log(`[cors] dynamic origin matching active`);
console.log(`[cors] pinned: ${PINNED_ORIGINS.join(" | ")}`);
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

// ─── Token-based auth fallback ────────────────────────────────────────────────
// Cross-origin deployments (Netlify ↔ Render) suffer from third-party cookie
// blocking in Safari and Chrome 120+. If the session cookie was dropped by the
// browser, we fall back to a signed Bearer token sent via Authorization header.
// All existing route files check req.session.userId — populating it here means
// every route works without changes.
app.use((req, _res, next) => {
  if (req.session.userId) return next(); // cookie session already active

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const claims = verifyAuthToken(token);
    if (claims) {
      req.session.userId    = claims.userId;
      req.session.userRole  = claims.role;
      console.log(`[auth-token] ✓ sesión restaurada desde token | userId=${claims.userId} role=${claims.role}`);
    } else {
      console.warn(`[auth-token] token inválido o expirado`);
    }
  }
  next();
});

app.use("/api", router);

seedAdminIfNeeded().catch(console.error);
ensureJaquiAdmin().catch(console.error);
ensureTempAdmin().catch(console.error);
seedGoalLibraryIfNeeded().catch(console.error);
seedFromSupabaseIfNeeded().catch(console.error);

export default app;
