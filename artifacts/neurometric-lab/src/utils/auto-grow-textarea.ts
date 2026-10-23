export type AutoGrowTextareaLayout = {
  height: number;
  overflowY: "hidden" | "auto";
};

export function calculateAutoGrowTextareaLayout({
  scrollHeight,
  lineHeight,
  paddingTop,
  paddingBottom,
  borderTopWidth,
  borderBottomWidth,
  minRows,
  maxRows,
}: {
  scrollHeight: number;
  lineHeight: number;
  paddingTop: number;
  paddingBottom: number;
  borderTopWidth: number;
  borderBottomWidth: number;
  minRows: number;
  maxRows: number;
}): AutoGrowTextareaLayout {
  const safeLineHeight = Number.isFinite(lineHeight) && lineHeight > 0 ? lineHeight : 20;
  const verticalExtras = paddingTop + paddingBottom + borderTopWidth + borderBottomWidth;
  const minHeight = safeLineHeight * minRows + verticalExtras;
  const maxHeight = safeLineHeight * Math.max(minRows, maxRows) + verticalExtras;
  const contentHeight = scrollHeight + borderTopWidth + borderBottomWidth;

  return {
    height: Math.ceil(Math.min(Math.max(contentHeight, minHeight), maxHeight)),
    overflowY: contentHeight > maxHeight ? "auto" : "hidden",
  };
}
