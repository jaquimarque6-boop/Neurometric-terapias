# Programa de Colaboradoras V1 — verificación

## Alcance

Implementación de cuatro tablas independientes del dominio clínico:
collaborators, referral_attributions, saas_receipts y saas_status_events.
Campos definitivos y restricciones: scripts/collaborators-v1.sql.
Contrato de endpoints: docs/collaborators-api-contract.md.

La migración se aplicó únicamente a heliumdb (desarrollo). No se creó ninguna
colaboradora real ni se ejecutó SQL sobre producción.

## Resultados

- 10 pruebas de referido aprobadas: captura temprana de /?ref=angie usando
  validador sintético, persistencia 30 días, expiración, first-valid-wins,
  códigos inválidos/inactivos, reintentos, concurrencia y WhatsApp.
- Suite integrada real sobre heliumdb aprobada, sin skips: permisos por rol,
  privacidad y aislamiento A/B, atribución, cobro sin referido, comisión,
  idempotencia, porcentaje histórico, pago completo y estados comerciales.
- 23 pruebas de regresión de permisos, login y Fase 1 aprobadas.
- Builds frontend y backend aprobados.
- Typechecks generales conservan errores preexistentes fuera de los archivos
  nuevos del programa; no se presenta el typecheck global como aprobado.
- Navegador con datos reales sintéticos: crear/activar colaboradoras,
  crear profesional con referido, persistencia local, dashboard propio,
  acceso directo denegado y aislamiento entre dos colaboradoras.
- Cobro USD 8 y comisión USD 3,20 al 40%; cambio posterior a 35% no alteró
  el cobro histórico. Pago completo y referencias conservados.

## Correcciones y límites

- Se corrigió un error en el SQL de limpieza de la primera ejecución y se
  eliminaron sus fixtures exactas antes de repetir la suite.
- El navegador mostró inicialmente reactivaciones sumadas como altas nuevas;
  se corrigió el cálculo y la prueba integrada verificó una sola primera alta.
  También se verificó cancelación desde mora y bloqueo de lectura de porcentaje
  concurrente con cambios administrativos.
- La lectura automática del portapapeles quedó limitada por permisos del
  navegador. El botón Copiar se mostró y se pudo pulsar.
- El admin dispone del historial mensual agregado; el formulario de cambios
  de estado muestra los eventos realizados en esa sesión, no un explorador
  detallado de todos los eventos históricos.
- El referido pendiente de otra persona llega por WhatsApp/código manual;
  no se comparte automáticamente el almacenamiento entre dispositivos.
- No hay pasarelas, devoluciones, pagos parciales, conciliación ni conversión
  de monedas. No hay cobros editables ni borrables por API.

## Limpieza

Se eliminaron exclusivamente las cuentas y dependencias sintéticas creadas
por estas pruebas: usuarios 36–61 (identificados en cada ejecución), filas
comerciales relacionadas y sesiones correspondientes. Las pruebas de navegador
usaron usuarios 50 y 58–61; no crearon pacientes.

Verificación final en heliumdb: las cuatro tablas nuevas vacías, cero usuarios
de esos IDs y cero sesiones asociadas. No se eliminaron cuentas reales, ni se
reiniciaron secuencias.

No se modificaron módulos clínicos, PWA o Fase 1. No se hizo push ni deploy.