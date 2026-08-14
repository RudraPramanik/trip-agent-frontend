# Wandr — F4 Cursor prompts: Trip detail + MapLibre

> Blueprint: [`docs/blueprint.md`](../blueprint.md) — Phase F4 (~2 days · trip detail + map)
> Wire contract: [`docs/frontendGuide.md`](../frontendGuide.md) §8 trips, §15 GeoJSON, §2 map stack
> Guardrails: [`AGENTS.md`](../../AGENTS.md) — principle #16 Modular by default; content rendering; guest-session-mismatch 403
> Built-so-far: [`docs/app/system.md`](../app/system.md) (F3 as-built)
> Runner: [`README.md`](README.md)
>
> One prompt per sub-step. Paste **one** fence into Agent mode, or run a batch file under [`batches/`](batches/).
> Do not start the next prompt until the current validation passes.

**Run order is numeric:** **4.1 → 4.2**. F4.2 is its own prompt and its own session so list-first degrade is not skipped.

| Batch | File | Sub-steps |
|-------|------|-----------|
| F4a | [`batches/F4a.md`](batches/F4a.md) | 4.1 |
| F4b | [`batches/F4b.md`](batches/F4b.md) | 4.2 |

---

## How to use these prompts

1. Workspace root is this repo (`guideagent-frontend`). It **is** the Next.js app.
2. Read `node_modules/next/dist/docs/` before writing App Router code (this Next line has breaking changes vs training data).
3. Run one batch **or** paste one fence — not this whole file.
4. Validation is PowerShell-first.
5. If the agent adds `rehype-raw`, invents map coordinates, collapses both 403s into one panel, puts trips fetch on the page, or starts the next sub-step: stop and correct.

## Prerequisites (F3 must be complete)

- F3 ship checklist in [`StepF3.md`](StepF3.md) is green (compose, abortable SSE, clarification fresh POST, stub `/trips/[id]`, Zustand Option A).
- `lib/api/trips.ts` and `features/trips/index.ts` are still stubs (`export {}`).
- `app/trips/[id]/page.tsx` is the F3 stub (“Trip detail lands in F4.”).
- `store/narrative.ts` already exists (Option A). Do **not** reinstall `zustand`.
- F4a needs the sibling API at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`) and a known `trip_id` (from generate navigate or a uuid).
- F4b list-first proof can use unset / broken `NEXT_PUBLIC_MAP_STYLE_URL`.

## Prompt conventions (every step)

- First line of every prompt: read `AGENTS.md` and the F4 locks below.
- **Extend, don't replace** F3 code unless the step says replace (replace the stub trip page copy; do not rip out planner SSE).
- **Packages at point of use** — 4.1 installs `react-markdown` + `remark-gfm` **once**. 4.2 installs `maplibre-gl` **once**.
- **PowerShell-first** validation (`Select-String`, `Get-ChildItem`).
- **Do NOT jump ahead** to the next sub-step inside a single prompt body.
- Never invent endpoints or DTO fields. OpenAPI / `types/generated/api.d.ts` win on wire shapes; this playbook wins on sequence, layers, and proofs.

## F4 architecture

```
lib/api/trips.ts                   HTTP only: getTrip (4.1), getTripGeojson (4.2)
                                   TRIP_PATH = "/api/v1/trips/{trip_id}" satisfies keyof paths
                                   GEOJSON_PATH = "/api/v1/trips/{trip_id}/geojson" satisfies keyof paths
                                   getTrip: getJson parse "api" → generated TripOut
                                   getTripGeojson: getJson parse "raw" → FeatureCollection
                                   AbortSignal; credentials via gateway
                                   MUST NOT add list / claim / delete / day-edit in F4

features/trips/use-trip.ts         Query key ["trips", id]
features/trips/use-trip-geojson.ts Query key ["trips", id, "geojson"] (4.2)
features/trips/trip-detail.tsx     days/stops from TripOut.places; prefs chips
features/trips/trip-forbidden.tsx  two 403 panels (viewer context)
features/trips/trip-not-found.tsx  404 panel
features/trips/day-narrative.tsx   react-markdown + remark-gfm; no rehype-raw (4.1)
features/trips/trip-map.tsx        MapLibre client (4.2)
features/trips/index.ts            public barrel only

