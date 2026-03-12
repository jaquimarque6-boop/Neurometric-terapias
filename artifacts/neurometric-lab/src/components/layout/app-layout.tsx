import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Bell } from "lucide-react";
import { useLanguage } from "@/i18n";
import { Button } from "@/components/ui/button";

export function AppLayout({ children }: { children: ReactNode }) {
  const { language, setLanguage, t } = useLanguage();

  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full bg-slate-50/50">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/40 bg-white/80 backdrop-blur-md px-4 sm:px-6 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors" />
              <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200">
                <span className="text-slate-400">⌘</span>
                <span className="font-medium">{t.header.searchHint}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Language switcher */}
              <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-full p-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setLanguage("es")}
                  className={`h-7 px-3 rounded-full text-xs font-semibold transition-all ${
                    language === "es"
                      ? "bg-primary text-white shadow-sm hover:bg-primary/90"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  ES
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setLanguage("en")}
                  className={`h-7 px-3 rounded-full text-xs font-semibold transition-all ${
                    language === "en"
                      ? "bg-primary text-white shadow-sm hover:bg-primary/90"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  EN
                </Button>
              </div>

              <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border-2 border-white"></span>
              </button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center font-bold text-sm shadow-md cursor-pointer border-2 border-white">
                DR
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
