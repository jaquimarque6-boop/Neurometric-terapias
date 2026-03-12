import { 
  Users, Activity, Target, Stethoscope, ArrowUpRight, Clock
} from "lucide-react";
import { format } from "date-fns";
import { 
  useGetDashboardStats, 
  useListSessions, 
  useListPatients 
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: sessions, isLoading: sessionsLoading } = useListSessions();
  const { data: patients, isLoading: patientsLoading } = useListPatients();

  const recentSessions = sessions?.slice(0, 5) || [];
  const recentPatients = patients?.slice(0, 5) || [];

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Clinical Overview</h1>
            <p className="text-slate-500 mt-1">Welcome back. Here is the activity across your platform.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-xl border shadow-sm">
            <Clock className="h-4 w-4 text-primary" />
            Last updated: {format(new Date(), 'h:mm a')}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard 
            title="Total Patients" 
            value={stats?.totalPatients} 
            loading={statsLoading}
            icon={Users}
            trend={`+${stats?.newPatientsThisMonth || 0} this month`}
            color="primary"
          />
          <StatCard 
            title="Active Sessions" 
            value={stats?.activeSessions} 
            loading={statsLoading}
            icon={Activity}
            trend={`${stats?.sessionsThisWeek || 0} this week`}
            color="accent"
          />
          <StatCard 
            title="Goals Achieved" 
            value={stats?.goalsAchieved} 
            loading={statsLoading}
            icon={Target}
            trend="Ongoing tracking"
            color="emerald"
          />
        </div>

        {/* Content Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Sessions */}
          <Card className="border-border/50 shadow-lg shadow-slate-200/50 overflow-hidden bg-card-gradient">
            <CardHeader className="border-b bg-white/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Upcoming Sessions
                </CardTitle>
                <button className="text-sm text-primary font-medium hover:underline flex items-center">
                  View all <ArrowUpRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {sessionsLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : recentSessions.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {recentSessions.map(session => (
                    <div key={session.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between group">
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                          {session.patientName || `Patient #${session.patientId}`}
                        </p>
                        <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="capitalize">{session.type}</span> • {session.duration} mins
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900">{format(new Date(session.date), 'MMM d, h:mm a')}</p>
                        <Badge variant="outline" className={`mt-1 bg-white ${session.status === 'scheduled' ? 'text-primary border-primary/30' : ''}`}>
                          {session.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">No upcoming sessions found.</div>
              )}
            </CardContent>
          </Card>

          {/* Recent Patients */}
          <Card className="border-border/50 shadow-lg shadow-slate-200/50 overflow-hidden bg-card-gradient">
            <CardHeader className="border-b bg-white/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Recent Patients
                </CardTitle>
                <button className="text-sm text-primary font-medium hover:underline flex items-center">
                  View all <ArrowUpRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {patientsLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : recentPatients.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {recentPatients.map(patient => (
                    <div key={patient.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-display">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{patient.name}</p>
                          <p className="text-sm text-slate-500 mt-0.5 truncate max-w-[200px]">
                            {patient.diagnosis || "No diagnosis recorded"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className={
                        patient.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                        patient.status === 'discharged' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : ''
                      }>
                        {patient.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">No patients recorded yet.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ 
  title, 
  value, 
  loading, 
  icon: Icon, 
  trend,
  color 
}: { 
  title: string; 
  value?: number; 
  loading: boolean; 
  icon: any; 
  trend: string;
  color: 'primary' | 'accent' | 'emerald';
}) {
  const colorMap = {
    primary: "text-primary bg-primary/10 border-primary/20",
    accent: "text-accent bg-accent/10 border-accent/20",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-200"
  };

  return (
    <Card className="relative overflow-hidden border-border/50 shadow-md hover:shadow-lg transition-shadow group">
      <div className={`absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-300`}>
        <Icon className="h-24 w-24" />
      </div>
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-xl border ${colorMap[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="font-medium text-slate-500">{title}</h3>
        </div>
        <div className="flex items-baseline justify-between">
          {loading ? (
            <Skeleton className="h-10 w-24" />
          ) : (
            <p className="text-4xl font-display font-bold text-slate-900">
              {value || 0}
            </p>
          )}
        </div>
        <div className="mt-4 flex items-center text-sm font-medium text-slate-500 bg-slate-50 w-fit px-2.5 py-1 rounded-md border border-slate-100">
          <ArrowUpRight className="h-3 w-3 mr-1" /> {trend}
        </div>
      </CardContent>
    </Card>
  );
}
