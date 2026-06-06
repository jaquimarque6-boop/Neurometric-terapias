# Neurometric Terapias

Plataforma de gestión clínica para consultorios de terapia: pacientes, profesionales, citas, registros clínicos, objetivos y pagos.

## Stack

| Capa          | Tecnología                                                   |
| ------------- | ------------------------------------------------------------ |
| Frontend      | React 19 + Vite 7 + Tailwind 4 (`artifacts/neurometric-lab`) |
| Backend       | Express 5 + tsx (`artifacts/api-server`)                     |
| Base de datos | PostgreSQL 17 + Drizzle ORM (`lib/db`)                       |

```
Producción:
  Netlify (frontend) ──VITE_API_URL──▶ Render (backend) ──▶ Supabase PostgreSQL

Desarrollo local:
  Vite :3000 ──proxy /api──▶ Express :3001 ──▶ Postgres en Docker :5433
```

## Estructura del repositorio

Es un workspace de pnpm:

```
artifacts/
  neurometric-lab/   # Frontend React (servidor de desarrollo Vite, puerto 3000)
  api-server/        # API Express (puerto 3001 en local)
  mockup-sandbox/    # Playground de mockups de UI
lib/
  db/                # Esquema Drizzle + pool de conexiones (@workspace/db)
  api-zod/           # Validación compartida de requests/responses
  api-client-react/  # Hooks tipados del cliente de la API
  api-spec/          # Especificación de la API
  integrations/      # Paquetes de integraciones (OpenAI, etc.)
scripts/             # Scripts de mantenimiento puntuales
```

## Requisitos

- Node.js 20+
- pnpm 10 (`corepack enable`)
- Docker (para PostgreSQL local)

## Cómo correr el proyecto en local

### 1. Instalar dependencias

```sh
pnpm install
```

### 2. Levantar PostgreSQL

La base de datos local corre en Docker en el puerto **5433** del host (el 5432 queda libre para otros proyectos):

```sh
docker run -d --name neurometric-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=neurometric \
  -p 5433:5432 \
  postgres:17
```

Si el contenedor ya existe, basta con iniciarlo: `docker start neurometric-pg`.

### 3. Configurar el servidor de la API

```sh
cp artifacts/api-server/.env.example artifacts/api-server/.env
```

Los valores por defecto coinciden con el contenedor Docker de arriba:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/neurometric
PORT=3001
```

`.env` está en el gitignore y solo se usa en local — en Replit/Render la plataforma inyecta estas variables (ver `artifacts/api-server/src/env.ts`).

### 4. Crear el esquema (solo con base de datos nueva)

Aplicar el esquema de Drizzle a la base de datos local:

```sh
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/neurometric \
  pnpm --filter @workspace/db push
```

### 5. Correr

```sh
pnpm dev
```

Esto levanta ambas apps en paralelo:

- **Frontend:** http://localhost:3000 (Vite, con `strictPort` — falla si el puerto está ocupado)
- **API:** http://localhost:3001 (el frontend la proxea en `/api`)

En el primer arranque la API hace el seed de la base de datos: la biblioteca de objetivos (444 objetivos), los usuarios admin y una importación única de datos desde Supabase (`seedFromSupabaseIfNeeded`). En arranques posteriores detecta los datos existentes y lo omite.

### Credenciales de acceso (seed)

El seed crea estos usuarios admin (ver `artifacts/api-server/src/routes/auth.ts`):

| Email                   | Contraseña  | Notas                                                                       |
| ----------------------- | ----------- | --------------------------------------------------------------------------- |
| `admin@neurometric.com` | `12345678`  | Se asegura en cada arranque (la contraseña se restablece al valor del seed) |
| `admin@neurometric.cl`  | `admin1234` | Solo se crea si la tabla de usuarios está vacía                             |

> ⚠️ Estos seeds corren incondicionalmente al arrancar el servidor — también en producción (Render). Las credenciales están hardcodeadas en el código.

## Otros comandos

```sh
pnpm typecheck     # Chequeo de tipos de libs + todos los artifacts
pnpm build         # Typecheck + build de todos los paquetes
pnpm build:render  # Build solo de frontend + api-server (deploy en Render)
```

## Deployment

- **Frontend — Netlify.** Configurado en `netlify.toml`: compila `@workspace/neurometric-lab`, publica `artifacts/neurometric-lab/dist` y define `VITE_API_URL` apuntando al backend en Render. Incluye el redirect de SPA a `index.html`.
- **Backend — Render.** Ejecuta los scripts `build` y luego `start` de `@workspace/api-server` (bundle con esbuild → `node dist/index.cjs`). `DATABASE_URL` (pooler de Supabase) se configura en el dashboard de Render, no en el repo.
- **Replit** (`.replit`) se mantiene como entorno de desarrollo/respaldo; provisiona su propia base de datos mediante las variables `PGHOST`/`PGDATABASE`.

## Solución de problemas

- **`DATABASE_URL must be set`** — falta `artifacts/api-server/.env` (paso 3) o el contenedor Docker no está corriendo.
- **`ECONNREFUSED ... :5433`** — iniciar la base de datos: `docker start neurometric-pg`.
- **Vite falla con "Port 3000 is already in use"** — algo más está usando el 3000; `strictPort` es intencional para que el proxy de `/api` nunca se rompa en silencio.
- **La sesión/login no persiste** — la API emite cookies `Secure; SameSite=None` incluso en desarrollo. Los navegadores permiten cookies Secure en `localhost`, pero solo vía `http://localhost`, no por IP de la red local.
