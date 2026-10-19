import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiJson, ApiError, type SaasStatus } from "@/hooks/use-collaborators";

export type CommercialIssue = { code: string; message: string };
export type CommercialReview = {
  mode: "verification";
  today: string;
  timeZone: string;
  exempt: boolean;
  needsReview: boolean;
  issues: CommercialIssue[];
  expiresOn: string | null;
  daysRemaining: number | null;
  severity: "info" | "warning" | "urgent";
  notice: string | null;
  blockingEnabled: false;
};

export type OwnCommercial = CommercialReview & {
  commercialStatus: SaasStatus;
  trialStartDate: string | null;
  trialEndDate: string | null;
  lastPaymentDate: string | null;
  nextDueDate: string | null;
};

export type CommercialHistoryRow = {
  id: number;
  event: string;
  actorUserId: number | null;
  actorName: string | null;
  effectiveDate: string | null;
  occurredAt: string;
  details: {
    before: Record<string, string | null>;
    after: Record<string, string | null>;
    reason?: string;
    receiptId?: number;
  } | null;
};

export type RenewalPreview = {
  willRenew: boolean;
  periodFrom: string | null;
  periodTo: string | null;
  reason: string | null;
};

export const commercialKeys = {
  own: (uid: number | null) => ["commercial", uid, "me"] as const,
  history: (uid: number | null, id: number) => ["commercial", uid, "history", id] as const,
  historyAll: (uid: number | null) => ["commercial", uid, "history"] as const,
  preview: (uid: number | null, pro: number, at: string) => ["commercial", uid, "renewal-preview", pro, at] as const,
  previewAll: (uid: number | null) => ["commercial", uid, "renewal-preview"] as const,
};

/** Invalida todo lo comercial: usuarios (colaboradoras), historial, preview, propio estado y cobros. */
export function invalidateCommercial(qc: QueryClient, uid: number | null) {
  qc.invalidateQueries({ queryKey: ["collab", uid, "users"] });
  qc.invalidateQueries({ queryKey: ["collab", uid, "receipts"] });
  qc.invalidateQueries({ queryKey: ["collab", uid, "dashboard"] });
  qc.invalidateQueries({ queryKey: ["commercial", uid] });
  qc.invalidateQueries({ queryKey: ["admin-users"] });
}

export function useInvalidateCommercial() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const uid = user?.id ?? null;
  return useCallback(() => invalidateCommercial(qc, uid), [qc, uid]);
}

export function useOwnCommercial() {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  return useQuery({
    queryKey: commercialKeys.own(uid),
    queryFn: () => apiJson<OwnCommercial>("/api/commercial/me"),
    enabled: uid != null && user?.role === "professional",
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
    retry: (count, error) => !(error instanceof ApiError && (error.status === 401 || error.status === 403)) && count < 1,
  });
}

export function useCommercialHistory(userId: number | null) {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  return useQuery({
    queryKey: commercialKeys.history(uid, userId ?? 0),
    queryFn: () => apiJson<CommercialHistoryRow[]>(`/api/users/${userId}/commercial-history`),
    enabled: user?.role === "admin" && userId != null,
    refetchOnMount: "always",
  });
}

export function useRenewalPreview(professionalUserId: number | null, receivedAt: string, enabled: boolean) {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  return useQuery({
    queryKey: commercialKeys.preview(uid, professionalUserId ?? 0, receivedAt),
    queryFn: () => apiJson<RenewalPreview>(
      `/api/saas/renewal-preview?professionalUserId=${professionalUserId}&receivedAt=${encodeURIComponent(receivedAt)}`,
    ),
    enabled: enabled && user?.role === "admin" && professionalUserId != null && /^\d{4}-\d{2}-\d{2}$/.test(receivedAt),
    retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 1,
    staleTime: 0,
  });
}

export const COMMERCIAL_FIELD_LABEL: Record<string, string> = {
  commercialStatus: "Estado comercial",
  trialStartDate: "Inicio de prueba",
  trialEndDate: "Fin de prueba",
  lastPaymentDate: "Último pago",
  nextDueDate: "Próximo vencimiento",
  monthlyAmount: "Monto mensual",
  paymentMethod: "Método de pago",
  internalNotes: "Observaciones internas",
  active: "Cuenta activa",
};

export const COMMERCIAL_EVENT_LABEL: Record<string, string> = {
  commercial_correction: "Corrección comercial",
  commercial_status_changed: "Cambio de estado comercial",
  payment_renewal: "Renovación por cobro confirmado",
  trial_started: "Inicio de prueba",
  baseline: "Estado comercial previo al historial",
  manual_update: "Edición manual",
  manual_edit: "Edición manual",
  renewal: "Renovación por cobro",
  receipt_renewal: "Renovación por cobro",
  status_change: "Cambio de estado",
  first_paid: "Primera alta paga",
  cancellation: "Cancelación",
  reactivation: "Reactivación",
  trial_start: "Inicio de prueba",
};

const STATUS_VALUE_LABEL: Record<string, string> = {
  trial: "En prueba", paying: "Pagando", overdue: "Pago vencido", courtesy: "Cortesía", churned: "Baja",
  true: "Sí", false: "No",
};

export function fmtDayOnly(d: string | null | undefined): string {
  if (!d) return "Sin fecha";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  if (!m) return d;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatFieldValue(field: string, v: string | null | undefined): string {
  if (v == null || v === "") return "Vacío";
  if (field === "commercialStatus" || field === "active") return STATUS_VALUE_LABEL[v] ?? v;
  if (/Date$/.test(field)) return fmtDayOnly(v);
  return v;
}
