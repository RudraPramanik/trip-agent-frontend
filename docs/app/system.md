# Wandr FE — system (F2 as-built)

Snapshot of what exists after F2. Product SSOT: [`docs/blueprint.md`](../blueprint.md). Guardrails: [`AGENTS.md`](../../AGENTS.md). Wire: [`docs/frontendGuide.md`](../frontendGuide.md).

This is not a second bible. Update it when a phase ships.

## Stack

Next.js App Router (this repo **is** the app), React, TypeScript strict, Tailwind v4, shadcn Button, TanStack Query, Sonner, react-hook-form, Zod, `@hookform/resolvers`. npm, Node `>=20`. No Zustand, no NextAuth / Better Auth, no map, no SSE parser.

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
- `lib/api/destinations.ts` — `searchDestinations` (`GET /api/v1/destinations/search?q=`, parse `api`, `DestinationOut[]`) and `getDestinationReadiness` (`GET /api/v1/destinations/{destination_id}/readiness`, parse `api`, `DestinationReadinessOut`). Query/path params are encoded in this module; the gateway is unchanged
- Domain stubs (empty): `places.ts`, `planner.ts`, `trips.ts`

## Auth / session

FastAPI owns cookies (`wandr_session`, `wandr_token`). FE never stores tokens in `localStorage` / `sessionStorage` / readable JS cookies.

- `features/auth/use-auth-me.ts` — Query key `["auth","me"]`, retry 1, `meta.skipErrorToast: true`; 401/error → guest + reconnect
- `features/auth/start-login.ts` — `location.assign` to `{API}/api/v1/auth/google` (not the JSON gateway)
- `features/auth/use-logout.ts` — mutation, retry 0, invalidate `["auth","me"]`
- `features/auth/session-chip.tsx` / `session-header.tsx` — chrome only; header does not fetch
- Header Search is a `Link` to `/#destination-search` (no typeahead, no destinations HTTP)
- OAuth success may land on the API JSON page (`frontendGuide.md` §11). Helper text says so. No `/auth/done`

## Destinations

Guests can search. No login wall. No `search_available` field.

- `features/destinations/use-destination-search.ts` — Query key `["destinations","search", q]` on a ~300ms debounced `q`; `enabled` when `q.trim().length >= 2`; retry 1; 429 / `rate_limit_exceeded` briefly disables the input (~2s) and uses the existing QueryCache toast
- `features/destinations/search-field.tsx` / `search-results.tsx` / `destination-search.tsx` — RHF + Zod on home (`id="destination-search"`). Empty list → “No destinations match”. Select writes `?destination=<id>`
- `features/destinations/use-destination-readiness.ts` — Query key `["destinations","readiness", id]`; `enabled` when id is non-empty; retry 1; 404 vs other errors
- `features/destinations/readiness-card.tsx` — warn-and-allow: Generate enabled for `ready` / `limited` / `sparse`; `sparse` warning more prominent; 404 → not-found panel. Generate does **not** `POST /planner/generate`

## UI shell

- `providers/app-providers.tsx` — QueryClient (query retry 1, mutation retry 0) + Sonner; QueryCache skips toast when `meta.skipErrorToast`
- `app/layout.tsx` — `AppProviders` wraps `SessionHeader` then `{children}`; no route guards
- `app/page.tsx` — Server Component mounts `DestinationSearch` + `ReadinessCard` (awaits `searchParams` for `destination`). No `getJson` / `useQuery`
- `app/dev/ui/page.tsx` — Button + scratch toast + session readout / Login / Logout proof

## Feature folders

`features/auth` and `features/destinations` are filled. `planner` and `trips` are still barrels (`export {}`).

## Not built yet

Planner SSE (F3), trip + MapLibre (F4), claim/list (F5), day edit (F6), Vitest/Playwright (F7).
