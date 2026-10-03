import type { UserActivityEventType } from "@workspace/db/schema";

export type UsageEventInsert = {
  userId: number;
  eventType: UserActivityEventType;
};

export type UsageAuditStatus = "active" | "login_only" | "no_login" | "inactive" | "unavailable";

export function getUsageAuditStatus(input: {
  accountActive: boolean;
  hasClinicalActivity: boolean;
  lastLoginAt: Date | string | null;
  trackingAvailable: boolean;
}): UsageAuditStatus {
  if (!input.accountActive) return "inactive";
  if (input.hasClinicalActivity) return "active";
  if (!input.trackingAvailable) return "unavailable";
  if (input.lastLoginAt) return "login_only";
  return "no_login";
}

export async function readUsageAuditRows<T>(
  read: () => PromiseLike<T[]>,
  onFailure: () => void,
): Promise<{ available: boolean; rows: T[] }> {
  try {
    return { available: true, rows: await read() };
  } catch {
    try {
      onFailure();
    } catch {
      // Audit-read failures must not block the primary users list.
    }
    return { available: false, rows: [] };
  }
}

export function dispatchUsageEventWrite(
  write: () => unknown,
  onFailure: () => void,
): void {
  void Promise.resolve()
    .then(write)
    .catch(() => {
      try {
        onFailure();
      } catch {
        // Metrics must never affect the request that produced them.
      }
    });
}