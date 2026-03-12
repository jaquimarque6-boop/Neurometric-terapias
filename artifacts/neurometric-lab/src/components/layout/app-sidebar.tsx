import { Link, useLocation } from "wouter";
import { 
  Activity, 
  Users, 
  CalendarDays, 
  Target, 
  Stethoscope,
  BarChart3
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

const navItems = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Patients", url: "/patients", icon: Users },
  { title: "Sessions", url: "/sessions", icon: CalendarDays },
  { title: "Goals", url: "/goals", icon: Target },
  { title: "Professionals", url: "/professionals", icon: Stethoscope },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r border-border/50 bg-white">
      <SidebarHeader className="p-6">
        <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-[1.02]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
            <Activity className="h-6 w-6 text-white" />
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
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-6 mb-2">
            CLINICAL PLATFORM
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-4 gap-1">
              {navItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={`
                        rounded-xl transition-all duration-200 h-11
                        ${isActive 
                          ? "bg-primary/10 text-primary font-semibold hover:bg-primary/15" 
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}
                      `}
                    >
                      <Link href={item.url} className="flex items-center gap-3 px-3">
                        <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-slate-400"}`} />
                        <span className="text-sm">{item.title}</span>
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
