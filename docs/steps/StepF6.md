# Wandr — F6 Cursor prompts: Day edit

> Blueprint: [`docs/blueprint.md`](../blueprint.md) — Phase F6 (~2 days · day edit)
> Wire contract: [`docs/frontendGuide.md`](../frontendGuide.md) §8 places + trips edit, §6 envelopes, §16 trip-edit **20/min**
> Guardrails: [`AGENTS.md`](../../AGENTS.md) — principle #16 Modular by default; guest-session-mismatch 403; no mutation retry
> Built-so-far: [`docs/app/system.md`](../app/system.md) (F5 as-built)
> Runner: [`README.md`](README.md)
>
> One prompt per sub-step. Paste **one** fence into Agent mode, or run a batch file under [`batches/`](batches/).
> Do not start the next prompt until the current validation passes.

**Run order is picker-first (unlike numeric labels):** **6.2 → 6.1**. Add-stop without `GET /places` is fake. Blueprint numbers stay 6.1 / 6.2.

| Batch | File | Sub-steps |
|-------|------|-----------|
| F6a | [`batches/F6a.md`](batches/F6a.md) | 6.2 |
| F6b | [`batches/F6b.md`](batches/F6b.md) | 6.1 |

Last-step validation (6.1 / F6 ship) includes a **Playwright MCP** browser pass. Do **not** install `@playwright/test` (that is F7.3).

---

## How to use these prompts

1. Workspace root is this repo (`guideagent-frontend`). It **is** the Next.js app.
2. Read `node_modules/next/dist/docs/` before writing App Router code (this Next line has breaking changes vs training data).
3. Run one batch **or** paste one fence — not this whole file.
4. Validation is PowerShell-first. **F6b / 6.1 also requires Playwright MCP** (fail-closed).
5. If the agent puts places HTTP in `trips.ts`, imports `lib/api/places` from trips, parses remove-stop as 204, auto-retries mutations, installs Playwright, invents FE LLM keys, or starts F7: stop and correct.

## Prerequisites (F5 must be complete)

- F5 ship checklist in [`StepF5.md`](StepF5.md) is green (authenticated list, claim distinct failure copy, delete 204).
- `docs/app/system.md` is the **F5 as-built** snapshot (explicitly: no day-edit / places picker; `lib/api/places.ts` is still `export {}`).
- `lib/api/trips.ts` has `getTrip` / `getTripGeojson` / `listTrips` / `claimTrip` / `deleteTrip` — **no** reorder / add / remove / reoptimize yet.
- Gateway already supports `parse: "paginated"` and `parse: "api"`. Do **not** change the gateway for F6.
- **Env:** `NEXT_PUBLIC_API_URL` required (default `http://localhost:8000` in `.env.example`). Copy that into **`.env.local`** (this Next app reads `NEXT_PUBLIC_*` from `.env.local` / `.env.example`, not backend secrets). **No new FE API keys** for F6. `NEXT_PUBLIC_MAP_STYLE_URL` is optional (F4 map).
- Local `.env` files that hold **API-repo** keys (`LLM_*`, `AUTH0_*`, `MAPTILER_API_KEY`, Context7, session secrets, …) are **not consumed** by this frontend. Keep those on the sibling FastAPI `.env`. Do **not** add them to FE env. Reoptimize is a JSON POST; if the API calls an LLM, that key stays on the API.
- F6a needs the sibling API up and a trip with a real `destination_id` (places GET is public).
- F6b needs authenticated **owner** cookies for mutation proofs.

## Prompt conventions (every step)

- First line of every prompt: read `AGENTS.md` and the F6 locks below.
- **Extend, don't replace** F5 list/claim/delete or F4 trip detail / map unless the step says extend.
- **Packages at point of use** — F6 installs **none**. Reuse TanStack Query + Sonner. No `@dnd-kit`. No `@playwright/test`.
- **PowerShell-first** validation (`Select-String`, `Get-ChildItem`).
- **Do NOT jump ahead** to the next sub-step inside a single prompt body.
- Never invent endpoints or DTO fields. OpenAPI / `types/generated/api.d.ts` win on wire shapes; this playbook wins on sequence, layers, and proofs.

