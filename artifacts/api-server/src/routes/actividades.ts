import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { actividadesTable } from "@workspace/db/schema";

const router: IRouter = Router();

router.get("/actividades", async (req, res) => {
  let activities = await db.select().from(actividadesTable).orderBy(actividadesTable.area);

  const { franjaEtaria, area, tipo } = req.query;
  if (franjaEtaria) activities = activities.filter(a => a.franjaEtaria === franjaEtaria);
  if (area) activities = activities.filter(a => a.area === area);
  if (tipo) activities = activities.filter(a => a.tipo === tipo);

  res.json(activities.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })));
});

export default router;
