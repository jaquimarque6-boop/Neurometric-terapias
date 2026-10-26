import { useMemo, useState } from "react";
import { CheckCircle2, LoaderCircle, Plus, StickyNote } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { NotaCard } from "@/components/mis-notas/nota-card";
import { NotaEditor } from "@/components/mis-notas/nota-editor";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePersonalNotes, type UpdatePersonalNote } from "@/hooks/use-personal-notes";
import { isNoteOverdue, sortPersonalNotes } from "@/lib/personal-notes";
import type { PersonalNote } from "@/lib/personal-notes";

export default function MisNotasPage() {
  const { toast } = useToast();
  const {
    notes, isLoading, isError, error, refetch,
    createNote, updateNote, deleteNote, isCreating, isUpdating, isDeleting,
  } = usePersonalNotes();
  const [showNewNote, setShowNewNote] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const sorted = useMemo(() => sortPersonalNotes(notes), [notes]);
  const activeNotes = sorted.filter(note => !note.isCompleted);
  const completedNotes = sorted.filter(note => note.isCompleted);
  const overdueCount = activeNotes.filter(note => isNoteOverdue(note)).length;

  const saveNewNote = async (input: { content: string; reminderDate?: string | null }) => {
    try {
      await createNote(input);
      setShowNewNote(false);
      toast({ title: "Nota guardada" });
    } catch (cause) {
      toast({
        title: "No se pudo guardar la nota",
        description: cause instanceof Error ? cause.message : "Intenta nuevamente.",
        variant: "destructive",
      });
      throw cause;
    }
  };

  const saveEdit = async (note: PersonalNote, input: { content: string; reminderDate?: string | null }) => {
    try {
      await updateNote({ id: note.id, ...input });
      setEditingId(null);
      toast({ title: "Cambios guardados" });
    } catch (cause) {
      toast({
        title: "No se pudieron guardar los cambios",
        description: cause instanceof Error ? cause.message : "Intenta nuevamente.",
        variant: "destructive",
      });
      throw cause;
    }
  };

  const changeNote = async (note: PersonalNote, patch: UpdatePersonalNote) => {
    try {
      await updateNote({ id: note.id, ...patch });
    } catch (cause) {
      toast({
        title: "No se pudo actualizar la nota",
        description: cause instanceof Error ? cause.message : "Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const removeNote = async (note: PersonalNote) => {
    if (!window.confirm("¿Eliminar esta nota? Esta acción no se puede deshacer.")) return;
    try {
      await deleteNote(note.id);
      toast({ title: "Nota eliminada" });
    } catch (cause) {
      toast({
        title: "No se pudo eliminar la nota",
        description: cause instanceof Error ? cause.message : "Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const renderNote = (note: PersonalNote) => editingId === note.id ? (
    <div key={note.id} className="rounded-2xl border border-primary/25 bg-card p-4 shadow-sm sm:p-5">
      <NotaEditor
        key={`edit-${note.id}`}
        initialContent={note.content}
        initialReminderDate={note.reminderDate}
        isSaving={isUpdating}
        saveLabel="Guardar cambios"
        onSave={input => saveEdit(note, input)}
        onCancel={() => setEditingId(null)}
      />
    </div>
  ) : (
    <NotaCard
      key={note.id}
      note={note}
      busy={isUpdating || isDeleting}
      onEdit={() => setEditingId(note.id)}
      onTogglePin={() => void changeNote(note, { isPinned: !note.isPinned })}
      onToggleCompleted={() => void changeNote(note, { isCompleted: !note.isCompleted })}
      onDelete={() => void removeNote(note)}
    />
  );

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-3xl space-y-5" data-testid="page-personal-notes">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <StickyNote className="h-4 w-4" />
              Espacio personal
            </p>
            <h1 className="mt-1 text-2xl font-display font-bold text-foreground">Mis notas</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ideas, tareas y recordatorios privados para ti.
            </p>
          </div>
          {!showNewNote && (
            <Button onClick={() => setShowNewNote(true)} data-testid="button-new-personal-note">
              <Plus className="mr-1.5 h-4 w-4" />
              Nueva nota
            </Button>
          )}
        </header>

        {showNewNote && (
          <section className="rounded-2xl border border-primary/20 bg-primary/[0.025] p-4 shadow-sm sm:p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Escribe una nota</h2>
            <NotaEditor
              isSaving={isCreating}
              onSave={saveNewNote}
              onCancel={() => setShowNewNote(false)}
            />
          </section>
        )}

        {isError && (
          <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm" role="alert">
            <p className="font-medium text-destructive">No se pudieron cargar tus notas.</p>
            <p className="mt-1 text-muted-foreground">
              {error instanceof Error ? error.message : "Comprueba tu conexión e inténtalo de nuevo."}
            </p>
            <Button variant="outline" size="sm" onClick={() => void refetch()} className="mt-3">
              Reintentar
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-card py-12 text-sm text-muted-foreground" role="status">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Cargando notas…
          </div>
        ) : !isError && notes.length === 0 && !showNewNote ? (
          <section className="rounded-2xl border border-dashed border-border bg-card/60 px-5 py-12 text-center">
            <StickyNote className="mx-auto h-9 w-9 text-primary/50" />
            <h2 className="mt-3 text-base font-semibold text-foreground">Todavía no tienes notas</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Guarda aquí una idea o tarea. El recordatorio es opcional.
            </p>
            <Button onClick={() => setShowNewNote(true)} className="mt-4">
              <Plus className="mr-1.5 h-4 w-4" />
              Crear mi primera nota
            </Button>
          </section>
        ) : !isError && (
          <>
            {activeNotes.length > 0 && (
              <section className="space-y-3" aria-labelledby="pending-notes-title">
                <div className="flex items-center justify-between">
                  <h2 id="pending-notes-title" className="text-sm font-semibold text-foreground">
                    Pendientes
                    <span className="ml-2 text-xs font-normal text-muted-foreground">{activeNotes.length}</span>
                  </h2>
                  {overdueCount > 0 && (
                    <span className="text-xs font-medium text-destructive">
                      {overdueCount} vencid{overdueCount === 1 ? "a" : "as"}
                    </span>
                  )}
                </div>
                <div className="space-y-2.5">{activeNotes.map(renderNote)}</div>
              </section>
            )}

            {completedNotes.length > 0 && (
              <section className="space-y-3" aria-labelledby="completed-notes-title">
                <h2 id="completed-notes-title" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  Realizadas
                  <span className="text-xs font-normal">{completedNotes.length}</span>
                </h2>
                <div className="space-y-2.5">{completedNotes.map(renderNote)}</div>
              </section>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