## F6 architecture

```
lib/api/places.ts                  REPLACE stub export {}
                                   PLACES_PATH = "/api/v1/places" satisfies keyof paths
                                   PLACE_PATH  = "/api/v1/places/{place_id}" satisfies keyof paths
                                   listPlaces({ destination_id, page?, size? }, signal)
                                     getJson parse "paginated" → PlaceOut items
                                   getPlace(placeId, signal)  OPTIONAL if list row is enough
                                     getJson parse "api" → PlaceOut
                                   AbortSignal; credentials via gateway
                                   MUST NOT add trip-edit in places.ts

lib/api/trips.ts                   EXTEND (keep getTrip / getTripGeojson / list / claim / delete)
                                   reorderDayStops(tripId, day, body: ReorderStopsIn, signal)
                                   addDayStop(tripId, day, body: AddStopIn, signal)
                                   removeDayStop(tripId, day, placeId, signal)
                                   reoptimizeDay(tripId, day, signal)  — POST, no body
                                   All four: parse "api" → TripOut
                                   Paths use {trip_id} / {day} / {place_id} and satisfy keyof paths
                                   MUST NOT put GET /places in trips.ts

features/places/use-places.ts      Query key ["places", destinationId] (+ page/size)
features/places/places-picker.tsx  list UI; 404 / empty / retry
features/places/index.ts           public barrel

features/trips/use-reorder-stops.ts    useMutation; retry: false; invalidate trip + geojson
features/trips/use-add-stop.ts         same
features/trips/use-remove-stop.ts      same
features/trips/use-reoptimize-day.ts   same
features/trips/day-edit-controls.tsx   (or equivalent) owner-gated reorder / remove / reoptimize
features/trips/add-stop-control.tsx    mounts places picker from features/places barrel
features/trips/index.ts                export new hooks/UI; do not re-export places HTTP

app/trips/[id]/page.tsx            still Server Component; mounts barrels only
                                   MAY compose trips + places barrels
                                   no getJson / useQuery / useMutation / fetch
app/trips/page.tsx                 unchanged — no day-edit on list

features/auth/*                    edit MAY use useAuthMe from auth barrel for gates
                                   MUST NOT import lib/api/auth from trips or places
features/planner/*                 unchanged — no day-edit ownership
features/auth/session-header.tsx   unchanged — still no trips/places HTTP
```

Principle #16: HTTP in `lib/api/{domain}.ts`; hooks/UI in `features/{domain}/`; `app/` only mounts barrels. Trips MAY import picker/hooks from the `features/places` barrel. MUST NOT import `lib/api/places`. Planner does not own day-edit.

## Locked decisions

### Modular layers — LOCKED

- HTTP stays in `lib/api/places.ts` (places) and `lib/api/trips.ts` (day-edit). Hooks/UI stay in the matching feature folder.
- `app/trips/[id]/page.tsx` and `app/trips/page.tsx` only mount public barrels. They MUST NOT call `fetch` / `getJson` / `sendJson` / `useQuery` / `useMutation`.
- Features MUST NOT import each other’s HTTP modules. Trips MAY import from `features/places` (barrel). MUST NOT import `lib/api/places`. MUST NOT import `lib/api/auth` (use `useAuthMe` from the auth barrel).
- Header stays fetch-free of trips and places.
- Wire types: `PlaceOut`, `ReorderStopsIn`, `AddStopIn`, `TripOut` from `types/generated/api.d.ts`. Do not invent fields. Do not hand-edit generated files.
- Mutations: **no automatic retries**. Idempotent places GET may retry at most 1.
- **No optimistic UI in F6 MVP.** On success, `setQueryData(["trips", id], trip)` and/or invalidate `["trips", id]` + `["trips", id, "geojson"]`. If optimistic updates are added later, they MUST rollback on 403/409/422/429.

