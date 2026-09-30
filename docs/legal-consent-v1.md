# Fase Legal 1 — registro técnico

Las versiones vigentes se centralizan en `artifacts/api-server/src/lib/consents.ts`
(terms 1.0, privacy 1.0, ai 1.0). Se pueden actualizar allí o mediante las
variables `CONSENT_TERMS_VERSION`, `CONSENT_PRIVACY_VERSION` y
`CONSENT_AI_VERSION`.

`user_consent_acceptances` conserva una fila por usuario, tipo y versión.
`accepted_at` tiene default de servidor y `accepted_by_user_id` se deriva de la
sesión; la base también exige que coincida con `user_id`. Las altas por
administración y el registro público no generan aceptaciones automáticas.
La baja definitiva de una cuenta elimina en cascada sus aceptaciones junto con
la cuenta, para no bloquear el flujo existente de eliminación ni conservar
historial vinculado a una cuenta borrada.

La pantalla de términos/privacidad aparece después de que se resuelve el usuario
autenticado. No se cambian el login, las sesiones, los tokens ni se incorpora
bloqueo global del backend. Como defensa específica, cada endpoint IA devuelve
HTTP 428 `AI_CONSENT_REQUIRED` antes de procesar datos; el frontend registra el
aviso vigente y reintenta la misma petición una vez tras aceptación.

Los documentos y el aviso IA de la interfaz están rotulados como provisionales.
No son textos legales definitivos ni una afirmación de cumplimiento normativo.

Migración aditiva: `scripts/user-consent-acceptances-v1.sql`. Aplicada solo a
la base de desarrollo para las pruebas de esta fase; nunca a producción.