import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import {
  ArrowLeft, User, Mail, Phone, FileText, CalendarDays,
  Target, CheckCircle2, Circle, ArrowRightCircle, AlertCircle,
  Clock, Plus, ChevronRight, Activity, TrendingUp, BarChart3
} from "lucide-react";
import {
  useGetPatient,
  useListSessions,
  useListGoals,
  useListProfessionals,
  useCreateSession,
  useCreateGoal,
  useUpdateGoal,
  getListSessionsQueryKey,
  getListGoalsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

// ─── Schemas ───────────────────────────────────────────────────────────────
const createSessionSchema = z.object({
  professionalId: z.coerce.number().min(1, "Professional is required"),
  date: z.string().min(1, "Date is required"),
  duration: z.coerce.number().min(15, "At least 15 minutes"),
  type: z.enum(["individual", "group", "assessment", "follow-up"]),
  notes: z.string().optional(),
  status: z.enum(["scheduled", "completed", "cancelled"]),
});

const createGoalSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  category: z.enum(["cognitive", "behavioral", "emotional", "social", "physical"]),
  status: z.enum(["pending", "in-progress", "achieved", "discontinued"]),
  targetDate: z.string().optional(),
});

// ─── Status helpers ─────────────────────────────────────────────────────────
function statusBadgeClass(status: string) {
  return {
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    inactive: "bg-slate-100 text-slate-600 border-slate-200",
    discharged: "bg-blue-100 text-blue-700 border-blue-200",
  }[status] ?? "bg-slate-100 text-slate-600";
}

function sessionStatusClass(status: string) {
  return {
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    scheduled: "bg-blue-50 text-primary border-primary/30",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  }[status] ?? "";
}