### Places picker — LOCKED (implement in 6.2)

- `listPlaces({ destination_id, page?, size? }, signal)` via `getJson` + `parse: "paginated"`. `destination_id` is **required**. Defaults `page=1`, `size=20` if the UI paginates — pass only OpenAPI query params.
- Query key MUST be `["places", destinationId]` (include page/size if paginating). Source `destination_id` from the open trip’s `TripOut.destination_id` — do not invent one.
- Auth: **None**. Picker GET may run for guests. **6.2 MUST NOT add day-edit mutations.** Mount a **read-only** picker on trip detail after trip GET succeeds (proof that the catalog loads). Wire add-stop in 6.1.
- Unknown destination → 404 / `not_found`: picker empty/error panel; **do not** blank the trip day list.
- Empty `items` → empty UI; never invent places.
- `getPlace` is **optional**. List `PlaceOut` already has id/name/category/lat/lng. Add `getPlace` only if a row needs the single-place envelope. Do not invent a third places route.
- Install **no new packages**.

### Edit mutations — LOCKED (implement in 6.1)

All **Required + owner**. Guests: hide/disable controls; never call expecting success. 401 → login CTA. Trip **detail** stays Optional + ownership (F4) — do **not** wrap `/trips/[id]` in required-auth.

| Client | Method / path | Body | Parse |
|--------|----------------|------|-------|
| `reorderDayStops` | PATCH `.../days/{day}/stops/reorder` | `ReorderStopsIn` `{ place_ids }` | `"api"` |
| `addDayStop` | POST `.../days/{day}/stops` | `AddStopIn` `{ place_id }` | `"api"` |
| `removeDayStop` | DELETE `.../days/{day}/stops/{place_id}` | none | `"api"` (HTTP **200** TripOut, **not** 204) |
| `reoptimizeDay` | POST `.../days/{day}/reoptimize` | **none** | `"api"` |

- Add-stop MUST open/use the 6.2 picker (**inline or sheet**). Picking a place already on that day MUST surface **duplicate conflict** (typically 409 + `ErrorResponse`; do **not** invent `duplicate_stop` if OpenAPI only has generic codes — map status + `code` + message/details).
- Reorder via **move-up / move-down** that rebuilds `place_ids` for that day. Do **not** install `@dnd-kit`.
- Remove: confirm (or equivalent explicit control).
- Reoptimize is a JSON POST, not SSE. Do **not** use `EventSource` or `lib/sse/planner.ts`. If API returns 503 `llm_unavailable`, toast like other service failures — **no FE LLM key**.
- On success: invalidate (or setQueryData from returned `TripOut`) `["trips", id]` and `["trips", id, "geojson"]` so MapLibre refreshes without inventing coordinates. List key `["trips","list"]` MAY invalidate (optional).
- 429 / `rate_limit_exceeded` (trip-edit **20/min**): backoff toast + brief CTA disable. Proving 429 under load is optional/manual, not a flaky CI requirement.
- 422 / `validation_error`: toast from `details`; do not pretend the itinerary changed.
- 403: distinct copy by viewer context (guest session-mismatch vs authenticated ownership). Login is **not** the fix for session mismatch.
- No blind mutation retry. AbortSignal required.
- Install **no new packages**.

### Env, API URL, and keys — LOCKED

