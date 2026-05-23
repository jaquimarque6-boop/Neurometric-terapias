import { Link, useLocation } from "wouter";
import {
  Activity,
  Users,
  ClipboardList,
  Target,
  Sparkles,
  Stethoscope,
  BarChart3,
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  UserCircle,
  ShieldCheck,
  Wallet,
  Download,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";

type NavItem = {
  title: string;
  url: string;
  icon: React.FC<{ className?: string }>;
  adminOnly?: boolean;
  adminHidden?: boolean;
};

const navItems: NavItem[] = [
  { title: "Panel",              url: "/",              icon: LayoutDashboard },
  { title: "Pacientes",          url: "/patients",      icon: Users,           adminHidden: true },
  { title: "Agenda",             url: "/agenda",        icon: CalendarDays,    adminHidden: true },
  { title: "Registro de Pagos",  url: "/agenda-pagos",  icon: Wallet,          adminHidden: true },
  { title: "Registros Clínicos", url: "/registros",     icon: ClipboardList,   adminHidden: true },
  { title: "Objetivos",          url: "/objetivos",     icon: Target,          adminHidden: true },
  { title: "Banco de Objetivos", url: "/goal-library",  icon: BookOpen,        adminHidden: true },
  { title: "Actividades",        url: "/actividades",   icon: Sparkles,        adminHidden: true },
  { title: "Respaldo de datos",  url: "/respaldo",      icon: Download,        adminHidden: true },
  { title: "Profesionales",      url: "/professionals", icon: Stethoscope,     adminOnly: true, adminHidden: true },
  { title: "Reportes",           url: "/reportes",      icon: BarChart3,       adminHidden: true },
  { title: "Usuarios",           url: "/usuarios",      icon: ShieldCheck,     adminOnly: true },
  { title: "Mi perfil",          url: "/usuario",       icon: UserCircle      },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const isAdmin = user?.role === "admin";

  const visibleItems = navItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.adminHidden && isAdmin) return false;
    return true;
  });

  return (
    <Sidebar
      collapsible={isMobile ? "offcanvas" : "none"}
      className="border-r border-sidebar-border bg-sidebar"
    >
      {/* Logo */}
      <SidebarHeader className="px-5 py-6 border-b border-sidebar-border/60">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/25">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-base font-semibold tracking-tight text-foreground">
              Neurometric
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase mt-0.5">
              Terapias
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="pt-3 pb-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground/60 px-5 mb-1 uppercase tracking-widest">
            Plataforma Clínica
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-3 gap-0.5">
              {visibleItems.map((item) => {
                const isActive =
                  location === item.url ||
                  (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`
                        rounded-xl transition-all duration-150 h-9
                        ${isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-sidebar-foreground/60 hover:bg-muted hover:text-sidebar-foreground"}
                      `}
                    >
                      <Link href={item.url} className="flex items-center gap-3 px-3">
                        <item.icon
                          className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/70"}`}
                        />
                        <span className="text-sm">{item.title}</span>
                        {isActive && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
