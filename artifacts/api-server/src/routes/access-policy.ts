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

const COLLABORATOR_API_ALLOWLIST: Array<{ method: string; path: RegExp }> = [
  { method: "GET", path: /^\/api\/auth\/me$/ },
  { method: "GET", path: /^\/api\/collaborator\/dashboard$/ },
  { method: "GET", path: /^\/api\/consents\/status$/ },
  { method: "POST", path: /^\/api\/consents\/accept$/ },
  { method: "POST", path: /^\/api\/auth\/logout$/ },
];

export function canCollaboratorAccessApiRoute(method: string, path: string): boolean {
  const normalizedPath = path.split("?")[0].replace(/\/+$/, "") || "/";
  const normalizedMethod = method.toUpperCase();
  return COLLABORATOR_API_ALLOWLIST.some(
    (entry) => entry.method === normalizedMethod && entry.path.test(normalizedPath),
  );
}

export function canRoleAccessApiRoute(role: string, method: string, path: string): boolean {
  if (role === "admin") return canAdminAccessApiRoute(method, path);
  if (role === "collaborator") return canCollaboratorAccessApiRoute(method, path);
  // Professionals continue to be checked by route-level ownership rules.
  return role === "professional";
}

export function shouldBypassCurrentUserAuthorization(
  method: string,
  path: string,
  hasSessionUser: boolean,
  hasBearerToken: boolean,
): boolean {
  const normalizedPath = path.split("?")[0].replace(/\/+$/, "") || "/";
  const normalizedMethod = method.toUpperCase();

  // Login must reach its credential verifier even when the browser sends an
  // old cookie or token. This does not grant access: the route still validates
  // the submitted credentials and only then replaces the session identity.
  if (normalizedMethod === "POST" && normalizedPath === "/api/auth/login") return true;

  // Logout must remain available to sessions that have since been revoked.
  if (normalizedMethod === "POST" && normalizedPath === "/api/auth/logout") return true;

  const isPublicRoute =
    (normalizedMethod === "POST" &&
      ["/api/auth/register", "/api/auth/logout"].includes(normalizedPath)) ||
    (normalizedMethod === "GET" &&
      (normalizedPath === "/api/healthz" ||
        /^\/api\/referrals\/[A-Za-z0-9]{2,32}$/.test(normalizedPath)));

  return isPublicRoute && !hasSessionUser && !hasBearerToken;
}