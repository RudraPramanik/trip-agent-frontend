# Wandr FE — system (F1 as-built)

Snapshot of what exists after F1. Product SSOT: [`docs/blueprint.md`](../blueprint.md). Guardrails: [`AGENTS.md`](../../AGENTS.md). Wire: [`docs/frontendGuide.md`](../frontendGuide.md).

This is not a second bible. Update it when a phase ships.

## Stack

Next.js App Router (this repo **is** the app), React, TypeScript strict, Tailwind v4, shadcn Button, TanStack Query, Sonner. npm, Node `>=20`. No Zustand, no NextAuth / Better Auth, no map, no SSE parser, no RHF/Zod.

## Env

- `.env.example`: `NEXT_PUBLIC_API_URL` (required), optional `NEXT_PUBLIC_MAP_STYLE_URL`
- `lib/config.ts`: `getPublicApiUrl()` throws if missing; strips trailing slash
- Copy to `.env.local` (not committed). If `localhost:8000` is not the Wandr API (IPv6/Docker collision), set `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`

## HTTP

- `types/generated/api.d.ts` — OpenAPI types; regenerate with `npm run gen:types` (API must be up)
- `lib/api/client.ts` — only gateway: `credentials: "include"`, AbortSignal (default 20s), GET retry once, no mutation retry
- `lib/api/errors.ts` — `NetworkError` / `ApiError`
- `lib/api/health.ts` — `GET /api/v1/health`
- `lib/api/auth.ts` — `getMe` (`GET /api/v1/auth/me`, parse `api`, `AuthMeResponse`) and `logout` (`POST /api/v1/auth/logout`, parse `api`, body typed `unknown`)
- Domain stubs (empty): `destinations.ts`, `places.ts`, `planner.ts`, `trips.ts`

## Auth / session

FastAPI owns cookies (`wandr_session`, `wandr_token`). FE never stores tokens in `localStorage` / `sessionStorage` / readable JS cookies.

- `features/auth/use-auth-me.ts` — Query key `["auth","me"]`, retry 1, `meta.skipErrorToast: true`; 401/error → guest + reconnect
- `features/auth/start-login.ts` — `location.assign` to `{API}/api/v1/auth/google` (not the JSON gateway)
- `features/auth/use-logout.ts` — mutation, retry 0, invalidate `["auth","me"]`
- `features/auth/session-chip.tsx` / `session-header.tsx` — chrome only; header does not fetch
- OAuth success may land on the API JSON page (`frontendGuide.md` §11). Helper text says so. No `/auth/done`

## UI shell

- `providers/app-providers.tsx` — QueryClient (query retry 1, mutation retry 0) + Sonner; QueryCache skips toast when `meta.skipErrorToast`
- `app/layout.tsx` — `AppProviders` wraps `SessionHeader` then `{children}`; no route guards
- Header: brand, Search placeholder (`Link` to `/`, enabled for guests), chip, Login/Logout
- `app/page.tsx` — Wandr placeholder (real search is F2)
- `app/dev/ui/page.tsx` — Button + scratch toast + session readout / Login / Logout proof

## Feature folders

`features/auth` is filled (hooks + chrome). `destinations`, `planner`, `trips` are still barrels (`export {}`).

## Not built yet

Destination search (F2), planner SSE (F3), trip + MapLibre (F4), claim/list (F5), day edit (F6), Vitest/Playwright (F7).