| Need | Value | F6? |
|------|--------|-----|
| API base URL | `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:8000`) | **Required** — already in `.env.example`; put it in `.env.local` |
| Map style | `NEXT_PUBLIC_MAP_STYLE_URL` | Optional (F4 map). Edits invalidate geojson; list-first still applies |
| FE API keys (MapTiler secret, Google Maps JS, LLM, OAuth client secret, Auth0 secret, Context7) | — | **None.** This Next app never holds them |
| Google login | Navigate to `{NEXT_PUBLIC_API_URL}/api/v1/auth/google` | Backend owns OAuth; FE redirects only |
| Cookies | `wandr_session` + `wandr_token` (httpOnly, set by API) | Required for day-edit; places GET needs none |

Backend keys in a local `.env` (`LLM_*`, `AUTH0_*`, `MAPTILER_API_KEY`, …) belong on the **API** process. Do not copy them into FE env or `NEXT_PUBLIC_*`.

### Packages — LOCKED

| Step | Install | Do not |
|------|---------|--------|
| 6.2 | none | `@playwright/test`, Vitest, dnd-kit, places HTTP inside `trips.ts` |
| 6.1 | none | Blind mutation retry, parse remove-stop as 204, EventSource for reoptimize, FE LLM keys |

### Playwright MCP — LOCKED (last step only)

PowerShell greps on **every** fence. **Additionally**, step **6.1** and the F6 ship checklist MUST run Playwright MCP (`plugin-playwright-playwright`: `browser_navigate`, `browser_snapshot`, `browser_click`, …) against `http://localhost:3000`.

- Do **not** `npm install @playwright/test`. Do **not** add `e2e/` specs (F7.3).
- If MCP tools are unavailable: **fail the validation** (not a silent pass). Fall back only to a documented **manual** browser pass with the same checklist, with written evidence. Never mark green with no evidence.

### Forward locks (do not implement in F6)

- Vitest, `@playwright/test` CI smoke (F7)
- `@dnd-kit` / drag-and-drop polish
- `FRONTEND_URL` OAuth bounce (backend follow-up)
- Required-auth wrapper on `/trips/[id]`
- Inventing a backend `duplicate_stop` / `session_mismatch` code
- Evaluation HTTP
- FE LLM / Auth0 / MapTiler secret env vars

## Failure-mode table — LOCKED (F6)

| Failure | Response this phase must implement | Lands in |
|---------|-------------------------------------|----------|
| Unknown destination 404 / `not_found` on places | Picker error/empty; trip day list still visible | 6.2 |
| Empty places `items: []` | Empty UI; never invent places | 6.2 |
| Places network / 5xx | Toast + retry in picker; do not blank trip | 6.2 |
| Edit while guest / 401 | Hidden/disabled controls; login CTA; do not pretend saved | 6.1 |
| 403 guest session mismatch | Distinct session-mismatch copy; **no** login-as-fix | 6.1 |
| 403 authenticated ownership | Distinct ownership copy | 6.1 |
| 409 duplicate / conflict | Duplicate-conflict copy; itinerary not silently duplicated | 6.1 |
| 422 / `validation_error` | Toast from `details`; no fake itinerary change | 6.1 |
| 429 / `rate_limit_exceeded` | Backoff toast; brief CTA disable (20/min trip-edit) | 6.1 |
| 503 `llm_unavailable` on reoptimize | Service-unavailable toast; no FE LLM key | 6.1 |

## Feature buildup

| After | Exists | Still empty / forbidden |
|-------|--------|-------------------------|
| 6.2 | `listPlaces` bare paginated; `usePlaces`; read-only picker on trip detail; Query key `["places", destinationId]`; 404/empty without blanking trip | No day-edit mutations; trips does not import `lib/api/places`; no new packages |
| 6.1 | Four edit clients `parse: "api"`; add-stop uses picker; up/down reorder; remove confirm; reoptimize POST; invalidate trip + geojson; owner gates; Playwright MCP last | No `@playwright/test`; no optimistic UI; no anonymous edits; no F7 |

## LLD / FE patterns this phase

