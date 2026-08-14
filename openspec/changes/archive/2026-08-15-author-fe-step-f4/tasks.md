## 1. F4 phase bible

- [x] 1.1 Replace `docs/steps/StepF4.md` outline with the phase header from `_template.md`: how to use, F3-ship prerequisites, conventions, architecture (modular layers from `design.md`), locked decisions (`GET /trips/{id}` via `lib/api/trips.ts` parse `"api"`, GeoJSON parse `"raw"`, two 403 panels by viewer context, Option A overlay only, `react-markdown` + `remark-gfm` with no `rehype-raw`, list-first map, points-only if no LineStrings, OSM tiles **dev only**, no list/claim/delete/day-edit), failure table, feature buildup, LLD patterns, recommended batches F4a/F4b. Cite `docs/app/system.md` (F3 as-built) and principle #16.
- [x] 1.2 Add the fenced prompt for **Step 4.1** (trip detail from `TripOut`). Lock: `getTrip` only (no geojson yet); Query key `["trips", id]`; page mounts barrel; days/stops grouped; empty places → empty UI; Option A overlay or omit; two 403 panels; 404 panel; install `react-markdown` + `remark-gfm` once; no MapLibre; no `rehype-raw` / `dangerouslySetInnerHTML`. Do NOT jump to 4.2. PowerShell VALIDATION.
- [x] 1.3 Add the fenced prompt for **Step 4.2** (GeoJSON + MapLibre). Lock: `getTripGeojson` parse `"raw"`; Query key `["trips", id, "geojson"]` enabled only after trip GET success; MapLibre in `features/trips/trip-map.tsx`; `getMapStyleUrl()`; points-only without LineStrings; never invent coordinates; tile/style fail → collapse map; OSM-dev-only; install `maplibre-gl` once. End with F4 ship checklist. PowerShell VALIDATION. Do NOT start F5.

## 2. CLI batches

- [x] 2.1 Write `docs/steps/batches/F4a.md` (4.1): F3-ship + API-up + known `trip_id` prerequisites, read pointers into `StepF4.md`, session rules (markdown once, no MapLibre, two 403s, no claim/list), hard stop, proofs. Do not inline prompt bodies.
- [x] 2.2 Write `docs/steps/batches/F4b.md` (4.2): F4a-green prerequisite, list-first + no invented coords + OSM-dev-only rules, hard stop, proofs, pointer at F4 ship checklist. Do not start F5.

## 3. Runner index

- [x] 3.1 Update `docs/steps/README.md` with an F4 batches table (F4a, F4b) next to the F3 table. Keep write grain vs run grain. Leave `StepF5.md`–`StepF7.md` as outlines. Note that F4 expansion happens only after F3 ship (already true).

## 4. Built-so-far pointer

- [x] 4.1 Keep `docs/app/system.md` as the F3 snapshot (compose, abortable SSE, stub trip route, `lib/api/trips.ts` stub). Do not rewrite it as if F4 code existed. `StepF4.md` header must cite it as “built so far.”

## 5. Docs-only guard

- [x] 5.1 Confirm no application files changed (`lib/api/trips.ts` and `features/trips/index.ts` still stubs; `app/trips/[id]/page.tsx` still the F3 stub; `package.json` has no `react-markdown` / `remark-gfm` / `maplibre-gl` / `rehype-raw`). This change authors playbooks only.
