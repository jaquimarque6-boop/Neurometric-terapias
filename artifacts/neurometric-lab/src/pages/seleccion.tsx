import { useLocation } from "wouter";
import { Activity, Stethoscope, Gamepad2, ArrowRight, ExternalLink } from "lucide-react";

const BANCO_ACTIVIDADES_URL = "https://therapy-spark-toolkit.lovable.app/";

export default function SeleccionPage() {
  const [, setLocation] = useLocation();

  const irAGestionClinica = () => setLocation("/");

  const abrirBancoActividades = () => {
    window.open(BANCO_ACTIVIDADES_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary shadow-md shadow-primary/30 mb-5">
            <Activity className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground font-display tracking-tight">
            Neurometric Terapias
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            ¿Qué sección deseas abrir?
          </p>
        </div>

        {/* Selection cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Gestión Clínica */}
          <button
            type="button"
            onClick={irAGestionClinica}
            className="group text-left bg-card rounded-2xl border border-card-border shadow-sm p-7 transition-all hover:shadow-md hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary mb-5">
              <Stethoscope className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Gestión Clínica</h2>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Pacientes, agenda, sesiones, objetivos y reportes de Neurometric Terapias.
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary mt-5 group-hover:gap-2.5 transition-all">
              Abrir
              <ArrowRight className="h-4 w-4" />
            </span>
          </button>

          {/* Banco de Actividades */}
          <button
            type="button"
            onClick={abrirBancoActividades}
            className="group text-left bg-card rounded-2xl border border-card-border shadow-sm p-7 transition-all hover:shadow-md hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary mb-5">
              <Gamepad2 className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Banco de Actividades</h2>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Recursos y actividades terapéuticas interactivas. Se abre en una pestaña nueva.
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary mt-5 group-hover:gap-2.5 transition-all">
              Abrir
              <ExternalLink className="h-4 w-4" />
            </span>
          </button>

        </div>
      </div>
    </div>
  );
}