| Pattern | Where |
|---------|--------|
| Domain modules | `lib/api/places.ts` (new); `lib/api/trips.ts` (extend) |
| Envelope Adapter | places list `parse: "paginated"`; day-edit `parse: "api"`; remove-stop is **not** `empty` |
| Server-state cache | `["places", destinationId]`; invalidate `["trips", id]` + `["trips", id, "geojson"]` on edit |
| Feature folders + Modular layers | `features/places/*`; `features/trips/*` edit UI; pages mount barrels |
| Null / empty UI | empty places page; 404 picker; guest-hidden edit |
| Cookie session probe | `useAuthMe` for edit gates |

## Recommended run batches

| Batch | Sub-steps | Proof before next |
|-------|-----------|-------------------|
| F6a | 6.2 | Picker lists or empty/404; trip day list still visible; no day-edit HTTP |
| F6b | 6.1 | Add from picker; duplicate conflict; reorder/remove/reoptimize update trip + geojson; Playwright MCP last |

---

## Step 6.2 — Places picker

```
Read AGENTS.md, docs/app/system.md (F5 as-built), docs/steps/StepF6.md (locks + this step), docs/frontendGuide.md §8 places + §6 envelopes, docs/blueprint.md F6.2 + Failure Boundary Summary, and node_modules/next/dist/docs/ before writing any file.

TASK: Add GET /api/v1/places?destination_id= (bare PaginatedResponse). Read-only places picker on trip detail, keyed by TripOut.destination_id. 404 unknown destination and empty items must not blank the day list. No day-edit mutations. No new packages.

This is step 6.2 (run first). Do NOT add reorderDayStops, addDayStop, removeDayStop, or reoptimizeDay.

─── FEATURE BUILDUP ───
After this step:
  EXISTS: listPlaces in lib/api/places.ts (parse "paginated"); usePlaces; places-picker UI; Query key ["places", destinationId]; read-only picker on trip detail after trip GET succeeds; 404/empty without blanking trip.
  STILL EMPTY: day-edit mutations; getPlace optional; trips MUST NOT import lib/api/places; no new FE API keys / packages.

─── FAILURE MODE ───
- Unknown destination 404 / not_found: picker error or empty panel. Do NOT blank trip days/stops.
- Empty items array: empty UI; never invent places.
- Network / 5xx: existing Query error toast; picker shows retry, not an infinite spinner. Day list remains.
- Do NOT wrap /trips/[id] in required-auth (detail stays F4 Optional + ownership).
- Do NOT fire day-edit PATCH/POST/DELETE in this step.

─── LLD / BEST PRACTICE ───
Pattern: Domain module + Server-state cache + Feature folders + Modular layers + Null / empty UI.
Replace lib/api/places.ts stub. Do NOT put GET /places in lib/api/trips.ts.
PLACES_PATH = "/api/v1/places" satisfies keyof paths.
listPlaces({ destination_id, page?, size? }, signal?) via getJson(..., { signal, parse: "paginated" }). destination_id is required (OpenAPI).
Type items as PlaceOut from types/generated/api.d.ts. Do not invent fields. Do not hand-edit api.d.ts.
Query key MUST be ["places", destinationId] (include page/size if paginating). enabled when destinationId is a non-empty string from the loaded trip. retry: 1. Pass AbortSignal.
getPlace is OPTIONAL this step — skip unless a row truly needs GET /places/{place_id} (parse "api").
Places picker lives in features/places/. Trip detail MAY import PlacesPicker from the features/places barrel. MUST NOT import lib/api/places from features/trips.
Page: app/trips/[id]/page.tsx still Server Component mounts barrels only. MUST NOT call getJson / useQuery / fetch.
Env: NEXT_PUBLIC_API_URL only (in .env.local). Do NOT add LLM / Auth0 / MapTiler / Context7 keys to FE env.
No npm install this step.

─── WHAT TO CREATE ───

1. lib/api/places.ts — replace `export {}` with:
   - PLACES_PATH = "/api/v1/places" satisfies keyof paths
   - listPlaces({ destination_id, page?, size? }, signal?) via getJson with parse: "paginated"
   - Do NOT add trip-edit functions here.

2. features/places/use-places.ts ("use client"):
   - useQuery({ queryKey: ["places", destinationId, …], queryFn: ({ signal }) => listPlaces({ destination_id: destinationId, … }, signal), enabled: Boolean(destinationId), retry: 1 })
   - Surface 404 / empty / other errors for picker UI.

3. features/places/places-picker.tsx — success: render items (name/category enough). Empty: empty UI. 404: error/empty panel that does not replace the trip day list.

4. features/places/index.ts — public barrel (PlacesPicker / usePlaces as needed). Do not export a kitchen-sink object.

5. Wire a read-only picker onto trip detail (after trip GET success) using TripOut.destination_id. Keep claim/delete/map. app/trips/[id]/page.tsx still MUST NOT import getJson / useQuery / fetch.

6. Leave session-header, planner, list/claim/delete APIs unchanged.

─── RULES FOR THIS STEP ───
- Do NOT jump ahead to step 6.1 (no reorder / add / remove / reoptimize).
- Do NOT install new packages.
- Do NOT import lib/api/places from features/trips.
- Do NOT put getJson / useQuery on the page or in session-header.
- Do NOT invent FE API keys.
- Do NOT treat TripOut.places as the catalog (catalog is GET /places).

─── VALIDATION ───
  Select-String -Path lib\api\places.ts -Pattern 'parse: "paginated"'
  Select-String -Path lib\api\places.ts -Pattern "/api/v1/places"
  Select-String -Path lib\api\trips.ts -Pattern "/api/v1/places"   # Expected: no matches
  Select-String -Path lib\api\trips.ts -Pattern "reorder|reoptimize|addDayStop|removeDayStop"   # Expected: no matches yet
  Select-String -Path features\places -Pattern 'places","|places",' -Recurse
  Select-String -Path features\trips -Pattern "lib/api/places" -Recurse   # Expected: no matches
  Select-String -Path app\trips\[id]\page.tsx -Pattern "getJson|useQuery|fetch|sendJson"   # Expected: no matches
  Test-Path features\places\places-picker.tsx
  Test-Path features\places\use-places.ts

  npm run dev
  # Browser: open /trips/{id} with a real destination_id → picker shows places or empty UI. Day list still visible.
  # Unknown destination (if you can force it) → picker error/empty; trip not blanked.
  # Network: GET {API}/api/v1/places?destination_id= with credentials OK (public). No PATCH/POST/DELETE day-edit.
  # Do NOT run Playwright MCP in this step.
```

