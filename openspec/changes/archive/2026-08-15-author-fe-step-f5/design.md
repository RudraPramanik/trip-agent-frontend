## Context

See `proposal.md` for why. `docs/blueprint.md` (F5) remains the product SSOT. Wire contract is `docs/frontendGuide.md` §8 trips (Required auth for list/claim/delete), §5 cookies, §6 envelopes (bare pagination; DELETE 204). Guest-mismatch and modular layers are already `AGENTS.md` hard rules. `docs/steps/StepF5.md` is an outline; `_template.md` and `StepF4.md` are the prompt-file pattern to copy.

F4 code is on disk: `getTrip` / `getTripGeojson` in `lib/api/trips.ts`; trip detail + dual 403 panels + MapLibre in `features/trips/`; `app/trips/[id]/page.tsx` mounts barrels only. Gateway already supports `parse: "api" | "raw" | "paginated" | "empty"`. Generated OpenAPI already has `GET /api/v1/trips`, `POST /api/v1/trips/{trip_id}/claim`, `DELETE /api/v1/trips/{trip_id}` (204). `docs/app/system.md` is the F4 as-built snapshot (explicitly: no list / claim / delete yet).

This change writes playbooks only. It does not implement list, claim, or delete.

## Goals / Non-Goals

**Goals:**
- Same two grains as F0–F4: one fenced prompt per sub-step in `StepF5.md`; thin `F5a` / `F5b` batch files that point into it.
- Lock a modular trips-extension architecture so a later implement change cannot put `getJson` / `useMutation` in `app/` pages, invent endpoints, auto-retry claim/delete, or collapse claim failures into one generic toast.
- Name every F5 failure boundary the implementer must prove (401 on list, empty list UI, claim 401 vs session-mismatch 403 vs already-claimed 403/409, delete 403/404, 204 cache drop).
- Keep 5.1 (list) as its **own** batch so login-CTA and empty-list proofs are not skipped in a claim/delete rush.
- Document FE env / API URL / keys clearly in the playbook: F5 needs `NEXT_PUBLIC_API_URL` only; no new FE API keys.
- Point `docs/app/system.md` at F4-as-built so F5 prompts can cite real trip detail without pretending list/claim exist.

**Non-Goals:**
- Implementing F5 application code (list UI, claim button, delete) in **this** (docs) change.
- Editing `docs/frontendGuide.md`, `docs/blueprint.md`, `AGENTS.md`, or the backend repo.
- Expanding `StepF6.md`–`StepF7.md` beyond their outlines.
- Installing new packages in this authoring pass (blueprint lists none for F5).
- Inventing day-edit (F6), evaluation HTTP, a narrative API, or a dedicated backend `session_mismatch` / `already_claimed` error code (use HTTP status + `ErrorResponse.code` + viewer context as documented).

## Decisions

### 1. Two-layer files (same as F0–F4)

`StepF5.md` is the SSOT for locks, architecture, failure table, feature buildup, and one fenced prompt per sub-step. `docs/steps/batches/F5a.md` and `F5b.md` are session gates: prerequisites, read pointers, order, hard stop, proofs. They do not duplicate prompt bodies.

**Alternative considered:** Self-contained batch files that inline prompts. Rejected — two copies drift (F0 decision 1).

### 2. Batch split: F5a → F5b

| Batch | Sub-steps | Why |
|-------|-----------|-----|
| F5a | 5.1 | Authenticated trip list (`GET /trips` bare paginated); 401 → login CTA; empty → empty UI. No claim/delete. |
| F5b | 5.2 + 5.3 | Claim (`POST …/claim`) with distinct failure copy; delete (`DELETE` 204) with list-cache invalidation. |

Blueprint numbers stay 5.1–5.3. Run order is numeric. 5.1 stays its own batch so “required auth list” cannot hide inside claim work. 5.2 and 5.3 share F5b because both are Required-auth mutations that invalidate the same Query keys — one session, two fenced prompts in order (5.2 then 5.3), hard stop after each fence’s VALIDATION.

