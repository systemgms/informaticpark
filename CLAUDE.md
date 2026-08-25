# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**Infopark** is a public-sector asset management system ("Parque Informático"). The UI and domain language are in **Spanish**. The repo is a monorepo with two independent apps:

- `backend/` — NestJS 11 + Prisma + PostgreSQL REST API (port **4000**, prefix `/api`)
- `frontend/` — Next.js 15 App Router admin dashboard (port **3000**)

Runtime: **Bun** (both development and production via Vercel).

Each subdirectory has its own `CLAUDE.md` with detailed commands and architecture.

## Development setup

Run both servers in separate terminals:

```bash
# Terminal 1 — backend
cd backend && bun run start:dev

# Terminal 2 — frontend
cd frontend && bun run dev
```

**Required env files:**

`backend/.env`:
```
DATABASE_URL="postgresql://user:pass@localhost:5432/informaticpark"
JWT_SECRET="your_secret"
JWT_EXPIRES_IN="1h"
```

`frontend/.env`:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

**First-time database setup:**
```bash
cd backend
bun run prisma:migrate
bun run prisma:seed   # creates admin@example.com / Admin123!
```

## Cross-cutting architecture

### Auth flow (spans both apps)

1. Frontend `POST /api/auth/login` → receives JWT
2. JWT stored in **localStorage** via `src/components/auth-provider.tsx`
3. All subsequent requests attach `Authorization: Bearer <token>` (see `src/lib/api.ts`)
4. Backend `JwtAuthGuard` validates every request unless the route is decorated `@Public()`
5. Admin routes additionally use `RolesGuard` + `@Roles('ADMIN')`
6. 401 responses auto-redirect to `/login` (handled in `api.ts`)

### Backend module access rules

| Module | Who can access |
|---|---|
| `AuthModule` | Public (no token required) |
| `AssetsModule` | Any authenticated user |
| `UsersModule` | ADMIN only |
| `CustodiansModule` | ADMIN only |
| `LocationsModule` | Read (`GET`) is `@Public()`; write/update/delete is ADMIN only |

### Data model relationships

`Location` sits at the root of the geographic hierarchy:

```
Location (1) ──── (N) Custodian
Location (1) ──── (N) Asset
Custodian (1) ─── (N) Asset
User (1) ────────── (N) Asset  (createdByUserId)
```

All FK relations are nullable. Deleting a `Location` sets `locationId` to `NULL` on related `Asset` and `Custodian` rows (SetNull). Note: `Asset` has both a free-text `location` field and a `locationId` FK — they serve different purposes (legacy text vs. structured reference).

### Frontend data fetching pattern

Every page is `"use client"` and fetches on mount via `useEffect` → `useState`. There is no caching layer (no SWR/React Query). All API calls route through `src/lib/api.ts` which exposes namespaced clients: `api.users.*`, `api.custodians.*`, `api.assets.*`, `api.locations.*`.

### Frontend route → admin page mapping

```
/admin/assets/                    list + search
/admin/assets/new                 create form
/admin/assets/[id]                edit form
/admin/custodians/                list
/admin/custodians/new             create form
/admin/custodians/[id]            edit form
/admin/custodians/[id]/assets     assets belonging to a custodian
/admin/users/                     list
/admin/users/new                  create form
/admin/users/[id]                 edit form
```

There is no frontend page for Locations — the backend `LocationsModule` exists and the `api.locations.*` client is wired up, but no admin route has been built yet.

## Code conventions

### Language rules
- **Variable names, function names, parameters, and internal logic MUST be in English**
- **UI-facing strings, labels, error messages, and user-facing text are in Spanish** (the app is for Spanish-speaking users)
- Prisma model and field names are in English; the Spanish UI maps them via the frontend

### Naming conventions (enforced by ESLint)
- **Variables / functions**: `camelCase` — e.g. `assetList`, `fetchAssets()`
- **React components / exported decorators / classes / types / interfaces**: `PascalCase` — e.g. `AssetForm`, `CreateAssetDto`
- **Constants**: `UPPER_SNAKE_CASE` — e.g. `API_TIMEOUT`
- **Enum members**: `PascalCase` — e.g. `Role.ADMIN`
- **Boolean variables**: prefix with `is`, `has`, `should`, `can` — e.g. `isActive`, `hasPermission`
- **Private class members**: `camelCase` (no underscore prefix)
- **Parameters**: `camelCase`, leading underscore allowed — e.g. `_id`, `userId`

### Run lint before committing
```bash
cd backend && bun run lint
cd frontend && bun run lint
```
