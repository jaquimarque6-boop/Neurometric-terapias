import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Bell, Search } from "lucide-react";

export function AppLayout({ children }: { children: ReactNode }) {
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
                <Search className="h-4 w-4" />
                <span className="font-medium">Cmd + K</span> to search patients
              </div>
            </div>
            <div className="flex items-center gap-4">
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
