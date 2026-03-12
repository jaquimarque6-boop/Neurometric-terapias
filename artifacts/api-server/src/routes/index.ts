import { Router, type IRouter } from "express";
import healthRouter from "./health";
import patientsRouter from "./patients";
import professionalsRouter from "./professionals";
import sessionsRouter from "./sessions";
import goalsRouter from "./goals";
import dashboardRouter from "./dashboard";
import goalLibraryRouter from "./goal-library";

const router: IRouter = Router();

router.use(healthRouter);
router.use(patientsRouter);
router.use(professionalsRouter);
router.use(sessionsRouter);
router.use(goalsRouter);
router.use(dashboardRouter);
router.use(goalLibraryRouter);

export default router;
