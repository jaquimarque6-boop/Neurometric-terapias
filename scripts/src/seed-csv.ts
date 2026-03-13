import { db } from "@workspace/db";
import { patientsTable, registrosTable, goalLibraryTable } from "@workspace/db/schema";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";

// ─── CSV Parser ─────────────────────────────────────────────────────────────
function parseCSV(filepath: string) {
  const text = fs.readFileSync(filepath, "utf8").replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let i = 0, row: string[] = [], field = "", inQ = false;
  while (i < text.length) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 2; continue; }
      if (c === '"') { inQ = false; i++; continue; }
      field += c;
    } else {
      if (c === '"') { inQ = true; i++; continue; }
      if (c === ',') { row.push(field.trim()); field = ""; i++; continue; }
      if (c === '\n') { row.push(field.trim()); rows.push(row); row = []; field = ""; i++; continue; }
      if (c === '\r') { i++; continue; }
      field += c;
    }
    i++;
  }
  if (field || row.length) { row.push(field.trim()); if (row.some(Boolean)) rows.push(row); }
  const headers = rows[0];
  return rows.slice(1)
    .filter(r => r.length === headers.length)
    .map(r => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => obj[h] = r[idx] || "");
      return obj;
    });
}

function cleanNotionUrl(value: string): string {
  return value.replace(/\s*\(https?:\/\/[^)]+\)/g, "").trim();
}

function parsePercentage(value: string): string {
  return value.replace(/\s*%\s*/, "%").trim();
}

function safeInt(value: string): number | null {
  const n = parseInt(value);
  return isNaN(n) ? null : n;
}

function safeFloat(value: string): number | null {
  const n = parseFloat(value);
  return isNaN(n) ? null : n;
}

const BASE = path.join(process.cwd(), "..", "attached_assets");

