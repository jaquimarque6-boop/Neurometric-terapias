type PrintDocument = {
  patientName: string;
  reportDate: string;
  printedDate: string;
  documentTitle?: string;
};

export type ClinicalPrintDocument = PrintDocument & {
  kind: "clinical";
  age?: string | null;
  diagnosis?: string | null;
  treatmentStart?: string | null;
  resumen: string;
  conducta: string;
  areas: Record<string, string>;
  sugerencias: string;
};

export type FamilyPrintDocument = PrintDocument & {
  kind: "family";
  achievedGoals: string[];
  workingGoals: string[];
  familyMessage: string;
};

export type ReportPrintDocument = ClinicalPrintDocument | FamilyPrintDocument;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function hasPrintableText(value: string | null | undefined): value is string {
  if (!value?.trim()) return false;
  return !["no registrado", "sin contenido", "sin contenido.", "sin mensaje registrado."]
    .includes(value.trim().toLocaleLowerCase("es"));
}

function section(title: string, content: string): string {
  if (!hasPrintableText(content)) return "";
  return `<section class="section"><h2>${escapeHtml(title)}</h2><div class="text">${escapeHtml(content.trim())}</div></section>`;
}

function listSection(title: string, items: string[]): string {
  const visible = items.filter(hasPrintableText);
  if (!visible.length) return "";
  return `<section class="section"><h2>${escapeHtml(title)}</h2><ul>${visible
    .map(item => `<li>${escapeHtml(item.trim())}</li>`).join("")}</ul></section>`;
}

function header(document: PrintDocument, subtitle: string, details: string[]): string {
  const visibleDetails = details.filter(hasPrintableText);
  return `<header><div><h1>${escapeHtml(document.patientName)}</h1>${
    visibleDetails.length
      ? `<div class="meta">${visibleDetails.map(item => `<span>${escapeHtml(item)}</span>`).join("")}</div>`
      : ""
  }</div><div class="header-right"><strong>${escapeHtml(subtitle)}</strong><span>${escapeHtml(document.reportDate)}</span></div></header>`;
}

function shell(document: PrintDocument, title: string, content: string): string {
  const documentTitle = document.documentTitle?.trim() || title;
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(documentTitle)} — ${escapeHtml(document.patientName)}</title><style>
*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1c1412;padding:44px 52px;font-size:13px;line-height:1.75;max-width:820px;margin:0 auto}
header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:2px solid #ddd3c8;margin-bottom:30px;gap:24px}h1{font-size:22px;line-height:1.3;margin:0 0 8px}.meta{font-size:11.5px;color:#78716c;display:flex;flex-wrap:wrap;gap:4px 20px}.header-right{text-align:right;font-size:11px;color:#78716c;white-space:nowrap}.header-right strong{display:block;font-size:12px;color:#374151;margin-bottom:2px}
.section{margin-bottom:25px;break-inside:avoid}h2{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#78716c;margin:0 0 8px;padding-bottom:8px;border-bottom:1px solid #e5e7eb}.text{font-size:13px;line-height:1.85;white-space:pre-wrap;overflow-wrap:anywhere}.area{margin:0 0 18px;break-inside:avoid}.area h3{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#374151;margin:0 0 5px}.area .text{border:0}
ul{padding-left:20px;margin:0}li{padding:4px 0}.footer{margin-top:38px;padding-top:10px;border-top:1px solid #e7e1d8;font-size:10px;color:#92897e;display:flex;justify-content:space-between;gap:12px}
@media print{body{padding:22px 28px}@page{margin:14mm}}
</style></head><body>${content}<div class="footer"><span>Neurometric Terapias · ${escapeHtml(documentTitle)} · Fecha del informe: ${escapeHtml(document.reportDate)}</span><span>Impreso: ${escapeHtml(document.printedDate)}</span></div></body></html>`;
}

export function renderReportPrintHtml(document: ReportPrintDocument): string {
  if (document.kind === "family") {
    const content = header(document, "Informe para la familia", [])
      + listSection("Lo que logró", document.achievedGoals)
      + listSection("En lo que estamos trabajando", document.workingGoals)
      + section("Mensaje y sugerencias para la familia", document.familyMessage);
    return shell(document, "Informe para la familia", content);
  }

  const areas = Object.entries(document.areas)
    .filter(([, text]) => hasPrintableText(text))
    .map(([name, text]) => `<div class="area"><h3>${escapeHtml(name)}</h3><div class="text">${escapeHtml(text.trim())}</div></div>`)
    .join("");
  const content = header(document, "Informe de evolución", [
    document.age ? `Edad: ${document.age}` : "",
    document.diagnosis ? `Diagnóstico: ${document.diagnosis}` : "",
    document.treatmentStart ? `Inicio: ${document.treatmentStart}` : "",
  ])
    + section("Evolución del proceso terapéutico", document.resumen)
    + section("Conducta en sesiones", document.conducta)
    + (areas ? `<section class="section"><h2>Desarrollo por área</h2>${areas}</section>` : "")
    + section("Sugerencias para la familia", document.sugerencias);
  return shell(document, "Informe de evolución", content);
}