function GoalIcon({ status }: { status: string }) {
  switch (status) {
    case "achieved":     return <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />;
    case "in-progress":  return <ArrowRightCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />;
    case "discontinued": return <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />;
    default:             return <Circle className="h-5 w-5 text-slate-300 shrink-0 mt-0.5" />;
  }
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function PatientProfile() {
  const params = useParams<{ id: string }>();
  const patientId = parseInt(params.id || "0");
  const [, navigate] = useLocation();

  const { data: patient, isLoading: loadingPatient } = useGetPatient(patientId);
  const { data: allSessions = [], isLoading: loadingSessions } = useListSessions();
  const { data: allGoals = [], isLoading: loadingGoals } = useListGoals();
  const { data: professionals = [] } = useListProfessionals();
  const queryClient = useQueryClient();
  const updateGoal = useUpdateGoal();

  const sessions = allSessions.filter(s => s.patientId === patientId);
  const goals = allGoals.filter(g => g.patientId === patientId);

  // ─── Chart: sessions per month (last 6 months) ──────────────────────────
  const sessionChartData = Array.from({ length: 6 }, (_, i) => {
    const monthDate = subMonths(new Date(), 5 - i);
    const interval = { start: startOfMonth(monthDate), end: endOfMonth(monthDate) };
    const count = sessions.filter(s => {
      try { return isWithinInterval(parseISO(s.date), interval); } catch { return false; }
    }).length;
    return { month: format(monthDate, "MMM"), sessions: count };
  });

  // ─── Chart: goals by status ──────────────────────────────────────────────
  const goalStatuses = ["pending", "in-progress", "achieved", "discontinued"];
  const goalStatusColors = ["#94a3b8", "#f59e0b", "#10b981", "#ef4444"];
  const goalChartData = goalStatuses
    .map((s, i) => ({
      name: s === "in-progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1),
      value: goals.filter(g => g.status === s).length,
      color: goalStatusColors[i],
    }))
    .filter(d => d.value > 0);

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.status === "completed").length;
  const achievedGoals = goals.filter(g => g.status === "achieved").length;
  const activeGoals = goals.filter(g => g.status === "in-progress").length;

  const professional = professionals.find(p => p.id === patient?.professionalId);

  const handleStatusUpdate = (id: number, newStatus: string) => {
    updateGoal.mutate({ id, data: { status: newStatus as any } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() }),
    });
  };

  if (loadingPatient) return (
    <AppLayout>
      <div className="space-y-6">
        <Skeleton className="h-36 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </AppLayout>
  );

  if (!patient) return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <User className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Patient not found</h2>
        <p className="text-slate-500 mt-1 mb-6">The requested patient record does not exist.</p>
        <Button variant="outline" onClick={() => navigate("/patients")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Patients
        </Button>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-6xl mx-auto">

        {/* Back button */}
        <button
          onClick={() => navigate("/patients")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors w-fit group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Patient Directory
        </button>

        {/* Patient header card */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold font-display ring-4 ring-white shadow-md shrink-0">
                {patient.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-2xl font-display font-bold text-slate-900">{patient.name}</h1>
                  <Badge variant="outline" className={statusBadgeClass(patient.status)}>
                    {patient.status}
                  </Badge>
                </div>
                <p className="text-slate-500 text-sm mb-4">Patient since {format(new Date(patient.createdAt), "MMMM d, yyyy")}</p>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5"><User className="h-4 w-4 text-slate-400" /> Age {patient.age}</span>
                  <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-slate-400" /> {patient.email}</span>
                  {patient.phone && <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-slate-400" /> {patient.phone}</span>}
                  {professional && <span className="flex items-center gap-1.5"><Activity className="h-4 w-4 text-slate-400" /> {professional.name}</span>}
                </div>
              </div>
            </div>
            {patient.diagnosis && (
              <div className="mt-5 flex items-start gap-3 bg-white/60 backdrop-blur-sm border border-primary/10 rounded-xl p-4">
                <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-0.5">Primary Diagnosis</p>
                  <p className="text-slate-800 font-medium">{patient.diagnosis}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Sessions", value: totalSessions, icon: CalendarDays, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Completed", value: completedSessions, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "Active Goals", value: activeGoals, icon: Target, color: "text-amber-500", bg: "bg-amber-50" },
            { label: "Goals Achieved", value: achievedGoals, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
          ].map(stat => (
            <Card key={stat.label} className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <div className={`inline-flex p-2 rounded-lg ${stat.bg} mb-3`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-display font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="bg-white border border-border/50 p-1 rounded-xl shadow-sm w-full md:w-auto">
            <TabsTrigger value="overview" className="rounded-lg text-sm flex-1 md:flex-none">Overview</TabsTrigger>
            <TabsTrigger value="sessions" className="rounded-lg text-sm flex-1 md:flex-none">Sessions ({totalSessions})</TabsTrigger>
            <TabsTrigger value="goals" className="rounded-lg text-sm flex-1 md:flex-none">Goals ({goals.length})</TabsTrigger>
            <TabsTrigger value="progress" className="rounded-lg text-sm flex-1 md:flex-none">Progress</TabsTrigger>
          </TabsList>

          {/* ── Overview Tab ─────────────────────────────────────────────── */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent sessions */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" /> Recent Sessions
                    </CardTitle>
                    <AddSessionSheet patientId={patientId} professionals={professionals} />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingSessions ? (
                    <div className="p-5 space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
                  ) : sessions.slice(0, 5).length ? (
                    <div className="divide-y divide-border/40">
                      {sessions.slice(0, 5).map(s => (
                        <div key={s.id} className="px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 capitalize">{s.type} session</p>
                              <p className="text-xs text-slate-500 mt-0.5">{format(new Date(s.date), "MMM d, yyyy")} · {s.duration}min</p>
                            </div>
                            <Badge variant="outline" className={`text-xs shrink-0 ${sessionStatusClass(s.status)}`}>{s.status}</Badge>
                          </div>
                          {s.notes && <p className="text-xs text-slate-500 mt-2 line-clamp-1 italic border-l-2 border-primary/20 pl-2">{s.notes}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center text-slate-400 text-sm">No sessions recorded yet.</div>
                  )}
                </CardContent>
              </Card>

              {/* Goals summary */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" /> Treatment Goals
                    </CardTitle>
                    <AddGoalSheet patientId={patientId} />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingGoals ? (
                    <div className="p-5 space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
                  ) : goals.slice(0, 5).length ? (
                    <div className="divide-y divide-border/40">
                      {goals.slice(0, 5).map(g => (
                        <div key={g.id} className="px-5 py-3.5 hover:bg-slate-50/60 transition-colors flex gap-3 items-start">
                          <GoalIcon status={g.status} />
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-medium ${g.status === "achieved" ? "line-through text-slate-400" : "text-slate-800"}`}>{g.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs capitalize bg-slate-100 text-slate-600 hover:bg-slate-100">{g.category}</Badge>
                              {g.targetDate && (
                                <span className="text-xs text-slate-400">Due {format(new Date(g.targetDate), "MMM d")}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center text-slate-400 text-sm">No goals defined yet.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Sessions Tab ─────────────────────────────────────────────── */}
          <TabsContent value="sessions" className="mt-6">
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-base font-semibold text-slate-800">All Session Records</CardTitle>
                  <AddSessionSheet patientId={patientId} professionals={professionals} />
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b text-slate-500 text-left">
                    <tr>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Type</th>
                      <th className="px-5 py-3 font-medium">Duration</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {loadingSessions ? (
                      Array(4).fill(0).map((_, i) => (
                        <tr key={i}>
                          {Array(5).fill(0).map((_, j) => (
                            <td key={j} className="px-5 py-4"><Skeleton className="h-4 w-full" /></td>
                          ))}
                        </tr>
                      ))
                    ) : sessions.length ? (
                      sessions
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(s => (
                          <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-4 font-medium text-slate-800 whitespace-nowrap">
                              {format(new Date(s.date), "MMM d, yyyy")}
                            </td>
                            <td className="px-5 py-4 capitalize text-slate-600">{s.type}</td>
                            <td className="px-5 py-4">
                              <span className="flex items-center gap-1.5 text-slate-600 bg-slate-100 w-fit px-2 py-1 rounded-md text-xs">
                                <Clock className="h-3 w-3 text-slate-400" />{s.duration}m
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <Badge variant="outline" className={`text-xs ${sessionStatusClass(s.status)}`}>{s.status}</Badge>
                            </td>
                            <td className="px-5 py-4 text-slate-500 text-xs max-w-xs">
                              {s.notes ? (
                                <span className="line-clamp-2 italic">{s.notes}</span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                          No sessions recorded for this patient.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* ── Goals Tab ────────────────────────────────────────────────── */}
          <TabsContent value="goals" className="mt-6">
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-base font-semibold text-slate-800">Treatment Goals</CardTitle>
                  <AddGoalSheet patientId={patientId} />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingGoals ? (
                  <div className="p-5 space-y-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
                ) : goals.length ? (
                  <div className="divide-y divide-border/40">
                    {goals.map(g => (
                      <div key={g.id} className="p-5 hover:bg-slate-50/40 transition-colors group">
                        <div className="flex gap-4 items-start justify-between flex-wrap">
                          <div className="flex gap-3 items-start flex-1 min-w-0">
                            <GoalIcon status={g.status} />
                            <div className="min-w-0">
                              <p className={`font-semibold text-sm ${g.status === "achieved" ? "line-through text-slate-400" : "text-slate-900"}`}>{g.title}</p>
                              {g.description && <p className="text-xs text-slate-500 mt-1">{g.description}</p>}
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs capitalize bg-slate-100 text-slate-600 hover:bg-slate-100">{g.category}</Badge>
                                {g.targetDate && (
                                  <span className="text-xs text-slate-400 bg-white border px-2 py-0.5 rounded">
                                    Target: {format(new Date(g.targetDate), "MMM d, yyyy")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Select
                            value={g.status}
                            onValueChange={(val) => handleStatusUpdate(g.id, val)}
                            disabled={updateGoal.isPending}
                          >
                            <SelectTrigger className="h-8 w-[140px] text-xs bg-white shrink-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="achieved">Achieved</SelectItem>
                              <SelectItem value="discontinued">Discontinued</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-14 text-center">
                    <Target className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No goals defined</p>
                    <p className="text-slate-400 text-sm mt-1">Create treatment goals to track progress.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Progress Tab ─────────────────────────────────────────────── */}
          <TabsContent value="progress" className="mt-6 space-y-6">
            {/* Sessions bar chart */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Sessions Over Time (Last 6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {sessions.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No session data available.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={sessionChartData} margin={{ top: 0, right: 16, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,.08)", fontSize: 12 }}
                        cursor={{ fill: "rgba(99,102,241,0.05)" }}
                      />
                      <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Goals donut + breakdown */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" /> Goals by Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {goals.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No goal data available.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={goalChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                        >
                          {goalChartData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" /> Goal Breakdown by Domain
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {goals.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No goal data available.</div>
                  ) : (
                    <div className="space-y-3">
                      {["cognitive", "behavioral", "emotional", "social", "physical"].map(category => {
                        const count = goals.filter(g => g.category === category).length;
                        const pct = goals.length ? Math.round((count / goals.length) * 100) : 0;
                        if (count === 0) return null;
                        return (
                          <div key={category}>
                            <div className="flex justify-between text-xs text-slate-600 mb-1 capitalize">
                              <span className="font-medium">{category}</span>
                              <span>{count} goal{count !== 1 ? "s" : ""}</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary/70 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Completion rate summary */}
            <Card className="border-border/50 shadow-sm bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Session Completion Rate</p>
                    <p className="text-3xl font-display font-bold text-slate-900">
                      {totalSessions ? Math.round((completedSessions / totalSessions) * 100) : 0}%
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{completedSessions} of {totalSessions} sessions</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Goal Achievement Rate</p>
                    <p className="text-3xl font-display font-bold text-emerald-600">
                      {goals.length ? Math.round((achievedGoals / goals.length) * 100) : 0}%
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{achievedGoals} of {goals.length} goals</p>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Active Treatment Items</p>
                    <p className="text-3xl font-display font-bold text-amber-600">{activeGoals}</p>
                    <p className="text-xs text-slate-500 mt-0.5">in-progress goals</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

// ─── Add Session Sheet ───────────────────────────────────────────────────────
function AddSessionSheet({ patientId, professionals }: { patientId: number; professionals: any[] }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createSession = useCreateSession();

  const form = useForm<z.infer<typeof createSessionSchema>>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      professionalId: undefined,
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      duration: 50,
      type: "individual",
      status: "scheduled",
      notes: "",
    },
  });

  const onSubmit = (values: z.infer<typeof createSessionSchema>) => {
    createSession.mutate(
      { data: { ...values, patientId, date: new Date(values.date).toISOString() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
          toast({ title: "Session logged", description: "Clinical session added to patient record." });
          setOpen(false);
          form.reset();
        },
        onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="h-8 text-xs bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-0 font-medium">
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Session
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-slate-50">
        <SheetHeader className="bg-white -mx-6 -mt-6 p-6 border-b mb-6">
          <SheetTitle className="text-primary text-xl">Log New Session</SheetTitle>
          <SheetDescription>Record a therapy session for this patient.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
              <FormField control={form.control} name="professionalId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value?.toString()}>
                    <FormControl><SelectTrigger className="bg-slate-50"><SelectValue placeholder="Assign professional" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {professionals.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & Time</FormLabel>
                  <FormControl><Input type="datetime-local" className="bg-slate-50" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="duration" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (min)</FormLabel>
                    <FormControl><Input type="number" className="bg-slate-50" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="bg-slate-50"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="group">Group</SelectItem>
                        <SelectItem value="assessment">Assessment</SelectItem>
                        <SelectItem value="follow-up">Follow-up</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="bg-slate-50"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Clinical Notes</FormLabel>
                  <FormControl><Textarea placeholder="Session observations..." className="bg-slate-50 min-h-[80px] resize-none" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 bg-primary" disabled={createSession.isPending}>
                {createSession.isPending ? "Saving..." : "Save Session"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

// ─── Add Goal Sheet ──────────────────────────────────────────────────────────
function AddGoalSheet({ patientId }: { patientId: number }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createGoal = useCreateGoal();

  const form = useForm<z.infer<typeof createGoalSchema>>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: { title: "", description: "", category: "behavioral", status: "pending", targetDate: "" },
  });

  const onSubmit = (values: z.infer<typeof createGoalSchema>) => {
    createGoal.mutate(
      { data: { ...values, patientId, targetDate: values.targetDate ? new Date(values.targetDate).toISOString() : undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
          toast({ title: "Goal created", description: "Treatment goal added to patient record." });
          setOpen(false);
          form.reset();
        },
        onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="h-8 text-xs bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-0 font-medium">
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Goal
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-slate-50">
        <SheetHeader className="bg-white -mx-6 -mt-6 p-6 border-b mb-6">
          <SheetTitle className="text-primary text-xl">Treatment Goal</SheetTitle>
          <SheetDescription>Define a measurable objective for this patient.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Title</FormLabel>
                  <FormControl><Input placeholder="Reduce anxiety episodes to <2/week" className="bg-slate-50 font-medium" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Details / Measurement</FormLabel>
                  <FormControl><Textarea placeholder="Patient will use grounding techniques..." className="bg-slate-50 min-h-[80px] resize-none text-sm" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="bg-slate-50"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="cognitive">Cognitive</SelectItem>
                        <SelectItem value="behavioral">Behavioral</SelectItem>
                        <SelectItem value="emotional">Emotional</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="physical">Physical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="targetDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Date</FormLabel>
                    <FormControl><Input type="date" className="bg-slate-50" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 bg-primary" disabled={createGoal.isPending}>
                {createGoal.isPending ? "Saving..." : "Save Goal"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