async function run() {
  console.log("📋 Parsing CSV files...");

  const pacCSV = parseCSV(path.join(BASE, "NEUROMETRIC_—_Pacientes_314dbccbb7cb8094a74ac1bacc3a3821_all_1773346475749.csv"));
  const regCSV = parseCSV(path.join(BASE, "NEUROMETRIC_—_Registros_314dbccbb7cb80bd8d0bcdcf2d94e8e4_all_1773346505094.csv"));
  const objCSV = parseCSV(path.join(BASE, "Banco_Oficial_de_Objetivos_314dbccbb7cb80cba182f1c7b2106b0c_al_1773346638007.csv"));

  console.log(`  Patients: ${pacCSV.length} rows`);
  console.log(`  Registros: ${regCSV.length} rows`);
  console.log(`  Objetivos: ${objCSV.length} rows`);

  // ─── Clear existing data ───────────────────────────────────────────────────
  console.log("\n🗑️  Clearing existing data...");
  await db.delete(registrosTable);
  await db.delete(goalLibraryTable);
  await db.delete(patientsTable);

  // ─── Seed goal library ────────────────────────────────────────────────────
  console.log("\n📚 Seeding goal library...");
  const goalLibraryInserted = await db.insert(goalLibraryTable).values(
    objCSV
      .filter(o => o["ID_Objetivo"] && o["Nombre_Objetivo"])
      .map(o => ({
        idObjetivo: o["ID_Objetivo"],
        nombreObjetivo: o["Nombre_Objetivo"],
        modulo: o["Módulo"] || "Neurolengua",
        area: o["Área"] || "",
        subarea: o["Subárea"] || null,
        franjaEtaria: o["Franja_Etaria"] || null,
        definicionOperativa: o["Definición_Operativa"] || null,
        actividadesClinicas: o["Actividades_Clínicas_Base"] || null,
        actividadesFamilia: o["Actividades_Familia_Base"] || null,
        metaPorcentaje: o["Meta_%"] || null,
        indicadorTipo: o["Indicador_Tipo"] || null,
        intentosSugeridos: o["Intentos_Sugeridos"] || null,
        marcoConceptual: o["Marco_Conceptual"] || null,
        nivel1Descripcion: o["Nivel_1_Descripción"] || null,
        nivel2Descripcion: o["Nivel_2_Descripción"] || null,
        nivel3Descripcion: o["Nivel_3_Descripción"] || null,
        recomendacionClinica: o["Recomendacion_Clinica"] || null,
        informeTecnico: o["Informe_Tecnico"] || null,
      }))
  ).returning();
  console.log(`  ✓ Inserted ${goalLibraryInserted.length} goals`);

  // Build goal name → id map for linking sessions
  const goalNameToId: Record<string, number> = {};
  goalLibraryInserted.forEach(g => {
    goalNameToId[g.nombreObjetivo] = g.id;
    // Also add trimmed version for fuzzy matching
    goalNameToId[g.nombreObjetivo.toLowerCase()] = g.id;
  });

  // ─── Seed patients (deduplicate by name, take most complete record) ────────
  console.log("\n👥 Seeding patients...");
  const realPatients = pacCSV.filter(p => 
    p["Nombre"] && 
    p["Nombre"] !== "Ficha clínica" && 
    !p["Nombre"].startsWith("Se ") &&
    !p["Nombre"].startsWith("Actualmente") &&
    !p["Nombre"].startsWith("En las")
  );

  // Deduplicate by name - keep the one with most data (has profesional or more sessions)
  const patientMap: Record<string, typeof realPatients[0]> = {};
  for (const p of realPatients) {
    const name = p["Nombre"].trim();
    const existing = patientMap[name];
    if (!existing) {
      patientMap[name] = p;
    } else {
      // Keep the one with more sessions or has a profesional
      const existingScore = (existing["Profesional"] ? 2 : 0) + parseInt(existing["Total_Sesiones"] || "0");
      const newScore = (p["Profesional"] ? 2 : 0) + parseInt(p["Total_Sesiones"] || "0");
      if (newScore > existingScore) patientMap[name] = p;
    }
  }

  const uniquePatients = Object.values(patientMap);
  const insertedPatients = await db.insert(patientsTable).values(
    uniquePatients.map(p => ({
      name: p["Nombre"].trim(),
      age: safeInt(p["Edad"]),
      diagnosis: p["Diagnosticos"] || null,
      profesionalNombre: p["Profesional"] || null,
      franjaEtaria: p["Franja_Sugerida"] || null,
      fechaInicio: p["Fecha_Inicio"] || null,
      progreso: p["Progreso"] || null,
      promedioDesempeno: safeFloat(p["Promedio_Desempeño"]),
      semaforo: p["Semáforo"] || null,
      observaciones: p["Observaciones"] || null,
      informeEvolucion: p["Informe_Evolucion"] || null,
      informeMensual: p["Informe_Mensual"] || null,
    }))
  ).returning();
  console.log(`  ✓ Inserted ${insertedPatients.length} patients: ${insertedPatients.map(p => p.name).join(", ")}`);

  // Build patient name → id map
  const patientNameToId: Record<string, number> = {};
  insertedPatients.forEach(p => { patientNameToId[p.name.toLowerCase()] = p.id; });

  // ─── Seed registros ────────────────────────────────────────────────────────
  console.log("\n📝 Seeding registros...");
  const validRegistros = regCSV.filter(r => {
    const pacName = cleanNotionUrl(r["Pacientes"]);
    return pacName && pacName.length > 0;
  });

  const registrosToInsert = validRegistros.map(r => {
    const pacName = cleanNotionUrl(r["Pacientes"]);
    const objName = cleanNotionUrl(r["Objetivos"]);
    const patientId = patientNameToId[pacName.toLowerCase()];
    
    // Try to match goal library item by name
    let goalLibraryId: number | null = goalNameToId[objName] || null;
    if (!goalLibraryId && objName) {
      // Fuzzy match - check if any goal name starts with the first 20 chars of objName
      const prefix = objName.toLowerCase().substring(0, 20);
      const matchKey = Object.keys(goalNameToId).find(k => k.toLowerCase().startsWith(prefix));
      if (matchKey) goalLibraryId = goalNameToId[matchKey];
    }

    const sesionVal = r["Sesión"];
    const sesionNumero = safeInt(sesionVal);

    return {
      patientId: patientId || 1,
      patientName: pacName,
      sesionNumero,
      objetivoNombre: objName || null,
      goalLibraryId,
      areaObjetivo: r["Area_objetivo"] || null,
      fecha: r["Fecha"] || null,
      estado: r["Estado"] || null,
      intentos: safeInt(r["Intentos"]),
      intentosSugeridos: safeInt(r["Intentos sugeridos"]),
      correctas: safeInt(r["Correctas"]),
      porcentaje: parsePercentage(r["Porcentaje"]),
      cumpleMeta: r["Cumple_Meta"] || null,
      recomendacionClinica: r["Recomendacion_Clinica"] || null,
      informeSesion: r["Informe_Sesion_Premium"] || null,
      actClinicasObj: r["Act_Clinicas_Obj"] || null,
      actFamiliaObj: r["Act_Familia_Obj"] || null,
      franjaPaciente: r["Franja del paciente"] || null,
    };
  }).filter(r => r.patientId);

  const insertedRegistros = await db.insert(registrosTable).values(registrosToInsert).returning();
  console.log(`  ✓ Inserted ${insertedRegistros.length} registros`);

  console.log("\n✅ CSV import complete!");
  console.log(`   ${insertedPatients.length} patients, ${insertedRegistros.length} registros, ${goalLibraryInserted.length} goals`);
}

run().catch(console.error).finally(() => process.exit(0));
