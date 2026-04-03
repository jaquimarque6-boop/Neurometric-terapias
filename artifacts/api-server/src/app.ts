import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import router from "./routes";
import { seedAdminIfNeeded } from "./routes/auth";
import { seedGoalLibraryIfNeeded } from "./seeds/goal-library-seed";

const app: Express = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET ?? "neurometric-secret-key-2024",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));

app.use("/api", router);

seedAdminIfNeeded().catch(console.error);
seedGoalLibraryIfNeeded().catch(console.error);

export default app;
