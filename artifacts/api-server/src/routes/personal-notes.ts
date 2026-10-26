import { and, desc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { personalNotesTable } from "@workspace/db/schema";
import {
  createPersonalNotesRouter,
  type PersonalNotesStore,
} from "./personal-notes-handler";

const store: PersonalNotesStore = {
  list: userId => db.select().from(personalNotesTable)
    .where(eq(personalNotesTable.userId, userId))
    .orderBy(desc(personalNotesTable.createdAt)),

  create: async (userId, input) => {
    const [note] = await db.insert(personalNotesTable)
      .values({ ...input, userId })
      .returning();
    return note;
  },

  update: async (userId, noteId, input) => {
    const [note] = await db.update(personalNotesTable)
      .set({ ...input, updatedAt: new Date() })
      .where(and(
        eq(personalNotesTable.id, noteId),
        eq(personalNotesTable.userId, userId),
      ))
      .returning();
    return note ?? null;
  },

  delete: async (userId, noteId) => {
    const deleted = await db.delete(personalNotesTable)
      .where(and(
        eq(personalNotesTable.id, noteId),
        eq(personalNotesTable.userId, userId),
      ))
      .returning({ id: personalNotesTable.id });
    return deleted.length > 0;
  },
};

export default createPersonalNotesRouter(store);