**Alternative considered:** One session for 5.1–5.3. Rejected — mixing list CTA with claim/delete is how 401→login and empty-list proofs get skipped.

**Alternative considered:** Separate F5c for delete only. Rejected — outline and blueprint batch table group claim+delete; invalidation story is shared; two fences inside F5b keep grain without a third batch file.

### 3. Modular layers — LOCKED in the playbook

Prompts must name these files and forbid crossing them:

```
lib/api/trips.ts                   EXTEND (do not replace getTrip / getTripGeojson)
                                   listTrips:  GET  /api/v1/trips              parse "paginated"
                                   claimTrip:  POST /api/v1/trips/{trip_id}/claim  parse "api"
                                   deleteTrip: DELETE /api/v1/trips/{trip_id}  parse "empty" (204)
                                   TRIPS_LIST_PATH / CLAIM_PATH / TRIP_PATH satisfy keyof paths
                                   AbortSignal; credentials via gateway
                                   MUST NOT add day-edit / places picker in F5

features/trips/use-trips-list.ts   Query key ["trips","list"] (+ page/size if used)
features/trips/use-claim-trip.ts   useMutation; invalidate ["trips","list"] + ["trips", id]
features/trips/use-delete-trip.ts  useMutation; invalidate ["trips","list"]; drop ["trips", id]
features/trips/trips-list.tsx      paginated items; empty UI; 401 login CTA
features/trips/claim-trip-button.tsx  (or equivalent on trip detail) — distinct failure copy
features/trips/delete-trip-control.tsx (list and/or detail) — confirm; 403/404 handling
features/trips/index.ts            public barrel — export new hooks/UI

app/trips/page.tsx                 NEW list route (Server Component); mounts trips barrel only
                                   no getJson / useQuery / fetch
app/trips/[id]/page.tsx            unchanged mount pattern; MAY gain claim/delete via barrel
                                   still no direct gateway / Query / fetch

features/auth/*                    list/claim MAY use useAuthMe from auth barrel for CTA/context
                                   MUST NOT import lib/api/auth from trips
features/planner/*                 unchanged — no list/claim/delete ownership
```

Rules the prompts must repeat:

- HTTP stays in `lib/api/trips.ts`. Hooks and trip list/claim/delete UI stay in `features/trips/`.
- `app/trips/page.tsx` and `app/trips/[id]/page.tsx` only mount public barrels. They do not own Query keys, DTO parsing, or mutations.
- Features MUST NOT import each other’s HTTP modules. Trips MAY import `useAuthMe` from the `features/auth` barrel. MUST NOT import `lib/api/auth`.
- Header stays fetch-free of trips. Do not put list/claim/delete in `session-header.tsx`.
- Wire types: `TripOut` and `PaginatedResponse_TripOut_` from `types/generated/api.d.ts`. Do not invent fields. Do not hand-edit generated files.
- Mutations: **no automatic retries**. Idempotent list GET may retry at most 1 (same as other GETs).

