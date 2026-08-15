## Context

See `proposal.md` for why. Product SSOT is `docs/blueprint.md` F6; wire is `docs/frontendGuide.md` §8 places + trips edit, §6 envelopes, §16 trip-edit **20/min**; execution grain is `docs/steps/StepF6.md` (write) and `docs/steps/batches/F6a.md`–`F6b.md` (run). Spec deltas: `specs/places/spec.md`, `specs/trips/spec.md`. Built-so-far: `docs/app/system.md` (F5).

F5 left `lib/api/places.ts` as `export {}`, `lib/api/trips.ts` with get/list/claim/delete/geojson only, and trip detail + MapLibre without day-edit. Gateway already supports `parse: "paginated"` and `parse: "api"` — do not change the gateway for F6. Generated types already include places + day-edit paths. Auth chrome (`useAuthMe`) already exists — trips import it from the auth barrel only.

Playbook sequence wins: **6.2 then 6.1** (picker-first, unlike numeric labels). No new packages. No F7 in this change.

## Goals / Non-Goals

**Goals:**
- Land F6 in playbook order: 6.2 then 6.1, hard-stopped batches (F6a then F6b) inside one change.
- Keep places HTTP, trips HTTP, hooks/UI, and page mounts in separate modules so `/trips/[id]` never owns fetch or mutations.
- Prove catalog honesty (404/empty without blanking the day list) before any day-edit mutation.
- Keep day-edit failure copy distinct (401 / 403-guest / 403-owner / 409 / 422 / 429 / 503).
- Prove 6.1 in a live browser via Playwright MCP last (fail-closed).

**Non-Goals:**
- Vitest / `@playwright/test` CI smoke (F7).
- `@dnd-kit` / drag-and-drop polish.
- Optimistic UI with rollback.
- Inventing backend `duplicate_stop` / `session_mismatch` OpenAPI codes.
- Required-auth wrapper on `/trips/[id]`.
- New FE packages or FE API keys (`LLM_*`, `AUTH0_*`, `MAPTILER_API_KEY`, Context7, OAuth secrets).
- Changing the JSON gateway parse modes.
- Using EventSource / planner SSE for reoptimize.
- Expanding or implementing F7.

## Decisions

### 1. One change, two hard-stopped batches, picker-first

Execute `docs/steps/batches/F6a.md` (6.2) then `F6b.md` (6.1). Prompt bodies stay in `StepF6.md`. Do not merge 6.2–6.1 into one prompt body. Stop F6a until `/trips/{id}` shows picker list or empty/404, the day list is still visible, and there is still no day-edit HTTP. Stop F6b at the F6 ship checklist after PowerShell greps **and** Playwright MCP last.

**Alternative considered:** Two OpenSpec changes (`implement-fe-step-f6a` / `f6b`). Rejected — they share trip detail composition and one trips HTTP module; F1–F5 used one implement change per phase. Batch files remain the apply-session grain.

**Alternative considered:** Follow blueprint numeric order 6.1 then 6.2. Rejected — playbook lock: add-stop without `GET /places` is fake. Blueprint numbers stay 6.1 / 6.2.

**Alternative considered:** One apply session that writes picker + mutations together. Rejected — playbook forbids jumping ahead; 404/empty-without-blanking-trip proofs are easy to skip inside an add-stop rush.

### 2. Extend modular layers (principle #16)

```
lib/api/places.ts                  REPLACE stub export {}
                                   PLACES_PATH = "/api/v1/places" satisfies keyof paths
                                   listPlaces({ destination_id, page?, size? }, signal)
                                     getJson parse "paginated" → PlaceOut items
                                   getPlace OPTIONAL (parse "api") — skip unless a row needs it
                                   MUST NOT add trip-edit here

lib/api/trips.ts                   KEEP getTrip / getTripGeojson / list / claim / delete
                                   reorderDayStops / addDayStop / removeDayStop / reoptimizeDay
                                   All four parse "api" → TripOut
                                   Paths satisfy keyof paths with {trip_id}/{day}/{place_id}
                                   MUST NOT put GET /places here

features/places/use-places.ts      Query key ["places", destinationId] (+ page/size)
features/places/places-picker.tsx  list UI; 404 / empty / retry
features/places/index.ts           public barrel

features/trips/use-reorder-stops.ts    useMutation; retry: false; invalidate trip + geojson
features/trips/use-add-stop.ts         same
features/trips/use-remove-stop.ts      same
features/trips/use-reoptimize-day.ts   same
features/trips/day-edit-controls.tsx   owner-gated reorder / remove / reoptimize
features/trips/add-stop-control.tsx    mounts PlacesPicker from features/places barrel
features/trips/index.ts                export edit pieces; do not re-export places HTTP

app/trips/[id]/page.tsx            still Server Component; mounts barrels only
                                   MAY compose trips + places barrels
                                   no getJson / useQuery / useMutation / fetch
app/trips/page.tsx                 unchanged — no day-edit on list

features/auth/*                    edit MAY use useAuthMe from auth barrel
                                   MUST NOT import lib/api/auth from trips or places
features/planner/*                 unchanged
features/auth/session-header.tsx   unchanged — still no trips/places HTTP
```

