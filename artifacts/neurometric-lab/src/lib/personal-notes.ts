export type PersonalNote = {
  id: number;
  userId: number;
  content: string;
  reminderDate: string | null;
  isPinned: boolean;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isNoteOverdue(note: Pick<PersonalNote, "reminderDate" | "isCompleted">, today = getLocalDateKey()): boolean {
  return !note.isCompleted && Boolean(note.reminderDate && note.reminderDate < today);
}

export function sortPersonalNotes(notes: PersonalNote[]): PersonalNote[] {
  return [...notes].sort((a, b) => {
    const groupA = a.isCompleted ? 2 : (a.isPinned || a.reminderDate ? 0 : 1);
    const groupB = b.isCompleted ? 2 : (b.isPinned || b.reminderDate ? 0 : 1);
    if (groupA !== groupB) return groupA - groupB;

    if (!a.isCompleted && a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    if (!a.isCompleted && a.reminderDate !== b.reminderDate) {
      if (!a.reminderDate) return 1;
      if (!b.reminderDate) return -1;
      return a.reminderDate.localeCompare(b.reminderDate);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function formatNoteReminder(reminderDate: string): string {
  const [year, month, day] = reminderDate.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" })
    .format(new Date(year, month - 1, day));
}

export function formatNoteCreatedAt(createdAt: string): string {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" })
    .format(new Date(createdAt));
}
