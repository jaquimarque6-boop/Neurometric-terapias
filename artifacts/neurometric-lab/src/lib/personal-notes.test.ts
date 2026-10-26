import assert from "node:assert/strict";
import test from "node:test";
import {
  formatNoteReminder,
  formatNoteCreatedAt,
  getLocalDateKey,
  isNoteOverdue,
  sortPersonalNotes,
  type PersonalNote,
} from "./personal-notes";

function note(id: number, overrides: Partial<PersonalNote> = {}): PersonalNote {
  return {
    id,
    userId: 1,
    content: `Nota ${id}`,
    reminderDate: null,
    isPinned: false,
    isCompleted: false,
    createdAt: `2026-10-${String(id).padStart(2, "0")}T12:00:00.000Z`,
    updatedAt: `2026-10-${String(id).padStart(2, "0")}T12:00:00.000Z`,
    ...overrides,
  };
}

test("ordena fijadas y recordatorios activos antes que notas comunes y completadas", () => {
  const input = [
    note(1),
    note(2, { isCompleted: true, isPinned: true }),
    note(3, { reminderDate: "2026-10-29" }),
    note(4, { isPinned: true }),
    note(5, { reminderDate: "2026-10-27" }),
  ];

  assert.deepEqual(sortPersonalNotes(input).map(item => item.id), [4, 5, 3, 1, 2]);
  assert.deepEqual(input.map(item => item.id), [1, 2, 3, 4, 5], "no muta la lista de origen");
});

test("mantiene visible el recordatorio vencido hasta completar la nota", () => {
  const overdue = note(1, { reminderDate: "2026-10-25" });
  assert.equal(isNoteOverdue(overdue, "2026-10-26"), true);
  assert.equal(isNoteOverdue({ ...overdue, isCompleted: true }, "2026-10-26"), false);
});

test("usa fecha local y formatea la fecha del recordatorio sin desplazar el día", () => {
  assert.equal(getLocalDateKey(new Date(2026, 9, 26, 23, 30)), "2026-10-26");
  assert.match(formatNoteReminder("2026-10-29"), /29/);
  assert.match(formatNoteCreatedAt("2026-10-26T12:00:00.000Z"), /2026/);
});
