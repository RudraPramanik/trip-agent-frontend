## Context

See `proposal.md` for why. Product SSOT is `docs/blueprint.md` F4; wire is `docs/frontendGuide.md` §8 trips, §15 GeoJSON, §2 map stack; execution grain is `docs/steps/StepF4.md` (write) and `docs/steps/batches/F4a.md`–`F4b.md` (run). Specs: `specs/trips/spec.md`, delta `specs/planner/spec.md`. Built-so-far: `docs/app/system.md` (F3).

F3 left `lib/api/trips.ts` and `features/trips/index.ts` as `export {}`, and `app/trips/[id]/page.tsx` as a stub. `store/narrative.ts` Option A already exists — do not reinstall `zustand`. Gateway already supports `parse: "api"` and `parse: "raw"`. `getMapStyleUrl()` already exists in `lib/config.ts`. Generated types already include `TripOut` / trip GET paths. Backend returns the same 403 body for guest-session-mismatch and ownership — distinguish by viewer context (`is_guest`), not payload.

Playbook sequence wins: 4.1 installs markdown packages only; 4.2 installs MapLibre only. No claim/list/delete, Vitest, or Playwright in F4.

## Goals / Non-Goals

**Goals:**
- Land F4 in playbook order: 4.1 then 4.2, two hard-stopped batches (F4a then F4b) inside one change.
- Keep trip HTTP, hooks/UI, and page mount in separate modules so `/trips/[id]` never owns fetch or MapLibre init.
- Prove list-first degrade: broken/missing style URL still leaves days/stops usable.
- Keep guest-mismatch 403 copy distinct from ownership 403 (no login CTA on the guest path).

**Non-Goals:**
- `GET /trips` list, claim, delete (F5).
- Day edit / places picker (F6).
- Vitest / Playwright (F7).
- Inventing a narrative column on `TripOut` or a backend `session_mismatch` code.
- Required-auth wrapper on `/trips/[id]`.
- OSM as production basemap; Google Maps / `react-map-gl`.
- Rewriting planner SSE or `session-header`.

## Decisions

### 1. One change, two hard-stopped batches

Execute `docs/steps/batches/F4a.md` (4.1) then `F4b.md` (4.2). Prompt bodies stay in `StepF4.md`. Do not merge 4.1–4.2 into one prompt body. Stop F4a until `/trips/{id}` shows days/stops (or empty), dual 403s work, narrative is markdown-safe, and there is still no GeoJSON/MapLibre. Stop F4b at the F4 ship checklist.

**Alternative considered:** Two OpenSpec changes (`implement-fe-step-f4a` / `f4b`). Rejected — they share one trips HTTP module, one feature folder, and one page; F1–F3 used one implement change per phase. Batch files remain the apply-session grain.

**Alternative considered:** One apply session that writes detail + map together. Rejected — playbook forbids jumping ahead; list-first prove is easy to skip inside a map rush.

### 2. Modular trips layers (principle #16)

```
lib/api/trips.ts                   getTrip (4.1), getTripGeojson (4.2)
                                   TRIP_PATH / GEOJSON_PATH satisfy keyof paths
                                   getTrip: parse "api" → TripOut
                                   getTripGeojson: parse "raw" → FeatureCollection
                                   AbortSignal; credentials via gateway
                                   MUST NOT add list / claim / delete / day-edit in F4

features/trips/use-trip.ts         Query key ["trips", id]
features/trips/use-trip-geojson.ts Query key ["trips", id, "geojson"] (4.2)
features/trips/trip-detail.tsx     days/stops; prefs chips; narrative overlay
features/trips/trip-forbidden.tsx  two 403 panels (viewer context)
features/trips/trip-not-found.tsx  404 panel
features/trips/day-narrative.tsx   react-markdown + remark-gfm; no rehype-raw (4.1)
features/trips/trip-map.tsx        MapLibre client (4.2)
features/trips/index.ts            public barrel only

app/trips/[id]/page.tsx            Server Component; await params (Promise in this Next line)
                                   mounts trips barrel only
                                   no getJson / useQuery / fetch / MapLibre

store/narrative.ts                 already exists (F3); overlay if cached; omit if missing
lib/config.ts                      getMapStyleUrl() — 4.2 consumes it
```

- Mirror `lib/api/destinations.ts`: path `satisfies keyof paths`, replace `{trip_id}`, pass `signal`.
- Query: `enabled` when id is non-empty; `retry: 1` (idempotent GET); pass AbortSignal into HTTP.
- Trips MAY import `useAuthMe` from the `features/auth` barrel for `is_guest`. MUST NOT import `lib/api/auth`.
- Do not put trip map UI in `components/map/` — blueprint tree is illustrative; principle #16 wins.
- Planner and `session-header` stay unchanged (no trips HTTP).

**Alternative considered:** Fetch on the Server Component page. Rejected — playbook and modular rule: page mounts barrels only; Query owns cookie-scoped client GETs with AbortSignal.

**Alternative considered:** Put MapLibre under `components/map/`. Rejected — principle #16; keep with trips feature.

### 3. Two 403 panels by viewer context

