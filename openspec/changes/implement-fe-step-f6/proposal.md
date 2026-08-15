## Why

F5 ships authenticated trip list, claim with distinct failure copy, and delete 204, but trip detail is still read-only: owners cannot add, reorder, remove, or reoptimize stops. Implement F6 now so day-edit lands with a real places catalog, owner gates, distinct failure copy, Query invalidation of trip + geojson, and a fail-closed Playwright MCP proof — without inventing FE API keys, `@dnd-kit`, optimistic UI, or F7 `@playwright/test`.

F6a (6.2 picker) and F6b (6.1 mutations) land in **one** OpenSpec change — the same grain as `implement-fe-step-f1`–`f5`. Apply stays hard-stopped batches: prove the read-only picker (404/empty without blanking the day list) before any PATCH/POST/DELETE. Do not merge 6.2 and 6.1 into a single prompt body. **Run order is picker-first (unlike blueprint numeric labels): 6.2 → 6.1.**

## What Changes

- Replace the `lib/api/places.ts` stub with `GET /api/v1/places?destination_id=` (`parse: "paginated"` → bare `PaginatedResponse` of generated `PlaceOut`). Add `usePlaces` + a **read-only** places picker on trip detail keyed by `TripOut.destination_id`. Unknown destination 404 / empty `items` MUST NOT blank the trip day list. Places GET is public (None auth). **6.2 MUST NOT add day-edit mutations.**
- Add owner day-edit on trip detail: `reorderDayStops` PATCH, `addDayStop` POST (from the 6.2 picker), `removeDayStop` DELETE (`parse: "api"` → `TripOut`, HTTP **200 not 204**), `reoptimizeDay` POST (no body, JSON not SSE). All four `parse: "api"`. Mutations `retry: false`. **No optimistic UI.** On success invalidate/set `["trips", id]` + `["trips", id, "geojson"]`.
- Owner gates via `useAuthMe` from the auth barrel. Guests: hide/disable edit; never call expecting success. Distinct copy for 401, 403 guest session-mismatch (no login-as-fix), 403 ownership, 409 duplicate/conflict, 422 validation, 429 trip-edit 20/min, 503 `llm_unavailable` on reoptimize.
- Modular layers: places HTTP only in `lib/api/places.ts`; edit HTTP only in `lib/api/trips.ts` (keep list/claim/delete/getTrip/geojson). Hooks/UI in `features/places/` and `features/trips/`. Pages mount barrels only. Trips MAY import the places **barrel**; MUST NOT import `lib/api/places`. Install **no new packages**.
- Last-step validation (6.1 / F6 ship) MUST run **Playwright MCP** against `http://localhost:3000` (navigate → picker → add → duplicate → reorder/remove; guest cannot mutate). Do **not** install `@playwright/test` (F7.3). If MCP is unavailable: **fail-closed** — documented manual browser pass with the same checklist, never a silent green.
- Stop at the F6 ship checklist. Do **not** implement F7 (Vitest, `@playwright/test` CI, a11y/responsive passes).

## Capabilities

### New Capabilities

- `places`: Destination place catalog for add-stop. `GET /api/v1/places?destination_id=` as bare paginated `PlaceOut`; read-only picker on trip detail; 404/empty/network without blanking the day list; no day-edit HTTP in this capability.

### Modified Capabilities

- `trips`: Add owner day-edit on trip detail — reorder PATCH, add POST from the places picker, remove DELETE (200 envelope, not 204), reoptimize POST (JSON, not SSE). Invalidate trip + geojson on success. Owner-gated; distinct 401/403/409/422/429/503 copy; no mutation retry; no optimistic UI. Keep F4 detail/map and F5 list/claim/delete. Detail stays Optional + ownership (no required-auth wrapper). List page stays list-only (no day-edit on `/trips`).

## Impact

- **Touched:** `lib/api/places.ts` (replace stub), `lib/api/trips.ts` (add four edit clients; keep get/list/claim/delete/geojson), `features/places/*` (new), `features/trips/*` (add-stop + day-edit controls/hooks; barrel), `app/trips/[id]/page.tsx` (still Server Component; MAY compose trips + places barrels), `docs/app/system.md` (F6 as-built snapshot at ship).
- **Not touched:** `lib/api/client.ts` / `lib/config.ts` (gateway already has `parse: "paginated"` and `parse: "api"`), `lib/sse/planner.ts`, `features/planner/*`, `features/auth/session-header.tsx` (still no trips/places HTTP), `lib/api/auth.ts`, `app/trips/page.tsx` (no day-edit on list), FastAPI, `AGENTS.md` / `docs/blueprint.md` / `docs/frontendGuide.md` / `docs/steps/StepF6.md` (already authored), `package.json` (no new packages), Vitest / `@playwright/test`.
- **APIs / deps:** **No new FE packages. No new FE API keys.** Wire:
  - `GET /api/v1/places?destination_id=` — None; bare paginated `PlaceOut`; unknown destination → 404
  - `GET /api/v1/places/{place_id}` — None; `ApiResponse[PlaceOut]` — **optional** in 6.2 (skip unless a row needs it)
  - `PATCH /api/v1/trips/{trip_id}/days/{day}/stops/reorder` — Required + owner; body `ReorderStopsIn` `{ place_ids }`
  - `POST /api/v1/trips/{trip_id}/days/{day}/stops` — Required + owner; body `AddStopIn` `{ place_id }`
  - `DELETE /api/v1/trips/{trip_id}/days/{day}/stops/{place_id}` — Required + owner; HTTP **200** `ApiResponse[TripOut]` (**not** 204)
  - `POST /api/v1/trips/{trip_id}/days/{day}/reoptimize` — Required + owner; no body; JSON not SSE
  - Trip-edit rate limit **20/min**. Auth: places GET needs none; day-edit needs owner cookies (`wandr_token` + matching `wandr_session`). Trips MAY import `useAuthMe` from the `features/auth` barrel and `PlacesPicker` from the `features/places` barrel; MUST NOT import `lib/api/auth` or `lib/api/places`.
- **Env:** `NEXT_PUBLIC_API_URL` **required** (already in `.env.example`, default `http://localhost:8000`; copy into `.env.local`). `NEXT_PUBLIC_MAP_STYLE_URL` **optional** (F4 map; edits invalidate geojson; list-first still applies). **No MapTiler / Google Maps JS / LLM / Auth0 / OAuth / Context7 secrets in FE env.** Reoptimize is a JSON POST; if the API calls an LLM, that key stays on the sibling FastAPI `.env`. Google login remains a redirect to `{NEXT_PUBLIC_API_URL}/api/v1/auth/google`.
- **Prerequisites (already met):** F5 ship is green. `StepF6.md` + `batches/F6a.md` / `F6b.md` exist. Generated types include places + day-edit paths. Gateway supports `paginated` and `api` parse modes. `lib/api/places.ts` is still `export {}`. `lib/api/trips.ts` has get/list/claim/delete/geojson — no reorder/add/remove/reoptimize yet.
- **Runtime dependency:** Sibling API up. F6a needs a trip with a real `destination_id` (places GET is public). F6b needs authenticated **owner** cookies. Playwright MCP (`plugin-playwright-playwright`) required for last-step validation; FE at `http://localhost:3000`.
- **Follow-up:** expand `docs/steps/StepF7.md` from outline after this ship checklist is green (separate change). Do not implement Vitest / `@playwright/test` here.
