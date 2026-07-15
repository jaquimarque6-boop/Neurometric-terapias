import { useMemo, useState } from "react";
import { Stethoscope, Search, Plus, X, Pencil, Check, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CATEGORY_ORDER,
  getDiagnosisLabel,
  type DiagnosisCategory,
  type DiagnosisOption,
} from "@/utils/diagnosis-map";
import { getDiagnosesByProfesion, type Profesion } from "@/utils/profession-map";

const BRAND_TEAL = "#81B29A";

interface DiagnosisPickerProps {
  value: string[];
  onChange: (next: string[]) => void;
  profesion: Profesion;
  /** Si true, arranca en vista compacta (chips + botón Editar). Default true. */
  compact?: boolean;
  className?: string;
}

function groupByCategory(options: DiagnosisOption[]): Array<{ category: DiagnosisCategory; items: DiagnosisOption[] }> {
  const map = new Map<DiagnosisCategory, DiagnosisOption[]>();
  for (const opt of options) {
    if (!map.has(opt.category)) map.set(opt.category, []);
    map.get(opt.category)!.push(opt);
  }
  return CATEGORY_ORDER
    .filter(cat => map.has(cat))
    .map(cat => ({ category: cat, items: map.get(cat)! }));
}

export function DiagnosisPicker({
  value,
  onChange,
  profesion,
  compact = true,
  className,
}: DiagnosisPickerProps) {
  const [editing, setEditing] = useState(!compact);
  const [search, setSearch] = useState("");
  const [customText, setCustomText] = useState("");

  const bankOptions = useMemo(() => getDiagnosesByProfesion(profesion), [profesion]);

  // Opciones a mostrar: banco de la profesión + cualquier diagnóstico ya
  // seleccionado que no esté en ese banco (personalizado o de otra profesión).
  const allOptions = useMemo(() => {
    const known = new Set(bankOptions.map(o => o.value));
    const extras: DiagnosisOption[] = value
      .filter(v => !known.has(v))
      .map(v => ({ value: v, label: getDiagnosisLabel(v), category: "Otros" as DiagnosisCategory }));
    return [...bankOptions, ...extras];
  }, [bankOptions, value]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allOptions;
    return allOptions.filter(
      o => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [allOptions, search]);

  const grouped = useMemo(() => groupByCategory(filtered), [filtered]);
  const selectedSet = useMemo(() => new Set(value), [value]);

  const toggle = (v: string) => {
    if (selectedSet.has(v)) onChange(value.filter(x => x !== v));
    else onChange([...value, v]);
  };

  const remove = (v: string) => onChange(value.filter(x => x !== v));

  // El primero de la lista es el diagnóstico PRINCIPAL; este botón lo reordena al frente.
  const makePrincipal = (v: string) => {
    if (value[0] === v) return;
    onChange([v, ...value.filter(x => x !== v)]);
  };

  const addCustom = () => {
    const t = customText.trim();
    if (!t) return;
    if (!value.includes(t)) onChange([...value, t]);
    setCustomText("");
  };

  // ── Vista compacta ────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
            <Stethoscope className="h-4 w-4" style={{ color: BRAND_TEAL }} />
            Diagnóstico
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            style={{ color: BRAND_TEAL }}
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Editar
          </Button>
        </div>
        {value.length === 0 ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-muted-foreground italic hover:text-foreground/70 transition-colors"
          >
            Sin diagnóstico — toca “Editar” para agregar
          </button>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {value.map((v, i) => (
              <span
                key={v}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                style={
                  i === 0 && value.length > 1
                    ? { background: BRAND_TEAL, color: "#fff" }
                    : { background: `${BRAND_TEAL}1f`, color: "#3f6b56" }
                }
              >
                {i === 0 && value.length > 1 && <Star className="h-3 w-3 fill-current" />}
                {getDiagnosisLabel(v)}
                {i === 0 && value.length > 1 && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">Principal</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Vista de edición ──────────────────────────────────────────────────────
  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
          <Stethoscope className="h-4 w-4" style={{ color: BRAND_TEAL }} />
          Diagnóstico
        </div>
        {compact && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            style={{ color: BRAND_TEAL }}
            onClick={() => setEditing(false)}
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            Listo
          </Button>
        )}
      </div>

      {/* Seleccionados */}
      {value.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1.5">
            {value.map((v, i) => (
              <span
                key={v}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                style={
                  i === 0 && value.length > 1
                    ? { background: BRAND_TEAL, color: "#fff" }
                    : { background: `${BRAND_TEAL}1f`, color: "#3f6b56" }
                }
              >
                {i === 0 && value.length > 1 && <Star className="h-3 w-3 fill-current" />}
                {getDiagnosisLabel(v)}
                {i === 0 && value.length > 1 && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">Principal</span>
                )}
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => makePrincipal(v)}
                    className="hover:opacity-70"
                    title="Marcar como diagnóstico principal"
                    aria-label={`Marcar ${getDiagnosisLabel(v)} como principal`}
                  >
                    <Star className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(v)}
                  className="hover:opacity-70"
                  aria-label={`Quitar ${getDiagnosisLabel(v)}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          {value.length > 1 && (
            <p className="text-[11px] text-muted-foreground mt-1.5">
              El primero es el diagnóstico principal. Toca la estrella para cambiarlo; el resto quedan como asociados.
            </p>
          )}
        </div>
      )}

      {/* Buscador */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar diagnóstico…"
          className="pl-8 h-9 text-sm"
        />
      </div>

      {/* Banco por categorías */}
      <div className="max-h-64 overflow-y-auto pr-1 space-y-3">
        {grouped.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">Sin resultados para “{search}”.</p>
        )}
        {grouped.map(({ category, items }) => (
          <div key={category}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              {category}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {items.map(opt => {
                const active = selectedSet.has(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggle(opt.value)}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border transition-colors"
                    style={
                      active
                        ? { background: BRAND_TEAL, color: "#fff", borderColor: BRAND_TEAL }
                        : { background: "transparent", color: "#475569", borderColor: "#e2e8f0" }
                    }
                  >
                    {active && <Check className="h-3 w-3" />}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Diagnóstico personalizado */}
      <div className="mt-3 pt-3 border-t border-border/60">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
          Diagnóstico personalizado
        </p>
        <div className="flex gap-2">
          <Input
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="Escribir diagnóstico…"
            className="h-9 text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 shrink-0"
            onClick={addCustom}
            disabled={!customText.trim()}
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </div>
      </div>
    </div>
  );
}
