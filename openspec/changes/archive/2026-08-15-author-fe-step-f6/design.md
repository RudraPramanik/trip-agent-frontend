## Context

See `proposal.md` for why. `docs/blueprint.md` (F6) remains the product SSOT. Wire contract is `docs/frontendGuide.md` §8 trips edit + §8 places, §6 envelopes (bare pagination; day-edit returns `ApiResponse[TripOut]`), §16 trip-edit **20/min**. Guest-mismatch, no-blind-retry, and modular layers are already `AGENTS.md` hard rules. `docs/steps/StepF6.md` is an outline; `_template.md` and `StepF5.md` are the prompt-file pattern to copy.

F5 code is on disk: `listTrips` / `claimTrip` / `deleteTrip` plus F4 `getTrip` / `getTripGeojson` in `lib/api/trips.ts`; list/claim/delete UI in `features/trips/`; `lib/api/places.ts` is still `export {}`; no `features/places/`. Gateway already supports `parse: "api" | "raw" | "paginated" | "empty"`. Generated OpenAPI already has places list/get and the four day-edit operations. `docs/app/system.md` is the F5 as-built snapshot (explicitly: no day-edit / places picker yet).

This change writes playbooks only. It does not implement picker or mutations.

## Goals / Non-Goals

**Goals:**
- Same two grains as F0–F5: one fenced prompt per sub-step in `StepF6.md`; thin `F6a` / `F6b` batch files that point into it.
- Lock a modular places + trips-edit architecture so a later implement change cannot put `getJson` / `useMutation` in `app/` pages, import `lib/api/places` from trips, parse remove-stop as HTTP 204, auto-retry edits, or skip the places picker.
- Name every F6 failure boundary the implementer must prove (unknown destination 404, empty places page, 401 on edit, dual 403, 409 duplicate, 422, 429 trip-edit, no guest mutations).
- Keep 6.2 (picker) as its **own** batch so add-stop cannot invent a fake place list.
- Document FE env / API URL / keys clearly: F6 needs `NEXT_PUBLIC_API_URL` only; no new FE API keys; map style optional.
- Require a **Playwright MCP** browser pass as the **last** validation (F6b / 6.1 + ship checklist). Do not install `@playwright/test`.

**Non-Goals:**
- Implementing F6 application code (places HTTP, picker UI, reorder/add/remove/reoptimize) in **this** (docs) change.
- Editing `docs/frontendGuide.md`, `docs/blueprint.md`, `AGENTS.md`, or the backend repo.
- Expanding `StepF7.md` beyond its outline.
- Installing new packages in this authoring pass (blueprint Package Install Order has **no F6 row**).
- Inventing `@dnd-kit`, a narrative API, evaluation HTTP, a dedicated `duplicate_stop` error code, or FE LLM keys for reoptimize.

## Decisions

### 1. Two-layer files (same as F0–F5)

`StepF6.md` is the SSOT for locks, architecture, failure table, feature buildup, and one fenced prompt per sub-step. `docs/steps/batches/F6a.md` and `F6b.md` are session gates: prerequisites, read pointers, order, hard stop, proofs. They do not duplicate prompt bodies.

**Alternative considered:** Self-contained batch files that inline prompts. Rejected — two copies drift (F0 decision 1).

### 2. Batch split: F6a (6.2) → F6b (6.1) — picker before mutations

| Batch | Sub-steps | Why |
|-------|-----------|-----|
| F6a | **6.2** | Places picker (`GET /places?destination_id=`); 404 unknown destination; empty page OK. **No** day-edit mutations. |
| F6b | **6.1** | Reorder / add / remove / reoptimize. Add-stop **must** use the 6.2 picker. Invalidate trip + geojson. Playwright MCP last. |

Blueprint numbers stay 6.1–6.2. **Run order is 6.2 then 6.1** (unlike numeric order). The F6 outline already called this out: add-stop without a picker is fake. F0 did the same inversion (0.6 type-lock before 0.3 client).

6.1 stays **one** fenced prompt covering all four mutations (blueprint grain). F6b is one session, one fence, then ship checklist + Playwright MCP. Do not invent 6.3.

**Alternative considered:** Numeric 6.1 then 6.2. Rejected — add-stop would hardcode a place_id or invent a stub list.

**Alternative considered:** Split 6.1 into four fences. Rejected — blueprint is one sub-step; four mutations share the same parse mode, owner gate, and invalidation. One fence with a named WHAT TO CREATE list + failure table is enough if 6.2 already exists.

