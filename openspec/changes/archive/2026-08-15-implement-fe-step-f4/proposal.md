## Why

F3 ships compose, abortable SSE generate, clarification as a fresh POST, Option A narrative cache, and a stub `/trips/[id]` page. Guests who finish generate land on “Trip detail lands in F4.” with no days/stops, no durable `GET /trips/{id}`, and no map. Implement F4 now so the trip route becomes real: API-backed detail, two distinct 403 panels by viewer context, safe markdown narrative overlay, then list-first MapLibre — without inventing coordinates, collapsing guest-mismatch into ownership copy, or dumping fetch on the page.

F4a (4.1 trip detail) and F4b (4.2 GeoJSON + MapLibre) land in **one** OpenSpec change — the same grain as `implement-fe-step-f1`–`f3`. Apply stays two hard-stopped batches: prove days/stops + dual 403s before MapLibre. Do not merge 4.1–4.2 into a single prompt body.

## What Changes

- Replace the F3 stub on `/trips/[id]` with trip detail from `GET /api/v1/trips/{trip_id}` (`parse: "api"` → generated `TripOut`). Guests who own the session can view (Optional + ownership). No required-auth wrapper.
- Group `TripOut.places` by `day_number`, sort by `order_in_day`. Preferences chips from keys that exist. Empty places → empty UI; never fake stops.
- Overlay Option A narrative from `store/narrative.ts` when present; hard reload / missing cache → omit prose, still show days/stops. Render LLM prose via `react-markdown` + `remark-gfm` only — no `rehype-raw`, no `dangerouslySetInnerHTML`.
- Two distinct 403 panels by **viewer context** (`useAuthMe` `is_guest`): guest session-mismatch copy with **no** login CTA; authenticated ownership copy. Dedicated 404 panel for `not_found`.
- Add `GET /trips/{id}/geojson` (`parse: "raw"`) and MapLibre in `features/trips/trip-map.tsx`. Points if no LineStrings; tile/style failure collapses the map; day list remains. OSM fallback is **development only**; production missing style → collapse map.
- Modular layers: HTTP in `lib/api/trips.ts`; hooks/UI in `features/trips/`; `app/trips/[id]/page.tsx` mounts barrels only. Packages at point of use: `react-markdown` + `remark-gfm` at 4.1; `maplibre-gl` at 4.2.
- Stop at the F4 ship checklist. Do **not** implement trip list, claim, delete, day-edit, Vitest, or Playwright.

## Capabilities

### New Capabilities

- `trips`: Trip detail from `GET /trips/{id}` with days/stops, prefs chips, Option A narrative overlay (safe markdown), dual 403 panels by viewer context, 404 panel, then GeoJSON + MapLibre with list-first degrade and points-only without LineStrings. Modular layers: HTTP in `lib/api/trips.ts`, hooks/UI in `features/trips/`, page mounts barrels only.

### Modified Capabilities

- `planner`: Drop the F3 stub-only `/trips/[id]` requirement. After F4 the route is real trip detail owned by the `trips` capability. Planner MUST still NOT `GET /trips/{id}` or treat the SSE blob as the durable trip; navigate-on-`itinerary_done` and Option A cache write remain as shipped.

## Impact

- **Touched:** `lib/api/trips.ts`, `features/trips/*`, `app/trips/[id]/page.tsx`, optional thin `types/trip-geojson.ts` (or similar), `package.json` / lockfile (`react-markdown` + `remark-gfm` at 4.1; `maplibre-gl` at 4.2), `docs/app/system.md` (F4 as-built snapshot at ship).
- **Not touched:** `lib/api/client.ts` / `lib/config.ts` (already have `parse: "raw"` and `getMapStyleUrl()`), `lib/sse/planner.ts`, `features/planner/*`, `features/auth/session-header.tsx` (still no trips HTTP), `lib/api/auth.ts`, FastAPI, `AGENTS.md` / `docs/blueprint.md` / `docs/frontendGuide.md` / `docs/steps/StepF4.md` (already authored), Vitest/Playwright, claim/list/delete, day-edit.
- **APIs / deps:** `react-markdown`, `remark-gfm` (4.1); `maplibre-gl` (4.2; `@types/maplibre-gl` only if needed). Wire: `GET /api/v1/trips/{trip_id}` (ApiResponse + `TripOut`, Optional + ownership) and `GET /api/v1/trips/{trip_id}/geojson` (raw FeatureCollection). Auth: none required on the trip page. Trips MAY import `useAuthMe` from the `features/auth` barrel for 403 viewer context; MUST NOT import `lib/api/auth`.
- **Prerequisites (already met):** F3 ship is green. `StepF4.md` + `batches/F4a.md` / `F4b.md` exist. Generated types include `TripOut` / trip GET paths. `lib/api/trips.ts` and `features/trips/index.ts` are stubs. `store/narrative.ts` exists. `getMapStyleUrl()` exists.
- **Runtime dependency:** F4a browser proofs need the sibling API and a known `trip_id`. F4b list-first proof can use unset / broken `NEXT_PUBLIC_MAP_STYLE_URL`. A MapTiler (or other) style URL is **optional for F4** — recommended for a real basemap; not required to ship list-first degrade.
- **Follow-up:** expand `docs/steps/StepF5.md` from outline after this ship checklist is green (separate change). Do not implement claim or trip list here.
