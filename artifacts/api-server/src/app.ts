import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";
import router from "./routes";
import { seedAdminIfNeeded } from "./routes/auth";
import { seedGoalLibraryIfNeeded } from "./seeds/goal-library-seed";

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

seedAdminIfNeeded().catch(console.error);
seedGoalLibraryIfNeeded().catch(console.error);

export default app;
