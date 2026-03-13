import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ClipboardList, Search, Plus, User, Stethoscope, Home,
  Eye, Pencil, Trash2, X, Check, ChevronDown
} from "lucide-react";
import {
  useListRegistrosClinicos,
  useCreateRegistroClinico,
  useUpdateRegistroClinico,
  useDeleteRegistroClinico,
  useListPatients,
  useListProfessionals,
  getListRegistrosClinicosQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type RC = {
  id: number; patientId: number; patientName?: string | null;
  professionalId?: number | null; professionalName?: string | null;
  fecha: string; resumenSesion?: string | null;
  observaciones?: string | null; recomendacionesHogar?: string | null;
  createdAt: string;
};

function formatFecha(fecha: string) {
  try { return format(new Date(fecha + "T00:00:00"), "d 'de' MMMM, yyyy", { locale: es }); }
  catch { return fecha; }
}

export default function Registros() {
  const { data: registros = [], isLoading } = useListRegistrosClinicos();
  const { data: patients = [] } = useListPatients();
  const { data: professionals = [] } = useListProfessionals();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [patientFilter, setPatientFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RC | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const create = useCreateRegistroClinico();
  const update = useUpdateRegistroClinico();
  const del = useDeleteRegistroClinico();

  const allReg = registros as RC[];
  const patientNames = Array.from(new Set(allReg.map(r => r.patientName ?? ""))).filter(Boolean);

  const filtered = allReg.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (r.patientName ?? "").toLowerCase().includes(q) ||
      (r.professionalName ?? "").toLowerCase().includes(q) ||
      (r.resumenSesion ?? "").toLowerCase().includes(q);
    const matchPatient = patientFilter === "all" || r.patientName === patientFilter;
    return matchSearch && matchPatient;
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListRegistrosClinicosQueryKey() });

  function handleSave(data: Omit<RC, "id" | "createdAt" | "patientName" | "professionalName">) {
    if (editing) {
      update.mutate(
        { id: editing.id, data: { fecha: data.fecha, professionalId: data.professionalId ?? undefined, resumenSesion: data.resumenSesion ?? undefined, observaciones: data.observaciones ?? undefined, recomendacionesHogar: data.recomendacionesHogar ?? undefined } },
        { onSuccess: () => { invalidate(); setEditing(null); toast({ title: "Registro actualizado" }); }, onError: () => toast({ title: "Error", variant: "destructive" }) }
      );
    } else {
      create.mutate(
        { data: { patientId: data.patientId, professionalId: data.professionalId ?? undefined, fecha: data.fecha, resumenSesion: data.resumenSesion ?? undefined, observaciones: data.observaciones ?? undefined, recomendacionesHogar: data.recomendacionesHogar ?? undefined } },
        { onSuccess: () => { invalidate(); setShowForm(false); toast({ title: "Registro creado" }); }, onError: () => toast({ title: "Error", variant: "destructive" }) }
      );
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">

        {/* Header */}
        <div className="bg-white border border-border/50 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-primary" />
                Registros Clínicos
              </h1>
              <p className="text-slate-500 mt-1">{allReg.length} registros de sesión · {patientNames.length} pacientes</p>
            </div>
            <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90 text-white shadow-sm">
              <Plus className="h-4 w-4 mr-2" /> Nuevo registro
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-slate-50 border-slate-200" />
            </div>
            <Select value={patientFilter} onValueChange={setPatientFilter}>
              <SelectTrigger className="w-full sm:w-52 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Todos los pacientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los pacientes</SelectItem>
                {patientNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
          ) : filtered.length > 0 ? (
            filtered.sort((a, b) => b.fecha.localeCompare(a.fecha)).map(r => (
              <Card key={r.id} className="border-border/50 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="shrink-0 h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold font-display text-lg">
                        {(r.patientName ?? "?").charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900">{r.patientName}</span>
                          <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">{formatFecha(r.fecha)}</Badge>
                        </div>
                        {r.professionalName && (
                          <p className="text-sm text-slate-500 flex items-center gap-1.5">
                            <Stethoscope className="h-3.5 w-3.5 text-slate-400" /> {r.professionalName}
                          </p>
                        )}
                        {r.resumenSesion && (
                          <p className={`text-sm text-slate-700 mt-2 leading-relaxed ${expanded === r.id ? "" : "line-clamp-2"}`}>
                            {r.resumenSesion}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" title="Expandir">
                        <ChevronDown className={`h-4 w-4 transition-transform ${expanded === r.id ? "rotate-180" : ""}`} />
                      </button>
                      <button onClick={() => setEditing(r)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteId(r.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {expanded === r.id && (
                    <div className="mt-4 pt-4 border-t border-slate-100 grid sm:grid-cols-2 gap-4">
                      {r.observaciones && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Eye className="h-4 w-4 text-amber-600" />
                            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Observaciones</p>
                          </div>
                          <p className="text-sm text-amber-900 leading-relaxed">{r.observaciones}</p>
                        </div>
                      )}
                      {r.recomendacionesHogar && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Home className="h-4 w-4 text-emerald-600" />
                            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Recomendaciones para el hogar</p>
                          </div>
                          <p className="text-sm text-emerald-900 leading-relaxed">{r.recomendacionesHogar}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
              <ClipboardList className="h-12 w-12 text-slate-200 mx-auto mb-3" />
              <p className="font-medium text-slate-600">No se encontraron registros</p>
              <p className="text-slate-400 text-sm mt-1">Crea el primer registro clínico.</p>
            </div>
          )}
        </div>
      </div>

      {(showForm || editing) && (
        <RegistroForm
          registro={editing}
          patients={patients}
          professionals={professionals}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
          isSaving={create.isPending || update.isPending}
        />
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteId) del.mutate({ id: deleteId }, { onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Registro eliminado" }); } });
              }}
            >Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

function RegistroForm({
  registro, patients, professionals, onSave, onClose, isSaving,
}: {
  registro: RC | null;
  patients: Array<{ id: number; name: string }>;
  professionals: Array<{ id: number; name: string; specialty: string }>;
  onSave: (data: any) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({
    patientId: registro?.patientId?.toString() ?? "",
    professionalId: registro?.professionalId?.toString() ?? "",
    fecha: registro?.fecha ?? new Date().toISOString().split("T")[0],
    resumenSesion: registro?.resumenSesion ?? "",
    observaciones: registro?.observaciones ?? "",
    recomendacionesHogar: registro?.recomendacionesHogar ?? "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const canSave = form.patientId && form.fecha;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            {registro ? "Editar registro" : "Nuevo registro clínico"}
          </DialogTitle>
          <DialogDescription>Complete los datos de la sesión clínica.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!registro && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Paciente *</label>
              <Select value={form.patientId} onValueChange={v => set("patientId", v)}>
                <SelectTrigger className="bg-slate-50"><SelectValue placeholder="Seleccionar paciente..." /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Profesional</label>
            <Select value={form.professionalId} onValueChange={v => set("professionalId", v)}>
              <SelectTrigger className="bg-slate-50"><SelectValue placeholder="Seleccionar profesional..." /></SelectTrigger>
              <SelectContent>
                {professionals.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name} · {p.specialty}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Fecha de sesión *</label>
            <Input type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} className="bg-slate-50" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Resumen de sesión</label>
            <Textarea rows={3} value={form.resumenSesion} onChange={e => set("resumenSesion", e.target.value)} placeholder="Describe lo trabajado en la sesión..." className="bg-slate-50 resize-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2"><Eye className="h-4 w-4 text-amber-500" /> Observaciones</label>
            <Textarea rows={2} value={form.observaciones} onChange={e => set("observaciones", e.target.value)} placeholder="Observaciones clínicas relevantes..." className="bg-slate-50 resize-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2"><Home className="h-4 w-4 text-emerald-600" /> Recomendaciones para el hogar</label>
            <Textarea rows={2} value={form.recomendacionesHogar} onChange={e => set("recomendacionesHogar", e.target.value)} placeholder="Actividades y sugerencias para la familia..." className="bg-slate-50 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={!canSave || isSaving}
              onClick={() => onSave({ patientId: parseInt(form.patientId), professionalId: form.professionalId ? parseInt(form.professionalId) : null, fecha: form.fecha, resumenSesion: form.resumenSesion || null, observaciones: form.observaciones || null, recomendacionesHogar: form.recomendacionesHogar || null })}
            >
              {isSaving ? "Guardando..." : "Guardar registro"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
