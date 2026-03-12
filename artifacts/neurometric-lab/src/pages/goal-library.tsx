import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  BookOpen, Search, Filter, ChevronDown, ChevronRight,
  Target, CheckCircle2, User, Sparkles, ClipboardList,
  AlertCircle, X, Check,
} from "lucide-react";
import {
  useListGoalLibrary,
  useAssignGoalToPatient,
  useListPatients,
  getListGoalsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Colour maps ─────────────────────────────────────────────────────────────
const MODULE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Emotional Regulation":    { bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200" },
  "Cognitive Restructuring": { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200" },
  "Behavioral Activation":   { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  "Social Skills":           { bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-200" },
  "Trauma Processing":       { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200" },
  "Executive Function":      { bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-200" },
  "Anxiety Management":      { bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-200" },
  "Sleep & Lifestyle":       { bg: "bg-green-50",   text: "text-green-700",   border: "border-green-200" },
  "Mindfulness & Acceptance":{ bg: "bg-cyan-50",    text: "text-cyan-700",    border: "border-cyan-200" },
};

const AREA_COLORS: Record<string, string> = {
  "Cognitive":  "bg-indigo-100 text-indigo-700",
  "Emotional":  "bg-rose-100 text-rose-700",
  "Behavioral": "bg-amber-100 text-amber-700",
  "Social":     "bg-sky-100 text-sky-700",
  "Physical":   "bg-green-100 text-green-700",
  "Language":   "bg-purple-100 text-purple-700",
  "Motor":      "bg-lime-100 text-lime-700",
};

function moduleColor(module: string) {
  return MODULE_COLORS[module] ?? { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" };
}

function ageLabel(min?: number | null, max?: number | null) {
  if (!min && !max) return "All ages";
  if (!max || max >= 99) return `${min}+`;
  return `${min}–${max} yrs`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GoalLibrary() {
  const { data: library = [], isLoading } = useListGoalLibrary();
  const { data: patients = [] } = useListPatients();

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [assignGoal, setAssignGoal] = useState<(typeof library)[0] | null>(null);

  const modules = useMemo(() => ["all", ...Array.from(new Set(library.map(g => g.module))).sort()], [library]);
  const areas   = useMemo(() => ["all", ...Array.from(new Set(library.map(g => g.area))).sort()], [library]);

  const filtered = useMemo(() => library.filter(g => {
    const q = search.toLowerCase();
    const matchSearch = !q || g.goalName.toLowerCase().includes(q) || g.module.toLowerCase().includes(q)
      || g.area.toLowerCase().includes(q) || g.subarea.toLowerCase().includes(q)
      || g.clinicalDescription.toLowerCase().includes(q) || g.goalId.toLowerCase().includes(q);
    const matchModule = moduleFilter === "all" || g.module === moduleFilter;
    const matchArea = areaFilter === "all" || g.area === areaFilter;
    return matchSearch && matchModule && matchArea;
  }), [library, search, moduleFilter, areaFilter]);

  // Group by module
  const grouped = useMemo(() => filtered.reduce((acc, g) => {
    if (!acc[g.module]) acc[g.module] = [];
    acc[g.module].push(g);
    return acc;
  }, {} as Record<string, typeof library>), [filtered]);

  const activeFilters = (moduleFilter !== "all" ? 1 : 0) + (areaFilter !== "all" ? 1 : 0);

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">

        {/* Header */}
        <div className="bg-white border border-border/50 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                Therapy Goals Library
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                {library.length} evidence-based goals across {modules.length - 1} modules. Select and assign to patients.
              </p>
            </div>
          </div>

          {/* Search + filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, module, area, or description..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-full sm:w-52 bg-slate-50 border-slate-200">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {modules.filter(m => m !== "all").map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-full sm:w-44 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {areas.filter(a => a !== "all").map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setModuleFilter("all"); setAreaFilter("all"); }}
                className="text-slate-500 hover:text-slate-700 whitespace-nowrap"
              >
                Clear filters
                <Badge className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center bg-slate-200 text-slate-600 hover:bg-slate-200 text-xs">{activeFilters}</Badge>
              </Button>
            )}
          </div>
        </div>

        {/* Results count */}
        {search || activeFilters > 0 ? (
          <p className="text-sm text-slate-500 -mt-2 px-1">
            Showing <span className="font-semibold text-slate-700">{filtered.length}</span> goals
            {search && <> matching <span className="italic">"{search}"</span></>}
          </p>
        ) : null}

        {/* Library */}
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <BookOpen className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="font-medium text-slate-600">No goals found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([module, goals]) => {
              const mc = moduleColor(module);
              return (
                <div key={module} className="space-y-2">
                  {/* Module header */}
                  <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${mc.bg} border ${mc.border}`}>
                    <Sparkles className={`h-4 w-4 ${mc.text}`} />
                    <h2 className={`font-semibold text-sm ${mc.text}`}>{module}</h2>
                    <Badge variant="outline" className={`ml-auto text-xs ${mc.text} ${mc.border} bg-white/50`}>
                      {goals.length} goal{goals.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {/* Goal cards */}
                  <div className="space-y-2 pl-2">
                    {goals.map(goal => {
                      const expanded = expandedId === goal.id;
                      return (
                        <Card
                          key={goal.id}
                          className={`border-border/50 shadow-sm overflow-hidden transition-all duration-200 ${expanded ? "ring-1 ring-primary/20" : "hover:shadow-md"}`}
                        >
                          {/* Card header row */}
                          <div
                            className="w-full text-left cursor-pointer"
                            onClick={() => setExpandedId(expanded ? null : goal.id)}
                          >
                            <div className="p-4 flex items-start gap-4">
                              {/* Goal ID badge */}
                              <div className={`shrink-0 text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg ${mc.bg} ${mc.text} border ${mc.border} mt-0.5`}>
                                {goal.goalId}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-slate-900 leading-snug">{goal.goalName}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                      <Badge variant="secondary" className={`text-xs ${AREA_COLORS[goal.area] ?? "bg-slate-100 text-slate-600"} border-0`}>
                                        {goal.area}
                                      </Badge>
                                      <span className="text-xs text-slate-400 font-medium">{goal.subarea}</span>
                                      <span className="text-xs text-slate-400">·</span>
                                      <span className="text-xs text-slate-400">{ageLabel(goal.ageRangeMin, goal.ageRangeMax)}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                      size="sm"
                                      onClick={e => { e.stopPropagation(); setAssignGoal(goal); }}
                                      className="h-8 text-xs bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/20"
                                    >
                                      <User className="h-3.5 w-3.5 mr-1.5" />
                                      Assign
                                    </Button>
                                    {expanded
                                      ? <ChevronDown className="h-4 w-4 text-slate-400" />
                                      : <ChevronRight className="h-4 w-4 text-slate-400" />
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Expanded details */}
                          {expanded && (
                            <div className="border-t border-slate-100 bg-slate-50/60">
                              <div className="p-5 grid md:grid-cols-2 gap-5">
                                <DetailSection
                                  icon={<ClipboardList className="h-4 w-4 text-primary" />}
                                  title="Clinical Description"
                                  content={goal.clinicalDescription}
                                />
                                <DetailSection
                                  icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                  title="Success Indicator"
                                  content={goal.successIndicator}
                                />
                                {goal.suggestedActivities && (
                                  <div className="md:col-span-2">
                                    <DetailSection
                                      icon={<Sparkles className="h-4 w-4 text-amber-500" />}
                                      title="Suggested Activities"
                                      content={goal.suggestedActivities}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assign to patient dialog */}
      {assignGoal && (
        <AssignGoalDialog
          goal={assignGoal}
          patients={patients}
          onClose={() => setAssignGoal(null)}
        />
      )}
    </AppLayout>
  );
}

// ─── Detail section ───────────────────────────────────────────────────────────
function DetailSection({ icon, title, content }: { icon: React.ReactNode; title: string; content: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{title}</p>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed">{content}</p>
    </div>
  );
}

// ─── Assign Goal Dialog ───────────────────────────────────────────────────────
function AssignGoalDialog({
  goal,
  patients,
  onClose,
}: {
  goal: { id: number; goalId: string; goalName: string; module: string };
  patients: Array<{ id: number; name: string; status: string }>;
  onClose: () => void;
}) {
  const [patientId, setPatientId] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const assign = useAssignGoalToPatient();

  const activePatients = patients.filter(p => p.status === "active");

  const handleAssign = () => {
    if (!patientId) return;
    assign.mutate(
      {
        id: goal.id,
        data: {
          patientId: parseInt(patientId),
          targetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
          setSuccess(true);
          toast({
            title: "Goal assigned",
            description: `"${goal.goalName}" added to patient's treatment plan.`,
          });
          setTimeout(onClose, 1400);
        },
        onError: (e: any) => {
          toast({ title: "Error", description: e.message, variant: "destructive" });
        },
      }
    );
  };

  const mc = MODULE_COLORS[goal.module] ?? { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" };

  return (
    <Dialog open onOpenChange={() => !assign.isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display text-slate-900 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Assign Goal to Patient
          </DialogTitle>
          <DialogDescription>
            This goal will be added to the patient's active treatment plan.
          </DialogDescription>
        </DialogHeader>

        {/* Goal summary */}
        <div className={`rounded-xl border ${mc.border} ${mc.bg} p-4 space-y-1.5`}>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono font-bold ${mc.text}`}>{goal.goalId}</span>
            <span className={`text-xs ${mc.text} opacity-60`}>·</span>
            <span className={`text-xs ${mc.text}`}>{goal.module}</span>
          </div>
          <p className={`font-semibold text-sm ${mc.text}`}>{goal.goalName}</p>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="font-semibold text-slate-800">Goal assigned successfully</p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Select Patient *</label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger className="bg-slate-50">
                  <SelectValue placeholder="Choose an active patient..." />
                </SelectTrigger>
                <SelectContent>
                  {activePatients.length ? (
                    activePatients.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        <span className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                            {p.name.charAt(0)}
                          </span>
                          {p.name}
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="_none" disabled>No active patients</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Target Date <span className="text-slate-400 font-normal">(optional)</span></label>
              <Input
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="bg-slate-50"
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>

            {!patientId && (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Please select a patient to assign this goal.
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={!patientId || assign.isPending}
                onClick={handleAssign}
              >
                {assign.isPending ? "Assigning..." : "Assign Goal"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