- Mirror existing HTTP: path `satisfies keyof paths`, replace path params, pass `signal`.
- Places Query: `enabled` when `destinationId` is a non-empty string from the loaded trip; `retry: 1` (idempotent GET). Mutations: `retry: false` (or 0).
- Trips MAY import picker/hooks from the `features/places` barrel. MUST NOT import `lib/api/places`.

**Alternative considered:** Put `GET /places` in `lib/api/trips.ts`. Rejected — principle #16; playbook hard lock.

**Alternative considered:** Fetch places on the Server Component. Rejected — cookie-aware client Query with AbortSignal; page mounts barrels only.

**Alternative considered:** New `features/day-edit` package. Rejected — same domain as trip detail; extend `features/trips` and add `features/places`.

### 3. Envelope modes stay as playbook locks

| Call | Method | Parse | Notes |
|------|--------|-------|-------|
| `listPlaces` | GET | `paginated` | Bare `PaginatedResponse`; `destination_id` required |
| `getPlace` | GET | `api` | Optional; skip in 6.2 unless needed |
| `reorderDayStops` | PATCH | `api` | Body `ReorderStopsIn` `{ place_ids }` |
| `addDayStop` | POST | `api` | Body `AddStopIn` `{ place_id }` |
| `removeDayStop` | DELETE | `api` | HTTP **200** TripOut — **not** `empty` / 204 |
| `reoptimizeDay` | POST | `api` | No body; JSON, not SSE |

Do not force places list through `ApiResponse`. Do not parse remove-stop as 204 (`deleteTrip` remains the only `parse: "empty"` trip call). Do not change `lib/api/client.ts` for F6.

**Alternative considered:** Parse remove-stop as `empty` like trip delete. Rejected — OpenAPI / playbook: remove-stop returns 200 `ApiResponse[TripOut]`.

### 4. No optimistic UI; invalidate trip + geojson

On mutation success, `setQueryData(["trips", id], trip)` and/or invalidate `["trips", id]` + `["trips", id, "geojson"]` so MapLibre refreshes from server GeoJSON. Never invent coordinates. List key `["trips","list"]` MAY invalidate (optional). Do not paint the new order before the server answers.

**Alternative considered:** Optimistic reorder with rollback on 403/409/422/429. Rejected — playbook: no optimistic UI in F6 MVP. If added later, rollback is mandatory.

### 5. Distinct failures without inventing OpenAPI codes

Map status + `ErrorResponse.code` + message/details + viewer context (`useAuthMe`) + known trip `user_id`:

| Case | Typical signal | Copy / CTA |
|------|----------------|------------|
| Not authenticated | 401 / `unauthorized` | Login CTA; controls hidden/disabled |
| Session mismatch | 403 + guest/session context | Different-session copy; **no** login-as-fix |
| Ownership | 403 + authenticated | Distinct ownership copy |
| Duplicate / conflict | 409 | Duplicate-conflict copy; no silent duplicate |
| Validation | 422 / `validation_error` | Toast from `details`; no fake itinerary change |
| Rate limit | 429 / `rate_limit_exceeded` | Backoff toast; brief CTA disable (20/min) |
| Reoptimize LLM down | 503 / `llm_unavailable` | Service-unavailable toast; **no FE LLM key** |
| Places 404 | 404 / `not_found` | Picker error/empty; day list stays |
| Places empty | `items: []` | Empty picker; never invent places |
| Places 5xx | network / 5xx | Toast + picker retry; day list stays |

**Alternative considered:** One generic “couldn’t edit” toast. Rejected — blueprint / playbook hard lock.

**Alternative considered:** Wait for backend `duplicate_stop` / `session_mismatch` codes. Rejected — FE ships distinct copy now from status + context.

### 6. Reorder via up/down; add from picker; reoptimize is JSON

- Reorder: move-up / move-down rebuilding `place_ids` for that day. Do not install `@dnd-kit`.
- Add-stop: open/use the 6.2 picker (inline or sheet). `place_id` from catalog `PlaceOut.id`.
- Remove: confirm (or equivalent explicit control).
- Reoptimize: `sendJson` POST, no body. Do **not** use `EventSource` or `lib/sse/planner.ts`.

**Alternative considered:** Drag-and-drop in F6. Rejected — packages at point of use; dnd is polish, not MVP.

**Alternative considered:** Reoptimize via planner SSE. Rejected — wire is a JSON POST; SSE is generate-only.

### 7. Playwright MCP last (6.1 / F6 ship only); fail-closed

