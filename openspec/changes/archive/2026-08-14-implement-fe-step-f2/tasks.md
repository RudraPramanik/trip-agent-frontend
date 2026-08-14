## 1. F2a — Destination search (2.1)

Follow [`docs/steps/batches/F2a.md`](../../../docs/steps/batches/F2a.md) and the fenced prompt **Step 2.1** in [`docs/steps/StepF2.md`](../../../docs/steps/StepF2.md). Do not add readiness HTTP, a generate CTA, or planner SSE. Do not put search fetch in `session-header`.

- [x] 1.1 Ensure `.env.local` exists (copy from `.env.example` if missing) with `NEXT_PUBLIC_API_URL=http://localhost:8000`. Prove the sibling API: `GET /api/v1/destinations/search?q=Da` is reachable (200 with a list, including empty, is fine). If it is not, **stop this section** — do not stub search rows
- [x] 1.2 Install once: `npm install react-hook-form zod @hookform/resolvers`. Do not add axios, a debounce package, NextAuth, or planner SSE deps
- [x] 1.3 Replace `lib/api/destinations.ts` stub: `SEARCH_PATH = "/api/v1/destinations/search" satisfies keyof paths`; `searchDestinations(q, signal?)` via `getJson` with `parse: "api"`, path `${SEARCH_PATH}?q=${encodeURIComponent(q)}`, typed as generated `DestinationOut[]`. Do not add `getDestinationReadiness`. Do not change `lib/api/client.ts`
- [x] 1.4 Add `features/destinations/use-destination-search.ts`: debounce `q` ~300ms (local timeout, no debounce package); `useQuery` key `["destinations","search", q]` on the debounced value; pass `AbortSignal` into `searchDestinations`; `enabled: q.trim().length >= 2`; `retry: 1`. Export data, isFetching, isError, refetch, and enough to detect 429 (`ApiError` status 429 or code `rate_limit_exceeded`). No Zustand
- [x] 1.5 Add `search-field.tsx` (RHF + small Zod schema for `q`, labeled for a11y) and `search-results.tsx` (list `display_name` / country; select writes `?destination=<id>` via `next/navigation`; empty “No destinations match”; error + retry, not an infinite spinner). On 429, briefly disable the search input (~2s); rely on existing QueryCache toast
- [x] 1.6 Add `destination-search.tsx` composing field + results (shared `q`) with `id="destination-search"`. Mount it from `app/page.tsx` (replace the F1 placeholder). Page MUST NOT import `getJson`, `searchDestinations`, or `useQuery`. Barrel-export `DestinationSearch` from `features/destinations/index.ts`
- [x] 1.7 Keep header Search a `Link` (href `/` or `/#destination-search`). Do not import destinations HTTP or add a typeahead in `session-header.tsx`
- [x] 1.8 Run Step 2.1 validation (PowerShell in the prompt). Browser: 1 character → no search request; type "Da" after ~300ms → `GET {API}/api/v1/destinations/search?q=Da` with credentials → results or empty UI; header Search does not spam search. Confirm `lib/api/destinations.ts` has no `readiness` yet. **Hard stop** — do not start 2.2 in this section

## 2. F2b — Readiness gate (2.2)

Follow [`docs/steps/batches/F2b.md`](../../../docs/steps/batches/F2b.md) and the fenced prompt **Step 2.2** in `StepF2.md`. No new packages. Do not start F3 (no `PlanRequest` form, no `POST /planner/generate`).

- [x] 2.1 Keep `searchDestinations`. Add `getDestinationReadiness(destinationId, signal?)`: readiness path `satisfies keyof paths`; substitute `{destination_id}` with `encodeURIComponent(destinationId)`; `getJson` `parse: "api"` typed as generated `DestinationReadinessOut`
- [x] 2.2 Add `features/destinations/use-destination-readiness.ts`: `useQuery` key `["destinations","readiness", id]`; pass `AbortSignal`; `enabled: Boolean(id)`; `retry: 1`. Surface 404 (`ApiError.status === 404`) vs other errors
- [x] 2.3 Add `readiness-card.tsx`: when id present and success, show `tier` / `score` / `place_count` / `enriched_pct` / `indexed_pct` / `message`. Generate `type="button"` enabled for `ready`, `limited`, and `sparse`; `limited`/`sparse` show `message`; `sparse` more prominent (e.g. amber). Never `disabled={tier === "sparse"}`. 404 → not-found panel. Missing id → render nothing. Generate MUST NOT fetch planner; helper text MAY say compose is next. No `search_available`
- [x] 2.4 `app/page.tsx` stays a Server Component. Read `destination` from `searchParams` (await if this Next line types it as a Promise — check `node_modules/next/dist/docs/`). Mount `DestinationSearch` and `ReadinessCard`; pass destination id into the card. Page MUST NOT import `getJson`, `useQuery`, or planner generate. Export `ReadinessCard` from the destinations barrel. Leave `session-header` fetch-free
- [x] 2.5 Run Step 2.2 validation. Browser: select a result (or open `?destination=<uuid>`) → card shows tier + message; Generate enabled on `sparse`; Generate click has no `POST /api/v1/planner/generate`; bad uuid → not-found, not a crash

## 3. F2 ship — stop

- [x] 3.1 Run the full F2 ship checklist at the bottom of `docs/steps/StepF2.md` and confirm every item is green
- [x] 3.2 Update `docs/app/system.md` to an F2 as-built snapshot (destinations HTTP + hooks, home search, URL `?destination=`, readiness warn-and-allow, RHF/Zod installed). Confirm this change did not implement planner SSE, Zustand, map, Vitest, `search_available`, or expand `StepF3.md`