app/trips/[id]/page.tsx            Server Component; await params (Promise in this Next line)
                                   mounts trips barrel only
                                   no getJson / useQuery / fetch / MapLibre

store/narrative.ts                 already exists (F3); overlay if cached; omit if missing

lib/config.ts                      getMapStyleUrl() already exists — 4.2 consumes it

features/auth/session-header.tsx   unchanged — still no trips HTTP
features/planner/*                 unchanged — do not GET /trips/{id} from planner
```

Principle #16: HTTP in `lib/api/trips.ts`; hooks/UI in `features/trips/`; `app/` only mounts barrels. Trips MAY import `useAuthMe` from the `features/auth` barrel for viewer context. MUST NOT import `lib/api/auth`. Planner does not own trip detail.

## Locked decisions

### Modular layers — LOCKED

- HTTP stays in `lib/api/trips.ts`. Hooks and trip UI stay in `features/trips/`. Do **not** put trip map UI in `components/map/` (blueprint folder tree is illustrative; principle #16 wins).
- `app/trips/[id]/page.tsx` only mounts public barrels. It MUST NOT call `fetch` / `getJson` / `sendJson` / `useQuery` / MapLibre init.
- Features MUST NOT import each other’s HTTP modules. Trips MAY import `useAuthMe` from `features/auth` (barrel) for 403 viewer context only.
- Wire types: `TripOut` / `TripPlaceOut` from `types/generated/api.d.ts`. GeoJSON 200 is generated as `{ [key: string]: unknown }` — a thin domain type in `types/` (not `types/generated/`) MAY narrow to FeatureCollection per `frontendGuide.md` §15. Do not invent properties. Do not hand-edit generated files.
- Do not treat the SSE itinerary blob as the durable trip model. Durable UI is `GET /trips/{id}` (+ `/geojson` in 4.2).

### Trip detail from API — LOCKED (implement in 4.1)

- Replace the F3 stub. Route stays `/trips/[id]`. Guests who own the session can view (Optional + ownership). No required-auth wrapper.
- Group `TripOut.places` by `day_number`, sort by `order_in_day`. Empty `places` → empty UI; never fake stops.
- Preferences: summary chips from `TripOut.preferences` keys that exist; do not invent a preference schema.
- Overlay Option A from `store/narrative.ts` keyed by `trip_id` when present. Hard reload / missing cache → omit prose; still show days/stops. Do not invent a narrative API. Do not read narrative fields off `TripOut` that OpenAPI does not have.
- LLM prose (cached title/narrative) renders via `react-markdown` + `remark-gfm` only. MUST NOT add `rehype-raw`. MUST NOT use `dangerouslySetInnerHTML`.
- Query key MUST be `["trips", id]`. `enabled` when id is a non-empty string. Pass AbortSignal. Retry at most 1 (idempotent GET).
- `getTrip` only in 4.1 — do **not** add `getTripGeojson` or MapLibre yet.
- Path: replace `{trip_id}` (mirror `lib/api/destinations.ts` readiness). `parse: "api"`.

### Two 403 panels — LOCKED (implement in 4.1)

Both derive from HTTP 403 + `forbidden`. Backend currently uses the same error body — distinguish by **viewer context** (`useAuthMe` `is_guest`), not by payload:

| Viewer | Copy | CTA |
|--------|------|-----|
| Guest (`is_guest`) | “This trip belongs to a different session” (or equivalent) | **No login CTA** (login would not fix it) |
| Authenticated | Ownership copy (you don’t own this trip) | Do not pretend success; do not reuse the guest-mismatch sentence |

404 / `not_found` → dedicated not-found panel (not either 403 panel).

### GeoJSON + MapLibre — LOCKED (implement in 4.2)

- `getTripGeojson` via gateway `parse: "raw"`. Query key MUST be `["trips", id, "geojson"]`. Enable only when trip GET **succeeded** (do not paint a map on 403/404 even though GeoJSON is public).
- MapLibre in a Client Component (`features/trips/trip-map.tsx`). Style URL from `getMapStyleUrl()`.
- Point features → markers. LineString features → day routes. Missing LineStrings → **points only**. Never invent `[lng, lat]`. Do **not** synthesize a FeatureCollection from `TripPlaceOut.lat` / `lng` on the client.
- Empty / unusable GeoJSON → no overlay; day list remains.
- Tile / style failure → collapse/hide the map; day list remains (list-first).
- OSM / public raster fallback is **development only**. If `NEXT_PUBLIC_MAP_STYLE_URL` is unset: allow a documented OSM-compatible fallback in development with helper text that production needs MapTiler; in production, missing style → collapse map (do not silently use OSM).

### Packages — LOCKED

| Step | Install | Do not |
|------|---------|--------|
| 4.1 | `react-markdown`, `remark-gfm` | `rehype-raw`, MapLibre, Vitest, claim/list HTTP |
| 4.2 | `maplibre-gl` (add `@types/maplibre-gl` only if the package has no shipped types) | Google Maps JS, `react-map-gl`, OSM as prod basemap, Zustand reinstall |

### Forward locks (do not implement in F4)

- `GET /trips` list / claim / delete (F5)
- Day edit / places picker (F6)
- Vitest, Playwright (F7)
- `FRONTEND_URL` OAuth bounce (backend follow-up)
- Required-auth wrapper on `/trips/[id]`
- Inventing a narrative column on `TripOut` or a backend `session_mismatch` code

## Failure-mode table — LOCKED (F4)

| Failure | Response this phase must implement | Lands in |
|---------|-------------------------------------|----------|
| 404 / `not_found` trip | Dedicated not-found panel | 4.1 |
| 403 guest session mismatch | Distinct copy; **no** login CTA | 4.1 |
| 403 ownership (authenticated) | Distinct ownership copy; not the guest-mismatch sentence | 4.1 |
| Missing narrative after reload | Omit prose; still show days/stops | 4.1 |
| Empty `places` | Empty UI; no fake stops | 4.1 |
| Network / 5xx on trip GET | Existing Query toast; detail shows retry, not infinite spinner | 4.1 |
| Missing LineStrings | Points only; never invent coordinates | 4.2 |
| Empty / bad GeoJSON | No overlay; day list remains | 4.2 |
| Tile / style failure | Collapse map; day list remains | 4.2 |
| Missing style URL (production) | Collapse map; do not use OSM | 4.2 |
| GeoJSON 404/5xx | Toast; map collapsed; list from 4.1 still shown | 4.2 |

## Feature buildup

| After | Exists | Still empty / forbidden |
|-------|--------|-------------------------|
| 4.1 | `getTrip`; `useTrip`; trip detail + two 403 panels + 404; Option A overlay; `react-markdown` + `remark-gfm` | No GeoJSON HTTP; no MapLibre; no `rehype-raw`; no claim/list |
| 4.2 | `getTripGeojson`; `useTripGeojson`; `trip-map`; list-first degrade; points-only without lines | No invented coords; no OSM in prod; no F5 claim/list |

## LLD / FE patterns this phase

| Pattern | Where |
|---------|--------|
| Domain modules | `lib/api/trips.ts` |
| Server-state cache | Query keys `["trips", id]` and `["trips", id, "geojson"]` |
| Feature folders + Modular layers | `features/trips/*`; `app/trips/[id]/page.tsx` mounts barrel |
| Null / empty UI | 404; empty places; missing narrative |
| List-first degrade | trip page when tiles/style fail |
| Thin Zustand | `store/narrative.ts` Option A overlay (already from F3) |

## Recommended run batches

| Batch | Sub-steps | Proof before next |
|-------|-----------|-------------------|
| F4a | 4.1 | Open `/trips/{id}` → days/stops; hard reload may omit narrative; guest 403 ≠ ownership 403; no MapLibre |
| F4b | 4.2 | Markers (and lines when present); break style URL → list still works; no invented coordinates |

---

## Step 4.1 — Trip detail from API

```
Read AGENTS.md, docs/app/system.md, docs/steps/StepF4.md (locks + this step), docs/frontendGuide.md §8 trips, docs/blueprint.md Failure Boundary Summary + principle #16, and node_modules/next/dist/docs/ before writing any file.

TASK: Replace the F3 stub trip page with trip detail from GET /trips/{id}. Days/stops from TripOut.places. Option A narrative overlay if cached. Two distinct 403 panels by viewer context. Install react-markdown + remark-gfm. Do not add MapLibre or GeoJSON.

This is step 4.1. Do NOT add getTripGeojson, MapLibre, claim, or trip list. No rehype-raw.

─── FEATURE BUILDUP ───
After this step:
  EXISTS: getTrip in lib/api/trips.ts; useTrip; trip-detail / trip-forbidden / trip-not-found / day-narrative; Query key ["trips", id]; app/trips/[id]/page.tsx mounts trips barrel; react-markdown + remark-gfm in package.json.
  STILL EMPTY: getTripGeojson; trip-map; maplibre-gl; no claim/list/delete; no rehype-raw.

─── FAILURE MODE ───
- 404 / not_found: dedicated not-found panel. Do not render fake days.
- 403 + guest (is_guest): “This trip belongs to a different session” (or equivalent). NO login CTA.
- 403 + authenticated: ownership copy. Do NOT reuse the guest-mismatch sentence. Do not pretend success.
- Missing Option A cache (hard reload): omit prose; still show days/stops from TripOut. Never invent narrative text.
- Empty places array: empty UI; never invent stops.
- Network / 5xx: existing Query error toast; detail area shows retry, not an infinite spinner.
- Do not wrap /trips/[id] in required-auth.

─── LLD / BEST PRACTICE ───
Pattern: Domain module + Server-state cache + Feature folders + Modular layers + Null / empty UI.
Mirror lib/api/destinations.ts: path satisfies keyof paths; replace {trip_id}; getJson with signal; parse "api".
Type as components["schemas"]["TripOut"] from types/generated/api.d.ts.
Query key MUST be ["trips", id] (tuple). enabled when id is non-empty. retry: 1. Pass AbortSignal into getTrip.
Group places by day_number; sort by order_in_day. Prefs chips from preferences keys that exist — do not invent a schema.
Narrative: read store/narrative.ts by trip_id; render LLM prose via react-markdown + remark-gfm only.
Surface 403 vs 404 via ApiError status/code so panels can branch. Use useAuthMe from features/auth barrel for is_guest — MUST NOT import lib/api/auth.
Check node_modules/next/dist/docs/ for params on app/trips/[id]/page.tsx (may be a Promise). Page passes id into the barrel; page MUST NOT call getJson or useQuery.
npm install react-markdown remark-gfm — once. Do not install rehype-raw, maplibre-gl, or Vitest.

─── WHAT TO CREATE ───

1. lib/api/trips.ts — replace the F4 stub:
   - TRIP_PATH = "/api/v1/trips/{trip_id}" satisfies keyof paths
   - getTrip(tripId: string, signal?: AbortSignal): Promise<TripOut> via getJson(..., { signal, parse: "api" })
   - Do NOT add getTripGeojson, list, claim, or delete yet.

2. features/trips/use-trip.ts ("use client"):
   - useQuery({ queryKey: ["trips", id], queryFn: ({ signal }) => getTrip(id, signal), enabled: Boolean(id), retry: 1 })
   - Surface 403 / 404 / other errors for panels.

3. features/trips/trip-not-found.tsx — 404 panel.

4. features/trips/trip-forbidden.tsx — two copy paths from useAuthMe is_guest. Guest: session-mismatch copy, no Login button. Authed: ownership copy.

5. features/trips/day-narrative.tsx — render cached title/narrative with react-markdown + remark-gfm. If no cache for trip_id, render nothing (omit). MUST NOT use rehype-raw or dangerouslySetInnerHTML.

6. features/trips/trip-detail.tsx — success UI: status/days summary, prefs chips, places grouped by day. Compose narrative overlay. No map.

7. features/trips/index.ts — barrel: export the page-facing trip view (e.g. TripPage that wires useTrip + panels). Do not export a kitchen-sink object.

8. app/trips/[id]/page.tsx — replace stub copy. Server Component. Await params, pass id, mount trips barrel only. MUST NOT import getJson, useQuery, fetch, or MapLibre. Do not add required-auth.

9. Leave session-header, planner, and store/narrative.ts APIs unchanged (trips only reads the store).

─── RULES FOR THIS STEP ───
- Do NOT jump ahead to step 4.2 (no GeoJSON, no MapLibre).
- Do NOT install rehype-raw, maplibre-gl, Vitest, or Google Maps.
- Do NOT add GET /trips list, claim, delete, or day-edit.
- Do NOT put getJson / useQuery on the page or in session-header.
- Do NOT invent TripOut narrative fields or a narrative API.

─── VALIDATION ───
  Select-String -Path lib\api\trips.ts -Pattern "trips/\{trip_id\}"
  Select-String -Path lib\api\trips.ts -Pattern 'parse: "api"'
  Select-String -Path lib\api\trips.ts -Pattern "geojson|claim"   # Expected: no matches yet
  Select-String -Path features\trips -Pattern 'trips","|"trips",' -Recurse
  Select-String -Path package.json -Pattern "react-markdown"
  Select-String -Path package.json -Pattern "remark-gfm"
  Select-String -Path package.json -Pattern "rehype-raw|maplibre"   # Expected: no matches yet
  Select-String -Path features\trips -Pattern "rehype-raw|dangerouslySetInnerHTML" -Recurse   # Expected: no matches
  Select-String -Path features\trips -Pattern "different session|is_guest" -Recurse
  Select-String -Path app\trips\[id]\page.tsx -Pattern "getJson|useQuery|fetch|MapLibre|maplibre"   # Expected: no matches
  Select-String -Path features\auth\session-header.tsx -Pattern "getTrip|trips/"   # Expected: no matches
  Test-Path features\trips\use-trip.ts
  Test-Path features\trips\day-narrative.tsx

  npm run dev
  # Browser: open /trips/{known-id} → days/stops (or empty), not the F3 stub sentence.
  # Hard reload: narrative may be missing; list still shows. No fake prose.
  # Bad uuid → not-found panel.
  # If you can force 403 as guest vs logged-in: copy differs; guest path has no Login CTA.
  # Network: GET {API}/api/v1/trips/{id} with credentials. No /geojson yet. No MapLibre.
```

---

## Step 4.2 — GeoJSON + MapLibre

```
Read AGENTS.md, docs/app/system.md, docs/steps/StepF4.md (locks + this step), docs/frontendGuide.md §15 GeoJSON + §2 map stack, docs/blueprint.md F4.2 (list-first), and node_modules/next/dist/docs/ before writing any file.

TASK: Add GET /trips/{id}/geojson and a MapLibre map. Points if no LineStrings. Tile/style failure collapses the map; day list remains. OSM is development only. Never invent coordinates.

This is step 4.2. Last F4 code step. Do NOT start F5 (no claim, no trip list). Do not add rehype-raw.

─── FEATURE BUILDUP ───
After this step:
  EXISTS: getTripGeojson; useTripGeojson; trip-map; Query key ["trips", id, "geojson"]; maplibre-gl; list-first degrade; points-only without LineStrings.
  STILL EMPTY: GET /trips list; claim; delete; day-edit; no invented coords; no OSM as production basemap.

─── FAILURE MODE ───
- Trip GET failed (403/404): do NOT enable the geojson query; no map.
- Empty / unusable FeatureCollection: no overlay; day list from 4.1 remains.
- Missing LineStrings: render Point markers only. NEVER invent [lng, lat]. Do NOT build features from TripPlaceOut.lat/lng.
- Tile / style error: collapse/hide the map; day list remains (list-first). Proving with unset or broken NEXT_PUBLIC_MAP_STYLE_URL is enough.
- Missing style URL in production: collapse map; do not silently use OSM.
- Missing style URL in development: OSM-compatible fallback OK with helper text that production needs MapTiler.
- GeoJSON network / 5xx / 404: existing toast; map collapsed; list still shown.

─── LLD / BEST PRACTICE ───
Pattern: Domain module + List-first degrade + Modular layers.
Keep getTrip. Add getTripGeojson with GEOJSON_PATH "/api/v1/trips/{trip_id}/geojson" satisfies keyof paths. getJson parse "raw".
Thin domain type in types/ (not types/generated/) MAY narrow the raw body to FeatureCollection per frontendGuide.md §15. Do not invent properties. Do not hand-edit api.d.ts.
Query key MUST be ["trips", id, "geojson"]. enabled when trip GET succeeded (e.g. trip query isSuccess and id present). Pass AbortSignal.
MapLibre Client Component in features/trips/trip-map.tsx. Style from getMapStyleUrl() in lib/config.ts.
npm install maplibre-gl — once. Add @types/maplibre-gl only if the installed package has no types. Do not install Google Maps JS or react-map-gl.
Compose map under/beside the existing day list in the trips feature — page still mounts barrels only.

─── WHAT TO CREATE ───

1. lib/api/trips.ts — keep getTrip; add:
   - GEOJSON_PATH = "/api/v1/trips/{trip_id}/geojson" satisfies keyof paths
   - getTripGeojson(tripId: string, signal?: AbortSignal) via getJson(..., { signal, parse: "raw" })

2. Optional types/trip-geojson.ts (or similar under types/) — narrow FeatureCollection Point/LineString shapes from frontendGuide.md §15. Do not invent fields.

3. features/trips/use-trip-geojson.ts ("use client"):
   - useQuery({ queryKey: ["trips", id, "geojson"], queryFn: ({ signal }) => getTripGeojson(id, signal), enabled: /* trip success */, retry: 1 })

