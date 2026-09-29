import assert from "node:assert/strict";
import { test } from "node:test";
import { historicalReportPatient, snapshotReportPatient } from "./report-snapshot";

test("every field used by the report is captured and historical render never inherits current clinical fields", () => {
  const original = {
    id: 1, name: "Nombre anterior", age: 9, fechaNacimiento: "2017-05-01",
    diagnosis: "diagnóstico anterior", fechaInicio: "2025-01-01",
    motivoConsulta: "motivo anterior", antecedentes: "antecedentes anteriores",
    historiaFamiliar: "familia anterior", impresionClinica: "impresión anterior",
    observaciones: "observaciones anteriores", lenguajeComunicacion: "lenguaje anterior",
    atencionConducta: "atención anterior", vozHabla: "voz anterior",
    deglucion: "deglución anterior", rutinasHabitos: "rutinas anteriores",
    entornoParticipacion: "entorno anterior",
  };
  const snapshot = snapshotReportPatient(original);
  const editedLivePatient = Object.fromEntries(Object.keys(original).map(field => [field, "actualizado"]));
  assert.notDeepEqual(editedLivePatient, original);
  assert.deepEqual(historicalReportPatient(snapshot, 1), { ...original });
  assert.equal(snapshotReportPatient(original).motivoConsulta, "motivo anterior");
  assert.equal(historicalReportPatient({ name: "Legacy" }, 1).antecedentes, null);
  assert.equal(historicalReportPatient({ name: "Legacy" }, 1).diagnosis, null);
  assert.equal(historicalReportPatient(undefined, 1).name, "Paciente (nombre no disponible)");
});