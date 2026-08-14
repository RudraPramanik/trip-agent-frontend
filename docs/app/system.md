# Wandr FE — system (F3 as-built)

Snapshot of what exists after F3. Product SSOT: [`docs/blueprint.md`](../blueprint.md). Guardrails: [`AGENTS.md`](../../AGENTS.md). Wire: [`docs/frontendGuide.md`](../frontendGuide.md).

This is not a second bible. Update it when a phase ships.

## Stack

Next.js App Router (this repo **is** the app), React, TypeScript strict, Tailwind v4, shadcn Button, TanStack Query, Sonner, react-hook-form, Zod, `@hookform/resolvers`, **Zustand** (narrative Option A only). npm, Node `>=20`. No NextAuth / Better Auth, no map, no `react-markdown`, no Vitest/Playwright in this phase.

## Env

- `.env.example`: `NEXT_PUBLIC_API_URL` (required), optional `NEXT_PUBLIC_MAP_STYLE_URL`
- `lib/config.ts`: `getPublicApiUrl()` throws if missing; strips trailing slash
- Copy to `.env.local` (not committed). If `localhost:8000` is not the Wandr API (IPv6/Docker collision), set `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`

## HTTP

- `types/generated/api.d.ts` — OpenAPI types; regenerate with `npm run gen:types` (API must be up)
- `lib/api/client.ts` — only gateway: `credentials: "include"`, AbortSignal (default 20s), GET retry once, no mutation retry
- `lib/api/errors.ts` — `NetworkError` / `ApiError`
- `lib/api/health.ts` — `GET /api/v1/health`
- `lib/api/auth.ts` — `getMe` and `logout`
- `lib/api/destinations.ts` — search + readiness
- Domain stubs (empty): `places.ts`, `planner.ts`, `trips.ts` — generate is **not** envelope JSON; planner generate uses SSE in `lib/sse/planner.ts`

## Planner SSE (F3)

- `lib/sse/planner.ts` — `POST /api/v1/planner/generate` via raw `fetch` + `ReadableStream` parser; `credentials: "include"`; caller `AbortSignal` in `fetch` (not `EventSource`, not `getJson`/`sendJson`); pre-stream 409 JSON via `parseErrorResponse`; terminals: `itinerary_done`, `error`, `clarification_needed`; helpers: `buildClarificationRawInput`, clarification/itinerary parsers
- `lib/sse/fixtures/` — plain-text SSE frames for parser/dev (no Vitest yet)
- `features/planner/use-planner-generate.ts` — owns `AbortController`; `start`/`cancel`; abort on unmount and new submit; no auto-retry; optional readiness invalidation by key tuple
- `features/planner/compose-form.tsx` — RHF + Zod vs generated `PlanRequest`; wires generate + terminals
- `features/planner/progress-panel.tsx` — phase/tool progress (`aria-live` polite)
- `features/planner/clarification-form.tsx` — inline clarification; fresh POST with `\n`-appended `raw_input`
- `features/planner/index.ts` — public barrel
- `app/generate/page.tsx` — Server Component; `?destination=` → compose; mounts planner barrel only (no fetch)
- `store/narrative.ts` — thin Zustand Option A: day title/narrative keyed by `trip_id`; hard reload may drop prose
- `app/trips/[id]/page.tsx` — stub (“Trip detail lands in F4.”); no `GET /trips/{id}`

## Auth / session

FastAPI owns cookies (`wandr_session`, `wandr_token`). FE never stores tokens in `localStorage` / `sessionStorage` / readable JS cookies.

- `features/auth/use-auth-me.ts` — Query key `["auth","me"]`, retry 1, `meta.skipErrorToast: true`; 401/error → guest + reconnect
- `features/auth/start-login.ts` — `location.assign` to `{API}/api/v1/auth/google`
- `features/auth/use-logout.ts` — mutation, retry 0, invalidate `["auth","me"]`
- `features/auth/session-chip.tsx` / `session-header.tsx` — chrome only
- Header Search is a `Link` to `/#destination-search`
- `/generate` has no required-auth wrapper

## Destinations

Guests can search. Generate on readiness card is a **`Link`** to `/generate?destination=<id>` (still enabled for `ready` / `limited` / `sparse`). Destinations does **not** import planner SSE or POST generate.

- `features/destinations/use-destination-search.ts` — debounced search
- `features/destinations/search-field.tsx` / `search-results.tsx` / `destination-search.tsx` — home search; select writes `?destination=<id>`
- `features/destinations/use-destination-readiness.ts` — readiness query
- `features/destinations/readiness-card.tsx` — warn-and-allow + Generate link

## UI shell

- `providers/app-providers.tsx` — QueryClient + Sonner
- `app/layout.tsx` — `AppProviders` wraps `SessionHeader` then `{children}`
- `app/page.tsx` — home: destinations only; no planner HTTP
- `app/dev/ui/page.tsx` — dev proof page

## Feature folders

`features/auth`, `features/destinations`, and `features/planner` are filled. `features/trips` is still a barrel (`export {}`).

## Terminals / failure modes (F3)

| Case | Behavior |
|------|----------|
| Empty `raw_input` | Field error; no POST |
| Missing `?destination=` | Pick-a-destination copy + link home |
| 409 `destination_not_ready` | JSON panel + link to `/?destination=` |
| 429 / rate limit | Toast + brief submit disable (~2s) |
| Cancel / unmount mid-stream | `fetch` aborted; server task should cancel (manual log proof) |
| SSE `error` / timeout / recursion limit | Terminal error panel; user re-submits |
| `clarification_needed` | Inline question; fresh POST with appended `raw_input` |
| `itinerary_done` without `trip_id` | Error panel; no navigation |
| `itinerary_done` with `trip_id` | Cache narrative if present; navigate to stub `/trips/[id]` |

## Not built yet

Trip detail + GeoJSON + MapLibre + `react-markdown` (F4), claim/list (F5), day edit (F6), Vitest/Playwright (F7).
