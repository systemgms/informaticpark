# Code Review Rules

## TypeScript
- Use `const`/`let`, never `var`
- Strict mode is enabled — no implicit `any`
- Prefer interfaces over types for object shapes
- No explicit `any` — use `unknown` and narrow
- Enum members: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`

## Naming
- Variables/functions: `camelCase`
- Components/classes/types/interfaces: `PascalCase`
- Boolean variables: prefix with `is`, `has`, `should`, `can`
- Private class members: `camelCase` (no underscore prefix)
- Parameters: `camelCase`, leading underscore allowed (`_id`)

## React / Next.js (frontend)
- Use functional components with `"use client"` directive
- Prefer named exports over default exports
- No caching library — data fetching is `useEffect` + `useState`
- Forms use `useState`, not react-hook-form
- UI components: shadcn/ui (Radix + Tailwind)
- Icons: `lucide-react`
- Path alias: `@/*` → `src/*`

## NestJS (backend)
- Follow module structure: controller → service → prisma
- Use DTOs with `class-validator` decorators
- All routes prefixed with `/api`
- Auth: `JwtAuthGuard` + `@Roles('ADMIN')` decorator
- Global pipes: `ValidationPipe`, `TrimStringsPipe`, `ParseIdPipe`

## Style
- Prettier: single quotes, trailing commas
- ESLint with `@typescript-eslint` + `eslint-config-prettier`
- No semicolons preference follows Prettier defaults

## Language
- Code (variables, functions, types): **English**
- UI strings, labels, error messages: **Spanish**

## Security
- Never commit secrets or API keys
- JWT secret from env vars only
- No `console.log` in production code