Backend currently uses the same `forbidden` body for guest-session-mismatch and ownership. Distinguish with `useAuthMe().data?.is_guest` (or equivalent):

| Viewer | Copy | CTA |
|--------|------|-----|
| Guest | Different-session / session-mismatch | **No login CTA** |
| Authenticated | Ownership (you don’t own this trip) | Do not reuse guest sentence |

404 / `not_found` → dedicated panel, not either 403 panel. Surface via `ApiError` status/code.

**Alternative considered:** Wait for a backend `session_mismatch` code. Rejected — blueprint documents this as a backend follow-up; FE must ship distinct copy now via viewer context.

### 4. Narrative overlay is Option A only; markdown is locked

Read `store/narrative.ts` by `trip_id`. If missing, omit. Install `react-markdown` + `remark-gfm` once at 4.1. MUST NOT add `rehype-raw`. MUST NOT use `dangerouslySetInnerHTML`. Do not invent `TripOut` narrative fields.

**Alternative considered:** Persist narrative via a new API. Rejected — AGENTS.md / blueprint Option A; hard reload may lose prose.

### 5. GeoJSON enablement and list-first map (4.2 only)

Enable `["trips", id, "geojson"]` only when trip GET **succeeded** (`isSuccess` + id). Never paint a map on 403/404 even though GeoJSON is public on the wire.

MapLibre in `features/trips/trip-map.tsx` (Client Component). Style from `getMapStyleUrl()`:
- Development + unset → documented OSM-compatible fallback + helper text that production needs MapTiler (or equivalent style URL).
- Production + unset → collapse map; do not silently use OSM.
- Style/tile error → collapse callback / render null; day list remains.

Points from Point features; lines from LineString features; missing lines → points only. NEVER invent coordinates. NEVER build features from `TripPlaceOut.lat` / `lng`. Thin domain type under `types/` (not `types/generated/`) MAY narrow the raw `{ [key: string]: unknown }` GeoJSON body to FeatureCollection per `frontendGuide.md` §15.

Install `maplibre-gl` once at 4.2. Add `@types/maplibre-gl` only if the package has no shipped types. Do not install Google Maps JS or `react-map-gl`.

**Alternative considered:** Client-synthesize GeoJSON from place lat/lng when `/geojson` is empty. Rejected — AGENTS.md / playbook hard rule; never invent coordinates.

**Alternative considered:** OSM in production when MapTiler unset. Rejected — playbook: OSM is development only.

### 6. Env / API keys for F4

| Variable | Required for F4? | Notes |
|----------|------------------|-------|
| `NEXT_PUBLIC_API_URL` | **Yes** | Already required; sibling API must be up for proofs |
| `NEXT_PUBLIC_MAP_STYLE_URL` | **No for ship** | Optional MapTiler (or other) style JSON URL — often includes `?key=…`. Recommended for a real basemap. Unset/broken is the list-first proof path |
| Backend LLM / OAuth / DB secrets | **No in FE** | Never in Next env |

No separate MapLibre API key package. Prefer one style URL over scattering keys. Optional `NEXT_PUBLIC_MAPTILER_KEY` is acceptable only if code builds the MapTiler URL — still FE-only; not required by the playbook if the full style URL is set.

**Alternative considered:** Block F4b until MapTiler key exists. Rejected — playbook explicitly proves list-first with unset/broken style URL.

## Risks / Trade-offs

- [Sibling API or unknown `trip_id`] → Mitigation: F4a needs a real trip from generate navigate or a known uuid. Stop the batch if the API is down; do not invent trip DTOs.
- [Agent collapses both 403s] → Mitigation: F4a validation requires guest vs authed copy paths; guest path has no Login CTA.
- [Agent adds `rehype-raw` or invents narrative] → Mitigation: package + grep checks; Option A omit-on-miss.
- [Agent invents map coordinates from places] → Mitigation: F4b lock + ship checklist; GeoJSON-only overlays.
- [MapLibre init on the Server Component] → Mitigation: page must not import maplibre; map stays in feature Client Component.
- [OSM silently used in production] → Mitigation: Decision 5; production unset → collapse.
- [params Promise vs sync] → Mitigation: confirm against this Next line’s docs at apply time (same as F2/F3).
- [Jumping to claim/list in F4] → Mitigation: hard stop; `claim` must not appear in `lib/api/trips.ts`.

## Migration Plan

Local FE only. Operators need `.env.local` with `NEXT_PUBLIC_API_URL` (already set) and the sibling API. For a styled map, set `NEXT_PUBLIC_MAP_STYLE_URL` to a MapTiler style JSON URL (key may be embedded in the URL). Leaving it unset is valid for F4b list-first proof (dev OSM fallback OK).

Rollback = revert this change’s commits (trips stubs and F3 stub page return). No production deploy.

After the F4 ship checklist in `StepF4.md` is green, update `docs/app/system.md` to the F4 as-built snapshot. A separate change expands `StepF5.md`.

## Open Questions

None. MapTiler key vs full style URL is an operator preference already covered by Decision 6; it does not change specs or task order.
