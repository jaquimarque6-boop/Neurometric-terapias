export type ReportEditorDraft = {
  resumen: string;
  conducta: string;
  areas: Record<string, string>;
  removedAreas: string[];
  sugerencias: string;
};

export type GeneratedReportDraft = Partial<ReportEditorDraft> & {
  mode?: "generate" | "rewrite";
};

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

function normalizeAreaName(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("es-AR");
}

function appendGeneratedText(original: string, addition: string | undefined): string {
  const proposed = addition?.trim() ?? "";
  if (!proposed) return original;

  const existing = original.trim();
  if (!existing) return proposed;
  if (existing === proposed || existing.includes(proposed)) return original;
  if (proposed.includes(existing)) {
    const remainder = proposed.slice(proposed.indexOf(existing) + existing.length).trim();
    if (!remainder) return original;
    return `${original}${original.endsWith("\n") ? "" : "\n\n"}${remainder}`;
  }
  return `${original}${original.endsWith("\n") ? "" : "\n\n"}${proposed}`;
}

export function cloneReportDraft(draft: ReportEditorDraft): ReportEditorDraft {
  return {
    resumen: draft.resumen,
    conducta: draft.conducta,
    areas: { ...draft.areas },
    removedAreas: [...draft.removedAreas],
    sugerencias: draft.sugerencias,
  };
}

export function reportDraftsEqual(left: ReportEditorDraft, right: ReportEditorDraft): boolean {
  const orderedAreas = (areas: Record<string, string>) =>
    Object.fromEntries(Object.entries(areas).sort(([a], [b]) => a.localeCompare(b, "es-AR")));
  return left.resumen === right.resumen
    && left.conducta === right.conducta
    && left.sugerencias === right.sugerencias
    && JSON.stringify(orderedAreas(left.areas)) === JSON.stringify(orderedAreas(right.areas))
    && JSON.stringify(left.removedAreas) === JSON.stringify(right.removedAreas);
}

export function requestReportGeneration<TGenerated extends GeneratedReportDraft>(
  draft: ReportEditorDraft,
  generated: TGenerated,
): ReportGenerationFlow<TGenerated> {
  return { draft, pending: generated, confirmationOpen: true };
}

export function applyGeneratedReport(
  current: ReportEditorDraft,
  generated: GeneratedReportDraft,
): ReportEditorDraft {
  if (generated.mode === "rewrite") {
    const areas = { ...current.areas };
    const removedAreaNames = new Set(current.removedAreas.map(normalizeAreaName));
    for (const [name, text] of Object.entries(generated.areas ?? {})) {
      const trimmedName = name.trim();
      if (!trimmedName || removedAreaNames.has(normalizeAreaName(trimmedName))) continue;
      const existingName = Object.keys(areas).find(
        currentName => normalizeAreaName(currentName) === normalizeAreaName(trimmedName),
      );
      areas[existingName ?? trimmedName] = text;
    }
    return {
      resumen: generated.resumen ?? current.resumen,
      conducta: generated.conducta ?? current.conducta,
      areas,
      removedAreas: [...current.removedAreas],
      sugerencias: generated.sugerencias ?? current.sugerencias,
    };
  }

  const areas = { ...current.areas };
  const removedAreaNames = new Set(current.removedAreas.map(normalizeAreaName));
  for (const [name, text] of Object.entries(generated.areas ?? {})) {
    const trimmedName = name.trim();
    if (!trimmedName || removedAreaNames.has(normalizeAreaName(trimmedName))) continue;
    const existingName = Object.keys(areas).find(
      currentName => normalizeAreaName(currentName) === normalizeAreaName(trimmedName),
    );
    const targetName = existingName ?? trimmedName;
    areas[targetName] = appendGeneratedText(areas[targetName] ?? "", text);
  }

  return {
    resumen: appendGeneratedText(current.resumen, generated.resumen),
    conducta: appendGeneratedText(current.conducta, generated.conducta),
    areas,
    removedAreas: [...current.removedAreas],
    sugerencias: appendGeneratedText(current.sugerencias, generated.sugerencias),
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
