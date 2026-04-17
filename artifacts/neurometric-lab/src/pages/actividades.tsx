import { useState, useMemo } from "react";
import { Sparkles, Search, Filter, X, Stethoscope, Home } from "lucide-react";
import { useListActividades } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

type Actividad = {
  id: number; titulo: string; descripcion?: string | null; tipo: string;
  area?: string | null; subarea?: string | null; franjaEtaria?: string | null;
  recursos?: string | null; goalLibraryId?: number | null; objetivoNombre?: string | null;
  createdAt: string;
};

const AREA_COLORS: Record<string, string> = {
  "Lenguaje Expresivo":             "bg-rose-100 text-rose-700",
  "Lenguaje Comprensivo-Expresivo": "bg-orange-100 text-orange-700",
  "Lenguaje Funcional":             "bg-amber-100 text-amber-700",
  "Lenguaje Narrativo":             "bg-teal-100 text-teal-700",
  "Léxico":                         "bg-teal-100 text-teal-700",
  "Comprensión":                    "bg-emerald-100 text-emerald-700",
  "Metalingüística":                "bg-stone-200 text-stone-700",
  "Semántica":                      "bg-emerald-100 text-emerald-700",
  "Pragmática":                     "bg-green-100 text-green-700",
  "Comunicación":                   "bg-lime-100 text-lime-700",
};

function areaColor(area: string) {
  return AREA_COLORS[area] ?? "bg-muted text-foreground/70";
}

export default function Actividades() {
  const { data: actividades = [], isLoading } = useListActividades();
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [franjaFilter, setFranjaFilter] = useState("all");
  const [tipoFilter, setTipoFilter] = useState("all");

  const all = actividades as Actividad[];
  const areas   = useMemo(() => ["all", ...Array.from(new Set(all.map(a => a.area).filter(Boolean))).sort()], [all]);
  const franjas = useMemo(() => {
    const normalized = new Set(all.map(a => a.franjaEtaria).filter(Boolean));
    return ["all", ...["0-2","3-5","6-8","9-12","13-16","17-20"].filter(f => normalized.has(f))];
  }, [all]);

  const filtered = useMemo(() => all.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.titulo.toLowerCase().includes(q) ||
      (a.descripcion ?? "").toLowerCase().includes(q) ||
      (a.area ?? "").toLowerCase().includes(q) ||
      (a.objetivoNombre ?? "").toLowerCase().includes(q);
    const matchArea   = areaFilter === "all"   || a.area === areaFilter;
    const matchFranja = franjaFilter === "all" || a.franjaEtaria === franjaFilter;
    const matchTipo   = tipoFilter === "all"   || a.tipo === tipoFilter;
    return matchSearch && matchArea && matchFranja && matchTipo;
  }), [all, search, areaFilter, franjaFilter, tipoFilter]);

  const grouped = useMemo(() => filtered.reduce((acc, a) => {
    const key = a.area ?? "Sin área";
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {} as Record<string, Actividad[]>), [filtered]);

  const clinicaCount = all.filter(a => a.tipo === "clinica").length;
  const familiaCount = all.filter(a => a.tipo === "familia").length;
  const activeFilters = (areaFilter !== "all" ? 1 : 0) + (franjaFilter !== "all" ? 1 : 0) + (tipoFilter !== "all" ? 1 : 0);

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">

        {/* Header */}
        <div className="bg-card border border-border/50 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Actividades Sugeridas
              </h1>
              <p className="text-muted-foreground mt-1">
                {all.length} actividades · {clinicaCount} clínicas · {familiaCount} para familia
              </p>
            </div>
          </div>

          {/* Tipo tabs */}
          <div className="flex items-center gap-1.5 mb-4 bg-muted/50 p-1 rounded-xl border border-border/50 w-fit">
            {[
              { value: "all", label: "Todas", icon: null },
              { value: "clinica", label: "Clínicas", icon: Stethoscope },
              { value: "familia", label: "Para familia", icon: Home },
            ].map(t => (
              <button
                key={t.value}
                onClick={() => setTipoFilter(t.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tipoFilter === t.value ? "bg-white text-primary shadow-sm border border-border/50" : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                {t.icon && <t.icon className="h-4 w-4" />}
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar actividades..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-muted/50" />
              {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground/70"><X className="h-4 w-4" /></button>}
            </div>
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-full sm:w-56 bg-muted/50">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las áreas</SelectItem>
                {areas.filter(a => a !== "all").map(a => <SelectItem key={a!} value={a!}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={franjaFilter} onValueChange={setFranjaFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-muted/50">
                <SelectValue placeholder="Franja etaria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las franjas</SelectItem>
                {franjas.filter(f => f !== "all").map(f => <SelectItem key={f!} value={f!}>{f} años</SelectItem>)}
              </SelectContent>
            </Select>
            {activeFilters > 0 && (
              <button onClick={() => { setAreaFilter("all"); setFranjaFilter("all"); setTipoFilter("all"); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground/80 px-3 py-2 rounded-lg hover:bg-muted transition-colors whitespace-nowrap">
                <X className="h-4 w-4" /> Limpiar ({activeFilters})
              </button>
            )}
          </div>
        </div>

        {(search || activeFilters > 0) && (
          <p className="text-sm text-muted-foreground -mt-2 px-1">
            Mostrando <span className="font-semibold text-foreground/80">{filtered.length}</span> actividades
          </p>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="py-20 text-center bg-card rounded-2xl border border-dashed border-border">
            <Sparkles className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="font-medium text-foreground/70">No se encontraron actividades</p>
            <p className="text-muted-foreground text-sm mt-1">Intenta ajustar los filtros.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([area, acts]) => (
              <div key={area}>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl mb-3 text-sm font-semibold ${areaColor(area)} border`} style={{ borderColor: "transparent" }}>
                  {area}
                  <span className="bg-white/50 text-xs px-1.5 py-0.5 rounded-full">{acts.length}</span>
                </div>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {acts.map(act => (
                    <Card key={act.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            {act.tipo === "clinica"
                              ? <div className="h-7 w-7 rounded-lg bg-rose-100 flex items-center justify-center shrink-0"><Stethoscope className="h-3.5 w-3.5 text-rose-600" /></div>
                              : <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0"><Home className="h-3.5 w-3.5 text-emerald-600" /></div>
                            }
                            <Badge variant="outline" className={`text-xs border-0 ${act.tipo === "clinica" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                              {act.tipo === "clinica" ? "Clínica" : "Familia"}
                            </Badge>
                          </div>
                          {act.franjaEtaria && (
                            <span className="text-xs text-muted-foreground shrink-0">{act.franjaEtaria} años</span>
                          )}
                        </div>
                        <p className="font-medium text-foreground text-sm leading-snug mb-2">{act.titulo}</p>
                        {act.subarea && <p className="text-xs text-muted-foreground">{act.subarea}</p>}
                        {act.objetivoNombre && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1 border-t border-border/50 pt-1.5">
                            Objetivo: {act.objetivoNombre}
                          </p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
