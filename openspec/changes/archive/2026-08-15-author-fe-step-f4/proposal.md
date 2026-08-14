## Why

F3 has shipped (compose on `/generate`, abortable SSE, clarification as a fresh POST, stub `/trips/[id]`). `docs/steps/StepF4.md` is still an outline. An agent cannot implement trip detail + MapLibre without inventing prompt grain, layer boundaries, a generic 403 panel, or `rehype-raw`. Author the F4 playbook now — before any `GET /trips/{id}` — so F4a/F4b cannot dump fetch on the page, collapse guest-session-mismatch into ownership copy, invent map coordinates, or treat the SSE blob as the durable trip.

This is **not** F3c and **not** trip-list/claim (F5). The stub trip route already exists. The next phase is F4 playbook expansion from `docs/blueprint.md` F4.

## What Changes

- Expand `docs/steps/StepF4.md` from outline into a full phase bible: locked decisions (trip HTTP in `lib/api/trips.ts`, UI in `features/trips/`, `GET /trips/{id}` as `ApiResponse` / GeoJSON as `parse: "raw"`, two distinct 403 panels by **viewer context**, Option A narrative overlay only, `react-markdown` + `remark-gfm` with no `rehype-raw`, list-first map degrade, points-only if no LineStrings, OSM tiles **dev only**), failure table, feature buildup, and **one fenced prompt per sub-step** (4.1 → 4.2).
- Add CLI entrypoints `docs/steps/batches/F4a.md` (4.1) and `F4b.md` (4.2). Prompt bodies live once in `StepF4.md`.
- Keep `docs/app/system.md` as the F3 as-built snapshot so F4 prompts cite compose, SSE, stub trip page, and empty `lib/api/trips.ts`. Do not rewrite it as if F4 code existed.
- Update `docs/steps/README.md` with the F4 batch table. Leave `StepF5.md`–`StepF7.md` as outlines.
- No `AGENTS.md` / blueprint rewrite — content-rendering, guest-mismatch 403, and list-first degrade are already hard rules. Playbook locks them into prompt grain.

## Capabilities

### New Capabilities

None. Docs-only playbooks; no application behavior. `skip_specs: true` is set on this change. Trip detail / GeoJSON requirements land in a later **implement** change after these files exist.

### Modified Capabilities

None. `planner` (compose, SSE, stub trip navigate) and existing specs stay as shipped. F4 code will later add a `trips` capability; this change does not.

## Impact

- **Touched:** `docs/steps/StepF4.md`, `docs/steps/batches/F4a.md`, `docs/steps/batches/F4b.md`, `docs/steps/README.md`. `docs/app/system.md` stays the F3 snapshot (cite it; do not pretend F4 shipped).
- **Not touched:** application code (`lib/api/trips.ts` and `features/trips/index.ts` stay stubs until a later implement change; `app/trips/[id]/page.tsx` stays the F3 stub), `package.json` (no `react-markdown` / `remark-gfm` / `maplibre-gl` here), `docs/frontendGuide.md`, `docs/blueprint.md`, `AGENTS.md`, backend repo.
- **APIs / deps:** none in this change. Later implement installs `react-markdown` + `remark-gfm` at 4.1 and `maplibre-gl` at 4.2. Wire: `GET /api/v1/trips/{id}` (`ApiResponse` + generated `TripOut`, Optional + ownership) and `GET /api/v1/trips/{id}/geojson` (raw FeatureCollection). Do not invent `GET /trips` list, claim, or day-edit in F4.
- **Prerequisites (already met):** F3 as-built is on disk (compose, abortable SSE, clarification, stub trip route, Zustand Option A). `StepF3.md` ship checklist says expand F4 next. Generated `TripOut` / `TripPlaceOut` and both trip GET paths exist in `types/generated/api.d.ts`. Gateway already has `parse: "raw"` for GeoJSON.
- **Runtime dependency:** later implement proofs need the sibling API up and a known `trip_id` (from generate or a fixture uuid). Authoring this playbook does not need the API.
- **Follow-up:** implementing F4a/F4b is a later change after these files exist. Do not implement trip HTTP, markdown, or MapLibre in this change.