---

## Step 6.1 — Edit mutations

```
Read AGENTS.md, docs/app/system.md (F5 as-built), docs/steps/StepF6.md (locks + this step), docs/frontendGuide.md §8 trips edit + §16 rate limits, docs/blueprint.md F6.1 + Failure Boundary Summary, and node_modules/next/dist/docs/ before writing any file.

TASK: Add owner day-edit: reorder PATCH, add POST (from 6.2 picker), remove DELETE (200 ApiResponse TripOut — NOT 204), reoptimize POST (no body). Invalidate ["trips", id] + geojson. No mutation retry. No optimistic UI. No new packages. Last validation is Playwright MCP (not @playwright/test).

This is step 6.1 (run after 6.2). Last F6 code step. Do NOT start F7. Do NOT install @playwright/test.

─── FEATURE BUILDUP ───
After this step:
  EXISTS: reorderDayStops / addDayStop / removeDayStop / reoptimizeDay (all parse "api"); mutations retry: false; add-stop uses places picker; up/down reorder; remove confirm; owner gates; invalidate trip + geojson; 401/403/409/422/429 handling.
  STILL EMPTY: @playwright/test; dnd-kit; optimistic UI; anonymous edits; evaluation HTTP; FE LLM keys.

─── FAILURE MODE ───
- Guest / 401: hide/disable edit; login CTA; do NOT pretend saved.
- 403 guest session mismatch: distinct session-mismatch copy; do NOT offer login as the fix.
- 403 authenticated ownership: distinct ownership copy.
- 409 duplicate / conflict (add same place): distinct duplicate-conflict copy; itinerary not silently duplicated.
- 422 validation_error: toast from details.
- 429 rate_limit_exceeded (trip-edit 20/min): backoff toast + brief CTA disable.
- 503 llm_unavailable on reoptimize: service-unavailable toast. Do NOT add LLM keys to FE.
- Network / 5xx: toast; manual retry only. No automatic mutation retry.

─── LLD / BEST PRACTICE ───
Pattern: Domain module + Server-state cache (invalidation) + Modular layers.
Keep listTrips / claimTrip / deleteTrip / getTrip / getTripGeojson. Keep listPlaces in places.ts.
Paths satisfy keyof paths, e.g.:
  "/api/v1/trips/{trip_id}/days/{day}/stops/reorder"
  "/api/v1/trips/{trip_id}/days/{day}/stops"
  "/api/v1/trips/{trip_id}/days/{day}/stops/{place_id}"
  "/api/v1/trips/{trip_id}/days/{day}/reoptimize"
Replace {trip_id} / {day} / {place_id}. Bodies: ReorderStopsIn { place_ids }, AddStopIn { place_id } from generated types.
All four via sendJson parse: "api" → TripOut. removeDayStop is DELETE parse "api" (HTTP 200 envelope). Do NOT use parse "empty" (that is trip deleteTrip only).
reoptimizeDay: POST, no body. Do NOT use EventSource or lib/sse/planner.ts.
useMutation retry: false (or 0). On success: setQueryData and/or invalidate ["trips", id] and ["trips", id, "geojson"]. No optimistic UI.
Add-stop MUST use PlacesPicker from features/places barrel. MUST NOT import lib/api/places from trips.
Reorder: move-up / move-down rebuilding place_ids for that day. No @dnd-kit.
Gate with useAuthMe from auth barrel. MUST NOT import lib/api/auth.
Pages still mount barrels only.
Env: NEXT_PUBLIC_API_URL only. Do NOT add LLM / Auth0 / MapTiler secrets to FE.
No npm install this step.

─── WHAT TO CREATE ───

1. lib/api/trips.ts — keep existing; add:
   - reorderDayStops(tripId, day, body, signal?) PATCH parse "api"
   - addDayStop(tripId, day, body, signal?) POST parse "api"
   - removeDayStop(tripId, day, placeId, signal?) DELETE parse "api"  (NOT parse "empty")
   - reoptimizeDay(tripId, day, signal?) POST parse "api" no body

2. features/trips/use-reorder-stops.ts, use-add-stop.ts, use-remove-stop.ts, use-reoptimize-day.ts ("use client"):
   - useMutation; retry: false; onSuccess invalidate/set trip + geojson
   - Surface typed errors for distinct copy

3. features/trips/add-stop-control.tsx — owner-gated; opens 6.2 picker (inline/sheet); AddStopIn.place_id from picker selection.

4. features/trips/day-edit-controls.tsx (or equivalent):
   - Up/down reorder per day
   - Remove with confirm
   - Reoptimize CTA
   - Guest: hidden/disabled + login path if needed
   - Distinct 401 / 403-guest / 403-owner / 409 / 422 / 429 handling

5. Wire into trip detail via barrel. app/trips/[id]/page.tsx still MUST NOT call sendJson / useMutation directly.

6. features/trips/index.ts — export edit pieces as needed. Do not re-export places HTTP.

─── RULES FOR THIS STEP ───
- Do NOT implement F7 (no Vitest, no @playwright/test package).
- Do NOT parse remove-stop as HTTP 204 / parse "empty".
- Do NOT auto-retry mutations.
- Do NOT use optimistic UI.
- Do NOT import lib/api/places from features/trips.
- Do NOT use EventSource / planner SSE for reoptimize.
- Do NOT invent FE API keys.
- Do NOT wrap /trips/[id] in required-auth.

─── VALIDATION ───
  Select-String -Path lib\api\trips.ts -Pattern "reorderDayStops|addDayStop|removeDayStop|reoptimizeDay"
  Select-String -Path lib\api\trips.ts -Pattern "days/.*/stops|reoptimize"
  Select-String -Path features\trips -Pattern "retry:\s*false|retry:\s*0" -Recurse
  Select-String -Path features\trips -Pattern "lib/api/places" -Recurse   # Expected: no matches
  Select-String -Path features\trips -Pattern "EventSource|lib/sse/planner" -Recurse   # Expected: no matches
  Select-String -Path app\trips\[id]\page.tsx -Pattern "sendJson|useMutation|getJson"   # Expected: no matches
  Select-String -Path package.json -Pattern "@playwright/test|@dnd-kit"   # Expected: no matches
  # removeDayStop must not be the only parse empty — deleteTrip may still use parse empty:
  Select-String -Path lib\api\trips.ts -Pattern "removeDayStop" -Context 0,6

  npm run dev

  # Playwright MCP LAST (plugin-playwright-playwright). Do NOT npm install @playwright/test.
  # If MCP tools are unavailable: FAIL this validation (not a silent pass). Manual fallback only with the same checklist written down.
  #
  # MCP sequence on an owned trip (FE http://localhost:3000, API from NEXT_PUBLIC_API_URL):
  # 1. browser_navigate → /trips/{id}; browser_snapshot — day list visible (list-first).
  # 2. Open add-stop picker; snapshot — places from GET /places?destination_id= (or empty/404 UI, trip not blank).
  # 3. Add a place → day list updates; network POST .../stops with credentials.
  # 4. Add the same place again → duplicate-conflict copy; itinerary not silently duplicated.
  # 5. Reorder (up/down) or remove (confirm) → trip view updates; geojson refetch allowed.
  # 6. Guest / logged-out (or disabled controls) → no successful PATCH/POST/DELETE day-edit.
```

