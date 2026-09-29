// Mirrors the existing clinical patient access rule (admin or assigned user).
export function canAccessPatient(
  patient: { assignedProfessionalId: number | null },
  user: { id: number; role: string },
): boolean {
  return user.role === "admin" || patient.assignedProfessionalId === user.id;
}

export function canAccessLibraryGoal(
  goal: { isCustom: boolean; createdBy: number | null },
  user: { id: number; role: string },
  write: boolean,
): boolean {
  if (goal.isCustom) return user.role === "admin" || goal.createdBy === user.id;
  return user.role === "admin" || !write;
}