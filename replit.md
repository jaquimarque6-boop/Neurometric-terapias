# Neurometric Lab

## Overview
Neurometric Lab is a full-stack clinical therapy platform designed as a bilingual (Spanish-default) monorepo. It manages patients, clinical records, therapeutic objectives, activities, and professionals, aiming to streamline clinical workflows and improve patient care. The platform provides tools for patient management, progress tracking, and report generation, including PDF exports of clinical reports.

## User Preferences
The agent should prioritize an iterative development approach. Before implementing any major changes or new features, the agent must ask for confirmation and provide a brief explanation of the proposed changes. The agent should ensure that all generated content and interactions are in Spanish, as it is the default language of the application. Do not make changes to the `lib/api-spec` directory or its contents.

## System Architecture

### Monorepo Structure
The project is organized as a pnpm workspace monorepo with the following key packages:
- `api-server`: Express.js backend for the API.
- `neurometric-lab`: React + Vite frontend application.
- `lib/db`: Drizzle ORM for PostgreSQL database interactions.
- `lib/api-spec`: Manages OpenAPI specification and Orval codegen.

### Technology Stack
- **Monorepo**: pnpm workspaces
- **Frontend**: React, Vite, Tailwind CSS, shadcn/ui, react-query, wouter, recharts
- **Backend**: Express 5, Node.js 24
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod
- **API Codegen**: Orval (from OpenAPI spec)

### Core Features
- **Patient Management**: Comprehensive patient profiles including records, therapeutic plans, timelines, and suggestions. Patient grid with visual performance indicators.
- **Therapeutic Objectives**: CRUD operations for therapeutic goals with status tracking (`activo`, `en progreso`, `logrado`, `archivado`). Integration with a goal bank for easy assignment.
- **Clinical Records**: CRUD for clinical records and read-only access to CSV session data.
- **Activity Library**: Management of a library of clinical and family activities linked to therapeutic goals.
- **Professional Management**: Tools for managing clinical professionals and their assigned patients.
- **Reporting**: Dashboard statistics and charts, along with a dedicated "Informe" tab for generating structured clinical reports with PDF export functionality. Auto-generation of contextual clinical text for reports.
- **Clinical Timeline**: A chronological view of all clinical activity for a patient, aggregating events from various sources.

### Authentication and Authorization
- **Session-based authentication**: Uses `express-session` and `bcryptjs`.
- **Role-based access control**: Supports `admin` and `professional` roles.
  - `admin`: Global access to all data.
  - `professional`: Scoped access to only their assigned patients and associated data.
- **Frontend enforcement**: Routes and UI elements are conditionally rendered or protected based on user roles.

### Data Management
- **Database Schema**: Key tables include `patients`, `registros_clinicos`, `goals`, `goal_library`, `actividades`, `professionals`, and `users`.
- **Goal Progress Tracking**: `goals.progressPct` for manual progress and `goal_progress.progressPct` for historical snapshots.
- **Clinical Report Storage**: `informeEvolucion` stores a JSON object for structured reports, supporting backward compatibility with older text formats.

### UI/UX
- Bilingual interface (Spanish-default)
- Utilizes shadcn/ui for consistent component design.
- The "Plan Terapéutico" section in patient profiles features interactive goal cards with detailed views and progress tracking dialogs.
- The "Línea de Tiempo" (Clinical Timeline) provides a visually distinct and filterable chronological view of patient activity.
- The "Informe" tab supports both "Técnico" (technical) and "Familia" (family) views for reports, with print-ready HTML generation for PDF export.

### Profession-aware Content Filtering
- The utility `src/utils/profession-map.ts` derives the clinical profession from `user.specialty` string matching ("ocupacional" → ocupacional; "psicoped"/"pedagog"/"aprendizaje" → psicopedagogia; else fonoaudiologia). Three branches: fonoaudiologia, psicopedagogia, ocupacional (Terapia Ocupacional).
- `nueva-sesion.tsx` uses the derived profession to:
  - Show diagnosis chips for the correct discipline (Fonoaudiología: TEL/TDL/TEA/TSH/etc.; Psicopedagogía: Dislexia/Disgrafía/Discalculia/TDAH/etc.; Terapia Ocupacional: TPS/TDC/dispraxia/AVD/etc.)
  - Show age-developmental skill blocks via a 3-way `bloquesActivos` (BLOQUES_SESION for fono; BLOQUES_PSICOPED for psicoped; BLOQUES_TO for TO — Integración sensorial, Motricidad fina/gruesa, Coordinación visomotora, AVD/autonomía, Grafomotricidad)
  - Filter the banco de objetivos area dropdown to profession-relevant areas (Fono: lenguaje/habla/pragmática/MO/deglución/ET; Psicoped: lectoescritura/cognición; TO: integración sensorial/motricidad/visomotora/AVD/grafomotricidad/autorregulación/praxias)