---

## F6 ship checklist

Do not author full F7 prompts or start F7 / F6-implement leftovers until every item is green:

```
# 6.2
Select-String -Path lib\api\places.ts -Pattern 'parse: "paginated"'
Test-Path features\places\places-picker.tsx
Select-String -Path features\trips -Pattern "lib/api/places" -Recurse
# Expected: no matches
# Browser: /trips/{id} picker lists or empty/404; day list still visible; no day-edit HTTP yet (after 6.2 only)

# 6.1
Select-String -Path lib\api\trips.ts -Pattern "reorderDayStops|addDayStop|removeDayStop|reoptimizeDay"
Select-String -Path features\trips -Pattern "retry:\s*false|retry:\s*0" -Recurse
Select-String -Path package.json -Pattern "@playwright/test"
# Expected: no matches

# Guard
Select-String -Path app\trips\[id]\page.tsx -Pattern "getJson|useQuery|sendJson|useMutation"
# Expected: no matches
Select-String -Path app\trips\page.tsx -Pattern "getJson|useQuery|sendJson|useMutation"
# Expected: no matches
Select-String -Path features\auth\session-header.tsx -Pattern "listPlaces|reorderDayStops|addDayStop"
# Expected: no matches
# Env: only NEXT_PUBLIC_API_URL required for F6 — no new FE API keys
Test-Path AGENT.md   # Expected: False

# Playwright MCP last (see Step 6.1 VALIDATION). Fail-closed if MCP unavailable.
```

All checks passing → F6 is done. Next: expand [`StepF7.md`](StepF7.md) from outline into full prompts, then run F7 batches. Do not implement F7 until that expansion exists.