**Alternative considered:** Picker + add in F6a, remaining mutations in F6b. Rejected — outline and blueprint keep picker vs mutations as the two grains; mixing add into the picker session is how 404/empty-page proofs get skipped.

### 3. Modular layers — LOCKED in the playbook

Prompts must name these files and forbid crossing them:

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

Rules the prompts must repeat:

- HTTP stays in `lib/api/places.ts` and `lib/api/trips.ts`. Hooks/UI stay in the matching feature folder.
- Features MUST NOT import each other’s HTTP modules. Trips MAY import picker/hooks from the `features/places` **barrel**. MUST NOT import `lib/api/places`.
- `app/trips/[id]/page.tsx` only mounts public barrels. It does not own Query keys, DTO parsing, or mutations.
- Wire types: `PlaceOut`, `ReorderStopsIn`, `AddStopIn`, `TripOut` from `types/generated/api.d.ts`. Do not invent fields. Do not hand-edit generated files.
- Mutations: **no automatic retries**. Idempotent places GET may retry at most 1.
- **No optimistic UI in F6 MVP.** All four edit routes return `ApiResponse[TripOut]`. On success, `setQueryData(["trips", id], trip)` and/or invalidate `["trips", id]` + `["trips", id, "geojson"]`. If a later implementer adds optimistic updates, they MUST rollback on 403/409/422/429 — playbook default is invalidate-only so rollback bugs are not the happy path.

**Alternative considered:** Put picker HTTP inside `lib/api/trips.ts`. Rejected — principle #16; places is its own domain (`frontendGuide.md` §8 `places`).

**Alternative considered:** Put picker UI inside trips and import `lib/api/places` from trips. Rejected — features must not import each other’s HTTP modules.

**Alternative considered:** Parse remove-stop as `parse: "empty"` like trip delete. Rejected — OpenAPI says HTTP **200** `ApiResponse[TripOut]`. Only `DELETE /trips/{id}` is 204.

**Alternative considered:** `@dnd-kit` for reorder. Rejected — no F6 package row; use move-up / move-down (or equivalent) with `ReorderStopsIn.place_ids`. Drag-and-drop can land in F7 polish if needed.

### 4. Places picker — LOCKED (6.2)

- `listPlaces({ destination_id, page?, size? }, signal)` via `getJson` + `parse: "paginated"`. `destination_id` is **required** (OpenAPI query). Defaults `page=1`, `size=20` if the UI paginates — pass only OpenAPI params.
- Query key MUST be `["places", destinationId]` (include page/size if paginating). Source `destination_id` from the open trip’s `TripOut.destination_id` — do not invent one.
- Auth: **None**. Picker GET may run for guests, but 6.2 MUST NOT expose add-stop mutations. Prefer showing the picker only in the owner add-stop flow in 6.1; 6.2 may mount a read-only picker on trip detail for proof, or a feature-internal preview — as long as **no** PATCH/POST/DELETE day-edit fires in F6a.
- Unknown destination → 404 / `not_found`: picker empty/error panel; **do not** blank the trip day list.
- Empty `items` → empty UI; never invent places.
- `getPlace` is **optional**. List `PlaceOut` already has id/name/category/lat/lng. Add `getPlace` only if a later row needs the single-place envelope. Do not invent a third places route.
- Install **no new packages** at 6.2.

**Alternative considered:** Client-side filter of `TripOut.places` as the “picker.” Rejected — blueprint 6.2 is `GET /places?destination_id=`; trip stops are not the catalog.

### 5. Edit mutations — LOCKED (6.1)

All Required + owner. Guests: hide/disable controls; never call expecting success. 401 → login CTA. Trip **detail** stays Optional + ownership (F4) — do not wrap `/trips/[id]` in required-auth.

| Client | Method / path | Body | Parse |
|--------|----------------|------|-------|
| `reorderDayStops` | PATCH `.../days/{day}/stops/reorder` | `ReorderStopsIn` `{ place_ids }` | `"api"` |
| `addDayStop` | POST `.../days/{day}/stops` | `AddStopIn` `{ place_id }` | `"api"` |
| `removeDayStop` | DELETE `.../days/{day}/stops/{place_id}` | none | `"api"` (200 TripOut, **not** 204) |
| `reoptimizeDay` | POST `.../days/{day}/reoptimize` | **none** | `"api"` |

