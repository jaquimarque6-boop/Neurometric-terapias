# Fase 1: cierre de verificación en desarrollo

Fecha: 2026-09-29.

## Alcance aprobado

Anamnesis editable con autor/fecha de actualización e informes históricos
independientes de evolución y familia. Implementación ya incluida en el commit
local `0b4ac86551ed3c5ebeb5a01f0b5a0d6275eaff9b`.

La migración `scripts/phase1-patient-reports.sql` se aplicó únicamente en
`heliumdb` (desarrollo). No se ejecutó en producción.

## Verificación realizada

- 23 pruebas automatizadas de lógica y permisos aprobadas.
- Navegador y base real: anamnesis guardada, recargada y editada, con autor/fecha.
- Informes de evolución y familia guardados, abiertos y editados sin duplicados.
- Conflicto de edición desactualizada: respuesta 409 sin sobrescritura.
- Generación real con IA: período 2026-08-30 a 2026-09-29, 2 registros utilizados
  de 4 totales; metadatos y dos registros de referencia conservados al editar.
- Compatibilidad: copia explícita del informe heredado sin modificar el original
  ni inventar período/conteos.
- Impresión de familia y dos reimpresiones de evolución: contenido y llamada de
  impresión del navegador verificados. No se validó impresora física ni PDF
  final descargado.
- La suite adicional account-access requiere TEST_DATABASE_URL aislada; su
  protección impidió ejecutarla contra desarrollo.

## Limpieza autorizada

Se eliminaron exclusivamente las fixtures TEST FASE1:

- Usuario 35 y paciente 34.
- Informes 1, 2 y 3.
- Registros clínicos 22, 23, 24 y 25.
- Una sesión de autenticación asociada al usuario 35.

Antes de borrar se verificaron identidad, propiedad y relaciones. No había
otros registros relacionados en citas, gastos, objetivos, pagos, archivos,
asignaciones, registros de objetivos, sesiones clínicas o progreso.

La eliminación se realizó en una transacción con comprobación de destino
heliumdb, bloqueo de las cinco tablas afectadas y comparación de huellas de
todos sus registros ajenos a las fixtures antes/después. La comprobación pasó.
Las consultas posteriores devolvieron cero registros para los identificadores
y marcadores TEST FASE1 comprobados. No se reiniciaron secuencias.

## Pendiente fuera de alcance

Durante las pruebas, `/api/ai/perfil/34` respondió 403. No bloqueó los flujos de
Fase 1 verificados. No se investigó ni corrigió su causa. El paciente sintético
34 ya fue eliminado; una futura investigación necesitará una nueva fixture
autorizada. No cambiar autenticación o permisos como parte de este cierre.

No se modificó código funcional durante la limpieza. No se realizó push,
deploy ni modificación de producción.