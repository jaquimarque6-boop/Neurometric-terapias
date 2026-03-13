import { useState } from "react";
import {
  Target, Plus, Search, CheckCircle2, Circle, Clock, Trash2,
  ChevronRight, User, Filter, X
} from "lucide-react";
import {
  useListGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useListPatients,
  getListGoalsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Goal = {
  id: number; patientId: number; patientName?: string;
  codigo?: string | null; title: string; description?: string | null;
  category: string; franjaEtaria?: string | null;
  status: string; targetDate?: string | null; createdAt: string;
};

const CATEGORIAS = [
  "lenguaje", "comprensión", "léxico", "narrativo", "pragmática",
  "fonología", "cognitivo", "conductual", "otro"
];

function statusIcon(status: string) {
  if (status === "logrado") return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  if (status === "suspendido") return <X className="h-5 w-5 text-red-400" />;
  return <Circle className="h-5 w-5 text-primary" />;
}

function statusStyle(status: string) {
  if (status === "logrado") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "suspendido") return "bg-red-100 text-red-700 border-red-200";
  return "bg-blue-100 text-blue-700 border-blue-200";
}

function statusLabel(status: string) {
  if (status === "logrado") return "Logrado";
  if (status === "suspendido") return "Suspendido";
  return "Activo";
}

