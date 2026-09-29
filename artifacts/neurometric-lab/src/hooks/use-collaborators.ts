import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

// Shapes follow docs/collaborators-api-contract.md exactly.
export type MoneyMap = Record<string, string>;

export type Collaborator = {
  id: number;
  userId: number;
  name: string;
  country: string;
  code: string;
  commissionPercent: string;
  active: boolean;
  createdAt: string;
};

export type DashboardHistoryRow = {
  month: string;
  referrals: number;
  newSubscriptions: number;
  cancellations: number;
  generated: MoneyMap;
  pending: MoneyMap;
  paid: MoneyMap;
};

export type CollaboratorDashboard = {
  name: string;
  code: string;
  link: string;
  commissionPercent: string;
  referrals: number;
  activeSubscriptions: number;
  newSubscriptionsThisMonth: number;
  cancellationsThisMonth: number;
  generatedThisMonth: MoneyMap;
  pending: MoneyMap;
  paid: MoneyMap;
  history: DashboardHistoryRow[];
};

export type SaasReceipt = {
  id: number;
  professionalUserId: number;
  amount: string;
  currency: string;
  receivedAt: string;
  periodFrom: string;
  periodTo: string;
  reference: string | null;
  idempotencyKey: string;
  createdByUserId?: number | null;
  paidByUserId?: number | null;
  paymentReference?: string | null;
  collaboratorId: number | null;
  commissionPercentSnapshot: string | null;
  commissionAmount: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type SaasStatus = "paying" | "churned" | "trial" | "overdue" | "courtesy";
export type SaasStatusResult = {
  professionalUserId: number;
  status: SaasStatus;
  event: "first_paid" | "cancellation" | "reactivation" | null;
};

export type CreateCollaboratorInput = {
  name: string; country: string; code: string; commissionPercent: string;
} & ({ existingUserId: number; email?: never; password?: never } | { existingUserId?: never; email: string; password: string });
export type UpdateCollaboratorInput = Partial<Pick<Collaborator, "name" | "country" | "code" | "commissionPercent" | "active">>;
export type CreateReceiptInput = {
  professionalUserId: number; amount: string; currency: string; receivedAt: string;
  periodFrom: string; periodTo: string; reference: string; idempotencyKey: string;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

// The global interceptor in main.tsx attaches the Bearer token; credentials keep cookie sessions working.
export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor.", 0);
  }
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new ApiError((data && typeof data.error === "string" && data.error) || `Error ${r.status}`, r.status);
  return data as T;
}

function useScope() {
  const { user } = useAuth();
  return { uid: user?.id ?? null, role: user?.role ?? null };
}

const keys = {
  all: (uid: number | null) => ["collab", uid] as const,
  list: (uid: number | null) => ["collab", uid, "list"] as const,
  dashboard: (uid: number | null, id: number) => ["collab", uid, "dashboard", id] as const,
  own: (uid: number | null) => ["collab", uid, "own-dashboard"] as const,
  receipts: (uid: number | null) => ["collab", uid, "receipts"] as const,
  users: (uid: number | null) => ["collab", uid, "users"] as const,
};

export function useCollaborators() {
  const { uid, role } = useScope();
  return useQuery({
    queryKey: keys.list(uid),
    queryFn: () => apiJson<Collaborator[]>("/api/collaborators"),
    enabled: role === "admin",
  });
}

export function useCollaboratorDashboard(id: number | null) {
  const { uid, role } = useScope();
  return useQuery({
    queryKey: keys.dashboard(uid, id ?? 0),
    queryFn: () => apiJson<CollaboratorDashboard>(`/api/collaborators/${id}/dashboard`),
    enabled: role === "admin" && id != null,
  });
}

export function useOwnCollaboratorDashboard() {
  const { uid, role } = useScope();
  return useQuery({
    queryKey: keys.own(uid),
    queryFn: () => apiJson<CollaboratorDashboard>("/api/collaborator/dashboard"),
    enabled: role === "collaborator" || role === "professional",
    retry: (count, error) => !(error instanceof ApiError && error.status === 403) && count < 1,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useSaasReceipts() {
  const { uid, role } = useScope();
  return useQuery({
    queryKey: keys.receipts(uid),
    queryFn: () => apiJson<SaasReceipt[]>("/api/saas/receipts"),
    enabled: role === "admin",
  });
}

export type BasicUser = { id: number; name: string; email: string; role: string; active: boolean; commercialStatus?: SaasStatus };
export function useProfessionalUsers() {
  const { uid, role } = useScope();
  return useQuery({
    queryKey: keys.users(uid),
    queryFn: async () => (await apiJson<BasicUser[]>("/api/users")).filter(u => u.role === "professional"),
    enabled: role === "admin",
  });
}

export function useCreateCollaborator() {
  const qc = useQueryClient();
  const { uid } = useScope();
  return useMutation({
    mutationFn: (data: CreateCollaboratorInput) =>
      apiJson<Collaborator>("/api/collaborators", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.list(uid) }),
  });
}

export function useUpdateCollaborator() {
  const qc = useQueryClient();
  const { uid } = useScope();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCollaboratorInput }) =>
      apiJson<Collaborator>(`/api/collaborators/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: keys.list(uid) });
      qc.invalidateQueries({ queryKey: keys.dashboard(uid, c.id) });
    },
  });
}

export function useCreateReceipt() {
  const qc = useQueryClient();
  const { uid } = useScope();
  return useMutation({
    mutationFn: (data: CreateReceiptInput) =>
      apiJson<SaasReceipt>("/api/saas/receipts", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.receipts(uid) });
      qc.invalidateQueries({ queryKey: ["collab", uid, "dashboard"] });
    },
  });
}

export function useMarkReceiptPaid() {
  const qc = useQueryClient();
  const { uid } = useScope();
  return useMutation({
    mutationFn: ({ id, paymentReference }: { id: number; paymentReference?: string }) =>
      apiJson<SaasReceipt>(`/api/saas/receipts/${id}/paid`, {
        method: "POST",
        body: JSON.stringify(paymentReference?.trim() ? { paymentReference: paymentReference.trim() } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.receipts(uid) });
      qc.invalidateQueries({ queryKey: ["collab", uid, "dashboard"] });
    },
  });
}

export function useSetSaasStatus() {
  const qc = useQueryClient();
  const { uid } = useScope();
  return useMutation({
    mutationFn: (data: { professionalUserId: number; status: SaasStatus; effectiveDate?: string }) =>
      apiJson<SaasStatusResult>("/api/saas/status", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.users(uid) });
      qc.invalidateQueries({ queryKey: ["collab", uid, "dashboard"] });
    },
  });
}

export function newIdempotencyKey(): string {
  try { return crypto.randomUUID(); } catch { return `k-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
}

export function moneyEntries(m: MoneyMap | null | undefined): [string, string][] {
  return Object.entries(m ?? {}).sort(([a], [b]) => a.localeCompare(b));
}

export function formatMoney(amount: string, currency: string): string {
  const n = Number(amount);
  if (!isFinite(n)) return `${amount} ${currency}`;
  return `${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export function formatMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Date(y, m - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}
