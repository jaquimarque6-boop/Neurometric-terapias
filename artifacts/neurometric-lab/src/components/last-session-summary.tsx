import { useState, useEffect } from "react";
import { FileText, CalendarDays, UserRound, ChevronRight, ChevronDown, ChevronUp, Stethoscope, Home } from "lucide-react";
import { API_BASE } from "@/lib/api";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const BRAND_BLUE = "#E07A5F";
const BRAND_TEAL = "#81B29A";

const SESSION_COUNT_OPTIONS = [1, 3, 5] as const;
const DEFAULT_SESSION_COUNT = 3;
const SESSION_COUNT_STORAGE_KEY = "neurometric:recent-sessions-count";

function readStoredSessionCount(): number {
  if (typeof window === "undefined") return DEFAULT_SESSION_COUNT;
  const raw = window.localStorage.getItem(SESSION_COUNT_STORAGE_KEY);
  const parsed = raw ? Number(raw) : NaN;
  return SESSION_COUNT_OPTIONS.includes(parsed as (typeof SESSION_COUNT_OPTIONS)[number])
    ? parsed
    : DEFAULT_SESSION_COUNT;
}

type ClinicalRecord = {
  id?: number;
  fecha?: string | null;
  diagnostico?: string | null;
  resumenSesion?: string | null;
  observaciones?: string | null;
  recomendacionesHogar?: string | null;
  professionalName?: string | null;
};

function formatFecha(value?: string | null): string {
  if (!value) return "Fecha no registrada";
  const d = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });
}

function hasContent(record: ClinicalRecord): boolean {
  return !!(record.resumenSesion || record.observaciones || record.recomendacionesHogar || record.diagnostico);
}

type Props = {
  patientId: number | null;
  /** Título mostrado en el encabezado de la tarjeta. */
  title?: string;
};

/** Una sección con etiqueta dentro de la vista compacta. */
function PreviewSection({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-line">{value}</p>
    </div>
  );
}

/**
 * Vista resumida (compacta) del registro dentro de la tarjeta.
 * El contenido se limita a ~6-8 renglones con un tope de altura real;
 * el detalle completo se abre en el modal mediante "Ver detalle completo".
 */