4. features/trips/trip-map.tsx ("use client"):
   - MapLibre map; markers from Point features; lines from LineString features; on style/tile error → call a collapse callback / render null so list-first holds.
   - Style: getMapStyleUrl(); OSM-compatible fallback only in development when unset; production unset → no map.
   - MUST NOT invent coordinates. MUST NOT synthesize GeoJSON from TripOut.places.

5. Wire trip-map into the page-facing trips barrel next to the day list. On map collapse, list remains.

6. features/trips/index.ts — export map pieces as needed. app/trips/[id]/page.tsx still MUST NOT import maplibre or getJson.

7. package.json — maplibre-gl added at this step only.

─── RULES FOR THIS STEP ───
- Do NOT implement claim, trip list, delete, or day-edit.
- Do NOT use OSM as the production basemap.
- Do NOT invent lat/lng.
- Do NOT add rehype-raw.
- Do NOT jump ahead to F5.
- Do NOT put MapLibre init on the Server Component page.

─── VALIDATION ───
  Select-String -Path lib\api\trips.ts -Pattern "geojson"
  Select-String -Path lib\api\trips.ts -Pattern 'parse: "raw"'
  Select-String -Path features\trips -Pattern 'trips", "geojson"|trips","geojson"' -Recurse
  Select-String -Path package.json -Pattern "maplibre-gl"
  Select-String -Path package.json -Pattern "rehype-raw|google-maps|react-map-gl"   # Expected: no matches
  Select-String -Path lib\api\trips.ts -Pattern "claim"   # Expected: no matches
  Select-String -Path app\trips\[id]\page.tsx -Pattern "getJson|useQuery|maplibre|MapLibre"   # Expected: no matches
  Select-String -Path features\trips -Pattern "rehype-raw|dangerouslySetInnerHTML" -Recurse   # Expected: no matches
  Test-Path features\trips\trip-map.tsx
  Test-Path features\trips\use-trip-geojson.ts

  npm run dev
  # Browser: trip with geojson → markers; lines when LineStrings present.
  # Unset or break NEXT_PUBLIC_MAP_STYLE_URL → map collapses; day list still usable.
  # Network: GET {API}/api/v1/trips/{id}/geojson (raw FeatureCollection). No claim/list.
  # Confirm no client-built fake coordinates when GeoJSON has points-only or is empty.
