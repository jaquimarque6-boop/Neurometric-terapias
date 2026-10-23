import { ACTIVIDADES_ACCESS_URL } from "./actividades";

export class ActivitiesSubscriptionInactiveError extends Error {
  constructor() {
    super("The subscription or trial is not active");
    this.name = "ActivitiesSubscriptionInactiveError";
  }
}

export async function requestActivitiesAccessUrl(
  apiBase: string,
  authToken: string | null,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  const endpoint = `${apiBase.replace(/\/+$/, "")}/api/actividades/pase`;
  const headers = new Headers();
  if (authToken) headers.set("Authorization", `Bearer ${authToken}`);

  const response = await fetcher(endpoint, {
    method: "POST",
    credentials: "include",
    headers,
  });

  if (response.status === 402) {
    throw new ActivitiesSubscriptionInactiveError();
  }
  if (!response.ok) throw new Error("Pass request failed");

  const result: unknown = await response.json();
  const pase = typeof result === "object" && result !== null && "pase" in result
    ? (result as { pase?: unknown }).pase
    : null;
  if (typeof pase !== "string" || !pase) throw new Error("Invalid pass response");

  return `${ACTIVIDADES_ACCESS_URL}#pase=${encodeURIComponent(pase)}`;
}
