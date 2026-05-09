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

const isProduction = process.env.NODE_ENV === "production";

const ALLOWED_ORIGINS = [
  "https://neurometrict.netlify.app",
  "https://neurometric-terapias-backend.onrender.com",
  "http://localhost:3000",
  "http://localhost:5173",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

const app: Express = express();

app.set("trust proxy", 1);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      ALLOWED_ORIGINS.includes(origin) ||
      /\.netlify\.app$/.test(origin) ||
      /\.onrender\.com$/.test(origin)
    ) {
      return callback(null, true);
    }
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
    secure: isProduction,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: isProduction ? "none" : "lax",
  },
}));

app.use("/api", router);

seedAdminIfNeeded().catch(console.error);
ensureJaquiAdmin().catch(console.error);
ensureTempAdmin().catch(console.error);
seedGoalLibraryIfNeeded().catch(console.error);
seedFromSupabaseIfNeeded().catch(console.error);

export default app;
