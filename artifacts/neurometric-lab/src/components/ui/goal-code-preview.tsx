import { useState, useEffect, useRef } from "react";
import { Wand2, Check, AlertTriangle, Copy, RefreshCw, Info } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Badge } from "./badge";
import {
  buildCodePrefix,
  isValidCodeFormat,
  explainCode,
  type CodePreviewParams,
} from "@/utils/goal-code-generator";
import { useToast } from "@/hooks/use-toast";

interface GoalCodePreviewProps {
  params: CodePreviewParams;
  value: string;
  onChange: (code: string) => void;
  /** Call API to get exact sequence number */
  onGenerate?: () => Promise<string>;
  className?: string;
}

export function GoalCodePreview({ params, value, onChange, onGenerate, className = "" }: GoalCodePreviewProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uniqueStatus, setUniqueStatus] = useState<"idle" | "ok" | "duplicate" | "invalid">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isValid = value ? isValidCodeFormat(value) : false;
  const hasParams = !!(params.areaClinica && params.subarea && params.nivelDificultad);

  // Live prefix preview (no API needed)
  const previewPrefix = hasParams ? buildCodePrefix(params) : null;

  // Validate code format + uniqueness whenever code changes
  useEffect(() => {
    if (!value) { setUniqueStatus("idle"); return; }
    if (!isValidCodeFormat(value)) { setUniqueStatus("invalid"); return; }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/goal-codes/check?code=${encodeURIComponent(value)}`);
        if (!res.ok) return;
        const data = await res.json();
        setUniqueStatus(data.isUnique ? "ok" : "duplicate");
      } catch { /* ignore */ }
    }, 500);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value]);

  const handleGenerate = async () => {
    if (!hasParams) {
      toast({ title: "Completa los campos", description: "Selecciona área, subárea, franja etaria y nivel de dificultad para generar un código.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      let code: string;
      if (onGenerate) {
        code = await onGenerate();
      } else {
        const res = await fetch("/api/goal-codes/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
        const data = await res.json();
        code = data.code;
      }
      onChange(code);
    } catch {
      toast({ title: "Error generando código", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(value).then(() =>
      toast({ title: "Código copiado" })
    );
  };

  const statusIcon = () => {
    if (!value) return null;
    if (uniqueStatus === "invalid")   return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" title="Formato inválido" />;
    if (uniqueStatus === "duplicate") return <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" title="Código duplicado" />;
    if (uniqueStatus === "ok")        return <Check className="h-4 w-4 text-emerald-500 shrink-0" title="Código disponible" />;
    return null;
  };

  const statusMsg = () => {
    if (!value) return null;
    if (uniqueStatus === "invalid")   return <span className="text-amber-600">Formato inválido</span>;
    if (uniqueStatus === "duplicate") return <span className="text-red-600">Este código ya está en uso</span>;
    if (uniqueStatus === "ok")        return <span className="text-emerald-600">Código disponible</span>;
    return null;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
        Código del objetivo
        <span className="text-muted-foreground font-normal text-xs">(generado automáticamente)</span>
      </label>

      {/* Live prefix preview */}
      {previewPrefix && !value && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border border-dashed border-border">
          <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span>Vista previa del prefijo: <strong className="font-mono text-primary">{previewPrefix}-??</strong></span>
        </div>
      )}

      {/* Code input + status */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={e => onChange(e.target.value.toUpperCase().replace(/\s/g, ""))}
            placeholder={previewPrefix ? `${previewPrefix}-01` : "NL-2-4-LEX-B-01"}
            className="font-mono bg-muted/50 pr-9 uppercase"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2">{statusIcon()}</span>
        </div>
        {value && (
          <button onClick={copyCode} title="Copiar código" className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/5 transition-colors">
            <Copy className="h-4 w-4" />
          </button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={loading || !hasParams}
          title={!hasParams ? "Completa área, subárea, franja y nivel primero" : "Generar código automáticamente"}
          className="shrink-0 gap-1.5 text-xs"
        >
          {loading ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Wand2 className="h-3.5 w-3.5" />
          )}
          {loading ? "Generando..." : "Generar"}
        </Button>
      </div>

      {/* Status message */}
      <div className="flex items-center gap-2 min-h-[18px]">
        {statusMsg() && <p className="text-xs">{statusMsg()}</p>}
      </div>

      {/* Explanation of current code */}
      {value && isValid && (
        <div className="bg-primary/5 border border-primary/15 rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-primary">{value}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-xs text-foreground/70">{explainCode(value)}</span>
          </div>
          {/* Segment breakdown */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {value.split("-").map((seg, i) => {
              const labels = ["Área", "Edad min", "Edad max", "Subárea", "Nivel", "N.°"];
              return (
                <span key={i} className="inline-flex flex-col items-center">
                  <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{seg}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{labels[i] ?? ""}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Format hint */}
      <p className="text-xs text-muted-foreground">
        Formato: <span className="font-mono">ÁREA-MÍNIMO-MÁXIMO-SUBÁREA-NIVEL-N°</span>
        &nbsp;·&nbsp; Ej: <span className="font-mono">NL-2-4-LEX-B-01</span>
      </p>
    </div>
  );
}
