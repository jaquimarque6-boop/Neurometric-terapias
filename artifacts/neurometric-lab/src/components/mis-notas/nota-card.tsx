import { Check, CheckCircle2, Circle, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNoteCreatedAt, formatNoteReminder, isNoteOverdue, type PersonalNote } from "@/lib/personal-notes";

type NotaCardProps = {
  note: PersonalNote;
  busy?: boolean;
  onEdit: () => void;
  onTogglePin: () => void;
  onToggleCompleted: () => void;
  onDelete: () => void;
};

export function NotaCard({
  note,
  busy = false,
  onEdit,
  onTogglePin,
  onToggleCompleted,
  onDelete,
}: NotaCardProps) {
  const overdue = note.reminderDate ? isNoteOverdue(note) : false;

  return (
    <article
      className={`rounded-2xl border bg-card p-4 shadow-sm transition-colors sm:p-5 ${
        note.isCompleted ? "border-border/50 opacity-75" : "border-border/70"
      }`}
      data-testid={`card-personal-note-${note.id}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggleCompleted}
          disabled={busy}
          aria-label={note.isCompleted ? "Marcar como pendiente" : "Marcar como realizada"}
          title={note.isCompleted ? "Marcar como pendiente" : "Marcar como realizada"}
          className="mt-0.5 shrink-0 rounded-full text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
          data-testid={`button-complete-note-${note.id}`}
        >
          {note.isCompleted
            ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            : <Circle className="h-5 w-5" />}
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={`whitespace-pre-wrap break-words text-sm leading-relaxed ${
              note.isCompleted ? "text-muted-foreground line-through decoration-muted-foreground/50" : "text-foreground"
            }`}
            data-testid={`text-personal-note-${note.id}`}
          >
            {note.content}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-muted-foreground/80">
              Creada {formatNoteCreatedAt(note.createdAt)}
            </span>
            {note.isPinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                <Pin className="h-3 w-3" />
                Fijada
              </span>
            )}
            {note.reminderDate && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                overdue ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
              }`}>
                {overdue ? "Vencida · " : "Recordatorio · "}
                {formatNoteReminder(note.reminderDate)}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onTogglePin}
            disabled={busy || note.isCompleted}
            aria-label={note.isPinned ? "Desfijar nota" : "Fijar nota"}
            title={note.isPinned ? "Desfijar" : "Fijar"}
            data-testid={`button-pin-note-${note.id}`}
          >
            {note.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onEdit}
            disabled={busy}
            aria-label="Editar nota"
            title="Editar"
            data-testid={`button-edit-note-${note.id}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={busy}
            aria-label="Eliminar nota"
            title="Eliminar"
            className="text-muted-foreground hover:text-destructive"
            data-testid={`button-delete-note-${note.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