```

---

## F4 ship checklist

Do not author full F5 prompts or start F5 code until every item is green:

```
# 4.1
Select-String -Path lib\api\trips.ts -Pattern "trips/\{trip_id\}"
Select-String -Path features\trips -Pattern 'trips","|"trips",' -Recurse
Select-String -Path package.json -Pattern "react-markdown"
Select-String -Path features\trips -Pattern "rehype-raw|dangerouslySetInnerHTML" -Recurse   # Expected: no matches
Select-String -Path app\trips\[id]\page.tsx -Pattern "getJson|useQuery"   # Expected: no matches
# Browser: /trips/{id} shows days/stops; hard reload may omit narrative; guest 403 ≠ ownership 403

# 4.2
Select-String -Path lib\api\trips.ts -Pattern "geojson"
Select-String -Path package.json -Pattern "maplibre-gl"
Test-Path features\trips\trip-map.tsx
# Browser: map markers (lines when present); break style → list still works; no invented coords

# Guard
Select-String -Path lib\api\trips.ts -Pattern "claim"
# Expected: no matches
Select-String -Path features\auth\session-header.tsx -Pattern "getTrip|getTripGeojson"
# Expected: no matches
Select-String -Path package.json -Pattern "rehype-raw"
# Expected: no matches
Test-Path AGENT.md   # Expected: False
```

All checks passing → F4 is done. Next: expand [`StepF5.md`](StepF5.md) from outline into full prompts, then run F5 batches. Do not implement F5 until that expansion exists.