**Alternative considered:** Put trip list under `features/auth` because Required auth. Rejected — trips own trip HTTP; auth owns session probe only (principle #16).

**Alternative considered:** Parse list as `parse: "api"`. Rejected — envelope exception; `frontendGuide.md` §6 bare `PaginatedResponse`.

**Alternative considered:** Parse DELETE as `parse: "api"`. Rejected — HTTP 204 empty body; gateway `parse: "empty"`.

### 4. My trips list — LOCKED (5.1)

- `listTrips({ page?, size? }, signal)` via `getJson` + `parse: "paginated"`. Defaults align with guide (`page=1`, `size=20`, size max 100) — pass only what OpenAPI query params allow.
- Query key MUST be `["trips","list"]` (include page/size in the key if the UI paginates). `enabled` when the viewer is authenticated (from `useAuthMe`); do **not** fire anonymous list polls.
- Route: `/trips` (new `app/trips/page.tsx`). Authenticated user sees items from `items[]`. Empty `items` → empty UI; never fake trips.
- 401 / `unauthorized` → login CTA (acknowledge OAuth gap / incomplete bounce). Do **not** spin forever. Do **not** show a fake guest list.
- Guests who open `/trips` → same login CTA path (no anonymous list). Guest trip detail at `/trips/[id]` remains as F4 (Optional + ownership).
- Install **no new packages** at 5.1.

**Alternative considered:** Client-side filter of all trips without auth. Rejected — API is Required; FE must not invent an anonymous list.

### 5. Claim trip — LOCKED (5.2)

- `claimTrip(tripId, signal)` via `sendJson` POST, `parse: "api"` → `TripOut`. Path uses `{trip_id}` replacement (mirror getTrip).
- Required auth. **Do not claim without login** — disable/hide CTA when guest; if somehow called, 401 → login CTA (not a success toast).
- On success: invalidate `["trips","list"]` and `["trips", id]` (and geojson key if present so owner state refreshes). Optionally toast success.
- Failure copy MUST be distinct (same spirit as F4.1 dual 403s) — **not** one generic “couldn’t claim” toast:
  - **Not authenticated (401):** login CTA / prompt login.
  - **Session mismatch (403 + guest or ownership/session context):** “This trip belongs to a different session” (or equivalent). Login would not fix a mismatched `wandr_session` — do not offer login as the fix when context says mismatch.
  - **Already claimed / ownership conflict (403 or 409 as API returns):** clear “already claimed” / cannot claim copy. Map from `ErrorResponse.code` + status; do not invent a code if OpenAPI only documents generic `forbidden` — distinguish with status + message/details + known trip `user_id` when available.
- ☁️ Document in playbook: claim needs working login cookies and a **matching** `wandr_session` after Google login (`frontendGuide.md` §5 rule 6). Until API `FRONTEND_URL` bounce works, treat claim as **best-effort** on local Option A cookies — proofs may be local-cookie only; do not block the phase on production bounce.
- No blind mutation retry. AbortSignal required.
- Install **no new packages** at 5.2.

**Alternative considered:** One generic claim-failure toast. Rejected — blueprint F5.2 and Failure Boundary Summary require distinct copy.

**Alternative considered:** Wait for polished OAuth bounce before authoring claim. Rejected — blueprint explicitly documents best-effort local Option A.

### 6. Delete trip — LOCKED (5.3)

- `deleteTrip(tripId, signal)` via `sendJson` DELETE, `parse: "empty"` (HTTP 204).
- Required + ownership. **No anonymous delete** — guests get login CTA / disabled control; never call delete as guest expecting success.
- On 204: remove from list cache (invalidate or optimistic remove on `["trips","list"]`); drop `["trips", id]` and `["trips", id, "geojson"]` from cache; navigate away from detail if current route is that trip.
- 403 → ownership/forbidden copy (do not pretend deleted). 404 / `not_found` → already-gone / not-found copy; refresh list.
- Confirm before delete (destructive). No blind retry.
- Install **no new packages** at 5.3.

**Alternative considered:** Soft-hide without calling DELETE. Rejected — wire contract is DELETE 204.

### 7. Env, API URL, and keys — LOCKED (document in playbook)

| Need | Value | F5? |
|------|--------|-----|
| API base URL | `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:8000`) | **Required** — already in `.env.example` |
| Map style | `NEXT_PUBLIC_MAP_STYLE_URL` | Not needed for F5 (F4 map only) |
| FE API keys (MapTiler, Google Maps JS, LLM, OAuth client secret) | — | **None.** FE never holds them for MVP |
| Google login | Browser navigates to `{NEXT_PUBLIC_API_URL}/api/v1/auth/google` | Backend owns OAuth; FE redirects only |
| Cookies | `wandr_session` + `wandr_token` (httpOnly, set by API) | Required for authenticated list/claim/delete |

