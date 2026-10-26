import { useMemo } from "react";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, StickyNote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePersonalNotes } from "@/hooks/use-personal-notes";
import { sortPersonalNotes } from "@/lib/personal-notes";
import { NotaEditor } from "./nota-editor";

export function ResumenNotas() {
  const { toast } = useToast();
  const { notes, isLoading, isError, createNote, isCreating } = usePersonalNotes();
  const sorted = useMemo(() => sortPersonalNotes(notes), [notes]);
  const activeNotes = sorted.filter(note => !note.isCompleted);
  const preview = activeNotes.slice(0, 2);

  const addQuickNote = async (input: { content: string }) => {
    try {
      await createNote(input);
      toast({ title: "Nota guardada" });
    } catch (error) {
      toast({
        title: "No se pudo guardar la nota",
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <section
      className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5"
      aria-labelledby="summary-personal-notes-title"
      data-testid="summary-personal-notes"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="summary-personal-notes-title" className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <StickyNote className="h-4 w-4 text-primary" />
          Mis notas
          {!isLoading && !isError && (
            <span className="text-xs font-normal text-muted-foreground">
              {activeNotes.length} pendiente{activeNotes.length === 1 ? "" : "s"}
            </span>
          )}
        </h2>
        <Link
          href="/mis-notas"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
          data-testid="link-view-all-notes"
        >
          Ver todas <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <NotaEditor compact onSave={addQuickNote} isSaving={isCreating} />

      {isLoading ? (
        <p className="mt-3 text-xs text-muted-foreground" role="status">Cargando notas…</p>
      ) : isError ? (
        <p className="mt-3 text-xs text-destructive" role="alert">No se pudieron cargar tus notas.</p>
      ) : preview.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Todavía no tienes notas pendientes. Escribe una arriba para guardarla.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {preview.map(note => (
            <li
              key={note.id}
              className="flex min-w-0 items-start gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm"
              data-testid={`summary-note-${note.id}`}
            >
              {note.isPinned
                ? <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                : <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
              <span className="min-w-0 whitespace-pre-wrap break-words line-clamp-2">{note.content}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
