# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev      # Start development server at http://localhost:3000
bun run build    # Production build
bun run start    # Start production server
bun run lint     # Run ESLint
```

No test runner is configured.

## Environment

Requires `NEXT_PUBLIC_BACKEND_URL` in a `.env` file (defaults to `http://localhost:4000`).

## Architecture

**Next.js 15 App Router** admin dashboard for an asset management system ("Infopark"). UI and all user-facing text is in **Spanish**.

### Key files

- `src/lib/api.ts` — Centralized API client. All backend calls go through `api.users.*`, `api.custodians.*`, `api.assets.*`. Auto-attaches Bearer token from localStorage, handles 401 auto-logout, 10s timeout, CORS/mixed-content detection.
- `src/lib/types.ts` — Shared TypeScript interfaces: `User`, `Custodian`, `Asset`, and `Role` enum.
- `src/components/auth-provider.tsx` — React Context for auth state (token + user stored in localStorage).
- `src/components/auth-guard.tsx` — Wraps protected routes; redirects to `/login` if unauthenticated.
- `src/app/layout.tsx` — Root layout wrapping all pages with `AuthProvider` and `AuthGuard`.

### Route structure

```
/login              — Public login page
/                   — Protected home dashboard (summary cards)
/admin/users/       — CRUD for users
/admin/custodians/  — CRUD for custodians
/admin/assets/      — CRUD for assets (with search)
```

Each resource follows the pattern: `page.tsx` (list), `new/page.tsx` (create), `[id]/page.tsx` (edit), and a shared `*-form.tsx` component.

### Patterns

- All pages use `"use client"` and fetch data in `useEffect` with `useState` for loading/error/data.
- No caching library (SWR/React Query); every mount refetches.
- Forms use `useState` (not react-hook-form); no validation library.
- UI components are from **shadcn/ui** (Radix UI + Tailwind). Add new components via `npx shadcn@latest add <component>`.
- Icons from `lucide-react`.
- Path alias: `@/*` → `src/*`.
