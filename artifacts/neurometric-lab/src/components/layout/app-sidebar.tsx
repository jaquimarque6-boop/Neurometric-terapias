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

type NavItem = { title: string; url: string; icon: React.FC<{ className?: string }>; adminOnly?: boolean };

const navItems: NavItem[] = [
  { title: "Panel",              url: "/",              icon: LayoutDashboard },
  { title: "Pacientes",          url: "/patients",      icon: Users           },
  { title: "Agenda",             url: "/agenda",        icon: CalendarDays    },
  { title: "Registros Clínicos", url: "/registros",     icon: ClipboardList   },
  { title: "Objetivos",          url: "/objetivos",     icon: Target          },
  { title: "Banco de Objetivos", url: "/goal-library",  icon: BookOpen        },
  { title: "Actividades",        url: "/actividades",   icon: Sparkles        },
  { title: "Sesiones CSV",       url: "/sessions",      icon: CalendarDays    },
  { title: "Profesionales",      url: "/professionals", icon: Stethoscope,    adminOnly: true },
  { title: "Reportes",           url: "/reportes",      icon: BarChart3       },
  { title: "Usuarios",           url: "/usuarios",      icon: ShieldCheck,    adminOnly: true },
  { title: "Mi perfil",          url: "/usuario",       icon: UserCircle      },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const visibleItems = navItems.filter(item => !item.adminOnly || user?.role === "admin");

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-6">
        <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-[1.02]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
            <Activity className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold tracking-tight text-foreground leading-tight">
              Neurometric
            </span>
            <span className="text-xs font-medium text-primary tracking-widest uppercase">
              LABORATORY
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-6 mb-2 uppercase tracking-widest">
            Plataforma Clínica
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-4 gap-0.5">
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
                        rounded-xl transition-all duration-200 h-10
                        ${isActive
                          ? "bg-primary/10 text-primary font-semibold hover:bg-primary/15"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"}
                      `}
                    >
                      <Link href={item.url} className="flex items-center gap-3 px-3">
                        <item.icon
                          className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                        />
                        <span className="text-sm">{item.title}</span>
                        {isActive && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
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
