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

// Cross-origin cookie settings are required whenever the frontend and backend
// are on different domains (Netlify + Render). We do NOT rely solely on NODE_ENV
// because Render may not set it automatically.
// SameSite=None + Secure=true is safe:
//   - Render: HTTPS-only ✓
//   - Netlify: HTTPS-only, cookies sent cross-origin ✓
//   - localhost: Chrome/Firefox treat localhost as a secure context ✓
const isLocalDev =
  process.env.NODE_ENV !== "production" &&
  !process.env.RENDER &&
  !process.env.FRONTEND_URL;

// In local dev (no RENDER env, no FRONTEND_URL) use lax/non-secure to keep
// the dev cookie working over plain HTTP on localhost.
const cookieSameSite: "none" | "lax" = isLocalDev ? "lax" : "none";
const cookieSecure: boolean = !isLocalDev;

console.log(`[app] isLocalDev=${isLocalDev} cookieSameSite=${cookieSameSite} cookieSecure=${cookieSecure} NODE_ENV=${process.env.NODE_ENV ?? "unset"}`);

const ALLOWED_ORIGINS = [
  "https://neurometrict.netlify.app",
  "https://neurometric-terapias-backend.onrender.com",
  "http://localhost:3000",
  "http://localhost:5173",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

const app: Express = express();

// Required on Render (behind a reverse proxy) so Express sees the real HTTPS
// protocol and sets req.secure = true, which allows Secure cookies to be set.
app.set("trust proxy", 1);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      ALLOWED_ORIGINS.includes(origin) ||
      /\.netlify\.app$/.test(origin) ||
      /\.onrender\.com$/.test(origin) ||
      /^https?:\/\/localhost(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    console.warn(`[cors] blocked origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
}));
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
    secure: cookieSecure,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: cookieSameSite,
  },
}));

app.use("/api", router);

seedAdminIfNeeded().catch(console.error);
ensureJaquiAdmin().catch(console.error);
ensureTempAdmin().catch(console.error);
seedGoalLibraryIfNeeded().catch(console.error);
seedFromSupabaseIfNeeded().catch(console.error);

export default app;
