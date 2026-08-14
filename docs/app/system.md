# Wandr FE — system (F0 as-built)

Snapshot of what exists after F0. Product SSOT: [`docs/blueprint.md`](../blueprint.md). Guardrails: [`AGENTS.md`](../../AGENTS.md). Wire: [`docs/frontendGuide.md`](../frontendGuide.md).

This is not a second bible. Update it when a phase ships.

## Stack

Next.js App Router (this repo **is** the app), React, TypeScript strict, Tailwind v4, shadcn Button, TanStack Query, Sonner. npm, Node `>=20`. No Zustand, no NextAuth / Better Auth, no map, no SSE parser.

## Env

- `.env.example`: `NEXT_PUBLIC_API_URL` (required), optional `NEXT_PUBLIC_MAP_STYLE_URL`
- `lib/config.ts`: `getPublicApiUrl()` throws if missing; strips trailing slash
- Copy to `.env.local` (not committed)

## HTTP

- `types/generated/api.d.ts` — OpenAPI types; regenerate with `npm run gen:types` (API must be up)
- `lib/api/client.ts` — only gateway: `credentials: "include"`, AbortSignal (default 20s), GET retry once, no mutation retry
- `lib/api/errors.ts` — `NetworkError` / `ApiError`
- `lib/api/health.ts` — `GET /api/v1/health` (pattern for later domain modules)
- Domain stubs (empty): `lib/api/auth.ts`, `destinations.ts`, `places.ts`, `planner.ts`, `trips.ts`

## UI shell

- `providers/app-providers.tsx` — QueryClient (query retry 1, mutation retry 0) + Sonner; query/mutation errors toast
- `app/layout.tsx` — wraps children with `AppProviders`; no session chrome yet
- `app/page.tsx` — Wandr placeholder (search is F2)
- `app/dev/ui/page.tsx` — Button + scratch toast

## Feature folders

`features/auth`, `destinations`, `planner`, `trips` are barrels only (`export {}`). Fill them at the F-step that owns them.

## Not built yet

Session probe / header (F1), destination search (F2), planner SSE (F3), trip + MapLibre (F4), claim/list (F5), day edit (F6), Vitest/Playwright (F7).
