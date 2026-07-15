import { ReactNode } from "react";
import { useLocation } from "wouter";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Bell, LogOut, ChevronDown, Menu, HelpCircle } from "lucide-react";
import { WelcomeTour, openTour } from "@/components/welcome-tour";
import { useLanguage } from "@/i18n";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function MobileMenuButton() {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      className="md:hidden flex items-center gap-1.5 h-10 px-3 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border/60"
      aria-label="Abrir menú"
    >
      <Menu className="h-4 w-4 shrink-0" />
      <span className="text-sm font-medium">Menú</span>
    </button>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const style = {
    "--sidebar-width": "17rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">

          {/* Top header */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-card/90 backdrop-blur-md px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <MobileMenuButton />
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-muted/80 px-3 py-1.5 rounded-full border border-border/60">
                <span className="opacity-50">⌘</span>
                <span className="font-medium">{t.header.searchHint}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language switcher */}
              <div className="flex items-center gap-0.5 bg-muted/80 border border-border/60 rounded-full p-0.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setLanguage("es")}
                  className={`h-6 px-2.5 rounded-full text-[11px] font-semibold transition-all ${
                    language === "es"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ES
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setLanguage("en")}
                  className={`h-6 px-2.5 rounded-full text-[11px] font-semibold transition-all ${
                    language === "en"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  EN
                </Button>
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted">
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary border-2 border-card"></span>
              </button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:bg-muted rounded-xl px-2 py-1.5 transition-colors">
                    <div className="h-7 w-7 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold text-xs border border-primary/20">
                      {initials}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-semibold text-foreground leading-tight">{user?.name ?? "Usuario"}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight capitalize">{user?.role === "admin" ? "Administrador" : "Profesional"}</p>
                    </div>
                    <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="font-normal py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-primary/12 text-primary flex items-center justify-center font-semibold text-sm border border-primary/20">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => openTour()}>
                    <HelpCircle className="h-4 w-4" />
                    Ver guía de uso
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive focus:bg-destructive/8 cursor-pointer gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main content */}
          {/* NOTE: no overflow-x-hidden here — the informe preview needs horizontal
              scroll on mobile. The parent flex item has min-w-0 which already
              prevents the sidebar from leaking into this area. */}
          <main className="flex-1 overflow-x-auto p-5 sm:p-7 lg:p-8">
            <div className="mx-auto w-full max-w-7xl">
              {children}
            </div>
          </main>

        </div>
      </div>
      <WelcomeTour />
    </SidebarProvider>
  );
}
