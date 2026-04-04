import { useState, useEffect } from "react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  ChevronLeft, ChevronRight, Plus, Calendar, Clock,
  Repeat, X, Pencil, AlertCircle, CalendarDays,
} from "lucide-react";

const HOUR_PX = 52;
const START_HOUR = 7;
const END_HOUR = 21;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const GRID_HEIGHT = TOTAL_HOURS * HOUR_PX;

const TIPO_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  sesion:     { bg: "bg-blue-50",   text: "text-blue-800",   border: "border-blue-200",   dot: "bg-blue-500"   },
  evaluacion: { bg: "bg-violet-50", text: "text-violet-800", border: "border-violet-200", dot: "bg-violet-500" },
  reunion:    { bg: "bg-amber-50",  text: "text-amber-800",  border: "border-amber-200",  dot: "bg-amber-500"  },
  otro:       { bg: "bg-slate-50",  text: "text-slate-700",  border: "border-slate-200",  dot: "bg-slate-400"  },
};
const TIPO_LABELS: Record<string, string> = {
  sesion: "Sesión", evaluacion: "Evaluación", reunion: "Reunión", otro: "Otro",
};

type Cita = {
  id: number;
  titulo: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tipo: string;
  status: string;
  notas?: string | null;
  patientId?: number | null;
  professionalId?: number | null;
  serieId?: string | null;
  repetirSemanal?: boolean;
  repetirHasta?: string | null;
};

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesFromStart(t: string): number {
  return timeToMinutes(t) - START_HOUR * 60;
}

function topPx(t: string): number {
  return (minutesFromStart(t) / 60) * HOUR_PX;
}

function heightPx(start: string, end: string): number {
  const mins = timeToMinutes(end) - timeToMinutes(start);
  return Math.max((mins / 60) * HOUR_PX, 24);
}

const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const TIPOS = ["sesion", "evaluacion", "reunion", "otro"];

function weekDays(baseMonday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(baseMonday, i));
}

function getMonday(d: Date): Date {
  return startOfWeek(d, { weekStartsOn: 1 });
}

function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const mStr = format(monday, "d", { locale: es });
  const sStr = format(sunday, "d 'de' MMMM 'de' yyyy", { locale: es });
  return `${mStr}–${sStr}`;
}

const DEFAULT_FORM = {
  titulo: "", fecha: format(new Date(), "yyyy-MM-dd"),
  horaInicio: "09:00", horaFin: "10:00",
  tipo: "sesion", notas: "",
  repetirSemanal: false, repetirHasta: "", sinFechaFin: true,
  patientId: "", professionalId: "",
};

