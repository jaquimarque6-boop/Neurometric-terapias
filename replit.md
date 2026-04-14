# Workspace — Neurometric Lab

## Overview

Full-stack clinical therapy platform (Neurometric Lab) built as a pnpm workspace monorepo. Spanish-default bilingual interface for managing patients, clinical records, therapeutic objectives, activities, and professionals.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui, react-query, wouter, recharts
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── neurometric-lab/    # React+Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
└── pnpm-workspace.yaml
```

## Neurometric Lab — Application

### Frontend Pages (`artifacts/neurometric-lab/src/pages/`)

| Route | File | Description |
|-------|------|-------------|
| `/` | `dashboard.tsx` | Panel clínico — stats, latest sessions, patient list |
| `/patients` | `patients.tsx` | Patient grid with semáforo badges and performance bars |
| `/patients/:id` | `patient-profile.tsx` | Full patient ficha with Ficha/Registros/Plan Terapéutico/Línea de tiempo/Sugerencias/Informe tabs |
| `/registros` | `registros.tsx` | Clinical records CRUD with search/filter |
| `/objetivos` | `objetivos.tsx` | Therapeutic goals with status toggle (activo/logrado/suspendido) |
| `/actividades` | `actividades.tsx` | Activity library (70 activities: clínicas + familia) |
| `/profesionales` | `professionals.tsx` | Professional management |
| `/reportes` | `reportes.tsx` | Stats charts (recharts) |
| `/sessions` | `sessions.tsx` | Read-only CSV session data table |
| `/goal-library` | `goal-library.tsx` | Goal bank browser |

### Database Schema

- **patients** — `id, name, age, fechaNacimiento, franjaEtaria, diagnosis, observaciones, semaforo, promedioDesempeno, profesionalId, profesionalNombre, createdAt`
- **registros** — CSV session data (read-only)
- **registros_clinicos** — Clinical records CRUD (new table)
- **goals** — Therapeutic goals per patient (activo/logrado/suspendido)
- **goal_library** — 70+ goal templates seeded from Neurometric CSV
- **actividades** — Activity suggestions (clínicas + familia)
- **professionals** — Clinical professionals
- **patient_professionals** — Junction table (M:M patients ↔ professionals)

### API Routes (all prefixed `/api`)

- `GET/POST /patients`, `GET/PUT /patients/:id`
- `GET /registros`, `GET /sessions` (CSV read-only)
- `GET/POST /registros-clinicos`, `GET/PUT/DELETE /registros-clinicos/:id`
- `GET/POST /goals`, `PATCH/DELETE /goals/:id`
- `GET /goals/:id/progress`, `POST /goals/:id/progress`
- `GET /goals/:id/activities` — returns structured activities + libraryEntry metadata for a goal
- `GET /goal-library`, `POST /goal-library/assign`
- `GET/POST /goal-codes/generate`
- `GET /actividades`
- `GET/POST /professionals`
- `GET /patient-professionals`, `POST /patient-professionals`, `DELETE /patient-professionals/:id`
- `GET /dashboard/stats`

### Plan Terapéutico (Patient Profile)

The Plan Terapéutico tab in patient profiles is the core clinical workflow:

**Overview Card** — circular SVG progress ring showing % logrado, stat tiles (En trabajo / Logrados / Total), area breakdown bars.

**Goal Cards** (expandable chevron button):
- Compact view: status badge, area badge, code chip, colored progress bar top edge, inline % bar
- Expanded view: assignment date + target date with countdown, definition operativa, meta% / indicador / intentos tiles, clinical activities list, family activities list, clinical recommendation, professional notes
- Activities come from `actividades` table (goalLibraryId link) OR text fields from the library entry

**GoalProgressDialog** (history icon button):
- Activities checklist: structured activities are checkable, auto-appended to note; text-only library activities show as reference
- Session selector, estado dropdown, progress bar preview when status changes
- Full timeline of past notes/status changes with pre-wrap text

**AddFromBankDialog** — search + filter (area/nivel) with all bank goals; hides already-assigned ones; one-click assign.

**Visual Progress Tracking:**
- `goals.progressPct` (integer, nullable) — manually set 0-100 by the professional; null falls back to status-derived % (activo=15, en progreso=55, logrado=100, archivado=0)
- `goal_progress.progressPct` — records the % snapshot at time of each update for full history
- GoalCard uses `goal.progressPct ?? goalProgressPct(goal.status)` for the progress bar and % label
- GoalProgressDialog has: numeric input (type=number, aria-label="Porcentaje de progreso") + range slider side-by-side; typing a value auto-updates status (100→logrado, 0→activo, 1-99→en progreso); history entries show a % badge + mini bar for each recorded snapshot
- Timeline events (nota_progreso, estado_actualizado) show a "Progreso registrado" mini bar when progressPct is set

### Línea de Tiempo (Clinical Timeline)

A "Línea de tiempo" tab appears in every patient profile. It shows a chronological view (newest first) of all clinical activity for the patient.

**Backend:** `GET /api/patients/:id/timeline` in `patients.ts` — aggregates events from:
- `registros_clinicos` → event type `sesion` ("Sesión realizada")
- `goals.fechaAsignacion` → event type `objetivo_asignado` ("Objetivo asignado")
- `goal_progress` with status change → `estado_actualizado` or `objetivo_logrado`
- `goal_progress` with only a nota → `nota_progreso`

**Frontend:** `ClinicalTimeline` + `TimelineCard` components at bottom of `patient-profile.tsx`.

Each event card shows: colored dot (by event type) + vertical connector line, event title + icon, date, description, optional badge, and for status-change events: old→new status pill transition.

Filters: Todo / Sesiones / Objetivos / Logros / Estados / Notas — clicking narrows displayed events. Events are grouped by month-year with a section header.

Color coding: sesion=teal, objetivo_asignado=primary, objetivo_logrado=emerald, estado_actualizado=amber, nota_progreso=muted.

### Key Data Rules

- **patients table has NO email/phone/status** fields (removed in new schema)
- **goals status enum**: `activo | en progreso | logrado | archivado` (4 states)
- **goal_progress**: has `goalId, nota, statusAnterior, statusNuevo, registroClinicoId`
- **GoalLibraryItem** fields use Spanish: `idObjetivo, nombreObjetivo, modulo, area, subarea, franjaEtaria, definicionOperativa, actividadesClinicas, actividadesFamilia, recomendacionClinica, metaPorcentaje, intentosSugeridos`
- API hooks take params directly: `useListGoals({ patientId })` — NOT `useListGoals({ params: { patientId } })`
- Activities table (70 records) covers goalLibraryIds 1-22; newer bank goals have text in actividadesClinicas/actividadesFamilia
- **Banco de Objetivos activities management**: `GoalActivitiesPanel` component in `goal-library.tsx` — renders inside each expanded goal card; fetches `GET /api/actividades?goalLibraryId=X`; full CRUD via `POST /actividades`, `PATCH /actividades/:id`, `DELETE /actividades/:id`
- **Activity types**: `tipo = "clinica"` (Sesión clínica, blue) or `tipo = "familia"` (Práctica en casa, green) — each shown in its own column inside `GoalActivitiesPanel`
- **Inline editing**: `ActivityItem` renders with hover-reveal pencil/trash buttons; `ActivityAddForm` is an inline form (no dialog) with título, descripción, recursos fields
- **Patient profile GoalCard**: when expanded, fetches `/api/goals/:id/activities` which looks up goalLibraryId and returns structured activities; shows "Actividades clínicas" section if clinicActs.length > 0, "Para el hogar / familia" if familyActs.length > 0; falls back to text blobs (actividadesClinicas/actividadesFamilia) if no structured activities exist
- **GoalProgressDialog**: also shows activities as a checklist for marking usage in session

### Authentication System

Session-based auth using `express-session` + `bcryptjs`.

**Backend** (`artifacts/api-server/src/routes/auth.ts`):
- `POST /api/auth/login` — validates email/password, creates session
- `GET /api/auth/me` — returns current user from session (401 if not logged in)
- `POST /api/auth/logout` — destroys session
- `POST /api/auth/register` — creates a new user (admin only)
- `GET /api/auth/users` — lists all users (admin only)
- `seedAdminIfNeeded()` — called on startup; seeds `admin@neurometric.cl / admin1234` if no users exist

**DB Table** (`lib/db/src/schema/users.ts`): `users` table with `id, email, passwordHash, role, professionalId, name, createdAt`.

**Frontend**:
- `AuthProvider` + `useAuth()` hook in `artifacts/neurometric-lab/src/contexts/auth-context.tsx`
- `LoginPage` at `/login` with branded design + demo credentials hint
- All routes wrapped in `ProtectedRoute` which redirects to `/login` if not authenticated
- App header shows user name + role + logout dropdown menu

### Informe Tab (Clinical Report / PDF Export)

The `InformeTab` component in `patient-profile.tsx` (tab value `"informe"`) generates a structured clinical report organized by area.

**Storage format**: `informeEvolucion` stores a JSON object `{ v: 2, resumen, areas: Record<string, string>, sugerencias }`. Old plain-text strings are auto-migrated to this format (backward compatible). `informeFamilia` stores the family message text directly.

**Técnico view sections:**
1. Patient header + stats (sesiones, active goals, logrados, áreas trabajadas)
2. **Resumen general** — editable textarea + "Sugerir texto" auto-generator
3. **Desarrollo por área** — one collapsible card per clinical area, showing goal chips (logrado/en progreso) + progress bar + editable narrative per area + "Sugerir" auto-generator
4. **Sugerencias y continuidad** — editable textarea (green tint) + "Sugerir texto"
5. Last 5 sessions (date + summary)

**Familia view sections**: stats, achieved goals list, in-progress goals list, editable family message + "Sugerir texto" auto-generator.

**Auto-generators** (`generarResumenGeneral`, `generarNarrativaArea`, `generarSugerencias`, `generarMensajeFamilia`) produce contextual Spanish clinical text based on goals, progress, and session notes.

**PDF Export**: "Exportar PDF" button renders `informe-tecnico-content` (or `informe-familia-content`) as print-ready HTML with embedded CSS classes (`area-section`, `area-header`, `goal-chips`, `chip-green/amber/default`, `sugerencias-box`). Textareas are `display:none` in print CSS.

## Seed Scripts

```bash
pnpm --filter @workspace/scripts run seed-csv       # Seed patients from CSV
pnpm --filter @workspace/scripts run seed-modules   # Seed professionals, assignments, clinical records, goals, activities
```

## Common Commands

```bash
pnpm --filter @workspace/db run push          # Push DB schema
pnpm --filter @workspace/api-spec run codegen # Regenerate API client hooks
pnpm run typecheck                             # Full TS type check
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. Always typecheck from the root — run `pnpm run typecheck`. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for validation.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts all sub-routers

### `artifacts/neurometric-lab` (`@workspace/neurometric-lab`)

React + Vite frontend. Fully in Spanish (with EN toggle). Uses shadcn/ui components and react-query for data fetching.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

- `src/schema/index.ts` — barrel re-export of all models
- `drizzle.config.ts` — requires `DATABASE_URL`
- `pnpm --filter @workspace/db run push` — sync schema

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and Orval config. Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `scripts` (`@workspace/scripts`)

Utility scripts: `seed`, `seed-csv`, `seed-modules`, `seed-goal-library`. Run via `pnpm --filter @workspace/scripts run <script>`.
