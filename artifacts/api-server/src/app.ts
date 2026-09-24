import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
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
// The manuscript endpoint receives one compressed image as JSON. Keep the
// larger body limit scoped to that route instead of changing all API payloads.
app.use("/api/ai/manuscrito-transcribe", express.json({ limit: "12mb" }));
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

function isPublicApiRoute(req: express.Request): boolean {
  return (
    req.url.startsWith("/api/auth/login") ||
    req.url.startsWith("/api/auth/register") ||
    req.url.startsWith("/api/auth/logout") ||
    req.url.startsWith("/api/health")
  );
}

// ─── Centralized current-user validation ──────────────────────────────────────
// Cross-origin deployments (Netlify ↔ Render) suffer from third-party cookie
// blocking in Safari and Chrome 120+. If the session cookie was dropped by the
// browser, we fall back to a signed Bearer token sent via Authorization header.
//
// Every authenticated request now resolves the user from the database before
// reaching a route. This deliberately ignores the role carried by a Bearer
// token: active status and the current role must come from `users`.
app.use(async (req, res, next) => {
  // Only log auth resolution for /api routes to avoid noise on static assets.
  const isApi = req.url.startsWith("/api");

  // Login, public registration, logout, and health must be able to run without
  // a currently valid account. Logout also needs to work for a just-deactivated
  // account so its old cookie can be destroyed cleanly.
  if (isPublicApiRoute(req)) return next();

  let authSource: "cookie-session" | "bearer-token" | null = null;

  if (req.session.userId) {
    authSource = "cookie-session";
    if (isApi) {
      console.log(
        `[auth] ✓ cookie-session | ${req.method} ${req.url}` +
        ` | userId=${req.session.userId} role=${req.session.userRole ?? "?"}`
      );
    }
  } else {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const claims = verifyAuthToken(token);
      if (claims) {
        // The token identifies the account, but its role is not authoritative.
        req.session.userId = claims.userId;
        authSource = "bearer-token";
        if (isApi) {
          console.log(
            `[auth] ✓ bearer-token | ${req.method} ${req.url}` +
            ` | userId=${claims.userId}` +
            ` | origin=${req.headers.origin ?? "none"}`
          );
        }
      } else if (isApi) {
        console.warn(
          `[auth] ✗ token inválido o expirado | ${req.method} ${req.url}` +
          ` | origin=${req.headers.origin ?? "none"}`
        );
      }
    } else if (isApi) {
      console.log(
        `[auth] · sin credenciales | ${req.method} ${req.url}` +
        ` | cookie=${req.headers.cookie ? "presente" : "ausente"}` +
        ` | authHeader=${authHeader ? "presente-no-bearer" : "ausente"}` +
        ` | origin=${req.headers.origin ?? "none"}`
      );
    }
  }

  if (!authSource || !req.session.userId) return next();

  try {
    const [currentUser] = await db
      .select({
        id: usersTable.id,
        role: usersTable.role,
        active: usersTable.active,
        professionalId: usersTable.professionalId,
        name: usersTable.name,
        email: usersTable.email,
        specialty: usersTable.specialty,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.session.userId));

    if (!currentUser || !currentUser.active) {
      return req.session.destroy((err) => {
        if (err) console.error("[auth] error al destruir sesión inválida:", err);
        return res.status(401).json({ error: "No autenticado" });
      });
    }

    // Refresh all authorization-relevant session fields from the database.
    // This immediately reflects active/role changes without forcing active
    // users to log in again.
    req.session.userId = currentUser.id;
    req.session.userRole = currentUser.role;
    req.session.professionalId = currentUser.professionalId ?? null;
    req.session.userName = currentUser.name;
    req.session.userEmail = currentUser.email;
    req.session.userSpecialty = currentUser.specialty ?? null;
    return next();
  } catch (err) {
    console.error("[auth] error al validar usuario actual:", err);
    return res.status(503).json({ error: "No se pudo validar la sesión" });
  }
});

app.use("/api", router);

seedAdminIfNeeded().catch(console.error);
ensureJaquiAdmin().catch(console.error);
ensureTempAdmin().catch(console.error);
seedGoalLibraryIfNeeded().catch(console.error);
seedFromSupabaseIfNeeded().catch(console.error);

export default app;
