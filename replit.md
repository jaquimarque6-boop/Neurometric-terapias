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
