# F4b — CLI session: GeoJSON + MapLibre

> Run **this file** as the agent prompt (or paste it). Do not also paste all of `StepF4.md`.
> Prompt bodies live in [`../StepF4.md`](../StepF4.md). This file is the session gate.

## Prerequisites

- **F4a green** (trip detail from `TripOut`; two 403 panels; markdown narrative; no MapLibre yet).
- Install **`maplibre-gl` once** at 4.2 (add `@types/maplibre-gl` only if needed). Do not add `rehype-raw`, Google Maps JS, claim, or trip list.
- List-first proof: unset or break `NEXT_PUBLIC_MAP_STYLE_URL` and confirm the day list still works.

## Read first

1. [`../StepF4.md`](../StepF4.md) — locks (GeoJSON `parse: "raw"`, list-first, points-only, OSM-dev-only)
2. Execute the fenced prompt in `StepF4.md`:
   - **Step 4.2** — GeoJSON + MapLibre

## Session rules

- `getTripGeojson` via gateway `parse: "raw"`. Query key `["trips", id, "geojson"]` enabled only after trip GET success.
- MapLibre lives in `features/trips/trip-map.tsx`. Page still mounts barrels only.
- Points if no LineStrings. Never invent coordinates. Do not synthesize GeoJSON from `TripOut.places`.
- Tile/style failure → collapse map; day list remains.
- OSM / public tiles are **development only**. Production missing style → collapse map.
- Do not start F5 (no claim, no `GET /trips` list).

## Hard stop

When 4.2 validation passes, run the **F4 ship checklist** at the bottom of `StepF4.md`. Then **stop**. Do not expand or implement F5 in this session.

## Proofs (F4 ship)

```powershell
Select-String -Path lib\api\trips.ts -Pattern "geojson"
Select-String -Path lib\api\trips.ts -Pattern 'parse: "raw"'
Select-String -Path package.json -Pattern "maplibre-gl"
Select-String -Path lib\api\trips.ts -Pattern "claim"   # Expected: no matches
Select-String -Path app\trips\[id]\page.tsx -Pattern "getJson|useQuery|maplibre|MapLibre"   # Expected: no matches
Test-Path features\trips\trip-map.tsx
# Browser: markers (lines when present); break style URL → list still usable; no invented coords

# Full F4 checklist: see StepF4.md "F4 ship checklist"
```

Next (separate planning pass): expand [`../StepF5.md`](../StepF5.md) from outline into full prompts, then run F5 batches.