Playbook prerequisites for later implement proofs: sibling API up; `.env.local` has `NEXT_PUBLIC_API_URL`; user can obtain an authenticated cookie (local Option A). No new `.env` keys in F5.

### 8. Packages — LOCKED

| Step | Install | Do not |
|------|---------|--------|
| 5.1 | none | Vitest, Playwright, day-edit deps, new state libs |
| 5.2 | none | Blind claim retry, invent claim DTO fields |
| 5.3 | none | Anonymous delete, force-delete without confirm |

No F5 row in blueprint Package Install Order — correct. Reuse TanStack Query + Sonner already present.

### 9. Prompt mechanics (copy F4)

Each fence: read `AGENTS.md` + F5 locks first; TASK; FEATURE BUILDUP (EXISTS / STILL EMPTY); FAILURE MODE; LLD pattern; WHAT TO CREATE (concrete paths); RULES (Do NOT jump ahead); PowerShell VALIDATION.

F5a prerequisites: F4 ship checklist green; API up; auth cookie path available for list proofs.

F5b prerequisites: F5a green (list renders; 401 CTA works). Claim proof may be best-effort local cookies.

F5 ship checklist at the bottom of `StepF5.md` before F6 expansion: authenticated list from bare pagination; empty UI; 401→login CTA; claim distinct failure copy; delete 204 drops list cache; no anonymous list/delete; no day-edit; pages have no `getJson` / `useMutation`; header has no trips HTTP; no new FE API keys.

Update `docs/steps/README.md` with an F5 batches table. Leave F6–F7 outlines.

`docs/app/system.md` stays F4 as-built. Authoring pass cites it; do not rewrite the snapshot as if F5 code existed.

### 10. Auth and guest path

`GET /trips` / claim / delete are **Required**. Guest flows on `/trips/[id]` (F4) stay intact. Do not wrap trip **detail** in required-auth. Do wrap or gate the **list** UX so anonymous users see login CTA, not a spinning query. Do not implement OAuth bounce (`FRONTEND_URL`) in F5 — document the gap. Do not implement day-edit (F6).

## Risks / Trade-offs

- [Agent implements F5 code while writing the playbook] → Mitigation: every task and batch file restates docs-only; `lib/api/trips.ts` must still lack list/claim/delete when this change archives.
- [Agent pastes the whole `StepF5.md`] → Mitigation: header + README: one fence or one batch file.
- [One generic claim-failure toast] → Mitigation: locked three-way copy; VALIDATION greps distinct unauthenticated / session-mismatch / already-claimed wording.
- [Anonymous list or delete] → Mitigation: locked; VALIDATION: list query disabled for guests; delete/claim CTAs gated.
- [Mutation auto-retry] → Mitigation: locked; greps must not show `retry: true` (or unbounded) on claim/delete mutations.
- [List parsed as ApiResponse] → Mitigation: locked `parse: "paginated"`; cite §6 envelope exception.
- [DELETE parsed as JSON envelope] → Mitigation: locked `parse: "empty"` for 204.
- [Day-edit sneaks in] → Mitigation: forward lock; VALIDATION: no reorder/add/remove/reoptimize client paths in F5.
- [Claim blocked waiting on FRONTEND_URL bounce] → Mitigation: playbook documents best-effort local Option A; ship checklist does not require production bounce.
- [New FE API key invented] → Mitigation: env table locks “none”; only `NEXT_PUBLIC_API_URL` required.

## Migration Plan

Docs-only. No deploy. Rollback = restore the F5 outline, delete `F5a.md` / `F5b.md`, revert the README F5 table.

## Open Questions

None. Batch split (F5a list; F5b claim+delete), modular layer paths, `parse` modes, Query keys, distinct claim-failure copy, env/API-key stance, and docs-only authoring are locked above. Exact claim CTA placement (detail-only vs list+detail) is an implement detail inside `features/trips/` as long as failures stay distinct and layers stay clean — record preferred default in the 5.2 prompt as **trip detail primary CTA** (matches MVP screen flow “Claim after Google login” on the trip).
