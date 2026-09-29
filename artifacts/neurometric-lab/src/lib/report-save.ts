export type ReportPeriodMeta = {
  periodKind: string | null;
  periodFrom: string | null;
  periodTo: string | null;
  clinicalRecordsUsedCount: number | null;
  clinicalRecordsTotalCount: number | null;
};

type OpenReport = { id: number; reportType: "evolution" | "family"; updatedAt: string };

export function clinicalSnapshotForSave<T>(
  openedReport: { content: { clinicalSnapshot?: T[] } } | null,
  generatedSnapshot: T[] | null,
  usedCount: number | null,
): T[] {
  if (openedReport) return openedReport.content.clinicalSnapshot ?? [];
  if (usedCount !== null && generatedSnapshot?.length !== usedCount) {
    throw new Error("Los registros del período generado no coinciden con el borrador. Volvé a generar el informe.");
  }
  // Never copy today's live sessions into a report with unknown provenance.
  return generatedSnapshot ?? [];
}

// The generator's server-reported period is draft provenance, not recomputed from
// patient records at save time. A legacy draft has no known historical provenance.
export function prepareReportSave(
  reportType: OpenReport["reportType"],
  title: string,
  content: object,
  generatedMeta: ReportPeriodMeta | null,
  openedReport: OpenReport | null,
) {
  const editing = openedReport?.reportType === reportType ? openedReport : null;
  return editing
    ? { method: "PUT" as const, reportId: editing.id,
        body: { title, content, updatedAt: editing.updatedAt } }
    : { method: "POST" as const, reportId: null,
        body: { reportType, title, content,
          periodKind: generatedMeta?.periodKind ?? null,
          periodFrom: generatedMeta?.periodFrom ?? null,
          periodTo: generatedMeta?.periodTo ?? null,
          clinicalRecordsUsedCount: generatedMeta?.clinicalRecordsUsedCount ?? null,
          clinicalRecordsTotalCount: generatedMeta?.clinicalRecordsTotalCount ?? null } };
}