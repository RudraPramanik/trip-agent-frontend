## Why

F4 ships trip detail from `GET /trips/{id}`, dual 403 panels, Option A markdown narrative, and list-first MapLibre. Guests who finish generate can open a trip, but there is still no authenticated `/trips` list, no claim CTA, and no delete — so logged-in users cannot browse owned trips or attach a guest trip after Google login. Implement F5 now so list/claim/delete land with modular layers, distinct claim-failure copy, and no invented day-edit.

F5a (5.1 list) and F5b (5.2 claim → 5.3 delete) land in **one** OpenSpec change — the same grain as `implement-fe-step-f1`–`f4`. Apply stays hard-stopped batches: prove 401→login CTA and empty list before claim/delete. Do not merge 5.1–5.3 into a single prompt body.

## What Changes

- Add `GET /api/v1/trips` (`parse: "paginated"` → bare `PaginatedResponse` of generated `TripOut`) and a new `/trips` list page. Authenticated users see `items[]`; empty → empty UI; 401 / guest → login CTA. Never invent anonymous or fake lists.
- Add `POST /api/v1/trips/{trip_id}/claim` (`parse: "api"` → `TripOut`) with a primary Claim CTA on trip detail. Invalidate `["trips","list"]` and `["trips", id]` (+ geojson). Distinct failure copy for unauthenticated vs session-mismatch vs already-claimed — not one generic toast. Claim is best-effort until API `FRONTEND_URL` OAuth bounce works.
- Add `DELETE /api/v1/trips/{trip_id}` (`parse: "empty"`, HTTP 204) with confirm. No anonymous delete. On 204 drop list + detail (+ geojson) cache and navigate away from detail. Handle 403/404 without pretending success.
- Modular layers: extend `lib/api/trips.ts` (keep `getTrip` / `getTripGeojson`); hooks/UI in `features/trips/`; `app/trips/page.tsx` and `app/trips/[id]/page.tsx` mount barrels only. Trips MAY use `useAuthMe` from the auth barrel; MUST NOT import `lib/api/auth`. Install **no new packages**.
- Stop at the F5 ship checklist. Do **not** implement day-edit, places picker, Vitest, or Playwright.

## Capabilities

### New Capabilities

None. List / claim / delete extend the existing `trips` capability.

### Modified Capabilities

- `trips`: Add authenticated trip list at `/trips` from bare paginated `GET /trips`, claim via `POST /trips/{id}/claim` with distinct failure copy and query invalidation, and delete via `DELETE /trips/{id}` (204 empty) with confirm and cache drop. Keep F4 detail + GeoJSON/MapLibre requirements. Detail stays Optional + ownership (no required-auth wrapper). No day-edit in this change.

## Impact

- **Touched:** `lib/api/trips.ts` (add `listTrips` / `claimTrip` / `deleteTrip`), `features/trips/*` (list/claim/delete hooks + UI), `features/trips/index.ts`, new `app/trips/page.tsx`, `app/trips/[id]/page.tsx` (mount claim/delete via barrel only), `docs/app/system.md` (F5 as-built snapshot at ship).
- **Not touched:** `lib/api/client.ts` / `lib/config.ts` (gateway already has `parse: "paginated"` and `parse: "empty"`), `lib/sse/planner.ts`, `features/planner/*`, `features/auth/session-header.tsx` (still no trips HTTP), `lib/api/auth.ts`, FastAPI, `AGENTS.md` / `docs/blueprint.md` / `docs/frontendGuide.md` / `docs/steps/StepF5.md` (already authored), `package.json` (no new packages), Vitest/Playwright, day-edit.
- **APIs / deps:** **No new FE packages. No new FE API keys.** Wire: `GET /api/v1/trips` (Required; bare paginated `TripOut`), `POST /api/v1/trips/{trip_id}/claim` (Required; `ApiResponse[TripOut]`), `DELETE /api/v1/trips/{trip_id}` (Required + ownership; HTTP 204). Auth: list/claim/delete need cookies from the sibling API (`wandr_token` + matching `wandr_session`). Trips MAY import `useAuthMe` from the `features/auth` barrel; MUST NOT import `lib/api/auth`.
- **Env:** `NEXT_PUBLIC_API_URL` **required** (already in `.env.example`, default `http://localhost:8000`). `NEXT_PUBLIC_MAP_STYLE_URL` **not needed for F5**. No MapTiler / Google Maps JS / LLM / OAuth client secrets in FE env. Google login remains a redirect to `{NEXT_PUBLIC_API_URL}/api/v1/auth/google` (backend owns OAuth).
- **Prerequisites (already met):** F4 ship is green. `StepF5.md` + `batches/F5a.md` / `F5b.md` exist. Generated types include list/claim/delete paths. Gateway supports `paginated` and `empty` parse modes. `lib/api/trips.ts` has `getTrip` + `getTripGeojson` only.
- **Runtime dependency:** Sibling API up. F5a list proofs need an authenticated cookie path (local Option A). F5b claim may be best-effort on local cookies until API `FRONTEND_URL` bounce — do not block the phase on production OAuth bounce.
- **Follow-up:** expand `docs/steps/StepF6.md` from outline after this ship checklist is green (separate change). Do not implement day-edit here.