- `eval-sugerida.tsx` has evaluation guidance for psicopedagogía-specific areas: funciones ejecutivas, disgrafía, matemáticas, comprensión lectora.

### Pagos: período vs fecha de ingreso
- The `pagos` table already separates two distinct fields (no schema change): `mes` ("YYYY-MM", the **period the payment covers** — "mes abonado") and `fecha` ("YYYY-MM-DD", the **real date the money was received** — "fecha de ingreso").
- `agenda-pagos.tsx` table/form labels make this distinction explicit ("Mes abonado" vs "Fecha de ingreso", with helper text).
- `agenda-pagos.tsx` has a "Filtrar por" selector (mes abonado vs fecha de ingreso). The API only filters by `mes`/`tipo`/`patientId`, so the period filter is applied **client-side**: the list is fetched by `tipo` only, then `pagosFiltrados` filters by month using either `pago.mes` (mes abonado) or `pago.fecha.slice(0,7)` (fecha de ingreso). Summary cards + table use `pagosFiltrados`.
- `patient-profile.tsx` has a read-only "Pagos" tab listing that patient's payment history via raw `useQuery` to `/api/pagos?patientId=` (query key `["pagos","patient",patientId]`, `refetchOnMount: "always"`), showing mes abonado, monto (CLP), tipo, fecha de ingreso, and a total.

## External Dependencies
- **PostgreSQL**: Primary database for all application data.
- **Orval**: Used for generating API client hooks and Zod schemas from the OpenAPI specification.
- **`express-session`**: Middleware for managing user sessions.
- **`bcryptjs`**: For hashing user passwords securely.
- **recharts**: For rendering statistical charts in the reporting section.
## Métricas de uso en la pantalla "Usuarios"

### Fase 1 (implementada)
- `GET /api/users` (admin) enriquece cada usuario con un objeto `stats` calculado **en tiempo de ejecución** desde tablas existentes (sin cambios de esquema):
  - `pacientesAsignados`: pacientes no archivados con `patients.assigned_professional_id = user.id`.
  - `sesionesRegistradas` / `pacientesConSesion` / `sesionesEsteMes` / `ultimaActividad`: derivados de `registros_clinicos`, atribuyendo cada registro a un usuario por `user_id`; si `user_id` es nulo (registros antiguos), se recupera por `professional_id` (vs `users.professional_id`) y, en última instancia, por nombre normalizado.
- El frontend (`usuarios.tsx`) muestra esas métricas por tarjeta y un resumen general arriba (activos este mes / con pacientes / con sesiones / sin actividad), visible solo si hay datos reales. No muestra "0" falsos.

### Fase 2 (pendiente — requiere aprobación, cambios de BD/login)
- **Pacientes creados**: agregar columna `created_by` en `patients` (hoy no existe forma de distinguir "creados" de "asignados").
- **Último acceso real**: agregar columna `last_login` en `users` y escribir el timestamp en el login (toca el flujo de autenticación).
- **Uso de IA**: no solicitado por ahora; las rutas `ai-informe.ts` / `ai-objetivos.ts` no persisten uso.

### Control de acceso en la API de usuarios (corregido)
- `PATCH /api/users/:id`: los administradores pueden gestionar cualquier usuario. Un no-admin solo puede editar su **propia** cuenta y solo campos no privilegiados (`name`, `email`, `specialty`, `password`); no puede cambiar `role`/`active` ni editar a otros (responde 403). Esto preserva el cambio de contraseña propia desde `/usuario`.
- `DELETE /api/users/:id`: requiere rol admin (`requireAdmin`); se mantiene la regla de no poder auto-desactivarse.
- Nota: el cambio de **nombre** propio se hace por `PATCH /api/auth/me`; el cambio de **contraseña** propia se hace por `PATCH /api/users/:id` con `{ password }`.

