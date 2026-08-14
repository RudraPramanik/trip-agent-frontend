## Context

See `proposal.md` for why. `docs/blueprint.md` (F4) remains the product SSOT. Wire contract is `docs/frontendGuide.md` §8 trips, §15 GeoJSON, §2 map stack. Content rendering and guest-mismatch 403 are already `AGENTS.md` hard rules. `docs/steps/StepF4.md` is an outline; `_template.md` and `StepF3.md` are the prompt-file pattern to copy.

F3 code is on disk: compose, abortable SSE, clarification as a fresh POST, Zustand `store/narrative.ts` Option A, stub `app/trips/[id]/page.tsx` (“Trip detail lands in F4.”). Stubs still `export {}`: `lib/api/trips.ts`, `features/trips/index.ts`. Gateway already supports `parse: "api" | "raw"`. Generated `TripOut` / `TripPlaceOut` and `GET /api/v1/trips/{trip_id}` (`ApiResponse`) plus `GET /api/v1/trips/{trip_id}/geojson` (untyped object) exist in `types/generated/api.d.ts`. `getMapStyleUrl()` already reads optional `NEXT_PUBLIC_MAP_STYLE_URL`.

This change writes playbooks only. It does not implement trip HTTP, markdown, or MapLibre.

## Goals / Non-Goals

**Goals:**
- Same two grains as F0–F3: one fenced prompt per sub-step in `StepF4.md`; thin `F4a` / `F4b` batch files that point into it.
- Lock a modular trips architecture so a later implement change cannot put `getJson` / `useQuery` in `app/trips/[id]/page.tsx`, use `rehype-raw` / `dangerouslySetInnerHTML`, invent GeoJSON coordinates, or fold guest-session-mismatch 403 into generic ownership copy.
- Name every F4 failure boundary the implementer must prove (404, two 403s, missing narrative after reload, tile/style failure, missing LineStrings, empty places).
- Keep 4.2 (MapLibre) as its **own** session so list-first degrade is not skipped in a detail+map rush.
- Point `docs/app/system.md` at F3-as-built so F4 prompts can cite the stub trip page + empty trips HTTP.

**Non-Goals:**
- Implementing F4 application code, MapLibre, or replacing the stub trip page in **this** (docs) change.
- Editing `docs/frontendGuide.md`, `docs/blueprint.md`, `AGENTS.md`, or the backend repo.
- Expanding `StepF5.md`–`StepF7.md` beyond their outlines.
- Installing `react-markdown` / `remark-gfm` / `maplibre-gl` in this authoring pass. Later implement installs markdown at 4.1 and MapLibre at 4.2.
- Inventing trip list, claim, delete, day-edit, a narrative API, or a dedicated backend `session_mismatch` error code.

## Decisions

### 1. Two-layer files (same as F0–F3)

`StepF4.md` is the SSOT for locks, architecture, failure table, feature buildup, and one fenced prompt per sub-step. `docs/steps/batches/F4a.md` and `F4b.md` are session gates: prerequisites, read pointers, order, hard stop, proofs. They do not duplicate prompt bodies.

**Alternative considered:** Self-contained batch files that inline prompts. Rejected — two copies drift (F0 decision 1).

### 2. Batch split: F4a → F4b

| Batch | Sub-steps | Why |
|-------|-----------|-----|
| F4a | 4.1 | `GET /trips/{id}` → day list from `TripOut`; Option A overlay; two 403 panels; `react-markdown` + `remark-gfm`. No map. |
| F4b | 4.2 | `GET /trips/{id}/geojson` + MapLibre. List-first if tiles/style fail. Points-only if no LineStrings. |

Blueprint numbers stay 4.1–4.2. Run order is numeric. 4.2 stays its own prompt **and** batch so OSM-in-prod, invented coordinates, and “blank the trip when the map dies” cannot hide inside trip-detail work.

**Alternative considered:** One session for 4.1–4.2. Rejected — mixing markdown/403 with MapLibre is how list-first degrade and the OSM-dev-only rule get skipped.

**Alternative considered:** Map first, then detail. Rejected — list is the durable UI; map degrades off the list.

### 3. Modular layers — LOCKED in the playbook

