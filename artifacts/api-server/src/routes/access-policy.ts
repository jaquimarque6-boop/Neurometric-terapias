// Clinical access belongs only to a professional account assigned to the patient.
export function canAccessPatient(
  patient: { assignedProfessionalId: number | null },
  user: { id: number; role: string },
): boolean {
  return user.role === "professional" && patient.assignedProfessionalId === user.id;
}

export function getPatientListScope(
  user: { id: number; role: string },
  archived: boolean,
): { archived: boolean; assignedProfessionalId: number } {
  return { archived, assignedProfessionalId: user.id };
}

export function canAccessLibraryGoal(
  goal: { isCustom: boolean; createdBy: number | null },
  user: { id: number; role: string },
  write: boolean,
): boolean {
  if (user.role !== "professional") return false;
  if (goal.isCustom) return goal.createdBy === user.id;
  return !write;
}

const ADMIN_API_ALLOWLIST: Array<{ method: string; path: RegExp }> = [
  { method: "GET", path: /^\/api\/healthz$/ },
  { method: "GET", path: /^\/api\/auth\/me$/ },
  { method: "PATCH", path: /^\/api\/auth\/me$/ },
  { method: "POST", path: /^\/api\/auth\/logout$/ },
  { method: "GET", path: /^\/api\/consents\/status$/ },
  { method: "POST", path: /^\/api\/consents\/accept$/ },
  { method: "GET", path: /^\/api\/dashboard\/stats$/ },
  { method: "GET", path: /^\/api\/users$/ },
  { method: "POST", path: /^\/api\/users$/ },
  { method: "GET", path: /^\/api\/users\/professionals$/ },
  { method: "GET", path: /^\/api\/users\/\d+\/commercial-history$/ },
  { method: "PATCH", path: /^\/api\/users\/\d+$/ },
  { method: "DELETE", path: /^\/api\/users\/\d+$/ },
  { method: "GET", path: /^\/api\/professionals$/ },
  { method: "POST", path: /^\/api\/professionals$/ },
  { method: "GET", path: /^\/api\/collaborators$/ },
  { method: "POST", path: /^\/api\/collaborators$/ },
  { method: "PATCH", path: /^\/api\/collaborators\/\d+$/ },
  { method: "DELETE", path: /^\/api\/collaborators\/\d+$/ },
  { method: "GET", path: /^\/api\/collaborators\/\d+\/dashboard$/ },
  { method: "GET", path: /^\/api\/saas\/receipts$/ },
  { method: "POST", path: /^\/api\/saas\/receipts$/ },
  { method: "POST", path: /^\/api\/saas\/receipts\/\d+\/paid$/ },
  { method: "GET", path: /^\/api\/saas\/renewal-preview$/ },
  { method: "POST", path: /^\/api\/saas\/status$/ },
  { method: "GET", path: /^\/api\/referrals\/[^/]+$/ },
];

export function canAdminAccessApiRoute(method: string, path: string): boolean {
  const normalizedPath = path.split("?")[0].replace(/\/+$/, "") || "/";
  const normalizedMethod = method.toUpperCase();
  return ADMIN_API_ALLOWLIST.some(
    (entry) => entry.method === normalizedMethod && entry.path.test(normalizedPath),
  );
}