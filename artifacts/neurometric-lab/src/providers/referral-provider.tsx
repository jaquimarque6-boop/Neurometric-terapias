import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { API_BASE } from "@/lib/api";
import {
  getStoredReferral, normalizeReferralCode, validatePendingCandidates,
  type ReferralValidation, type StoredReferral,
} from "@/lib/referral";

/** Calls the public validation endpoint. Throws on transport / 5xx so candidates are retried. */
export async function validateReferralCode(code: string): Promise<ReferralValidation> {
  const normalized = normalizeReferralCode(code);
  if (!normalized) return { valid: false, code: String(code ?? "") };
  const r = await fetch(`${API_BASE}/api/referrals/${encodeURIComponent(normalized)}`, { credentials: "include" });
  if (r.status >= 500) throw new Error(`referral validation ${r.status}`);
  if (!r.ok) return { valid: false, code: normalized };
  const data = (await r.json().catch(() => null)) as Partial<ReferralValidation> | null;
  return { valid: data?.valid === true, code: normalizeReferralCode(data?.code) ?? normalized };
}

type ReferralContextValue = {
  /** Server-validated referral of this browser (30 days), or null. */
  referral: StoredReferral | null;
  validating: boolean;
};

const ReferralContext = createContext<ReferralContextValue>({ referral: null, validating: false });

export function ReferralProvider({ children }: { children: ReactNode }) {
  const [referral, setReferral] = useState<StoredReferral | null>(() => getStoredReferral());
  const [validating, setValidating] = useState(false);

  const run = useCallback(() => {
    setValidating(true);
    validatePendingCandidates(validateReferralCode)
      .then(r => setReferral(r ?? getStoredReferral()))
      .finally(() => setValidating(false));
  }, []);

  useEffect(() => {
    run();
    const onOnline = () => run();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [run]);

  return <ReferralContext.Provider value={{ referral, validating }}>{children}</ReferralContext.Provider>;
}

export function useReferral() {
  return useContext(ReferralContext);
}
