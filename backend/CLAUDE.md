# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun run start:dev        # Start with hot reload (port 4000)
bun run start:debug      # Start with debugger

# Build
bun run build            # Generates Prisma client + compiles TypeScript

# Code quality
bun run lint             # ESLint with auto-fix
bun run format           # Prettier formatting

# Testing
bun run test             # Unit tests
bun run test:watch       # Watch mode
bun run test:cov         # Coverage report
bun run test:e2e         # E2E tests

# Database
bun run prisma:migrate   # Run migrations
bun run prisma:seed      # Seed with initial data (admin@example.com / Admin123!)
bun run prisma:generate  # Regenerate Prisma client after schema changes
```

## Architecture

NestJS 11 + Prisma + PostgreSQL API running on port 4000. All routes are prefixed with `/api`. Swagger docs at `/api/docs`.

### Module structure

- **AppModule** — root module wiring everything together
- **AuthModule** — JWT login (`POST /api/auth/login`), public endpoint only; issues Bearer tokens
- **UsersModule** — ADMIN-only CRUD; soft deletes (sets `isActive = false`)
- **AssetsModule** — any authenticated user; manages physical assets with Decimal precision values
- **CustodiansModule** — ADMIN-only; people responsible for assets (one-to-many with assets)
- **PrismaModule** — global singleton wrapping the Prisma client

### Auth & authorization flow

1. `POST /api/auth/login` returns a JWT
2. All other routes require `Authorization: Bearer <token>` (enforced by `JwtAuthGuard`)
3. `@Roles('ADMIN')` decorator + `RolesGuard` restricts admin endpoints
4. JWT config reads `JWT_SECRET` and `JWT_EXPIRES_IN` from env (defaults: `'changeme_jwt_secret'` / `'1h'`)

### Database models

Three Prisma models: **User** (role: ADMIN|USER), **Custodian** (unique `identifier`), **Asset** (optional `code`, Decimal `initialValue`/`currentValue`). Assets reference both a custodian and the user who created them.

### Global pipes (applied in `main.ts`)

- `ValidationPipe` — whitelist + forbidNonWhitelisted + auto transform
- `TrimStringsPipe` — trims all string inputs
- `ParseIdPipe` — validates numeric ID params

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_SECRET` | `changeme_jwt_secret` | JWT signing key |
| `JWT_EXPIRES_IN` | `1h` | Token TTL |
