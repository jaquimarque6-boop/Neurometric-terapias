import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import {
  insertPersonalNoteSchema,
  updatePersonalNoteSchema,
  type PersonalNote,
} from "@workspace/db/schema";

export type PersonalNoteCreate = Pick<PersonalNote, "content"> & {
  reminderDate?: string | null;
};

export type PersonalNoteUpdate = Partial<Pick<
  PersonalNote,
  "content" | "reminderDate" | "isPinned" | "isCompleted"
>>;

export interface PersonalNotesStore {
  list(userId: number): Promise<PersonalNote[]>;
  create(userId: number, input: PersonalNoteCreate): Promise<PersonalNote>;
  update(userId: number, noteId: number, input: PersonalNoteUpdate): Promise<PersonalNote | null>;
  delete(userId: number, noteId: number): Promise<boolean>;
}

function sessionUserId(req: Request): number | null {
  const value = req.session?.userId;
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

function parsedNoteId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

export function createPersonalNotesRouter(store: PersonalNotesStore): IRouter {
  const router: IRouter = Router();

  router.use("/personal-notes", (req: Request, res: Response, next: NextFunction) => {
    const userId = sessionUserId(req);
    if (!userId) return res.status(401).json({ error: "No autenticado" });
    const role = req.session?.userRole;
    if (role !== "professional" && role !== "admin") {
      return res.status(403).json({ error: "Acceso reservado a usuarios de Neurometric" });
    }
    return next();
  });

  router.get("/personal-notes", async (req, res) => {
    const userId = sessionUserId(req)!;
    return res.json(await store.list(userId));
  });

  router.post("/personal-notes", async (req, res) => {
    const userId = sessionUserId(req)!;
    const parsed = insertPersonalNoteSchema
      .pick({ content: true, reminderDate: true })
      .strict()
      .safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Datos de nota inválidos" });
    }
    const note = await store.create(userId, parsed.data);
    return res.status(201).json(note);
  });

  router.patch("/personal-notes/:id", async (req, res) => {
    const userId = sessionUserId(req)!;
    const noteId = parsedNoteId(req.params.id);
    if (!noteId) return res.status(400).json({ error: "Identificador de nota inválido" });

    const parsed = updatePersonalNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Datos de nota inválidos" });
    }

    const note = await store.update(userId, noteId, parsed.data);
    if (!note) return res.status(404).json({ error: "Nota no encontrada" });
    return res.json(note);
  });

  router.delete("/personal-notes/:id", async (req, res) => {
    const userId = sessionUserId(req)!;
    const noteId = parsedNoteId(req.params.id);
    if (!noteId) return res.status(400).json({ error: "Identificador de nota inválido" });
    const deleted = await store.delete(userId, noteId);
    if (!deleted) return res.status(404).json({ error: "Nota no encontrada" });
    return res.status(204).end();
  });

  return router;
}
