import React, { useState, type FormEvent } from "react";
import { Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CreatePersonalNote } from "@/hooks/use-personal-notes";

type NotaEditorProps = {
  initialContent?: string;
  initialReminderDate?: string | null;
  compact?: boolean;
  isSaving?: boolean;
  saveLabel?: string;
  onSave: (input: CreatePersonalNote) => Promise<void>;
  onCancel?: () => void;
};

export function NotaEditor({
  initialContent = "",
  initialReminderDate = null,
  compact = false,
  isSaving = false,
  saveLabel,
  onSave,
  onCancel,
}: NotaEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [reminderDate, setReminderDate] = useState(initialReminderDate ?? "");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isSaving) return;
    try {
      await onSave({
        content: trimmed,
        ...(compact ? {} : { reminderDate: reminderDate || null }),
      });
    } catch {
      return;
    }
    if (!initialContent) {
      setContent("");
      setReminderDate("");
    }
  };

  if (compact) {
    return (
      <form onSubmit={submit} className="flex items-center gap-2" data-testid="form-quick-note">
        <Input
          value={content}
          onChange={event => setContent(event.target.value)}
          placeholder="Anotá una idea o tarea…"
          aria-label="Texto de la nueva nota"
          maxLength={10000}
          className="min-w-0 bg-background"
          data-testid="input-quick-note"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!content.trim() || isSaving}
          aria-label="Guardar nota"
          data-testid="button-save-quick-note"
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3" data-testid="form-note-editor">
      <div className="space-y-1.5">
        <label htmlFor="personal-note-content" className="sr-only">Texto de la nota</label>
        <Textarea
          id="personal-note-content"
          value={content}
          onChange={event => setContent(event.target.value)}
          placeholder="Escribe una idea, tarea o recordatorio…"
          rows={3}
          maxLength={10000}
          className="resize-y bg-background text-sm"
          data-testid="input-note-content"
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <label htmlFor="personal-note-reminder" className="text-xs font-medium text-muted-foreground">
            Recordatorio <span className="font-normal">(opcional)</span>
          </label>
          <Input
            id="personal-note-reminder"
            type="date"
            value={reminderDate}
            onChange={event => setReminderDate(event.target.value)}
            className="w-full sm:w-48 bg-background"
            data-testid="input-note-reminder"
          />
        </div>
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} data-testid="button-cancel-note">
              <X className="mr-1.5 h-4 w-4" />
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={!content.trim() || isSaving}
            data-testid="button-save-note"
          >
            <Check className="mr-1.5 h-4 w-4" />
            {isSaving ? "Guardando…" : saveLabel ?? "Guardar nota"}
          </Button>
        </div>
      </div>
    </form>
  );
}
