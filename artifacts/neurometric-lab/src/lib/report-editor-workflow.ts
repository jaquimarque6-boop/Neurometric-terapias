export type ReportEditorDraft = {
  resumen: string;
  conducta: string;
  areas: Record<string, string>;
  removedAreas: string[];
  sugerencias: string;
};

export type GeneratedReportDraft = Partial<ReportEditorDraft>;

export type ReportGenerationFlow<TGenerated extends GeneratedReportDraft = GeneratedReportDraft> = {
  draft: ReportEditorDraft;
  pending: TGenerated | null;
  confirmationOpen: boolean;
};

export function hasReportDraftContent(draft: ReportEditorDraft): boolean {
  return Boolean(
    draft.resumen.trim()
    || draft.conducta.trim()
    || draft.sugerencias.trim()
    || Object.values(draft.areas).some(value => value.trim()),
  );
}

export function requestReportGeneration<TGenerated extends GeneratedReportDraft>(
  draft: ReportEditorDraft,
  generated: TGenerated,
): ReportGenerationFlow<TGenerated> {
  if (hasReportDraftContent(draft)) {
    return { draft, pending: generated, confirmationOpen: true };
  }
  return {
    draft: applyGeneratedReport(draft, generated),
    pending: null,
    confirmationOpen: false,
  };
}

export function applyGeneratedReport(
  current: ReportEditorDraft,
  generated: GeneratedReportDraft,
): ReportEditorDraft {
  return {
    resumen: generated.resumen ?? "",
    conducta: generated.conducta ?? "",
    areas: generated.areas ?? {},
    removedAreas: [],
    sugerencias: generated.sugerencias ?? "",
  };
}

export function acceptPendingReportGeneration<TGenerated extends GeneratedReportDraft>(
  flow: ReportGenerationFlow<TGenerated>,
): ReportGenerationFlow<TGenerated> {
  if (!flow.pending) return flow;
  return {
    draft: applyGeneratedReport(flow.draft, flow.pending),
    pending: null,
    confirmationOpen: false,
  };
}

export function cancelPendingReportGeneration<TGenerated extends GeneratedReportDraft>(
  flow: ReportGenerationFlow<TGenerated>,
): ReportGenerationFlow<TGenerated> {
  return {
    draft: flow.draft,
    pending: null,
    confirmationOpen: false,
  };
}

export function restoreSavedReportDraft(content: {
  resumen?: string;
  conducta?: string;
  areas?: Record<string, string>;
  removedAreas?: string[];
  sugerencias?: string;
}): ReportEditorDraft {
  return {
    resumen: content.resumen ?? "",
    conducta: content.conducta ?? "",
    areas: content.areas ?? {},
    removedAreas: content.removedAreas ?? [],
    sugerencias: content.sugerencias ?? "",
  };
}