- Add-stop MUST open/use the 6.2 picker. Picking a place already on that day MUST surface **duplicate conflict** (typically 409 + `ErrorResponse`; do not invent `duplicate_stop` if OpenAPI only has generic codes — map status + `code` + message/details).
- Remove is destructive enough to confirm (or equivalent explicit control). Reorder via up/down that rebuilds `place_ids` for that day.
- Reoptimize is a JSON POST, not SSE. Do **not** use `EventSource` or `lib/sse/planner.ts`. If API returns 503 `llm_unavailable`, toast like other service failures — no FE LLM key.
- On success: invalidate (or setQueryData from returned `TripOut`) `["trips", id]` and `["trips", id, "geojson"]` so MapLibre refreshes without inventing coordinates. List key `["trips","list"]` MAY invalidate if list rows show stop counts (optional).
- 429 / `rate_limit_exceeded` (trip-edit **20/min**): backoff toast + brief CTA disable. Proving 429 under load is optional/manual, not a flaky CI requirement — same stance as F2.1 search limiter.
- 422 / `validation_error`: toast from `details`; do not pretend the itinerary changed.
- 403: distinct copy by viewer context (guest session-mismatch vs authenticated ownership) — same F4.1 / Failure Boundary Summary rule. Login is not the fix for session mismatch.
- No blind mutation retry. AbortSignal required.
- Install **no new packages** at 6.1.

**Alternative considered:** Treat reoptimize as planner SSE. Rejected — OpenAPI is a POST that returns `ApiResponse[TripOut]`.

**Alternative considered:** Optimistic reorder. Rejected for MVP — returned `TripOut` is the source of truth; geojson must refetch anyway.

### 6. Env, API URL, and keys — LOCKED (document in playbook)

| Need | Value | F6? |
|------|--------|-----|
| API base URL | `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:8000`) | **Required** — already in `.env.example` |
| Map style | `NEXT_PUBLIC_MAP_STYLE_URL` | Optional (F4 map). Edits invalidate geojson; list-first still applies |
| FE API keys (MapTiler, Google Maps JS, LLM, OAuth client secret) | — | **None.** FE never holds them for MVP |
| Google login | Navigate to `{NEXT_PUBLIC_API_URL}/api/v1/auth/google` | Backend owns OAuth; FE redirects only |
| Cookies | `wandr_session` + `wandr_token` (httpOnly, set by API) | Required for day-edit; places GET needs none |

Playbook prerequisites for later implement proofs: sibling API up; `.env.local` has `NEXT_PUBLIC_API_URL`; an owned trip with a real `destination_id`; authenticated owner cookies. No new `.env` keys in F6.

### 7. Packages — LOCKED

| Step | Install | Do not |
|------|---------|--------|
| 6.2 | none | `@playwright/test`, Vitest, dnd-kit, places HTTP inside trips.ts |
| 6.1 | none | Blind mutation retry, parse remove-stop as 204, EventSource for reoptimize, FE LLM keys |

No F6 row in blueprint Package Install Order — correct. Reuse TanStack Query + Sonner already present.

### 8. Prompt mechanics (copy F5)

Each fence: read `AGENTS.md` + F6 locks first; TASK; FEATURE BUILDUP (EXISTS / STILL EMPTY); FAILURE MODE; LLD pattern; WHAT TO CREATE (concrete paths); RULES (Do NOT jump ahead); PowerShell VALIDATION.

F6a prerequisites: F5 ship checklist green; API up; `NEXT_PUBLIC_API_URL`; a trip with `destination_id` (auth not required for places GET).

F6b prerequisites: F6a green (picker lists or empty/404 without blanking trip detail). Owner cookies required for mutation proofs.

F6 ship checklist at the bottom of `StepF6.md` before F7 expansion: picker from `GET /places`; 404/empty handled; four edit clients `parse: "api"`; remove-stop not 204; invalidate trip + geojson; no mutation retry; 401/403/409/422/429 named; guests cannot mutate; pages have no `getJson` / `useMutation`; trips does not import `lib/api/places`; no new FE API keys; **Playwright MCP last pass green**.

Update `docs/steps/README.md` with an F6 batches table. Leave F7 outline.

`docs/app/system.md` stays F5 as-built. Authoring pass cites it; do not rewrite the snapshot as if F6 code existed.

### 9. Playwright MCP validation — LOCKED (last step only)

