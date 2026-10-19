// Informational only. No function in this module grants or denies permissions.
export const COMMERCIAL_TIME_ZONE = "America/Argentina/Buenos_Aires";
export function commercialToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: COMMERCIAL_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => parts.find(p => p.type === type)!.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
export function validCommercialDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
    && value >= "1900-01-01" && value <= "9998-12-31";
}
export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function addCalendarMonth(date: string): string {
  const value = new Date(`${date}T00:00:00Z`);
  const day = value.getUTCDate();
  value.setUTCDate(1);
  value.setUTCMonth(value.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0)).getUTCDate();
  value.setUTCDate(Math.min(day, lastDay));
  return value.toISOString().slice(0, 10);
}
export type CommercialAccount = {
  role: string; active: boolean; commercialStatus: string;
  trialStartDate: string | null; trialEndDate: string | null;
  lastPaymentDate: string | null; nextDueDate: string | null;
  trialStartPending?: boolean;
};
export const canRenewCommercially = (u: CommercialAccount) =>
  u.role === "professional" && u.active && ["trial", "paying", "overdue"].includes(u.commercialStatus);
export function renewalPeriod(u: CommercialAccount, receivedAt: string, today = commercialToday()) {
  if (!validCommercialDate(receivedAt) || receivedAt > today) throw new Error("La fecha del pago debe ser real y no futura.");
  if (u.lastPaymentDate && receivedAt < u.lastPaymentDate) throw new Error("El pago es anterior al último registrado. Revisá las fechas antes de renovar.");
  if (u.nextDueDate && (!validCommercialDate(u.nextDueDate) || (u.lastPaymentDate && u.nextDueDate < u.lastPaymentDate))) {
    throw new Error("El vencimiento actual es inconsistente. Corregilo antes de renovar.");
  }
  const periodFrom = u.nextDueDate && u.nextDueDate > receivedAt ? u.nextDueDate : receivedAt;
  return { periodFrom, periodTo: addCalendarMonth(periodFrom) };
}
export function reviewCommercialAccount(u: CommercialAccount, today = commercialToday()) {
  const issues: Array<{ code: string; message: string }> = [];
  const add = (code: string, message: string) => issues.push({ code, message });
  const exempt = u.role !== "professional" || !u.active || ["courtesy", "churned"].includes(u.commercialStatus);
  let expiresOn: string | null = null;
  if (!exempt) {
    if (u.commercialStatus === "trial") {
      if (u.trialStartPending && !u.trialStartDate && !u.trialEndDate) {
        add("trial_pending", "Cuenta nueva: la prueba comenzará en el primer ingreso habilitado.");
      } else {
        if (!u.trialStartDate) add("missing_trial_start", "Falta el inicio real de la prueba. Confirmalo; no usar la fecha de creación por suposición.");
        if (!u.trialEndDate) add("missing_trial_end", "Falta la fecha de fin de prueba.");
        if (u.trialStartDate && u.trialEndDate && validCommercialDate(u.trialStartDate) &&
            u.trialEndDate !== addDays(u.trialStartDate, 14)) {
          add("trial_duration", "Las fechas no corresponden a 15 días calendario de prueba. Revisá si existe una excepción autorizada.");
        }
      }
      if (u.trialStartDate && u.trialStartDate > today) add("future_trial_start", "El inicio de prueba está en el futuro. Confirmá la fecha real.");
      expiresOn = u.trialEndDate;
    } else if (["paying", "overdue"].includes(u.commercialStatus)) {
      if (!u.lastPaymentDate) add("missing_payment", "Falta la fecha del último pago confirmado. Revisá el comprobante; el estado Pagando no prueba un cobro.");
      if (!u.nextDueDate) add("missing_due", "Falta el próximo vencimiento. Revisá el período abonado.");
      if (u.lastPaymentDate && u.lastPaymentDate > today) add("future_payment", "El último pago tiene una fecha futura.");
      if (u.lastPaymentDate && u.nextDueDate && u.nextDueDate < u.lastPaymentDate) add("due_before_payment", "El vencimiento es anterior al último pago.");
      if (u.commercialStatus === "overdue" && u.nextDueDate && u.nextDueDate >= today) add("status_date_conflict", "El estado dice Pago vencido, pero la fecha no venció. Revisá el estado.");
      expiresOn = u.nextDueDate;
    }
    for (const field of ["trialStartDate", "trialEndDate", "lastPaymentDate", "nextDueDate"] as const) {
      if (u[field] && !validCommercialDate(u[field])) add("invalid_date", `Fecha inválida en ${field}.`);
    }
    if (expiresOn && validCommercialDate(expiresOn) && expiresOn < today) add("expired", "La fecha comercial ya venció. Verificá si hubo una renovación no registrada. El acceso sigue habilitado.");
  }
  const daysRemaining = expiresOn && validCommercialDate(expiresOn)
    ? Math.round((Date.parse(`${expiresOn}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000)
      + (u.commercialStatus === "trial" ? 1 : 0)
    : null;
  const needsReview = issues.some(i => i.code !== "trial_pending");
  const severity = needsReview && (issues.some(i => i.code === "expired") || (daysRemaining != null && daysRemaining <= 1))
    ? "urgent" : daysRemaining != null && daysRemaining <= 3 ? "urgent"
    : needsReview || (daysRemaining != null && daysRemaining <= 5) ? "warning" : "info";
  const formatDate = (d: string) => d.split("-").reverse().join("/");
  let notice: string | null = null;
  if (!exempt && expiresOn && validCommercialDate(expiresOn)) {
    if (expiresOn < today) notice = "La fecha comercial registrada venció. Estamos en modo de verificación: tu acceso continúa habilitado.";
    else if (u.commercialStatus === "trial") notice = `Te ${daysRemaining === 1 ? "queda 1 día" : `quedan ${daysRemaining} días`} de prueba gratuita`;
    else if (daysRemaining === 0) notice = "Tu suscripción vence hoy";
    else if (daysRemaining === 1) notice = "Tu suscripción vence mañana";
    else if (daysRemaining! <= 5) notice = `Tu suscripción vence en ${daysRemaining} días`;
    else notice = `Tu acceso está activo hasta el ${formatDate(expiresOn)}`;
  } else if (!exempt && needsReview) notice = "Tus fechas comerciales están pendientes de revisión. Tu acceso continúa habilitado.";
  return { mode: "verification" as const, today, timeZone: COMMERCIAL_TIME_ZONE, exempt,
    needsReview, issues, expiresOn, daysRemaining, severity, notice, blockingEnabled: false };
}
