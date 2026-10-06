import type { ChangeEvent } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type SessionMaterialDraft = {
  id: string;
  nombre: string;
  fotos: File[];
};

type Props = {
  value: SessionMaterialDraft[];
  onChange: (value: SessionMaterialDraft[]) => void;
};

function newMaterialId(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `material-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function SessionMaterialsField({ value, onChange }: Props) {
  const updateMaterial = (id: string, update: (item: SessionMaterialDraft) => SessionMaterialDraft) => {
    onChange(value.map(item => item.id === id ? update(item) : item));
  };

  const addPhotos = (id: string, event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (!files.length) return;
    updateMaterial(id, item => ({ ...item, fotos: [...item.fotos, ...files] }));
  };

  return (
    <section
      aria-labelledby="session-materials-title"
      className="rounded-2xl border border-border/60 bg-card shadow-sm p-4 space-y-3"
      data-testid="section-session-materials"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="session-materials-title" className="text-sm font-semibold text-foreground">
            Materiales / actividades utilizadas
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Opcional. Puedes adjuntar fotos a cada material o actividad.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="button-add-session-material"
          onClick={() => onChange([...value, { id: newMaterialId(), nombre: "", fotos: [] }])}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Agregar
        </Button>
      </div>

      {value.map((material, index) => (
        <div
          key={material.id}
          className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-3"
          data-testid={`card-session-material-${material.id}`}
        >
          <div className="flex items-center gap-2">
            <Input
              value={material.nombre}
              maxLength={250}
              aria-label={`Nombre del material o actividad ${index + 1}`}
              data-testid={`input-session-material-name-${material.id}`}
              placeholder="Nombre del material o actividad"
              onChange={event => updateMaterial(material.id, item => ({ ...item, nombre: event.target.value }))}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Eliminar material o actividad"
              data-testid={`button-remove-session-material-${material.id}`}
              onClick={() => onChange(value.filter(item => item.id !== material.id))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Fotos (opcional)</span>
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/heic"
              multiple
              disabled={!material.nombre.trim()}
              aria-label={`Adjuntar fotos a ${material.nombre || "este material"}`}
              data-testid={`input-session-material-photos-${material.id}`}
              onChange={event => addPhotos(material.id, event)}
            />
          </label>

          {material.fotos.length > 0 && (
            <ul className="space-y-1.5">
              {material.fotos.map((photo, photoIndex) => (
                <li
                  key={`${photo.name}-${photoIndex}`}
                  className="flex items-center justify-between gap-2 rounded-lg bg-background px-2.5 py-1.5 text-xs"
                  data-testid={`row-session-material-photo-${material.id}-${photoIndex}`}
                >
                  <span className="min-w-0 truncate">{photo.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    aria-label={`Quitar foto ${photo.name}`}
                    data-testid={`button-remove-session-material-photo-${material.id}-${photoIndex}`}
                    onClick={() => updateMaterial(material.id, item => ({
                      ...item,
                      fotos: item.fotos.filter((_, i) => i !== photoIndex),
                    }))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  );
}