## Documentación / Archivos del paciente (Supabase Storage)
- Nueva pestaña "Documentación" en `patient-profile.tsx`: subir / listar / descargar / eliminar archivos de cada paciente. Muestra nombre, tipo, tamaño, quién subió y fecha.
- Almacenamiento en **Supabase Storage** en un bucket **privado** (`SUPABASE_FILES_BUCKET`, por defecto `patient-files`); el navegador nunca recibe la service key, solo **URLs firmadas** de corta duración (subida y descarga firmadas, expiran en 5 min).
- Tabla `patient_files` (sin FKs, igual que el resto del esquema): `id, patient_id, uploaded_by, original_name, mime_type, size_bytes, storage_path (UNIQUE), created_at`. La ruta de objeto es `patients/{patientId}/{uuid}-{nombreSeguro}`.
- Backend: `lib/supabaseStorage.ts` (fetch crudo, sin SDK; lee `SUPABASE_URL`/`SUPABASE_SERVICE_KEY`/`SUPABASE_FILES_BUCKET`) y `routes/patient-files.ts` (registrada en `routes/index.ts`).
  - Flujo de subida en 3 pasos: `POST .../files/upload-url` (valida nombre, allowlist de MIME, tamaño ≤ 25 MB → URL firmada) → el navegador hace `PUT` de los bytes a Supabase → `POST .../files` guarda la metadata (verifica que el objeto exista antes de persistir, evita filas fantasma).
  - `GET .../files` lista con el nombre de quien subió (leftJoin a `users`). `GET .../files/:fileId/download` devuelve URL firmada.
  - `DELETE .../files/:fileId`: borra primero el objeto y solo entonces la fila (si el almacenamiento no está configurado responde 503, para no dejar objetos huérfanos). Permitido a cualquier profesional con acceso + admin.
- Control de acceso: todos los endpoints usan la misma regla que las rutas de pacientes (admin **o** `assigned_professional_id === sesión`); los archivos están acotados por `patientId` y `fileId` (sin IDOR). **No** toca login/permisos/actividades ni otros datos. **Sin claves hardcodeadas.**
- Variables de entorno: `SUPABASE_URL` y `SUPABASE_FILES_BUCKET` en *shared*; `SUPABASE_SERVICE_KEY` como **secret** (service_role). En producción (Render) deben configurarse las tres.

## Perfil clínico con IA + diferenciación de sesiones
- **Perfil clínico con IA** (`patient-profile.tsx`, pestaña Anamnesis): el botón antes mostraba un toast "próximamente"; ahora genera un perfil clínico editable. Llama a `POST /api/ai/perfil-generate` y abre un diálogo con un `Textarea` por sección (editable) + botón "Copiar todo".
  - Backend: `routes/ai-perfil.ts` (registrada en `routes/index.ts`). Reutiliza el patrón de `ai-informe.ts`: junta datos del paciente (anamnesis, diagnóstico, edad), objetivos con estado/progreso, sesiones recientes (últimas 8) y profesionales; detecta disciplina; llama a OpenAI con `response_format: json_object`.
  - Devuelve 7 secciones: `motivoConsulta`, `antecedentes`, `fortalezas`, `dificultades`, `areasIntervencion`, `objetivosPrioritarios`, `resumenProfesional`. No persiste nada (solo lectura + generación).
  - **No** se especifica `temperature` (gpt-5.4 vía la integración de Replit solo admite el valor por defecto; `ai-informe.ts` usa 0.3 porque corre con gpt-4o + clave directa).
  - Clave de IA: `OPENAI_API_KEY` (clave directa → gpt-4o) **o** `AI_INTEGRATIONS_OPENAI_API_KEY` + `AI_INTEGRATIONS_OPENAI_BASE_URL` (integración Replit → gpt-5.4). En dev se aprovisionó la integración Replit; en producción (Render) debe existir una de las dos opciones o el endpoint responde 500 por diseño.
- **Diferenciación de sesiones** (solo etiquetas/iconos, sin cambios de lógica de guardado): "Nueva sesión" pasó a llamarse **"Sesión completa"** (icono `Target`) y se mantiene **"Sesión rápida"** (icono `Zap`), con textos de ayuda distintos. Aplicado en `dashboard.tsx` (tarjetas, con emojis ⚡/🎯) y en `patient-profile.tsx` (botones de cabecera y de la pestaña Registros).

