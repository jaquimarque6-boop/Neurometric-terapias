const ANAMNESIS_FIELDS = [
  "motivoConsulta", "antecedentes", "historiaFamiliar", "escolaridad",
  "lenguajeComunicacion", "atencionConducta", "vozHabla", "deglucion",
  "impresionClinica", "rutinasHabitos", "entornoParticipacion", "observaciones",
];

export function anamnesisMetadata(body: Record<string, unknown>, userId: number, now = new Date()) {
  return ANAMNESIS_FIELDS.some(field => Object.prototype.hasOwnProperty.call(body, field))
    ? { anamnesisUpdatedAt: now, anamnesisUpdatedByUserId: userId } : {};
}