export default function AgendaPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMonday(new Date()));
  const days = weekDays(currentMonday);
  const rangeStart = format(currentMonday, "yyyy-MM-dd");
  const rangeEnd   = format(addDays(currentMonday, 6), "yyyy-MM-dd");

  const { data: citas = [], isLoading } = useQuery<Cita[]>({
    queryKey: ["citas", rangeStart, rangeEnd],
    queryFn: async () => {
      const res = await fetch(`/api/citas?start=${rangeStart}&end=${rangeEnd}`);
      if (!res.ok) throw new Error("Error al cargar citas");
      return res.json();
    },
  });

  const { data: patients = [] } = useQuery<any[]>({
    queryKey: ["listPatients"],
    queryFn: async () => {
      const res = await fetch("/api/patients");
      if (!res.ok) return [];
      return res.json();
    },
  });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [isSaving, setIsSaving] = useState(false);

  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editScope, setEditScope] = useState<"solo" | "siguientes" | "serie">("solo");
  const [editForm, setEditForm] = useState({ titulo: "", horaInicio: "", horaFin: "", tipo: "", notas: "" });
  const [isEditSaving, setIsEditSaving] = useState(false);

  const [showCancel, setShowCancel] = useState(false);
  const [cancelScope, setCancelScope] = useState<"solo" | "siguientes" | "serie">("solo");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (selectedCita && showEdit) {
      setEditForm({
        titulo: selectedCita.titulo,
        horaInicio: selectedCita.horaInicio,
        horaFin: selectedCita.horaFin,
        tipo: selectedCita.tipo,
        notas: selectedCita.notas ?? "",
      });
      setEditScope("solo");
    }
  }, [selectedCita, showEdit]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["citas", rangeStart, rangeEnd] });
    queryClient.invalidateQueries({ queryKey: ["citas"] });
  };

  const handleCreate = async () => {
    if (!form.patientId || !form.fecha || !form.horaInicio || !form.horaFin) {
      toast({ title: "Selecciona un paciente y completa la fecha y horario", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const body: any = {
        titulo: form.titulo.trim(),
        fecha: form.fecha,
        horaInicio: form.horaInicio,
        horaFin: form.horaFin,
        tipo: form.tipo,
        notas: form.notas || null,
        repetirSemanal: form.repetirSemanal,
        repetirHasta: (form.repetirSemanal && !form.sinFechaFin && form.repetirHasta) ? form.repetirHasta : null,
        patientId: form.patientId ? parseInt(form.patientId) : null,
        professionalId: form.professionalId ? parseInt(form.professionalId) : null,
      };
      const res = await fetch("/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Error al crear cita");
      const created = await res.json();
      const count = Array.isArray(created) ? created.length : 1;
      toast({ title: count > 1 ? `${count} citas creadas (serie semanal)` : "Cita creada" });
      setShowCreate(false);
      setForm({ ...DEFAULT_FORM });
      invalidate();
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedCita) return;
    setIsEditSaving(true);
    try {
      const res = await fetch(`/api/citas/${selectedCita.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: editScope, ...editForm }),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      toast({ title: "Cita actualizada" });
      setShowEdit(false);
      setSelectedCita(null);
      invalidate();
    } catch {
      toast({ title: "Error al actualizar", variant: "destructive" });
    } finally {
      setIsEditSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedCita) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/citas/${selectedCita.id}?scope=${cancelScope}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error");
      const msg =
        cancelScope === "serie" ? "Serie cancelada" :
        cancelScope === "siguientes" ? "Esta y siguientes citas canceladas" :
        "Cita cancelada";
      toast({ title: msg });
      setShowCancel(false);
      setSelectedCita(null);
      invalidate();
    } catch {
      toast({ title: "Error al cancelar", variant: "destructive" });
    } finally {
      setIsCancelling(false);
    }
  };

  const citasForDay = (day: Date) =>
    citas.filter(c => {
      try { return isSameDay(parseISO(c.fecha), day) && c.status !== "cancelada"; }
      catch { return false; }
    });

  const hoursLabels = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);
  const isToday = (d: Date) => isSameDay(d, new Date());

  return (
    <SidebarProvider>
    <div className="flex h-screen bg-slate-50/50 overflow-hidden w-full">
      <AppSidebar />
      <SidebarInset className="flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-6 py-4 border-b border-border/50 bg-white shrink-0">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1 flex items-center gap-4">
            <div>
              <h1 className="text-lg font-bold font-display text-slate-900">Agenda</h1>
              <p className="text-xs text-slate-400 capitalize">{formatWeekRange(currentMonday)}</p>
            </div>
            <div className="flex items-center gap-1 ml-4">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCurrentMonday(d => subWeeks(d, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs px-3" onClick={() => setCurrentMonday(getMonday(new Date()))}>
                Esta semana
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCurrentMonday(d => addWeeks(d, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button
            size="sm"
            className="gap-1.5 text-white shadow-sm"
            style={{ background: "#0E3A6D" }}
            onClick={() => { setForm({ ...DEFAULT_FORM }); setShowCreate(true); }}
          >
            <Plus className="h-4 w-4" /> Nueva cita
          </Button>
        </header>

        {/* Calendar grid */}
        <div className="flex-1 overflow-auto">
          <div className="min-w-[700px]">
            {/* Day headers */}
            <div className="sticky top-0 z-10 bg-white border-b border-border/50 flex">
              <div className="w-14 shrink-0" />
              {days.map((day, i) => (
                <div
                  key={i}
                  className={`flex-1 text-center py-3 border-l border-border/40 first:border-l-0 ${isToday(day) ? "bg-primary/5" : ""}`}
                >
                  <p className={`text-xs font-semibold uppercase tracking-wide ${isToday(day) ? "text-primary" : "text-slate-400"}`}>
                    {DAYS_ES[i]}
                  </p>
                  <p className={`text-lg font-bold font-display mt-0.5 leading-none ${isToday(day) ? "text-primary" : "text-slate-800"}`}>
                    {format(day, "d")}
                  </p>
                  {isToday(day) && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                  )}
                </div>
              ))}
            </div>

            {/* Time grid */}
            <div className="flex">
              {/* Hour labels */}
              <div className="w-14 shrink-0 relative" style={{ height: GRID_HEIGHT + 16 }}>
                {hoursLabels.map(h => (
                  <div
                    key={h}
                    className="absolute right-2 text-[10px] text-slate-400 font-medium leading-none -translate-y-2"
                    style={{ top: (h - START_HOUR) * HOUR_PX }}
                  >
                    {String(h).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map((day, dayIdx) => {
                const dayCitas = citasForDay(day);
                return (
                  <div
                    key={dayIdx}
                    className={`flex-1 relative border-l border-border/40 first:border-l-0 ${isToday(day) ? "bg-primary/[0.02]" : ""}`}
                    style={{ height: GRID_HEIGHT + 16 }}
                  >
                    {/* Hour grid lines */}
                    {hoursLabels.map(h => (
                      <div
                        key={h}
                        className="absolute left-0 right-0 border-t border-slate-100"
                        style={{ top: (h - START_HOUR) * HOUR_PX }}
                      />
                    ))}
                    {/* Half-hour dashed lines */}
                    {hoursLabels.map(h => (
                      <div
                        key={`h-${h}`}
                        className="absolute left-0 right-0 border-t border-dashed border-slate-100/80"
                        style={{ top: (h - START_HOUR) * HOUR_PX + HOUR_PX / 2 }}
                      />
                    ))}

                    {/* Appointments */}
                    {dayCitas.map(cita => {
                      const top = topPx(cita.horaInicio);
                      const h = heightPx(cita.horaInicio, cita.horaFin);
                      const colors = TIPO_COLORS[cita.tipo] ?? TIPO_COLORS.otro;
                      const durationMins = timeToMinutes(cita.horaFin) - timeToMinutes(cita.horaInicio);
                      return (
                        <button
                          key={cita.id}
                          onClick={() => setSelectedCita(cita)}
                          className={`absolute left-0.5 right-0.5 rounded-md border-l-2 text-left overflow-hidden transition-all hover:brightness-95 active:scale-[0.98] ${colors.bg} ${colors.border}`}
                          style={{ top: top + 1, height: h - 2, zIndex: 1, borderLeftColor: colors.dot.replace("bg-", "").includes("-") ? undefined : undefined }}
                        >
                          <div className="px-1.5 py-1 h-full flex flex-col justify-start">
                            <span className={`text-[11px] font-semibold truncate leading-snug ${colors.text}`}>
                              {cita.titulo}
                            </span>
                            <span className={`text-[10px] leading-none mt-0.5 ${colors.text} opacity-60`}>
                              {cita.horaInicio}
                              {h > 32 && ` · ${durationMins}min`}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* ── Create appointment modal ────────────────────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={o => { if (!o && !isSaving) { setShowCreate(false); }}}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" /> Nueva cita
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Paciente *</label>
              <select
                value={form.patientId}
                onChange={e => {
                  const id = e.target.value;
                  const patient = (patients as any[]).find(p => String(p.id) === id);
                  setForm(f => ({ ...f, patientId: id, titulo: patient?.name ?? "" }));
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— Seleccionar paciente —</option>
                {(patients as any[]).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Fecha *</label>
                <Input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Hora inicio *</label>
                <Input type="time" value={form.horaInicio} onChange={e => setForm(f => ({ ...f, horaInicio: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Hora fin *</label>
                <Input type="time" value={form.horaFin} onChange={e => setForm(f => ({ ...f, horaFin: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Notas</label>
              <Textarea
                value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                placeholder="Observaciones opcionales…"
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            {/* Recurrence */}
            <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-slate-50/60">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.repetirSemanal}
                  onChange={e => setForm(f => ({ ...f, repetirSemanal: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-primary accent-primary"
                />
                <div className="flex items-center gap-1.5">
                  <Repeat className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-slate-800">Repetir semanalmente</span>
                </div>
              </label>

              {form.repetirSemanal && (
                <div className="pl-6 space-y-2.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={form.sinFechaFin}
                      onChange={() => setForm(f => ({ ...f, sinFechaFin: true }))}
                      className="accent-primary"
                    />
                    <span className="text-sm text-slate-700">Indefinidamente</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!form.sinFechaFin}
                      onChange={() => setForm(f => ({ ...f, sinFechaFin: false }))}
                      className="accent-primary"
                    />
                    <span className="text-sm text-slate-700">Hasta una fecha:</span>
                  </label>
                  {!form.sinFechaFin && (
                    <Input
                      type="date"
                      value={form.repetirHasta}
                      min={form.fecha}
                      onChange={e => setForm(f => ({ ...f, repetirHasta: e.target.value }))}
                      className="ml-5 w-auto"
                    />
                  )}
                  <p className="text-[10px] text-slate-400 ml-0.5">
                    {form.sinFechaFin
                      ? "Se crearán citas hasta 1 año desde la fecha indicada."
                      : `Se crearán citas cada semana hasta el ${form.repetirHasta || "…"}.`}
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={isSaving} className="text-white" style={{ background: "#0E3A6D" }}>
              {isSaving ? "Guardando…" : form.repetirSemanal ? "Crear serie" : "Crear cita"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Appointment detail / quick actions ─────────────────────────────────── */}
      {selectedCita && !showEdit && !showCancel && (
        <Dialog open onOpenChange={() => setSelectedCita(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 pr-6 text-base">
                {selectedCita.titulo}
              </DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-2 pt-1">
                  <div className="flex flex-col gap-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span className="capitalize">{format(parseISO(selectedCita.fecha), "EEEE d 'de' MMMM", { locale: es })}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {selectedCita.horaInicio} – {selectedCita.horaFin}
                      <span className="text-slate-400">({timeToMinutes(selectedCita.horaFin) - timeToMinutes(selectedCita.horaInicio)} min)</span>
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {selectedCita.serieId && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Repeat className="h-3 w-3" /> Semanal
                      </Badge>
                    )}
                    {selectedCita.status === "cancelada" && (
                      <Badge variant="outline" className="text-xs text-red-600 border-red-200">Cancelada</Badge>
                    )}
                  </div>
                  {selectedCita.notas && (
                    <p className="text-xs text-slate-400 italic">{selectedCita.notas}</p>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            {selectedCita.status !== "cancelada" && (
              <DialogFooter className="flex gap-2 sm:justify-between">
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1.5"
                  onClick={() => { setCancelScope("solo"); setShowCancel(true); }}
                >
                  <X className="h-3.5 w-3.5" /> Cancelar
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 text-white"
                  style={{ background: "#0E3A6D" }}
                  onClick={() => setShowEdit(true)}
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* ── Edit modal ───────────────────────────────────────────────────────────── */}
      {selectedCita && showEdit && (
        <Dialog open onOpenChange={() => { setShowEdit(false); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-primary" /> Editar cita
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-1">
              {/* Scope selection — only if part of a series */}
              {selectedCita.serieId && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                  <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                    <Repeat className="h-3.5 w-3.5" /> Cita recurrente — ¿qué deseas modificar?
                  </p>
                  {(["solo", "siguientes", "serie"] as const).map(s => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={editScope === s}
                        onChange={() => setEditScope(s)}
                        className="accent-amber-600"
                      />
                      <span className="text-sm text-amber-800">
                        {s === "solo"       ? "Solo esta ocurrencia"          :
                         s === "siguientes" ? "Esta y las siguientes citas"   :
                                             "Toda la serie"}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Hora inicio</label>
                  <Input type="time" value={editForm.horaInicio} onChange={e => setEditForm(f => ({ ...f, horaInicio: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Hora fin</label>
                  <Input type="time" value={editForm.horaFin} onChange={e => setEditForm(f => ({ ...f, horaFin: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Tipo</label>
                <select
                  value={editForm.tipo}
                  onChange={e => setEditForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Notas</label>
                <Textarea
                  value={editForm.notas}
                  onChange={e => setEditForm(f => ({ ...f, notas: e.target.value }))}
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowEdit(false)} disabled={isEditSaving}>Cancelar</Button>
              <Button onClick={handleEdit} disabled={isEditSaving} className="text-white" style={{ background: "#0E3A6D" }}>
                {isEditSaving ? "Guardando…" : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Cancel confirm modal ─────────────────────────────────────────────────── */}
      {selectedCita && showCancel && (
        <Dialog open onOpenChange={() => { setShowCancel(false); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" /> Cancelar cita
              </DialogTitle>
              <DialogDescription>
                {`¿Cancelar "${selectedCita.titulo}"?`}
              </DialogDescription>
            </DialogHeader>
            {selectedCita.serieId ? (
              <div className="space-y-2">
                {(["solo", "siguientes", "serie"] as const).map(s => (
                  <label key={s} className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-lg hover:bg-red-50 transition-colors">
                    <input
                      type="radio"
                      checked={cancelScope === s}
                      onChange={() => setCancelScope(s)}
                      className="accent-red-600 mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {s === "solo"       ? "Solo esta ocurrencia"        :
                         s === "siguientes" ? "Esta y las siguientes citas" :
                                             "Toda la serie"}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {s === "solo"       ? "Las demás citas de la serie se mantienen."     :
                         s === "siguientes" ? "Se cancelan esta y todas las citas futuras."   :
                                             "Se cancelan todas las citas de la serie."}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">Esta acción marcará la cita como cancelada.</p>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowCancel(false)} disabled={isCancelling}>Volver</Button>
              <Button variant="destructive" onClick={handleCancel} disabled={isCancelling}>
                {isCancelling ? "Cancelando…" : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
    </SidebarProvider>
  );
}
