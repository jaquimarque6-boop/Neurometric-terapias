import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ExistingSessionPhoto = {
  id: string;
  name: string;
  url: string;
};

export type SessionMaterialDraft = {
  id: string;
  nombre: string;
  fotos: File[];
  fotosGuardadas?: ExistingSessionPhoto[];
};

type Props = {
  value: SessionMaterialDraft[];
  onChange: (value: SessionMaterialDraft[]) => void;
};

function newMaterialId(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `material-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type PhotoPreviewProps = {
  photo: File;
  materialId: string;
  photoIndex: number;
  onRemove: () => void;
};

function PhotoPreview({ photo, materialId, photoIndex, onRemove }: PhotoPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  return (
    <li
      className="relative min-w-0 overflow-hidden rounded-lg border border-border/60 bg-background"
      data-testid={`row-session-material-photo-${materialId}-${photoIndex}`}
    >
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={`Vista previa de ${photo.name || `foto ${photoIndex + 1}`}`}
          className="aspect-square w-full object-cover"
        />
      ) : (
        <div className="aspect-square w-full animate-pulse bg-muted" aria-hidden="true" />
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1 h-7 w-7 rounded-full bg-background/90 shadow-sm hover:bg-background"
        aria-label={`Quitar foto ${photo.name || photoIndex + 1}`}
        data-testid={`button-remove-session-material-photo-${materialId}-${photoIndex}`}
        onClick={onRemove}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
      <span className="block truncate px-2 py-1.5 text-[11px] text-muted-foreground" title={photo.name}>
        {photo.name || `Foto ${photoIndex + 1}`}
      </span>
    </li>
  );
}

type MaterialPhotosProps = {
  material: SessionMaterialDraft;
  onAdd: (files: File[]) => void;
  onRemove: (photoIndex: number) => void;
  onRemoveSaved: (photoId: string) => void;
};

function MaterialPhotos({ material, onAdd, onRemove, onRemoveSaved }: MaterialPhotosProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputId = `session-material-camera-${material.id}`;
  const libraryInputId = `input-session-material-photos-${material.id}`;
  const canAttach = Boolean(material.nombre.trim());

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (files.length) onAdd(files);
  };

  return (
    <div className="space-y-2">
      <div
        role="group"
        aria-labelledby={`session-material-photos-label-${material.id}`}
        className="space-y-2"
      >
        <span
          id={`session-material-photos-label-${material.id}`}
          className="block text-xs font-medium text-muted-foreground"
        >
          Fotos (opcional)
        </span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full justify-center sm:w-auto"
            disabled={!canAttach}
            aria-label={`Sacar foto para ${material.nombre || "este material"}`}
            data-testid={`button-session-material-camera-${material.id}`}
            onClick={() => cameraInputRef.current?.click()}
          >
            <span aria-hidden="true">📷</span>
            Sacar foto
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full justify-center sm:w-auto"
            disabled={!canAttach}
            aria-label={`Elegir foto para ${material.nombre || "este material"}`}
            data-testid={`button-session-material-photo-library-${material.id}`}
            onClick={() => libraryInputRef.current?.click()}
          >
            <span aria-hidden="true">🖼️</span>
            Elegir foto
          </Button>
        </div>
        <Input
          id={cameraInputId}
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          disabled={!canAttach}
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
          data-testid={`input-session-material-camera-${material.id}`}
          onChange={handleFiles}
        />
        <Input
          id={libraryInputId}
          ref={libraryInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/heic"
          multiple
          disabled={!canAttach}
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
          aria-label={`Adjuntar fotos a ${material.nombre || "este material"}`}
          data-testid={libraryInputId}
          onChange={handleFiles}
        />
        {!canAttach && (
          <p className="text-xs text-muted-foreground">Escribe el nombre del material para adjuntar fotos.</p>
        )}
      </div>

      {!!(material.fotosGuardadas?.length || material.fotos.length) && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {material.fotosGuardadas?.map((photo, photoIndex) => (
            <li
              key={photo.id}
              className="relative min-w-0 overflow-hidden rounded-lg border border-border/60 bg-background"
              data-testid={`row-session-material-saved-photo-${material.id}-${photoIndex}`}
            >
              <img
                src={photo.url}
                alt={`Vista previa de ${photo.name || `foto guardada ${photoIndex + 1}`}`}
                className="aspect-square w-full object-cover"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-7 w-7 rounded-full bg-background/90 shadow-sm hover:bg-background"
                aria-label={`Quitar foto ${photo.name || photoIndex + 1}`}
                data-testid={`button-remove-session-material-saved-photo-${material.id}-${photoIndex}`}
                onClick={() => onRemoveSaved(photo.id)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
              <span className="block truncate px-2 py-1.5 text-[11px] text-muted-foreground" title={photo.name}>
                {photo.name || `Foto ${photoIndex + 1}`}
              </span>
            </li>
          ))}
          {material.fotos.map((photo, photoIndex) => (
            <PhotoPreview
              key={`${photo.name}-${photo.lastModified}-${photo.size}-${photoIndex}`}
              photo={photo}
              materialId={material.id}
              photoIndex={photoIndex}
              onRemove={() => onRemove(photoIndex)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export function SessionMaterialsField({ value, onChange }: Props) {
  const updateMaterial = (id: string, update: (item: SessionMaterialDraft) => SessionMaterialDraft) => {
    onChange(value.map(item => item.id === id ? update(item) : item));
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

          <MaterialPhotos
            material={material}
            onAdd={files => updateMaterial(material.id, item => ({
              ...item,
              fotos: [...item.fotos, ...files],
            }))}
            onRemove={photoIndex => updateMaterial(material.id, item => ({
              ...item,
              fotos: item.fotos.filter((_, i) => i !== photoIndex),
            }))}
            onRemoveSaved={photoId => updateMaterial(material.id, item => ({
              ...item,
              fotosGuardadas: item.fotosGuardadas?.filter(photo => photo.id !== photoId),
            }))}
          />
        </div>
      ))}
    </section>
  );
}
