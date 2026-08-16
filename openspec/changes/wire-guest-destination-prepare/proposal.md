## Why

The API now lets guests search **any** place (often a geocoded shell with `place_count=0`) and seed POIs with `POST /destinations/{id}/prepare`, then generate only after `place_count` meets the planner floor (default 10). The frontend still assumes destinations are pre-seeded: search + warn-and-allow readiness, Generate enabled at every tier, no prepare client, and `409 destination_not_ready` only as a compose dead-end. Without this change, a new search hit looks “selected” but generate 409s, and nothing on home kicks off Overpass or polls readiness.

## What Changes

- **BREAKING (product, vs F2 warn-and-allow-only):** Gate the home Generate CTA on **`place_count` vs the planner floor** (UI default **10**, matching `PLANNER_ABSOLUTE_MIN_PLACES`). Do **not** hard-block Generate merely because `tier` is `sparse` when the floor is already met. `limited` / `sparse` warnings stay when Generate is allowed.
- Add guest-reachable **Prepare** on the home readiness card when `place_count` is below the floor: `POST /api/v1/destinations/{id}/prepare` (auth None). **200** `status=ready` → refetch readiness and allow Generate. **202** `status=preparing` → poll `GET .../readiness` about every **2s** for up to **~120s**. First sparse / zero-place poll is expected, not a failure. Timeout or still below floor → “not enough places” (not login, not SSE).
- Search stays fast: **no** prepare on typeahead; **no** auto-prepare on select (prepare is **5/min/IP**). Omit `radius_km` in the body (API default 30, max 50). Country/region scrape UI is out of scope.
- Keep guest generate (no Google login wall). Compose stays planner-only; under-floor deep-links still **409** JSON (not SSE) with a way back to `/?destination=` to prepare. 409 is not an auth failure.
- Sync `docs/frontendGuide.md` to the contract in `docs/update_backend.md` (search → prepare → poll → guest generate). Regenerate `types/generated/api.d.ts` from live OpenAPI — do not hand-edit wire types.
- Prepare **429** / `rate_limit_exceeded` → existing error toast + brief Prepare disable. Mutations: no automatic retry.

## Capabilities

### New Capabilities

- (none — prepare is part of destinations, not a new domain)

### Modified Capabilities

- `destinations`: Home readiness MUST offer Prepare + poll when `place_count` is below the floor; MUST enable Generate only when the floor is met (tier warnings unchanged); MUST NOT scrape on search; MUST NOT require login for search/prepare/readiness.
- `planner`: Pre-stream `409 destination_not_ready` MUST remain JSON-not-SSE and MUST send the visitor back to home readiness to prepare/poll. MUST NOT treat that 409 as missing Google login. Guest compose/generate stays ungated by auth.
- `core-client`: JSON gateway MUST treat HTTP **202** with a success `ApiResponse` as success (prepare kickoff). MUST NOT hang the default ~20s JSON timeout waiting for Overpass — polling is readiness, not a long POST.

## Impact

- **Touched:** `lib/api/destinations.ts` (prepare + types from generated OpenAPI), `features/destinations/*` (readiness card, prepare mutation, poll), `docs/frontendGuide.md`, `docs/blueprint.md` failure/F2 notes as needed, `docs/app/system.md` as-built, `types/generated/api.d.ts` via `npm run gen:types`.
- **Light touch:** `features/planner/*` only if 409 copy should say “prepare this place” instead of a generic not-ready panel. Do **not** import destinations HTTP from planner.
- **Not touched:** Google OAuth return-to-app, country/region polygons, radius slider, CLI `ingest.py`, trips/map/edit, F6 leftover tasks.
- **APIs:** `POST /api/v1/destinations/{destination_id}/prepare` (`ApiResponse<DestinationPrepareOut>`, 200 ready / 202 preparing, optional `PrepareIn`); existing search + readiness. Auth: None. Limiter: 5/min/IP.
- **Runtime dependency (apply):** sibling API up at `NEXT_PUBLIC_API_URL` so OpenAPI includes prepare. If `/openapi.json` lacks the path, stop — do not stub DTOs from the markdown guide.
- **In-flight changes:** does not replace `implement-fe-step-f6` or `verify-generate-trip-after-api-fix`.