export default function Objetivos() {
  const { data: goals = [], isLoading } = useListGoals();
  const { data: patients = [] } = useListPatients();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [patientFilter, setPatientFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const allGoals = goals as Goal[];
  const uniquePatients = Array.from(new Map(allGoals.map(g => [g.patientId, g.patientName ?? ""])).entries());

  const filtered = allGoals.filter(g => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      g.title.toLowerCase().includes(q) ||
      (g.codigo ?? "").toLowerCase().includes(q) ||
      (g.category ?? "").toLowerCase().includes(q) ||
      (g.patientName ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || g.status === statusFilter;
    const matchPatient = patientFilter === "all" || g.patientId.toString() === patientFilter;
    return matchSearch && matchStatus && matchPatient;
  });

  const grouped = filtered.reduce((acc, g) => {
    const key = g.patientName ?? `Paciente #${g.patientId}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {} as Record<string, Goal[]>);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });

  const toggleStatus = (goal: Goal) => {
    const next = goal.status === "activo" ? "logrado" : "activo";
    updateGoal.mutate(
      { id: goal.id, data: { status: next as any } },
      { onSuccess: invalidate }
    );
  };

  const stats = {
    total: allGoals.length,
    activos: allGoals.filter(g => g.status === "activo").length,
    logrados: allGoals.filter(g => g.status === "logrado").length,
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">

        {/* Header */}
        <div className="bg-white border border-border/50 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                Objetivos Terapéuticos
              </h1>
              <p className="text-slate-500 mt-1">
                {stats.total} objetivos · {stats.activos} activos · {stats.logrados} logrados
              </p>
            </div>
            <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90 text-white shadow-sm">
              <Plus className="h-4 w-4 mr-2" /> Nuevo objetivo
            </Button>
          </div>

          {/* Stats chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { label: "Total", count: stats.total, color: "bg-slate-100 text-slate-600" },
              { label: "Activos", count: stats.activos, color: "bg-blue-100 text-blue-700" },
              { label: "Logrados", count: stats.logrados, color: "bg-emerald-100 text-emerald-700" },
            ].map(s => (
              <div key={s.label} className={`px-3 py-1 rounded-full text-xs font-semibold ${s.color}`}>
                {s.label}: {s.count}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Buscar objetivos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-slate-50 border-slate-200" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="logrado">Logrado</SelectItem>
                <SelectItem value="suspendido">Suspendido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={patientFilter} onValueChange={setPatientFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Paciente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los pacientes</SelectItem>
                {uniquePatients.map(([id, name]) => (
                  <SelectItem key={id} value={id.toString()}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grouped goals */}
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          </div>
        ) : Object.keys(grouped).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(grouped).map(([patientName, patientGoals]) => (
              <div key={patientName}>
                <div className="flex items-center gap-3 mb-3 px-1">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm font-display">{patientName.charAt(0)}</div>
                  <h2 className="font-semibold text-slate-700">{patientName}</h2>
                  <span className="text-xs text-slate-400">{patientGoals.length} objetivo{patientGoals.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-2">
                  {patientGoals.map(goal => (
                    <Card key={goal.id} className={`border-border/50 shadow-sm overflow-hidden transition-all ${goal.status === "logrado" ? "opacity-70" : ""}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <button onClick={() => toggleStatus(goal)} className="shrink-0 mt-0.5 hover:scale-110 transition-transform" title="Cambiar estado">
                            {statusIcon(goal.status)}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              {goal.codigo && (
                                <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{goal.codigo}</span>
                              )}
                              <p className={`font-semibold text-slate-900 ${goal.status === "logrado" ? "line-through text-slate-400" : ""}`}>
                                {goal.title}
                              </p>
                            </div>
                            {goal.description && (
                              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{goal.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge variant="outline" className={`text-xs ${statusStyle(goal.status)}`}>{statusLabel(goal.status)}</Badge>
                              {goal.category && (
                                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-100 capitalize">{goal.category}</Badge>
                              )}
                              {goal.franjaEtaria && (
                                <span className="text-xs text-slate-400">{goal.franjaEtaria} años</span>
                              )}
                              {goal.targetDate && (
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> Vence {goal.targetDate}
                                </span>
                              )}
                            </div>
                          </div>
                          <button onClick={() => setDeleteId(goal.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0" title="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <Target className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="font-medium text-slate-600">No se encontraron objetivos</p>
            <p className="text-slate-400 text-sm mt-1">Crea el primer objetivo terapéutico.</p>
          </div>
        )}
      </div>

      {showForm && (
        <GoalForm
          patients={patients}
          onSave={(data) => {
            createGoal.mutate({ data }, {
              onSuccess: () => { invalidate(); setShowForm(false); toast({ title: "Objetivo creado" }); },
              onError: () => toast({ title: "Error", variant: "destructive" }),
            });
          }}
          onClose={() => setShowForm(false)}
          isSaving={createGoal.isPending}
        />
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar objetivo?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => {
              if (deleteId) deleteGoal.mutate({ id: deleteId }, { onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Objetivo eliminado" }); } });
            }}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

function GoalForm({ patients, onSave, onClose, isSaving }: {
  patients: Array<{ id: number; name: string }>;
  onSave: (data: any) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({
    patientId: "", codigo: "", title: "", description: "",
    category: "lenguaje", franjaEtaria: "", status: "activo", targetDate: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const canSave = form.patientId && form.title && form.category;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" /> Nuevo objetivo terapéutico
          </DialogTitle>
          <DialogDescription>Define un objetivo clínico medible para el paciente.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Paciente *</label>
            <Select value={form.patientId} onValueChange={v => set("patientId", v)}>
              <SelectTrigger className="bg-slate-50"><SelectValue placeholder="Seleccionar paciente..." /></SelectTrigger>
              <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Código</label>
              <Input value={form.codigo} onChange={e => set("codigo", e.target.value)} placeholder="NL-001" className="bg-slate-50 font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Franja etaria</label>
              <Input value={form.franjaEtaria} onChange={e => set("franjaEtaria", e.target.value)} placeholder="3-5" className="bg-slate-50" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Título del objetivo *</label>
            <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Ampliar vocabulario sustantivo..." className="bg-slate-50" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Descripción / Definición operativa</label>
            <Textarea rows={3} value={form.description} onChange={e => set("description", e.target.value)} placeholder="El paciente nombrará correctamente..." className="bg-slate-50 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Categoría *</label>
              <Select value={form.category} onValueChange={v => set("category", v)}>
                <SelectTrigger className="bg-slate-50"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Estado</label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger className="bg-slate-50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="logrado">Logrado</SelectItem>
                  <SelectItem value="suspendido">Suspendido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Fecha objetivo</label>
            <Input type="date" value={form.targetDate} onChange={e => set("targetDate", e.target.value)} className="bg-slate-50" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1 bg-primary hover:bg-primary/90" disabled={!canSave || isSaving}
              onClick={() => onSave({
                patientId: parseInt(form.patientId), codigo: form.codigo || undefined,
                title: form.title, description: form.description || undefined,
                category: form.category, franjaEtaria: form.franjaEtaria || undefined,
                status: form.status, targetDate: form.targetDate || undefined,
              })}>
              {isSaving ? "Guardando..." : "Crear objetivo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
