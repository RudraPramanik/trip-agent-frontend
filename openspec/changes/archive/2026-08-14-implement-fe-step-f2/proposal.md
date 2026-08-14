## Why

F1 shipped the cookie-aware shell (session probe, login/logout, guest-unblocked `SessionHeader`), and `docs/steps/StepF2.md` is a full playbook, but `lib/api/destinations.ts` and `features/destinations/` are still stubs and home still says “Destination search lands in F2.” Guests cannot search destinations or see readiness. Implement F2 now so F3 compose can read `?destination=` without inventing search HTTP, sparse hard-blocks, or a `search_available` field.

F2a (2.1 search) and F2b (2.2 readiness) land in **one** OpenSpec change — the same grain as `implement-fe-step-f1`. They share one HTTP module, one feature folder, and one home page. Apply stays two hard-stopped batches: prove search before adding readiness. Do not merge 2.1 and 2.2 into a single prompt body.

## What Changes

- Fill `lib/api/destinations.ts` as an HTTP-only domain module: `GET /api/v1/destinations/search?q=` (`searchDestinations` in 2.1) then `GET /api/v1/destinations/{id}/readiness` (`getDestinationReadiness` in 2.2), both through the F0 gateway with `AbortSignal`. Mirror `lib/api/auth.ts`. Types from `types/generated/api.d.ts` (`DestinationOut`, `DestinationReadinessOut`, path keys).
- Add `features/destinations/use-destination-search.ts` (Query key `["destinations","search", q]`, debounce ~300ms, `enabled` only when `q.trim().length >= 2`, retry 1). Search field + results on `/`; select writes `?destination=<uuid>`. Empty list → empty UI. 429 / `rate_limit_exceeded` → existing QueryCache toast + brief search-control disable (~2s).
- Install `react-hook-form`, `zod`, and `@hookform/resolvers` **once** at 2.1 (F3 compose reuses them). No debounce package, axios, NextAuth, Zustand, or planner SSE deps.
- Add `features/destinations/use-destination-readiness.ts` (Query key `["destinations","readiness", id]`) and `readiness-card.tsx`: warn-and-allow at `ready` / `limited` / `sparse`; Generate CTA enabled at every tier and MUST NOT `POST /planner/generate`. 404 → not-found panel. Home mounts both barrels; page MUST NOT call `getJson` / `useQuery`.
- Keep header Search as a `Link` to `/` or `/#destination-search`. Header MUST NOT import destinations HTTP or render typeahead.
- Stop at the F2 ship checklist. Do **not** implement compose / SSE, map, claim, Vitest/Playwright, Zustand, or invent `search_available`.

## Capabilities

### New Capabilities

- `destinations`: Guest-reachable home typeahead against `GET /destinations/search` (`q` min 2, debounce, empty UI, 429 brief disable) and a warn-and-allow readiness card from `GET /destinations/{id}/readiness` after `?destination=` selection. Generate stays a non-fetching CTA. Modular layers: HTTP in `lib/api/destinations.ts`, hooks/UI in `features/destinations/`, `app/page.tsx` mounts barrels only.

### Modified Capabilities

- `session-shell`: Header Search remains a navigation `Link` to home (optionally `#destination-search`) and MUST NOT own destinations fetch or typeahead. Real search lives on `/` (new `destinations` capability). Guest reachability is unchanged.

## Impact

- **Touched:** `lib/api/destinations.ts`, `features/destinations/*`, `app/page.tsx`, `package.json` / lockfile (RHF + Zod + resolvers), optionally `features/auth/session-header.tsx` (hash on the Search Link only), `docs/app/system.md` (F2 as-built snapshot at ship).
- **Not touched:** `lib/api/client.ts` (append `?q=` / substitute `{destination_id}` in the domain module; do not add a query-params API to the gateway), planner SSE, trips, map, Zustand, Vitest/Playwright, FastAPI, `AGENTS.md` hard rules (already cover modular layers and 429).
- **APIs / deps:** `react-hook-form`, `zod`, `@hookform/resolvers` at 2.1 only. Wire: `GET /api/v1/destinations/search?q=`, `GET /api/v1/destinations/{destination_id}/readiness`. Auth: none (guest-reachable).
- **Prerequisites (already met):** F1 ship is green (cookie probe, login/logout, `SessionHeader`, Search as `Link` to `/`). `StepF2.md` + `batches/F2a.md` / `F2b.md` exist. Generated types already include `DestinationOut`, `DestinationReadinessOut`, and both paths. Destinations modules are still stubs.
- **Runtime dependency:** F2a browser proofs need the sibling API at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`) with `GET /api/v1/destinations/search?q=Da` reachable, plus `.env.local`. F2b proofs need a selectable search hit (or a known uuid in `?destination=`). Proving 429 under load is optional/manual, not CI.
- **Follow-up:** expand `docs/steps/StepF3.md` from outline after this ship checklist is green (separate change). Do not implement `POST /planner/generate` here.
