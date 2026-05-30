import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { FileText, CalendarDays, UserRound, ChevronRight } from "lucide-react";
import { API_BASE } from "@/lib/api";

const BRAND_BLUE = "#E07A5F";
const BRAND_TEAL = "#81B29A";

type ClinicalRecord = {
  id?: number;
  fecha?: string | null;
  resumenSesion?: string | null;
  observaciones?: string | null;
  professionalName?: string | null;
};

function formatFecha(value?: string | null): string {
  if (!value) return "Fecha no registrada";
  const d = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });
}

type Props = {
  patientId: number | null;
  /** Título mostrado en el encabezado de la tarjeta. */
  title?: string;
};

export function LastSessionSummary({ patientId, title = "Resumen de la sesión anterior" }: Props) {
  const [, navigate] = useLocation();
  const [record, setRecord] = useState<ClinicalRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!patientId) {
      setRecord(null);
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
        const last = Array.isArray(data) && data.length > 0 ? data[data.length - 1] : null;
        setRecord(last);
      })
      .catch(() => {
        if (!cancelled) setRecord(null);
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
        {record && (
          <button
            onClick={() => navigate(`/patients/${patientId}`)}
            className="flex items-center gap-0.5 text-xs font-semibold shrink-0 hover:underline"
            style={{ color: BRAND_BLUE }}
          >
            Ver más
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {!record ? (
        <div className="px-4 py-4">
          <p className="text-[13px] text-muted-foreground italic">No hay sesiones anteriores registradas.</p>
        </div>
      ) : (
        <div className="px-4 py-3.5 space-y-2.5">
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

          {/* Resumen breve */}
          {record.resumenSesion && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Resumen</p>
              <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-line line-clamp-4">
                {record.resumenSesion}
              </p>
            </div>
          )}

          {/* Observaciones */}
          {record.observaciones && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Observaciones</p>
              <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-line line-clamp-4">
                {record.observaciones}
              </p>
            </div>
          )}

          {!record.resumenSesion && !record.observaciones && (
            <p className="text-[13px] text-muted-foreground italic">Sin resumen ni observaciones en la última sesión.</p>
          )}
        </div>
      )}
    </div>
  );
}
