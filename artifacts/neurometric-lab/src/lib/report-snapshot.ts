// A report must never look up clinical fields from the live patient after it is saved.
// Keep this list aligned with the patient fields rendered by InformeTab and its suggestion helpers.
const PATIENT_REPORT_FIELDS = [
  "name", "age", "fechaNacimiento", "diagnosis", "fechaInicio",
  "motivoConsulta", "antecedentes", "historiaFamiliar", "impresionClinica",
  "observaciones", "lenguajeComunicacion", "atencionConducta", "vozHabla",
  "deglucion", "rutinasHabitos", "entornoParticipacion",
] as const;

export type ReportPatientSnapshot = {
  name: string;
  age: number | null;
  fechaNacimiento: string | null;
  diagnosis: string | null;
  fechaInicio: string | null;
  motivoConsulta: string | null;
  antecedentes: string | null;
  historiaFamiliar: string | null;
  impresionClinica: string | null;
  observaciones: string | null;
  lenguajeComunicacion: string | null;
  atencionConducta: string | null;
  vozHabla: string | null;
  deglucion: string | null;
  rutinasHabitos: string | null;
  entornoParticipacion: string | null;
};

export function snapshotReportPatient(patient: object): ReportPatientSnapshot {
  const snapshot: Record<string, unknown> = {};
  for (const field of PATIENT_REPORT_FIELDS) snapshot[field] = (patient as Record<string, unknown>)[field] ?? null;
  return snapshot as ReportPatientSnapshot;
}

export function historicalReportPatient(snapshot: Record<string, unknown> | undefined, id: number): ReportPatientSnapshot & { id: number } {
  const historical = snapshotReportPatient(snapshot ?? {});
  return { ...historical, id, name: typeof historical.name === "string" && historical.name.trim()
    ? historical.name : "Paciente (nombre no disponible)" };
}