## Why

F5 has shipped (authenticated trip list, claim with distinct failure copy, delete 204). `docs/steps/StepF6.md` is still an outline. An agent cannot implement day edit without inventing prompt grain, wiring add-stop without a places picker, putting edit HTTP on the trip page, auto-retrying mutations, or collapsing 403 / 409 duplicate / 422 / 429 into one toast. Author the F6 playbook now — before any reorder / add / remove / reoptimize client — so F6a/F6b cannot skip the picker, owner gating, Query invalidation, or a live Playwright MCP proof.

This is **not** F5 (already shipped) and **not** F7 (Vitest / `@playwright/test`). The next phase is F6 playbook expansion from `docs/blueprint.md` F6.

## What Changes

- Expand `docs/steps/StepF6.md` from outline into a full phase bible: locked decisions (places HTTP only in `lib/api/places.ts`; edit HTTP only in `lib/api/trips.ts`; hooks/UI in `features/places/` and `features/trips/`; pages mount barrels; `GET /places` as bare paginated `parse: "paginated"`; `GET /places/{id}` as `parse: "api"` when needed; reorder PATCH / add POST / remove DELETE / reoptimize POST all `parse: "api"` → `TripOut`; **remove-stop is HTTP 200 envelope, not 204**; Query invalidation on `["trips", id]` + `["trips", id, "geojson"]`; no mutation retry; 401 login CTA; dual 403 copy; 409 duplicate conflict; 422 validation; 429 trip-edit 20/min backoff; **no new FE packages or API keys**), failure table, feature buildup, and **one fenced prompt per sub-step**.
- **Run order is picker-first, unlike blueprint numeric labels:** implement **6.2 then 6.1** so add-stop has a real `GET /places` source (matches the existing F6 outline). Blueprint numbers stay 6.1 / 6.2.
- Add CLI entrypoints `docs/steps/batches/F6a.md` (6.2) and `F6b.md` (6.1). Prompt bodies live once in `StepF6.md`.
- Keep `docs/app/system.md` as the **F5 as-built** snapshot so F6 prompts cite real list/claim/delete without pretending day-edit exists.
- Update `docs/steps/README.md` with the F6 batch table. Leave `StepF7.md` as an outline.
- Last-step validation MUST include a **Playwright MCP** browser pass (the Playwright MCP server already in Cursor — `browser_navigate` / snapshot / click). Do **not** install `@playwright/test` (that is F7.3).
- No `AGENTS.md` / blueprint rewrite — modular layers, credentials, guest-mismatch, and no-blind-retry are already hard. Playbook locks them into F6 prompt grain.

## Capabilities

### New Capabilities

None. Docs-only playbooks; no application behavior. `skip_specs: true` is set on this change. Places picker + day-edit requirements land in a later **implement** change after these files exist.

### Modified Capabilities

None. Existing `trips` (detail, GeoJSON, list, claim, delete) stays as shipped. F6 code will later extend `trips` and introduce a `places` capability; this change does not.

## Impact

- **Touched:** `docs/steps/StepF6.md`, `docs/steps/batches/F6a.md`, `docs/steps/batches/F6b.md`, `docs/steps/README.md`. `docs/app/system.md` stays the F5 snapshot (cite it; do not pretend F6 shipped).
- **Not touched:** application code (`lib/api/places.ts` stays `export {}` until a later implement change; `lib/api/trips.ts` keeps list/claim/delete and MUST NOT gain day-edit yet), `package.json` (no F6 row in blueprint Package Install Order), `docs/frontendGuide.md`, `docs/blueprint.md`, `AGENTS.md`, backend repo.
- **APIs / deps (documented for later implement — none installed in this authoring pass):**
  - **API URL (required):** `NEXT_PUBLIC_API_URL` (already in `.env.example`, default `http://localhost:8000`). All places + trip-edit calls go through the gateway to this origin. No new env var for F6.
  - **Map style URL:** `NEXT_PUBLIC_MAP_STYLE_URL` — **optional**. Map already shipped in F4; edit success MUST invalidate geojson so the existing map refreshes. Do not require a new MapTiler key in F6.
  - **API keys:** **none for the frontend.** No MapTiler/Google/LLM/OAuth secrets in FE env. Reoptimize is a JSON POST owned by FastAPI — if the API calls an LLM, that stays backend `.env`. Google OAuth remains `{API}/api/v1/auth/google`.
  - **Cookies:** `wandr_session` + `wandr_token` (httpOnly, set by API). Places list is **None** auth; day-edit routes are **Required + owner**.
  - **Wire paths (OpenAPI already present):** `GET /api/v1/places?destination_id=` (bare `PaginatedResponse[PlaceOut]`; unknown destination → 404); `GET /api/v1/places/{place_id}` (`ApiResponse[PlaceOut]`); `PATCH /api/v1/trips/{trip_id}/days/{day}/stops/reorder` body `ReorderStopsIn`; `POST /api/v1/trips/{trip_id}/days/{day}/stops` body `AddStopIn`; `DELETE /api/v1/trips/{trip_id}/days/{day}/stops/{place_id}` → **200** `ApiResponse[TripOut]` (not 204); `POST /api/v1/trips/{trip_id}/days/{day}/reoptimize` no body. Trip-edit rate limit **20/min**.
- **Prerequisites (already met):** F5 as-built is on disk (list/claim/delete, dual 403s, MapLibre list-first). `docs/app/system.md` is the F5 snapshot. Generated types include places + day-edit paths. Gateway already supports `parse: "paginated"` and `parse: "api"`.
- **Runtime dependency (later implement proofs):** sibling API up; owned trip with `destination_id`; authenticated owner cookies for mutations; Playwright MCP available in the implement session for the **last** validation only.
- **Follow-up:** implementing F6a/F6b is a later change after these files exist. Do not implement places HTTP, picker UI, or day-edit mutations in this change.
