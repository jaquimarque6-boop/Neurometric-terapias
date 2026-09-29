type DatedRecord = { fecha: string | null };

export function validClinicalDay(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function selectClinicalPeriod<T extends DatedRecord>(records: T[], kind: string, now = new Date()) {
  if (!["4", "mes", "3meses", "6meses"].includes(kind)) throw new RangeError("Período inválido");
  const periodTo = now.toISOString().slice(0, 10);
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - (kind === "mes" ? 30 : kind === "3meses" ? 90 : 180));
  // An invalid session date is not a real session date: do not silently substitute
  // createdAt (the row creation time) and present it as clinical evidence.
  const sorted = records.filter((row): row is T & { fecha: string } =>
    validClinicalDay(row.fecha) && row.fecha <= periodTo).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const selected = kind === "4" ? sorted.slice(0, 4)
    : sorted.filter(row => row.fecha >= cutoff.toISOString().slice(0, 10));
  const periodFrom = kind === "4"
    ? selected.reduce<string | null>((earliest, row) =>
      !earliest || row.fecha < earliest ? row.fecha : earliest, null)
    : cutoff.toISOString().slice(0, 10);
  return { selected, periodKind: kind, periodFrom, periodTo,
    clinicalRecordsUsedCount: selected.length, clinicalRecordsTotalCount: records.length };
}