### Perfil clínico con IA — persistencia (documento del paciente)
- El perfil clínico generado por IA ahora es un **documento persistente por paciente** (editable, guardable, con fechas).
- **Reutiliza la tabla `patients`** (sin tabla nueva): columnas `perfil_ia` (text con JSON de las 7 secciones), `perfil_ia_created_at` y `perfil_ia_updated_at` (timestamps). Sigue la misma convención que los informes IA (guardados como JSON en columnas de `patients`). **No** toca los campos de anamnesis (`motivo_consulta`/`antecedentes` siguen siendo datos clínicos aparte).
- Backend (`routes/ai-perfil.ts`): `GET /api/ai/perfil/:patientId` (devuelve `{ perfil, createdAt, updatedAt }`) y `PUT /api/ai/perfil/:patientId` (upsert; `updatedAt` se actualiza siempre, `createdAt` queda fijo una vez establecido). `normalizePerfil()` solo persiste las 7 claves válidas. `POST /api/ai/perfil-generate` (generación, sin persistir) queda igual.
- Frontend (`patient-profile.tsx`): un `useQuery(["perfil-ia", patientId], { refetchOnMount: "always" })` **carga automáticamente** la última versión guardada al abrir el paciente. El botón "Perfil clínico con IA" abre el diálogo mostrando la versión guardada si existe (si no, genera una). El diálogo muestra **Creado / Última edición** y un indicador de "Cambios sin guardar"; sus acciones son **Regenerar con IA** (con confirmación `AlertDialog`; regenerar solo reemplaza el editor, **no** pisa la versión guardada hasta presionar Guardar), **Copiar todo** y **Guardar**.
- **Producción (Render/Supabase)**: requiere aplicar la misma migración (las 3 columnas en `patients`) antes de usarse en prod, o el endpoint fallará.

### Agenda — estado de asistencia por cita
- Cada cita tiene un **estado de asistencia** independiente del ciclo de vida (`status`): `pendiente` (default), `asistio`, `ausente`, `reprogramada`.
- **Reutiliza la tabla `citas`** (sin tabla nueva): columna `asistencia` (text, `NOT NULL default 'pendiente'`). `status` (programada/cancelada) **no se toca**; la cancelación, recurrencia y edición quedan igual.
- Backend (`routes/citas.ts`): el `PUT /api/citas/:id` acepta `asistencia` solo si es uno de los 4 valores válidos (whitelist). Guard: si no hay cambios válidos, devuelve la cita sin error (evita el UPDATE vacío de drizzle).
- Frontend (`agenda.tsx`): en la vista semanal el **color de la cita** sale de `asistencia` (pendiente gris/neutro, asistió verde, ausente rojo, reprogramada ámbar). El modal de acción rápida muestra el estado actual + botones **Marcar asistencia** (Asistió/Ausente/Reprogramada + "Volver a pendiente") y **Accesos** (Sesión rápida, Sesión completa, Registrar pago), además de Editar/Cancelar.
- Acceso a pago (`agenda-pagos.tsx`): se abre con `?patientId=X&nuevo=1`, que preselecciona el paciente y abre el formulario de registro (sin tocar la lógica de pagos).
- Los datos de asistencia quedan guardados para **reportes futuros** (asistencias, ausencias, % de asistencia por paciente/profesional) — esa etapa es posterior.
- **Producción (Render/Supabase)**: requiere aplicar la misma migración (columna `asistencia` en `citas`) antes de usarse.

### Panel de usuarios — filtros rápidos por actividad
- Las métricas de uso (Con pacientes, Con sesiones, Sin actividad) ahora también funcionan como **filtros rápidos** sobre la lista: Todos, Con pacientes, Con sesiones, Sin pacientes, Sin actividad (cada chip muestra su conteo).
  - Con pacientes: `pacientesAsignados > 0`; Con sesiones: `sesionesRegistradas > 0`; Sin pacientes: `pacientesAsignados === 0`; Sin actividad: sin pacientes y sin sesiones; Todos: lista completa.
- El filtro se combina con el buscador existente (AND). No se tocaron las tarjetas de métricas, roles, permisos, login ni el alta/edición/baja de usuarios.
- Cada tarjeta muestra badges visuales: **Tiene pacientes** (verde), **Tiene sesiones** (azul), **Sin actividad** (gris).