PowerShell-first greps stay on **every** fence (this repo is Windows). **Additionally**, the **last** fence (6.1) and the F6 ship checklist MUST instruct a Playwright MCP call — the Cursor Playwright MCP server (`plugin-playwright-playwright`: `browser_navigate`, `browser_snapshot`, `browser_click`, …). This is **not** F7.3:

- Do **not** `npm install @playwright/test`.
- Do **not** add `e2e/` specs or a CI smoke job (F7.3).
- Do **not** treat a skipped MCP (server unavailable) as a silent pass — the playbook must say: if MCP tools are unavailable, **fail the validation** and fall back to a documented manual browser pass with the same checklist, never a green check with no evidence.

Minimum MCP proof on an owned trip at `/trips/{id}` (FE `http://localhost:3000`, API from `NEXT_PUBLIC_API_URL`):

1. Snapshot day list (list-first still visible).
2. Open add-stop picker; places from `GET /places?destination_id=` (or empty/404 UI — not a blank trip).
3. Add a place → day list updates; network shows POST `.../stops` with credentials.
4. Duplicate add (same place) → conflict copy, itinerary not silently duplicated.
5. Reorder or remove → trip view updates; geojson refetch allowed.
6. Guest / logged-out (or disabled controls while guest) → no successful PATCH/POST/DELETE day-edit.

F6a (6.2) stays PowerShell + optional manual browser; MCP is reserved for the last step so the picker exists before the live add-stop proof.

**Alternative considered:** Install Playwright in F6. Rejected — blueprint installs `@playwright/test` at F7.3.

**Alternative considered:** MCP on every sub-step. Rejected — user asked for MCP **at last**; 6.2 has no mutations to prove end-to-end.

### 10. Auth and guest path

Places GET is public. Day-edit is **Required + owner**. Guest flows on `/trips/[id]` (F4 read) stay intact. Do not wrap trip detail in required-auth. Gate edit CTAs so anonymous users see login (or hidden controls), not a spinning mutation. Do not implement OAuth bounce (`FRONTEND_URL`) in F6. Do not implement F7 hardening.

## Risks / Trade-offs

- [Agent implements F6 code while writing the playbook] → Mitigation: every task and batch file restates docs-only; `lib/api/places.ts` must still be `export {}` and `lib/api/trips.ts` must still lack reorder/add/remove/reoptimize when this change archives.
- [Agent pastes the whole `StepF6.md`] → Mitigation: header + README: one fence or one batch file.
- [Numeric 6.1 first] → Mitigation: locked run order 6.2 → 6.1; F6a has no mutation clients.
- [Remove-stop parsed as 204] → Mitigation: locked `parse: "api"`; VALIDATION greps `parse: "empty"` only on `deleteTrip`, not on remove-stop.
- [Places HTTP inside trips.ts or trips imports `lib/api/places`] → Mitigation: locked layers; greps forbid `from "@/lib/api/places"` (or relative equivalent) under `features/trips`.
- [Mutation auto-retry] → Mitigation: locked `retry: false`; greps.
- [One generic edit-failure toast] → Mitigation: locked 401 / 403-guest / 403-owner / 409 / 422 / 429 copy.
- [Optimistic UI desyncs map] → Mitigation: locked invalidate-only; geojson key always invalidated on success.
- [Playwright npm package sneaks in] → Mitigation: locked “MCP not `@playwright/test`”; `package.json` unchanged in both author and (for F6) implement regarding Playwright.
- [MCP unavailable counted as pass] → Mitigation: playbook says fail-closed; manual checklist is the only alternate evidence.
- [New FE API key invented] → Mitigation: env table locks “none”; only `NEXT_PUBLIC_API_URL` required.
- [Reoptimize treated as SSE] → Mitigation: locked JSON POST; forbid EventSource / planner SSE client on the edit path.

## Migration Plan

Docs-only. No deploy. Rollback = restore the F6 outline, delete `F6a.md` / `F6b.md`, revert the README F6 table.

## Open Questions

None. Batch split (F6a picker 6.2; F6b mutations 6.1), modular layer paths, `parse` modes (including remove-stop 200 vs trip-delete 204), Query keys, invalidate-only, no new packages/keys, and Playwright MCP as last validation are locked above. Exact control chrome (sheet vs inline picker, up/down vs drag) is an implement detail inside `features/trips/` + `features/places/` as long as add-stop uses the picker, failures stay distinct, and layers stay clean — record preferred default in the 6.1 prompt as **inline/sheet picker + up/down reorder** (no new dnd package).
