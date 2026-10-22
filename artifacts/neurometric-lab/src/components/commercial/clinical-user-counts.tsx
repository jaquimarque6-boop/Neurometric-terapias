import * as React from "react";
import { Activity, Users } from "lucide-react";

type ClinicalUserCountsProps = {
  userId: number;
  role: string;
  patientCount?: number | null;
  clinicalSessionCount?: number | null;
  className?: string;
};

function CountValue({
  value,
  label,
  userId,
  metric,
}: {
  value: number | null | undefined;
  label: string;
  userId: number;
  metric: "patients" | "sessions";
}) {
  const unavailable = value == null;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
      data-testid={`user-${metric}-count-${userId}`}
      title={unavailable ? "No disponible: no se pudo calcular de forma confiable" : `${value} ${label.toLowerCase()}`}
      aria-label={`${label}: ${unavailable ? "no disponible" : value}`}
    >
      {metric === "patients"
        ? <Users className="h-3.5 w-3.5 text-muted-foreground/70" aria-hidden="true" />
        : <Activity className="h-3.5 w-3.5 text-muted-foreground/70" aria-hidden="true" />}
      <span>{label}:</span>
      <span className={unavailable ? "font-medium text-amber-700 dark:text-amber-300" : "font-semibold text-foreground"}>
        {unavailable ? "N/D" : value.toLocaleString("es-AR")}
      </span>
    </span>
  );
}

export function ClinicalUserCounts({
  userId,
  role,
  patientCount,
  clinicalSessionCount,
  className = "",
}: ClinicalUserCountsProps) {
  if (role !== "professional") return null;

  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-1 ${className}`}>
      <CountValue value={patientCount} label="Pacientes" userId={userId} metric="patients" />
      <CountValue value={clinicalSessionCount} label="Sesiones" userId={userId} metric="sessions" />
    </div>
  );
}
