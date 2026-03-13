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
| `/patients/:id` | `patient-profile.tsx` | Full patient ficha with Ficha/Registros/Objetivos tabs |
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
- `GET/POST /goals`, `PUT/DELETE /goals/:id`
- `GET /goal-library`, `POST /goal-library/assign`
- `GET /actividades`
- `GET/POST /professionals`
- `GET /patient-professionals`, `POST /patient-professionals`, `DELETE /patient-professionals/:id`
- `GET /dashboard/stats`

### Key Data Rules

- **patients table has NO email/phone/status** fields (removed in new schema)
- **goals status enum**: `activo | logrado | suspendido` (NOT pending/in-progress/achieved)
- **GoalLibraryItem** fields use Spanish: `idObjetivo, nombreObjetivo, modulo, area, subarea, franjaEtaria, definicionOperativa, actividadesClinicas, actividadesFamilia, recomendacionClinica, metaPorcentaje, intentosSugeridos`
- API hooks take params directly: `useListGoals({ patientId })` — NOT `useListGoals({ params: { patientId } })`

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
