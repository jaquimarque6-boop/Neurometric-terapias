import { db } from "@workspace/db";
import {
  patientsTable,
  professionalsTable,
  registrosClinicosTable,
  patientProfessionalsTable,
  actividadesTable,
  goalLibraryTable,
  goalsTable,
} from "@workspace/db/schema";

async function main() {
  console.log("🌱 Seeding new modules...");

  const patients = await db.select().from(patientsTable);
  const professionals = await db.select().from(professionalsTable);
  const goalLibrary = await db.select().from(goalLibraryTable);

  if (!patients.length) {
    console.log("⚠️  No patients found. Run seed-csv first.");
    return;
  }

  // ─── 1. Professional dates seeded (ensure we have at least 2 professionals) ───
  if (!professionals.length) {
    await db.insert(professionalsTable).values([
      { name: "Dra. María López", email: "mlopez@neurometric.com", phone: "+54 11 5555-0001", specialty: "Fonoaudiología", license: "MP-12345", status: "active" },
      { name: "Lic. Carlos Ruiz",  email: "cruiz@neurometric.com",  phone: "+54 11 5555-0002", specialty: "Psicología Infantil", license: "MP-23456", status: "active" },
      { name: "Lic. Ana Gómez",   email: "agomez@neurometric.com", phone: "+54 11 5555-0003", specialty: "Neuropsicología",    license: "MP-34567", status: "active" },
    ]);
    console.log("✅ Professionals seeded");
  }

  const profs = await db.select().from(professionalsTable);

  // ─── 2. Patient–professional assignments ────────────────────────────────────
  const existingAssignments = await db.select().from(patientProfessionalsTable);
  if (!existingAssignments.length) {
    const assignments = [];
    for (const p of patients) {
      assignments.push({ patientId: p.id, professionalId: profs[0].id });
      if (profs.length > 1) assignments.push({ patientId: p.id, professionalId: profs[1].id });
    }
    await db.insert(patientProfessionalsTable).values(assignments);
    console.log(`✅ ${assignments.length} patient-professional assignments seeded`);
  }

  // ─── 3. Clinical session records (registros_clinicos) ───────────────────────
  const existingReg = await db.select().from(registrosClinicosTable);
  if (!existingReg.length) {
    const records = [];
    const summaries = [
      { resumen: "El paciente mostró buena disposición durante la sesión. Se trabajó sobre comprensión de oraciones complejas con apoyo visual.", obs: "Se observan mejoras en la comprensión auditiva.", recom: "Practicar juegos de vocabulario 15 minutos diarios. Leer cuentos en voz alta." },
      { resumen: "Sesión centrada en producción léxica. El paciente logró nombrar correctamente 18 de 20 objetos presentados.", obs: "Persistencia en la generalización del léxico en contextos naturales.", recom: "Nombrar objetos del hogar durante el almuerzo. Revisar tarjetas de vocabulario." },
      { resumen: "Trabajo en narración de historias con secuencia temporal. Se introdujo el uso de conectores narrativos.", obs: "Dificultad con el uso de conectores causales.", recom: "Narrar el día en 3 oraciones antes de dormir. Mirar cuentos animados." },
      { resumen: "Evaluación de progreso trimestral. Los indicadores muestran avance sostenido en comprensión.", obs: "El paciente mantiene motivación alta. Participa activamente.", recom: "Continuar con rutinas de lectura y juegos fonológicos." },
      { resumen: "Sesión de trabajo fonológico. Ejercicios de segmentación silábica y conciencia fonémica.", obs: "Mejora notable en la discriminación de sonidos.", recom: "Juegos de rimas y adivinanzas 10 minutos al día." },
      { resumen: "Abordaje de lenguaje pragmático. Trabajo en turnos conversacionales y contacto visual.", obs: "Progresa en la iniciación de intercambios comunicativos.", recom: "Practicar saludos y despedidas en distintos contextos sociales." },
    ];

    for (const p of patients) {
      for (let i = 0; i < 3; i++) {
        const s = summaries[(patients.indexOf(p) * 3 + i) % summaries.length];
        const daysBack = (i + 1) * 14;
        const fecha = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        records.push({
          patientId: p.id,
          patientName: p.name,
          professionalId: profs[0].id,
          professionalName: profs[0].name,
          fecha,
          resumenSesion: s.resumen,
          observaciones: s.obs,
          recomendacionesHogar: s.recom,
        });
      }
    }
    await db.insert(registrosClinicosTable).values(records);
    console.log(`✅ ${records.length} clinical records seeded`);
  }

  // ─── 4. Therapeutic goals (objetivos terapéuticos) ─────────────────────────
  const existingGoals = await db.select().from(goalsTable);
  if (!existingGoals.length && goalLibrary.length) {
    const goalSeeds = [];
    const categorias = ["lenguaje", "comprensión", "léxico", "narrativo", "pragmática", "fonología"];
    for (const p of patients) {
      const slice = goalLibrary.slice(0, 6);
      for (let i = 0; i < Math.min(slice.length, 4); i++) {
        const gl = slice[i];
        goalSeeds.push({
          patientId: p.id,
          codigo: gl.idObjetivo ?? `OBJ-${i + 1}`,
          title: gl.nombreObjetivo ?? `Objetivo ${i + 1}`,
          description: gl.definicionOperativa ?? "",
          category: categorias[i % categorias.length],
          franjaEtaria: gl.franjaEtaria ?? p.franjaEtaria ?? "3-4",
          status: i === 0 ? "logrado" : "activo",
          targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        });
      }
    }
    await db.insert(goalsTable).values(goalSeeds);
    console.log(`✅ ${goalSeeds.length} therapeutic goals seeded`);
  }

  // ─── 5. Actividades sugeridas ────────────────────────────────────────────────
  const existingAct = await db.select().from(actividadesTable);
  if (!existingAct.length && goalLibrary.length) {
    const activities = [];
    for (const gl of goalLibrary) {
      if (gl.actividadesClinicas && gl.actividadesClinicas.trim()) {
        const lines = gl.actividadesClinicas.split(/\n|-\s/).filter(l => l.trim().length > 15);
        for (const line of lines.slice(0, 2)) {
          activities.push({
            titulo: line.trim().slice(0, 120),
            descripcion: line.trim(),
            tipo: "clinica",
            area: gl.area ?? null,
            subarea: gl.subarea ?? null,
            franjaEtaria: gl.franjaEtaria ?? null,
            goalLibraryId: gl.id,
            objetivoNombre: gl.nombreObjetivo ?? null,
          });
        }
      }
      if (gl.actividadesFamilia && gl.actividadesFamilia.trim()) {
        const lines = gl.actividadesFamilia.split(/\n|-\s/).filter(l => l.trim().length > 15);
        for (const line of lines.slice(0, 2)) {
          activities.push({
            titulo: line.trim().slice(0, 120),
            descripcion: line.trim(),
            tipo: "familia",
            area: gl.area ?? null,
            subarea: gl.subarea ?? null,
            franjaEtaria: gl.franjaEtaria ?? null,
            goalLibraryId: gl.id,
            objetivoNombre: gl.nombreObjetivo ?? null,
          });
        }
      }
    }

    if (activities.length) {
      await db.insert(actividadesTable).values(activities);
      console.log(`✅ ${activities.length} activities seeded from goal library`);
    }
  }

  console.log("✅ All modules seeded successfully");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