function SessionBody({ record, onOpenDetail }: { record: ClinicalRecord; onOpenDetail: (r: ClinicalRecord) => void }) {
  return (
    <div className="space-y-2.5">
      {/* Fecha + profesional */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" style={{ color: BRAND_TEAL }} />
          {formatFecha(record.fecha)}
        </span>
        {record.professionalName && (
          <span className="flex items-center gap-1.5">
            <UserRound className="h-3.5 w-3.5" style={{ color: BRAND_TEAL }} />
            {record.professionalName}
          </span>
        )}
      </div>

      {hasContent(record) ? (
        /* Tope real de altura (~8 renglones) con desvanecido inferior. */
        <div className="relative max-h-[11.5rem] overflow-hidden">
          <div className="space-y-2">
            {record.diagnostico && <PreviewSection label="Diagnóstico" value={record.diagnostico} />}
            {record.resumenSesion && <PreviewSection label="Resumen" value={record.resumenSesion} />}
            {record.observaciones && <PreviewSection label="Observaciones / evolución" value={record.observaciones} />}
            {record.recomendacionesHogar && <PreviewSection label="Recomendaciones para el hogar" value={record.recomendacionesHogar} />}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white/90 to-transparent" />
        </div>
      ) : (
        <p className="text-[13px] text-muted-foreground italic">Sin contenido registrado en esta sesión.</p>
      )}

      {/* Abrir el registro completo */}
      <button
        onClick={() => onOpenDetail(record)}
        className="flex items-center gap-0.5 text-[11px] font-semibold hover:underline pt-0.5"
        style={{ color: BRAND_BLUE }}
      >
        Ver detalle completo
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function CollapsibleSession({ record, defaultOpen, onOpenDetail }: { record: ClinicalRecord; defaultOpen: boolean; onOpenDetail: (r: ClinicalRecord) => void }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border bg-white/50" style={{ borderColor: `${BRAND_TEAL}25` }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground/80 min-w-0">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" style={{ color: BRAND_TEAL }} />
          <span className="truncate">{formatFecha(record.fecha)}</span>
          {record.professionalName && (
            <span className="text-muted-foreground font-normal truncate">· {record.professionalName}</span>
          )}
        </span>
        {open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="px-3 pb-3 pt-0.5 border-t" style={{ borderColor: `${BRAND_TEAL}15` }}>
          <div className="pt-2.5">
            <SessionBody record={record} onOpenDetail={onOpenDetail} />
          </div>
        </div>
      )}
    </div>
  );
}

/** Campo del detalle completo (modal), sin truncado. */
function DetailField({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">{value}</p>
    </div>
  );
}

function RecordDetailModal({ record, onClose }: { record: ClinicalRecord | null; onClose: () => void }) {
  return (
    <Dialog open={!!record} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" style={{ color: BRAND_TEAL }} />
            Registro clínico
          </DialogTitle>
        </DialogHeader>
        {record && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" style={{ color: BRAND_TEAL }} />
                {formatFecha(record.fecha)}
              </span>
              {record.professionalName && (
                <span className="flex items-center gap-1.5">
                  <UserRound className="h-4 w-4" style={{ color: BRAND_TEAL }} />
                  {record.professionalName}
                </span>
              )}
            </div>

            <DetailField label="Diagnóstico" value={record.diagnostico} icon={<Stethoscope className="h-3 w-3" style={{ color: BRAND_TEAL }} />} />
            <DetailField label="Resumen de la sesión" value={record.resumenSesion} />
            <DetailField label="Observaciones / evolución" value={record.observaciones} />
            <DetailField label="Recomendaciones para el hogar" value={record.recomendacionesHogar} icon={<Home className="h-3 w-3" style={{ color: BRAND_TEAL }} />} />

            {!hasContent(record) && (
              <p className="text-sm text-muted-foreground italic">Este registro no tiene contenido clínico.</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function LastSessionSummary({ patientId, title = "Resumen de la sesión anterior" }: Props) {
  const [allRecords, setAllRecords] = useState<ClinicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sessionCount, setSessionCount] = useState<number>(readStoredSessionCount);
  const [detailRecord, setDetailRecord] = useState<ClinicalRecord | null>(null);

  const updateSessionCount = (count: number) => {
    setSessionCount(count);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SESSION_COUNT_STORAGE_KEY, String(count));
    }
  };

  useEffect(() => {
    if (!patientId) {
      setAllRecords([]);
      setLoaded(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoaded(false);
    fetch(`${API_BASE}/api/registros-clinicos?patientId=${patientId}`, { credentials: "include" })
      .then(r => (r.ok ? r.json() : []))
      .then((data: ClinicalRecord[]) => {
        if (cancelled) return;
        // Orden determinístico de la más nueva a la más antigua: por fecha
        // descendente y, ante misma fecha, por id descendente como desempate
        // estable (el id mayor es el registro creado más recientemente).
        const ordered = Array.isArray(data)
          ? [...data].sort((a, b) => {
              const fa = a.fecha ?? "";
              const fb = b.fecha ?? "";
              if (fa !== fb) return fb.localeCompare(fa);
              return (b.id ?? 0) - (a.id ?? 0);
            })
          : [];
        setAllRecords(ordered);
      })
      .catch(() => {
        if (!cancelled) setAllRecords([]);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  if (!patientId) return null;

  if (loading && !loaded) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-4 animate-pulse">
        <div className="h-3 w-40 rounded bg-muted mb-3" />
        <div className="h-3 w-full rounded bg-muted mb-2" />
        <div className="h-3 w-2/3 rounded bg-muted" />
      </div>
    );
  }

  const records = allRecords.slice(0, sessionCount);
  const [latest, ...previous] = records;

  return (
    <div
      className="rounded-2xl border shadow-sm overflow-hidden"
      style={{ borderColor: `${BRAND_TEAL}40`, background: `linear-gradient(135deg, ${BRAND_TEAL}10 0%, #faf7f5 100%)` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b" style={{ borderColor: `${BRAND_TEAL}20` }}>
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 shrink-0" style={{ color: BRAND_TEAL }} />
          <h2 className="text-sm font-bold text-foreground truncate">{title}</h2>
        </div>
        {latest && (
          <button
            onClick={() => setDetailRecord(latest)}
            className="flex items-center gap-0.5 text-xs font-semibold shrink-0 hover:underline"
            style={{ color: BRAND_BLUE }}
          >
            Ver más
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Selector de cantidad de sesiones recientes */}
      {allRecords.length > 1 && (
        <div className="flex items-center justify-end gap-1.5 px-4 py-2 border-b" style={{ borderColor: `${BRAND_TEAL}15` }}>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mr-0.5">
            Mostrar
          </span>
          <div className="inline-flex items-center rounded-full border p-0.5" style={{ borderColor: `${BRAND_TEAL}30` }}>
            {SESSION_COUNT_OPTIONS.map(count => {
              const active = sessionCount === count;
              return (
                <button
                  key={count}
                  type="button"
                  onClick={() => updateSessionCount(count)}
                  aria-pressed={active}
                  className={`min-w-[28px] rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                    active ? "text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={active ? { backgroundColor: BRAND_TEAL } : undefined}
                >
                  {count}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!latest ? (
        <div className="px-4 py-4">
          <p className="text-[13px] text-muted-foreground italic">No hay sesiones anteriores registradas.</p>
        </div>
      ) : (
        <div className="px-4 py-3.5 space-y-3">
          {/* Sesión más reciente, siempre visible */}
          <SessionBody record={latest} onOpenDetail={setDetailRecord} />

          {/* Sesiones previas (colapsables) */}
          {previous.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Sesiones anteriores
              </p>
              {previous.map((rec, i) => (
                <CollapsibleSession key={rec.id ?? `prev-${i}`} record={rec} defaultOpen={false} onOpenDetail={setDetailRecord} />
              ))}
            </div>
          )}
        </div>
      )}

      <RecordDetailModal record={detailRecord} onClose={() => setDetailRecord(null)} />
    </div>
  );
}