PowerShell greps on **every** fence. **Additionally**, step 6.1 and the F6 ship checklist MUST run Playwright MCP (`plugin-playwright-playwright`: `browser_navigate`, `browser_snapshot`, `browser_click`, …) against `http://localhost:3000`.

Do **not** `npm install @playwright/test`. Do **not** add `e2e/` specs (F7.3). Do **not** run Playwright MCP in F6a / 6.2.

If MCP tools are unavailable: **fail the validation** (not a silent pass). Fall back only to a documented **manual** browser pass with the same checklist, with written evidence.

MCP sequence on an owned trip (FE `http://localhost:3000`, API from `NEXT_PUBLIC_API_URL`):

1. `browser_navigate` → `/trips/{id}`; snapshot — day list visible (list-first).
2. Open add-stop picker; snapshot — places from `GET /places?destination_id=` (or empty/404 UI, trip not blank).
3. Add a place → day list updates; network POST `.../stops` with credentials.
4. Add the same place again → duplicate-conflict copy; itinerary not silently duplicated.
5. Reorder (up/down) or remove (confirm) → trip view updates; geojson refetch allowed.
6. Guest / logged-out (or disabled controls) → no successful PATCH/POST/DELETE day-edit.

**Alternative considered:** Skip browser proof because F7 will add Playwright. Rejected — playbook last-step lock; F7.3 is CI `@playwright/test`, not this MCP pass.

**Alternative considered:** Install `@playwright/test` now. Rejected — packages at point of use (F7.3).

### 8. Env / API keys for F6

| Variable | Required for F6? | Notes |
|----------|------------------|-------|
| `NEXT_PUBLIC_API_URL` | **Yes** | Already in `.env.example` (default `http://localhost:8000`). Copy into `.env.local`. |
| `NEXT_PUBLIC_MAP_STYLE_URL` | **Optional** | F4 map. Edits invalidate geojson; list-first still applies. |
| MapTiler / Google Maps JS / LLM / Auth0 / OAuth client secrets / Context7 | **No in FE** | Never in Next env. Backend `.env` on the API process only. |
| Google login | Redirect only | `{NEXT_PUBLIC_API_URL}/api/v1/auth/google` — backend owns OAuth |
| Cookies | Set by API | Places GET needs none. Day-edit needs `wandr_session` + `wandr_token` (httpOnly) for the **owner**. |

**Alternative considered:** Add FE `LLM_*` for reoptimize. Rejected — reoptimize is a JSON POST owned by FastAPI.

**Alternative considered:** Add MapTiler secret to FE because geojson refreshes. Rejected — map style URL is already optional public `NEXT_PUBLIC_*`; secret stays on the style host / API.

## Risks / Trade-offs

- [Sibling API down or no trip with `destination_id` for picker proofs] → Mitigation: F6a needs local API + a real destination; stop the batch if API is down; do not invent `PlaceOut` rows.
- [Agent puts places HTTP in `trips.ts` or imports `lib/api/places` from trips] → Mitigation: F6a/F6b greps; modular lock.
- [Agent parses remove-stop as 204 / `empty`] → Mitigation: playbook + 6.1 grep of `removeDayStop` context; only `deleteTrip` uses `empty`.
- [Agent auto-retries mutations or paints optimistic order] → Mitigation: `retry: false` grep; no optimistic UI lock.
- [Agent uses EventSource for reoptimize] → Mitigation: grep `EventSource` / `lib/sse/planner` under `features/trips`.
- [Agent collapses 403/409/422/429 into one toast] → Mitigation: spec scenarios + ship checklist distinct-copy proofs.
- [Agent installs `@playwright/test` or `@dnd-kit`] → Mitigation: `package.json` grep expected empty; MCP-only last validation.
- [Playwright MCP unavailable] → Mitigation: Decision 7 fail-closed; manual checklist with written evidence only — never silent green.
- [Anonymous edits] → Mitigation: `useAuthMe` gates; guest controls hidden/disabled; MCP step 6.
- [Reoptimize 503 needs an FE LLM key] → Mitigation: toast like other service failures; no new env var.
- [Map style missing after edit] → Mitigation: list-first already shipped in F4; invalidate geojson; do not invent coordinates.

## Migration Plan

Local FE only. Operators need `.env.local` with `NEXT_PUBLIC_API_URL` (already required) and the sibling API up. F6a: a trip with a real `destination_id` (places GET is public). F6b: authenticate as the trip **owner** via existing Google redirect or local Option A cookies. Map style URL is optional.

Rollback = revert this change’s commits (picker + day-edit removed; F5 list/claim/delete and F4 detail/map remain). No production deploy.

After the F6 ship checklist in `StepF6.md` is green, update `docs/app/system.md` to the F6 as-built snapshot. A separate change expands `StepF7.md`.

## Open Questions

None. Playwright MCP vs `@playwright/test` is locked in Decision 7. `getPlace` is optional and skipped unless a row truly needs the single-place envelope. Picker chrome (inline vs sheet) is an implementation detail that does not change specs.
