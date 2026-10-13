export type ReportAreaState = {
  areaTexts: Record<string, string>;
  removedAreaNames: string[];
};

export function addReportArea(
  areaTexts: Record<string, string>,
  removedAreaNames: string[],
  goalAreaNames: string[] = [],
): ReportAreaState & { name: string } {
  const occupied = new Set([...Object.keys(areaTexts), ...removedAreaNames, ...goalAreaNames]);
  let name = "Nueva área";
  let suffix = 2;
  while (occupied.has(name)) name = `Nueva área ${suffix++}`;
  return {
    name,
    areaTexts: { ...areaTexts, [name]: "" },
    removedAreaNames: removedAreaNames.filter(area => area !== name),
  };
}

export function renameReportArea(
  areaTexts: Record<string, string>,
  removedAreaNames: string[],
  previousName: string,
  nextName: string,
):
  | (ReportAreaState & { ok: true })
  | { ok: false; reason: "empty" | "duplicate" } {
  const name = nextName.trim();
  if (!name) return { ok: false, reason: "empty" };
  if (name !== previousName && Object.prototype.hasOwnProperty.call(areaTexts, name)) {
    return { ok: false, reason: "duplicate" };
  }
  if (name === previousName) {
    return { ok: true, areaTexts, removedAreaNames };
  }

  const nextAreaTexts = { ...areaTexts, [name]: areaTexts[previousName] ?? "" };
  delete nextAreaTexts[previousName];
  return {
    ok: true,
    areaTexts: nextAreaTexts,
    // Unhide both names: the destination may have been removed earlier.
    removedAreaNames: removedAreaNames.filter(area => area !== previousName && area !== name),
  };
}

export function removeReportArea(
  areaTexts: Record<string, string>,
  removedAreaNames: string[],
  name: string,
): ReportAreaState {
  const nextAreaTexts = { ...areaTexts };
  delete nextAreaTexts[name];
  return {
    areaTexts: nextAreaTexts,
    removedAreaNames: [...new Set([...removedAreaNames, name])],
  };
}

export function visibleReportAreas(
  goalAreaNames: string[],
  areaTexts: Record<string, string>,
  removedAreaNames: string[],
): string[] {
  const removed = new Set(removedAreaNames);
  return [...new Set([...goalAreaNames, ...Object.keys(areaTexts)])]
    .filter(area => !removed.has(area))
    .sort();
}
