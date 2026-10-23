import { ExternalLink, BookOpen, Mic, Brain, Lightbulb, FileText } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { useActividadesPass } from "@/hooks/use-actividades-pass";

const QUICK_LINKS = [
  {
    label: "Lenguaje",
    icon: BookOpen,
    description: "Comprensión, expresión y vocabulario",
    color: { bg: "bg-rose-50", border: "border-rose-200", icon: "text-rose-500", label: "text-rose-700", desc: "text-rose-500" },
  },
  {
    label: "Fonología / TSH",
    icon: Mic,
    description: "Fonemas, sílabas y discriminación auditiva",
    color: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-500", label: "text-amber-700", desc: "text-amber-500" },
  },
  {
    label: "Atención",
    icon: Brain,
    description: "Foco sostenido y funciones ejecutivas",
    color: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-500", label: "text-violet-700", desc: "text-violet-500" },
  },
  {
    label: "Cognición",
    icon: Lightbulb,
    description: "Memoria, razonamiento y resolución de problemas",
    color: { bg: "bg-sky-50", border: "border-sky-200", icon: "text-sky-500", label: "text-sky-700", desc: "text-sky-500" },
  },
  {
    label: "Lectoescritura",
    icon: FileText,
    description: "Lectura, escritura y comprensión lectora",
    color: { bg: "bg-teal-50", border: "border-teal-200", icon: "text-teal-500", label: "text-teal-700", desc: "text-teal-500" },
  },
];

export default function Actividades() {
  const { openActivities, openingActivities } = useActividadesPass();

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-2xl mx-auto w-full">

        {/* Hero card */}
        <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
          {/* Decorative top bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-secondary to-accent" />

          <div className="p-6 sm:p-8 flex flex-col items-center text-center gap-5">
            {/* Icon */}
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>

            {/* Title & description */}
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                Banco de actividades terapéuticas
              </h1>
              <p className="text-muted-foreground mt-2 leading-relaxed max-w-md mx-auto">
                Accedé a actividades organizadas por área y edad listas para usar en sesión.
              </p>
            </div>

            {/* Main CTA */}
            <button
              type="button"
              onClick={() => void openActivities()}
              disabled={openingActivities}
              aria-busy={openingActivities}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm shadow-md transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
              style={{ background: "linear-gradient(90deg, #E07A5F 0%, #c85a44 100%)" }}
            >
              {openingActivities ? "Conectando…" : "Ver banco de actividades"}
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick access section */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-3 px-1">
            Acceso rápido por área
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {QUICK_LINKS.map(({ label, icon: Icon, description, color }) => (
              <button
                key={label}
                type="button"
                onClick={() => void openActivities()}
                disabled={openingActivities}
                aria-busy={openingActivities}
                className={`group flex flex-col gap-2 p-4 rounded-xl border ${color.bg} ${color.border} transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.99] disabled:cursor-wait disabled:opacity-70`}
              >
                <div className="flex items-center justify-between">
                  <div className={`h-9 w-9 rounded-lg bg-white/70 flex items-center justify-center shadow-sm`}>
                    <Icon className={`h-4.5 w-4.5 ${color.icon}`} />
                  </div>
                  <ExternalLink className={`h-3.5 w-3.5 ${color.desc} opacity-50 group-hover:opacity-100 transition-opacity`} />
                </div>
                <div>
                  <p className={`font-semibold text-sm ${color.label}`}>{label}</p>
                  <p className={`text-xs mt-0.5 ${color.desc} leading-snug`}>{description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground/60 pb-2">
          Las actividades se abren en una nueva pestaña del navegador.
        </p>

      </div>
    </AppLayout>
  );
}
