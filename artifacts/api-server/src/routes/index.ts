import { Router, type IRouter } from "express";
import healthRouter from "./health";
import patientsRouter from "./patients";
import professionalsRouter from "./professionals";
import sessionsRouter from "./sessions";
import goalsRouter from "./goals";
import dashboardRouter from "./dashboard";
import goalLibraryRouter from "./goal-library";
import registrosClinicosRouter from "./registros-clinicos";
import actividadesRouter from "./actividades";
import patientProfessionalsRouter from "./patient-professionals";

const router: IRouter = Router();

router.use(healthRouter);
router.use(patientsRouter);
router.use(professionalsRouter);
router.use(sessionsRouter);
router.use(goalsRouter);
router.use(dashboardRouter);
router.use(goalLibraryRouter);
router.use(registrosClinicosRouter);
router.use(actividadesRouter);
router.use(patientProfessionalsRouter);

export default router;