Prompts must name these files and forbid crossing them:

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
```

Rules the prompts must repeat:

- HTTP stays in `lib/api/trips.ts`. Hooks and trip UI stay in `features/trips/`.
- `app/trips/[id]/page.tsx` only mounts public barrels. It does not own Query keys, DTO parsing, or MapLibre init.
- Features MUST NOT import each other’s HTTP modules. `features/trips` MAY import `useAuthMe` from the `features/auth` barrel for viewer context only. MUST NOT import `lib/api/auth`.
- Planner stays out of the trip page. Do not treat the SSE itinerary blob as the trip model. Do not `GET /trips/{id}` from `features/planner`.
- Header stays fetch-free. Do not put trip HTTP in `session-header.tsx`.
- Wire types: `TripOut` / `TripPlaceOut` from `types/generated/api.d.ts`. GeoJSON 200 is generated as `{ [key: string]: unknown }` — a thin domain type in `types/` (not `types/generated/`) MAY narrow to FeatureCollection per `frontendGuide.md` §15. Do not invent properties. Do not hand-edit generated files.

**Alternative considered:** Put map UI in `components/map/`. Rejected — principle #16; F2/F3 already forbade dumping feature UI into `components/`.

**Alternative considered:** Parse GeoJSON as `parse: "api"`. Rejected — envelope exception; `frontendGuide.md` §6.

### 4. Trip detail from API — LOCKED (4.1)

- Replace the F3 stub copy. Route stays `/trips/[id]`. Guests who own the session can view (Optional + ownership). No required-auth wrapper.
- Group `TripOut.places` by `day_number`, sort by `order_in_day`. Empty `places` → empty UI, never fake stops.
- Preferences: summary chips from `TripOut.preferences` keys that exist; do not invent a preference schema.
- Overlay Option A from `store/narrative.ts` keyed by `trip_id` when present. Hard reload / missing cache → omit prose; still show days/stops. Do not invent a narrative API. Do not read narrative fields off `TripOut` that OpenAPI does not have.
- LLM prose (cached title/narrative) renders via `react-markdown` + `remark-gfm` only. MUST NOT add `rehype-raw`. MUST NOT use `dangerouslySetInnerHTML`.
- Query key MUST be `["trips", id]`. `enabled` when id is a non-empty string. Pass AbortSignal. Retry at most 1 (idempotent GET).
- 404 / `not_found` → dedicated not-found panel.
- 403 / `forbidden` → two panels, distinguished by **viewer context** (`useAuthMe` `is_guest`), not by error body (backend currently same `forbidden` shape — documented backend follow-up, not blocking):
  - Guest: “This trip belongs to a different session” (or equivalent). **No login CTA** (login would not fix it). No retry-as-if-network.
  - Authenticated: ownership copy (you don’t own this trip). Do not pretend success. Do not reuse the guest-mismatch sentence.
- Network / 5xx: existing Query error toast; detail area shows retry, not an infinite spinner.
- Install **`react-markdown` and `remark-gfm` once at 4.1**. Do not install MapLibre, Vitest, or `rehype-raw`.

**Alternative considered:** One generic 403 panel. Rejected — `AGENTS.md` and Failure Boundary Summary require distinct copy.

**Alternative considered:** Wait for a backend `session_mismatch` code. Rejected — blueprint stopgap is client context; do not block F4.

**Alternative considered:** Skip markdown packages until narrative exists on `TripOut`. Rejected — Option A cache is LLM text now; the content-rendering rule applies in 4.1.

### 5. GeoJSON + MapLibre — LOCKED (4.2)

- `getTripGeojson` via gateway `parse: "raw"`. Query key MUST be `["trips", id, "geojson"]`. Enable only when trip GET **succeeded** (do not paint a map on 403/404 even though GeoJSON is public).
- MapLibre in a Client Component (`features/trips/trip-map.tsx`). Style URL from `getMapStyleUrl()`.
- Point features → markers. LineString features → day routes. Missing LineStrings → **points only**. Never invent `[lng, lat]`. Do **not** synthesize a FeatureCollection from `TripPlaceOut.lat` / `lng` on the client.
- Empty / unusable GeoJSON → no overlay; day list remains.
- Tile / style failure → collapse/hide the map; day list remains (list-first). Proof: break or unset the style URL and confirm the list still works.
- OSM / public raster fallback is **development only**. If `NEXT_PUBLIC_MAP_STYLE_URL` is unset: allow a documented OSM-compatible fallback in development with helper text that production needs MapTiler; in production, missing style → collapse map (do not silently use OSM).
- Install **`maplibre-gl` once at 4.2**. Use shipped types if present; add `@types/maplibre-gl` only if the installed package has none. Do not install Google Maps JS, `react-map-gl`, or a second map SDK.
- GeoJSON 404/5xx: existing toast; map collapsed; list still shown from 4.1.

**Alternative considered:** Build markers from `TripOut.places` lat/lng and skip GeoJSON. Rejected — overlay contract is §15; list uses `TripOut`, map uses GeoJSON.

**Alternative considered:** OSM as default in all envs. Rejected — `frontendGuide.md` §2: OSM is development only.

### 6. Packages — LOCKED

| Step | Install | Do not |
|------|---------|--------|
| 4.1 | `react-markdown`, `remark-gfm` | `rehype-raw`, MapLibre, Vitest, claim/list HTTP |
| 4.2 | `maplibre-gl` (types if needed) | Google Maps JS, OSM as prod basemap, Zustand reinstall |

Zustand is already present from F3. Do not reinstall.

### 7. Prompt mechanics (copy F3)

Each fence: read `AGENTS.md` + F4 locks first; TASK; FEATURE BUILDUP (EXISTS / STILL EMPTY); FAILURE MODE; LLD pattern; WHAT TO CREATE (concrete paths); RULES (Do NOT jump ahead); PowerShell VALIDATION.

F4a prerequisites: F3 ship checklist green; API up; a known `trip_id` (navigate from generate or a uuid). Stubs: `lib/api/trips.ts`, `features/trips/index.ts`.

F4b prerequisites: F4a green (trip list renders; 403/404 panels exist). MapTiler URL optional; unset is a valid list-first proof.

F4 ship checklist at the bottom of `StepF4.md` before F5 expansion: trip detail from `TripOut`; narrative omitted after reload without fake text; no `rehype-raw` / `dangerouslySetInnerHTML`; guest 403 ≠ ownership 403; map collapses on tile fail; points-only without LineStrings; no invented coordinates; no `GET /trips` list / claim / delete / day-edit; page has no `getJson` / `useQuery`; header has no trips HTTP.

Update `docs/steps/README.md` with an F4 batches table. Leave F5–F7 outlines.

`docs/app/system.md` already says F3 as-built. Authoring pass cites it; do not rewrite the snapshot as if F4 code existed.

### 8. Auth and guest path

`GET /trips/{id}` is Optional + ownership. Do not wrap `/trips/[id]` in required-auth. GeoJSON is public; still do not show the map when trip GET failed. Do not implement OAuth bounce (`FRONTEND_URL`). Do not implement claim (F5).

## Risks / Trade-offs

- [Agent implements F4 code while writing the playbook] → Mitigation: every task and batch file restates docs-only; `lib/api/trips.ts` must still be a stub when this change archives.
- [Agent pastes the whole `StepF4.md`] → Mitigation: header + README: one fence or one batch file.
- [One generic 403 panel] → Mitigation: locked two-panel copy; VALIDATION greps distinct session-mismatch wording vs ownership wording.
- [`rehype-raw` or `dangerouslySetInnerHTML`] → Mitigation: locked; VALIDATION greps both (expected: no matches in trips/narrative).
- [Map failure blanks the trip] → Mitigation: list-first named in 4.2 VALIDATION; ship checklist cannot go green if the list unmounts with the map.
- [Client invents coordinates] → Mitigation: locked GeoJSON-only overlay; greps must not show fallback lat/lng synthesis from place names.
- [OSM in production] → Mitigation: locked; production missing style collapses the map.
- [Markdown / MapLibre installed in the authoring pass] → Mitigation: this change is docs-only; `package.json` must not change here.
- [F5 claim sneaks in] → Mitigation: forward lock; VALIDATION: no `trips/{id}/claim` or `GET /api/v1/trips` list client in F4.
- [Local API down during later implement] → Mitigation: F4a prerequisites list API up + a `trip_id`; authoring this playbook does not need the API.

## Migration Plan

Docs-only. No deploy. Rollback = restore the F4 outline, delete `F4a.md` / `F4b.md`, revert the README F4 table.

## Open Questions

None. Batch split, two 403s via viewer context, GeoJSON `parse: "raw"`, markdown at 4.1, MapLibre at 4.2, OSM-dev-only, and docs-only authoring are locked above.
