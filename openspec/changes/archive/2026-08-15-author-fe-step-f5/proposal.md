## Why

F4 has shipped (trip detail from `GET /trips/{id}`, dual 403 panels, Option A narrative markdown, list-first MapLibre). `docs/steps/StepF5.md` is still an outline. An agent cannot implement claim + trip list without inventing prompt grain, collapsing claim failures into one toast, putting list/claim HTTP on the page, or retrying mutations. Author the F5 playbook now — before any `GET /trips` list, claim, or delete — so F5a/F5b cannot skip 401→login CTA, distinct claim-failure copy, or list-cache invalidation.

This is **not** day-edit (F6) and **not** F4. The next phase is F5 playbook expansion from `docs/blueprint.md` F5.

## What Changes

- Expand `docs/steps/StepF5.md` from outline into a full phase bible: locked decisions (list/claim/delete HTTP only in `lib/api/trips.ts`; hooks/UI in `features/trips/`; `GET /trips` as bare paginated `parse: "paginated"`; claim `POST` as `parse: "api"`; delete as `parse: "empty"` / HTTP 204; Query keys `["trips","list"]` + invalidate on claim/delete; distinct claim-failure copy for unauthenticated / session-mismatch / already-claimed; no anonymous list or delete; claim best-effort until `FRONTEND_URL` bounce), failure table, feature buildup, and **one fenced prompt per sub-step** (5.1 → 5.2 → 5.3).
- Add CLI entrypoints `docs/steps/batches/F5a.md` (5.1) and `F5b.md` (5.2 + 5.3). Prompt bodies live once in `StepF5.md`.
- Keep `docs/app/system.md` as the F4 as-built snapshot so F5 prompts cite real trip detail + map without pretending list/claim exist.
- Update `docs/steps/README.md` with the F5 batch table. Leave `StepF6.md`–`StepF7.md` as outlines.
- No `AGENTS.md` / blueprint rewrite — modular layers, credentials, and guest-mismatch rules are already hard. Playbook locks them into F5 prompt grain.

## Capabilities

### New Capabilities

None. Docs-only playbooks; no application behavior. `skip_specs: true` is set on this change. Trip list / claim / delete requirements land in a later **implement** change after these files exist.

### Modified Capabilities

None. Existing `trips` (detail + GeoJSON) and other specs stay as shipped. F5 code will later extend the `trips` capability; this change does not.

## Impact

- **Touched:** `docs/steps/StepF5.md`, `docs/steps/batches/F5a.md`, `docs/steps/batches/F5b.md`, `docs/steps/README.md`. `docs/app/system.md` stays the F4 snapshot (cite it; do not pretend F5 shipped).
- **Not touched:** application code (`lib/api/trips.ts` keeps getTrip/getTripGeojson only until a later implement change; no new list/claim/delete yet), `package.json` (no new packages for F5 — blueprint Package Install Order lists none for F5), `docs/frontendGuide.md`, `docs/blueprint.md`, `AGENTS.md`, backend repo.
- **APIs / deps (documented for later implement — none installed in this authoring pass):**
  - **API URL (required):** `NEXT_PUBLIC_API_URL` (already in `.env.example`, default `http://localhost:8000`). All trip list/claim/delete calls go through the gateway to this origin. No new env var for F5.
  - **Map style URL:** `NEXT_PUBLIC_MAP_STYLE_URL` — **not required for F5** (map already shipped in F4; list/claim/delete do not use MapLibre).
  - **API keys:** **none for the frontend.** No MapTiler/Google/LLM keys in FE env. Google OAuth is owned by FastAPI (`GET /api/v1/auth/google`); FE only redirects. Claim needs working login cookies (`wandr_token` + matching `wandr_session`) from the sibling API — not a FE API key.
  - **Wire paths (OpenAPI already present):** `GET /api/v1/trips` (Required; bare `PaginatedResponse[TripOut]`), `POST /api/v1/trips/{trip_id}/claim` (Required; `ApiResponse[TripOut]`), `DELETE /api/v1/trips/{trip_id}` (Required + ownership; HTTP 204). Do not invent day-edit in F5.
- **Prerequisites (already met):** F4 as-built is on disk (trip detail, dual 403s, MapLibre list-first, `lib/api/trips.ts` with getTrip/getTripGeojson). `docs/app/system.md` is the F4 snapshot. Generated types include list/claim/delete paths. Gateway already supports `parse: "paginated"` and `parse: "empty"` (204).
- **Runtime dependency (later implement proofs):** sibling API up; authenticated cookie path for list/delete; for claim, same browser session so `wandr_session` still matches after login. Until API `FRONTEND_URL` OAuth bounce works, treat claim as best-effort on local Option A cookies (document in playbook; do not block the phase).
- **Follow-up:** implementing F5a/F5b is a later change after these files exist. Do not implement list/claim/delete HTTP or UI in this change.
