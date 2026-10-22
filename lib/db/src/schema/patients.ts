import { pgTable, text, serial, integer, real, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export type PsychologyAnamnesisSection = {
  status: "not_explored" | "draft" | "recorded";
  text: string;
};

export type PsychologyClinicalData = {
  schemaVersion: 1;
  anamnesis: {
    sections: {
      reasonAndExpectations: PsychologyAnamnesisSection;
      personalFamilyHistory: PsychologyAnamnesisSection;
      developmentalHistory: PsychologyAnamnesisSection;
      emotionalRegulation: PsychologyAnamnesisSection;
      behaviorDailyFunctioning: PsychologyAnamnesisSection;
      relationshipsSupport: PsychologyAnamnesisSection;
      lifeContext: PsychologyAnamnesisSection;
      sleepHabitsRoutines: PsychologyAnamnesisSection;
      strengthsInterestsResources: PsychologyAnamnesisSection;
      previousTreatmentsStrategies: PsychologyAnamnesisSection;
      riskAndProtection: PsychologyAnamnesisSection;
    };
  };
  evaluations: Array<{
    id: string;
    title: string;
    date: string | null;
    status: "draft" | "completed";
    areas: {
      emotionalAffective: string;
      behavioral: string;
      cognitiveExecutive: string;
      socialRelational: string;
      autonomyDailyFunctioning: string;
      copingEmotionalRegulation: string;
      strengthsResources: string;
    };
    interviews: Array<{
      id: string;
      date: string | null;
      participant: string;
      notes: string;
    }>;
    instruments: Array<{
      id: string;
      name: string;
      version: string;
      date: string | null;
      results: string;
      interpretation: string;
    }>;
    professionalInterpretation: string;
  }>;
};

export const patientsTable = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age"),
  fechaNacimiento: text("fecha_nacimiento"),
  diagnosis: text("diagnosis"),
  profesionalNombre: text("profesional_nombre"),
  assignedProfessionalId: integer("assigned_professional_id"),
  franjaEtaria: text("franja_etaria"),
  fechaInicio: text("fecha_inicio"),
  progreso: text("progreso"),
  promedioDesempeno: real("promedio_desempeno"),
  semaforo: text("semaforo"),
  observaciones: text("observaciones"),
  motivoConsulta: text("motivo_consulta"),
  antecedentes: text("antecedentes"),
  historiaFamiliar: text("historia_familiar"),
  escolaridad: text("escolaridad"),
  lenguajeComunicacion: text("lenguaje_comunicacion"),
  atencionConducta: text("atencion_conducta"),
  vozHabla: text("voz_habla"),
  deglucion: text("deglucion"),
  impresionClinica: text("impresion_clinica"),
  rutinasHabitos: text("rutinas_habitos"),
  entornoParticipacion: text("entorno_participacion"),
  psychologyData: jsonb("psychology_data").$type<PsychologyClinicalData>(),
  anamnesisUpdatedAt: timestamp("anamnesis_updated_at", { withTimezone: true }),
  anamnesisUpdatedByUserId: integer("anamnesis_updated_by_user_id").references(() => usersTable.id),
  informeEvolucion: text("informe_evolucion"),
  informeFamilia: text("informe_familia"),
  informeMensual: text("informe_mensual"),
  perfilIa: text("perfil_ia"),
  perfilIaCreatedAt: timestamp("perfil_ia_created_at"),
  perfilIaUpdatedAt: timestamp("perfil_ia_updated_at"),
  archived: boolean("archived").notNull().default(false),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Patient = typeof patientsTable.$inferSelect;
export type InsertPatient = typeof patientsTable.$inferInsert;
