import assert from "node:assert/strict";
import { after, test } from "node:test";
import { once } from "node:events";
import express from "express";
import type { PersonalNote, PersonalNoteCreate, PersonalNoteUpdate, PersonalNotesStore } from "../src/routes/personal-notes-handler";
import { createPersonalNotesRouter } from "../src/routes/personal-notes-handler";

const notes: PersonalNote[] = [];
let nextId = 1;

const store: PersonalNotesStore = {
  async list(userId) {
    return notes.filter(note => note.userId === userId);
  },
  async create(userId, input: PersonalNoteCreate) {
    const now = new Date();
    const note: PersonalNote = {
      id: nextId++,
      userId,
      content: input.content,
      reminderDate: input.reminderDate ?? null,
      isPinned: false,
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
    };
    notes.push(note);
    return note;
  },
  async update(userId, noteId, input: PersonalNoteUpdate) {
    const note = notes.find(candidate => candidate.id === noteId && candidate.userId === userId);
    if (!note) return null;
    Object.assign(note, input, { updatedAt: new Date() });
    return note;
  },
  async delete(userId, noteId) {
    const index = notes.findIndex(candidate => candidate.id === noteId && candidate.userId === userId);
    if (index < 0) return false;
    notes.splice(index, 1);
    return true;
  },
};

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  const rawId = req.header("x-test-user-id");
  const role = req.header("x-test-user-role") ?? "professional";
  (req as any).session = rawId ? { userId: Number(rawId), userRole: role } : {};
  next();
});
app.use("/api", createPersonalNotesRouter(store));

const server = app.listen(0);
await once(server, "listening");
const address = server.address();
if (!address || typeof address === "string") throw new Error("Test server unavailable");
const base = `http://127.0.0.1:${address.port}/api`;
const request = async (method: string, path: string, userId?: number, body?: unknown, role = "professional") => {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(userId === undefined ? {} : { "x-test-user-id": String(userId), "x-test-user-role": role }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return {
    status: response.status,
    body: response.status === 204 ? null : await response.json().catch(() => null),
  };
};

after(() => {
  server.close();
});

test("autentica, valida y mantiene aisladas las notas por cuenta", async () => {
  assert.equal((await request("GET", "/personal-notes")).status, 401);
  assert.equal((await request("GET", "/personal-notes", 30, undefined, "collaborator")).status, 403);

  const createdA = await request("POST", "/personal-notes", 30, {
    content: "Nota privada A",
    reminderDate: "2026-10-29",
  });
  const createdB = await request("POST", "/personal-notes", 31, {
    content: "Nota privada B",
  }, "admin");
  assert.equal(createdA.status, 201);
  assert.equal(createdB.status, 201);
  assert.equal(createdA.body.userId, 30);
  assert.equal(createdB.body.userId, 31);

  const aId = createdA.body.id as number;
  const bId = createdB.body.id as number;
  assert.deepEqual((await request("GET", "/personal-notes", 30)).body.map((note: PersonalNote) => note.id), [aId]);
  assert.deepEqual((await request("GET", "/personal-notes", 31)).body.map((note: PersonalNote) => note.id), [bId]);

  assert.equal((await request("POST", "/personal-notes", 30, {
    content: "No aceptar propietario del cliente",
    userId: 31,
  })).status, 400);
  assert.equal((await request("PATCH", `/personal-notes/${bId}`, 30, { content: "Intrusión" })).status, 404);
  assert.equal((await request("DELETE", `/personal-notes/${bId}`, 30)).status, 404);
  assert.equal((await request("GET", "/personal-notes", 31)).body[0].content, "Nota privada B");

  assert.equal((await request("POST", "/personal-notes", 30, { content: "  " })).status, 400);
  assert.equal((await request("POST", "/personal-notes", 30, {
    content: "Fecha imposible",
    reminderDate: "2026-02-30",
  })).status, 400);
  assert.equal((await request("PATCH", `/personal-notes/${aId}`, 30, {})).status, 400);

  const updated = await request("PATCH", `/personal-notes/${aId}`, 30, {
    isPinned: true,
    isCompleted: true,
    reminderDate: null,
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.isPinned, true);
  assert.equal(updated.body.isCompleted, true);
  assert.equal(updated.body.reminderDate, null);

  assert.equal((await request("DELETE", `/personal-notes/${aId}`, 30)).status, 204);
  assert.deepEqual((await request("GET", "/personal-notes", 30)).body, []);
});
