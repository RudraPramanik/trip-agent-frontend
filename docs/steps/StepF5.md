# Wandr — F5 Cursor prompts: Claim & trip list

> Blueprint: [`docs/blueprint.md`](../blueprint.md) — Phase F5 (~1–2 days · claim + list)
> Wire contract: [`docs/frontendGuide.md`](../frontendGuide.md) §8 trips (Required auth), §5 cookies, §6 envelopes
> Guardrails: [`AGENTS.md`](../../AGENTS.md) — principle #16 Modular by default; guest-session-mismatch 403; credentials include
> Built-so-far: [`docs/app/system.md`](../app/system.md) (F4 as-built)
> Runner: [`README.md`](README.md)
>
> One prompt per sub-step. Paste **one** fence into Agent mode, or run a batch file under [`batches/`](batches/).
> Do not start the next prompt until the current validation passes.

**Run order is numeric:** **5.1 → 5.2 → 5.3**. F5.1 is its own session so 401→login CTA and empty-list proofs are not skipped. F5.2 and F5.3 share F5b (two fences, hard stop after each).

| Batch | File | Sub-steps |
|-------|------|-----------|
| F5a | [`batches/F5a.md`](batches/F5a.md) | 5.1 |
| F5b | [`batches/F5b.md`](batches/F5b.md) | 5.2 → 5.3 |

---

## How to use these prompts

1. Workspace root is this repo (`guideagent-frontend`). It **is** the Next.js app.
2. Read `node_modules/next/dist/docs/` before writing App Router code (this Next line has breaking changes vs training data).
3. Run one batch **or** paste one fence — not this whole file.
4. Validation is PowerShell-first.
5. If the agent collapses claim failures into one toast, puts list/claim HTTP on the page, auto-retries mutations, invents day-edit, or starts the next sub-step: stop and correct.

## Prerequisites (F4 must be complete)

- F4 ship checklist in [`StepF4.md`](StepF4.md) is green (trip detail from `TripOut`, dual 403 panels, Option A markdown, MapLibre list-first).
- `lib/api/trips.ts` has `getTrip` + `getTripGeojson` only — **no** `listTrips` / `claimTrip` / `deleteTrip` yet.
- `docs/app/system.md` is the F4 as-built snapshot (explicitly: no list / claim / delete).
- Gateway already supports `parse: "paginated"` and `parse: "empty"` (HTTP 204). Do **not** change the gateway for F5.
- **Env:** `NEXT_PUBLIC_API_URL` required (default `http://localhost:8000` in `.env.example`). **No new FE API keys** for F5. `NEXT_PUBLIC_MAP_STYLE_URL` is not needed for list/claim/delete.
- F5a needs the sibling API up and an authenticated cookie path for list proofs (local Option A).
- F5b claim may be **best-effort** on local cookies until API `FRONTEND_URL` OAuth bounce works — do not block the phase on production bounce.

## Prompt conventions (every step)

- First line of every prompt: read `AGENTS.md` and the F5 locks below.
- **Extend, don't replace** F4 trip detail / map unless the step says extend (keep `getTrip` / `getTripGeojson`; add list/claim/delete beside them).
- **Packages at point of use** — F5 installs **none**. Reuse TanStack Query + Sonner.
- **PowerShell-first** validation (`Select-String`, `Get-ChildItem`).
- **Do NOT jump ahead** to the next sub-step inside a single prompt body.
- Never invent endpoints or DTO fields. OpenAPI / `types/generated/api.d.ts` win on wire shapes; this playbook wins on sequence, layers, and proofs.

## F5 architecture

```
lib/api/trips.ts                   EXTEND (keep getTrip / getTripGeojson)
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
features/trips/claim-trip-button.tsx  (or equivalent) — primary CTA on trip detail; distinct failure copy
features/trips/delete-trip-control.tsx — confirm; 403/404 handling
features/trips/index.ts            public barrel — export new hooks/UI

app/trips/page.tsx                 NEW list route (Server Component); mounts trips barrel only
                                   no getJson / useQuery / fetch
app/trips/[id]/page.tsx            unchanged mount pattern; MAY gain claim/delete via barrel
                                   still no direct gateway / Query / fetch

features/auth/*                    list/claim MAY use useAuthMe from auth barrel for CTA/context
                                   MUST NOT import lib/api/auth from trips
features/planner/*                 unchanged — no list/claim/delete ownership
features/auth/session-header.tsx   unchanged — still no trips HTTP
```

Principle #16: HTTP in `lib/api/trips.ts`; hooks/UI in `features/trips/`; `app/` only mounts barrels. Trips MAY import `useAuthMe` from the `features/auth` barrel. MUST NOT import `lib/api/auth`. Planner does not own list/claim/delete.

## Locked decisions

### Modular layers — LOCKED

- HTTP stays in `lib/api/trips.ts`. Hooks and list/claim/delete UI stay in `features/trips/`.
- `app/trips/page.tsx` and `app/trips/[id]/page.tsx` only mount public barrels. They MUST NOT call `fetch` / `getJson` / `sendJson` / `useQuery` / `useMutation`.
- Features MUST NOT import each other’s HTTP modules. Trips MAY import `useAuthMe` from `features/auth` (barrel). MUST NOT import `lib/api/auth`.
- Header stays fetch-free of trips. Do not put list/claim/delete in `session-header.tsx`.
- Wire types: `TripOut` and `PaginatedResponse_TripOut_` from `types/generated/api.d.ts`. Do not invent fields. Do not hand-edit generated files.
- Mutations: **no automatic retries**. Idempotent list GET may retry at most 1.

### My trips list — LOCKED (implement in 5.1)

- `listTrips({ page?, size? }, signal)` via `getJson` + `parse: "paginated"`. Defaults align with guide (`page=1`, `size=20`, size max 100) — pass only OpenAPI query params.
- Query key MUST be `["trips","list"]` (include page/size in the key if the UI paginates). `enabled` when the viewer is authenticated (from `useAuthMe`); do **not** fire anonymous list polls.
- Route: `/trips` (new `app/trips/page.tsx`). Authenticated user sees `items[]`. Empty `items` → empty UI; never fake trips.
- 401 / `unauthorized` → login CTA (acknowledge OAuth gap / incomplete bounce). Do **not** spin forever. Do **not** show a fake guest list.
- Guests who open `/trips` → same login CTA path (no anonymous list). Guest trip **detail** at `/trips/[id]` remains as F4 (Optional + ownership) — do **not** wrap detail in required-auth.
- `listTrips` only in 5.1 — do **not** add claim or delete yet.
- Install **no new packages**.

### Claim trip — LOCKED (implement in 5.2)

- `claimTrip(tripId, signal)` via `sendJson` POST, `parse: "api"` → `TripOut`. Path uses `{trip_id}` replacement (mirror `getTrip`).
- Required auth. **Do not claim without login** — disable/hide CTA when guest; if somehow called, 401 → login CTA (not a success toast).
- **Primary CTA on trip detail** (MVP screen flow: claim after Google login on the trip). Optional secondary affordance on the list is fine if layers stay clean.
- On success: invalidate `["trips","list"]` and `["trips", id]` (and `["trips", id, "geojson"]` if present). Optionally toast success.
- Failure copy MUST be distinct — **not** one generic “couldn’t claim” toast:

| Case | Typical signal | Copy / CTA |
|------|----------------|------------|
| Not authenticated | 401 / `unauthorized` | Login CTA / prompt login |
| Session mismatch | 403 + guest or session context | “This trip belongs to a different session” (or equivalent). **Do not** offer login as the fix |
| Already claimed / ownership conflict | 403 or 409 as API returns | Clear “already claimed” / cannot claim copy. Map from `ErrorResponse.code` + status + message/details + known trip `user_id` when available. Do **not** invent a backend code if OpenAPI only has generic `forbidden` |

- ☁️ Claim needs working login cookies and a **matching** `wandr_session` after Google login (`frontendGuide.md` §5 rule 6). Until API `FRONTEND_URL` bounce works, treat claim as **best-effort** on local Option A cookies — proofs may be local-cookie only; do not block the phase on production bounce.
- No blind mutation retry. AbortSignal required.
- Install **no new packages**.

### Delete trip — LOCKED (implement in 5.3)

- `deleteTrip(tripId, signal)` via `sendJson` DELETE, `parse: "empty"` (HTTP 204).
- Required + ownership. **No anonymous delete** — guests get login CTA / disabled control; never call delete as guest expecting success.
- On 204: remove from list cache (invalidate or optimistic remove on `["trips","list"]`); drop `["trips", id]` and `["trips", id, "geojson"]`; navigate away from detail if current route is that trip.
- 403 → ownership/forbidden copy (do not pretend deleted). 404 / `not_found` → already-gone / not-found copy; refresh list.
- Confirm before delete (destructive). No blind retry.
- Install **no new packages**.

### Env, API URL, and keys — LOCKED

| Need | Value | F5? |
|------|--------|-----|
| API base URL | `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:8000`) | **Required** — already in `.env.example` |
| Map style | `NEXT_PUBLIC_MAP_STYLE_URL` | Not needed for F5 |
| FE API keys (MapTiler, Google Maps JS, LLM, OAuth client secret) | — | **None** |
| Google login | Navigate to `{NEXT_PUBLIC_API_URL}/api/v1/auth/google` | Backend owns OAuth; FE redirects only |
| Cookies | `wandr_session` + `wandr_token` (httpOnly, set by API) | Required for authenticated list/claim/delete |

### Packages — LOCKED

| Step | Install | Do not |
|------|---------|--------|
| 5.1 | none | Vitest, Playwright, day-edit deps, new state libs |
| 5.2 | none | Blind claim retry, invent claim DTO fields |
| 5.3 | none | Anonymous delete, force-delete without confirm |

### Forward locks (do not implement in F5)

- Day edit / places picker / reorder / reoptimize (F6)
- Vitest, Playwright (F7)
- `FRONTEND_URL` OAuth bounce (backend follow-up) — document only
- Required-auth wrapper on `/trips/[id]` (detail stays Optional + ownership)
- Inventing a backend `session_mismatch` / `already_claimed` code
- Evaluation HTTP

## Failure-mode table — LOCKED (F5)

| Failure | Response this phase must implement | Lands in |
|---------|-------------------------------------|----------|
| 401 on list | Login CTA; do not spin; no fake guest list | 5.1 |
| Empty list (`items: []`) | Empty UI; never invent trips | 5.1 |
| Guest opens `/trips` | Login CTA path (no anonymous list) | 5.1 |
| Claim while guest / 401 | Login CTA; do not pretend claimed | 5.2 |
| Claim session mismatch | Distinct session-mismatch copy; no login-as-fix | 5.2 |
| Claim already-claimed / conflict | Distinct already-claimed / cannot-claim copy | 5.2 |
| Delete while guest | Disabled / login gate; no anonymous DELETE | 5.3 |
| Delete 403 | Ownership/forbidden copy; do not pretend deleted | 5.3 |
| Delete 404 | Already-gone / not-found; refresh list | 5.3 |
| Delete 204 | Drop list + detail (+ geojson) cache | 5.3 |

## Feature buildup

| After | Exists | Still empty / forbidden |
|-------|--------|-------------------------|
| 5.1 | `listTrips` bare paginated; `useTripsList`; `/trips` list page; 401 → login CTA; empty UI | No claim; no delete; no anonymous list |
| 5.2 | `claimTrip`; claim CTA on detail; invalidate list + trip; distinct claim-failure copy | No delete yet; no day-edit; claim best-effort until bounce |
| 5.3 | `deleteTrip` 204; confirm; drop list/detail cache; 403/404 handling | No day-edit; no anonymous delete |

## LLD / FE patterns this phase

| Pattern | Where |
|---------|--------|
| Domain modules | `lib/api/trips.ts` (extend) |
| Envelope Adapter | list `parse: "paginated"`; claim `parse: "api"`; delete `parse: "empty"` |
| Server-state cache | `["trips","list"]`; invalidate on claim/delete; drop `["trips", id]` (+ geojson) on delete |
| Feature folders + Modular layers | `features/trips/*`; `app/trips/page.tsx` mounts barrel |
| Null / empty UI | empty trip list; 401 login CTA |
| Cookie session probe | `useAuthMe` for list `enabled` + claim/delete gates |

## Recommended run batches

| Batch | Sub-steps | Proof before next |
|-------|-----------|-------------------|
| F5a | 5.1 | Open `/trips` logged in → list or empty; guest/401 → login CTA; no claim/delete |
| F5b | 5.2 → 5.3 | Claim failures distinct; delete 204 drops from list; no day-edit |

---

## Step 5.1 — My trips list

```
Read AGENTS.md, docs/app/system.md (F4 as-built), docs/steps/StepF5.md (locks + this step), docs/frontendGuide.md §8 trips + §6 envelopes, docs/blueprint.md F5.1 + Failure Boundary Summary, and node_modules/next/dist/docs/ before writing any file.

TASK: Add authenticated trip list from GET /api/v1/trips (bare PaginatedResponse). New /trips page. 401 → login CTA. Empty items → empty UI. No claim or delete yet. No new packages.

This is step 5.1. Do NOT add claimTrip, deleteTrip, or day-edit.

─── FEATURE BUILDUP ───
After this step:
  EXISTS: listTrips in lib/api/trips.ts (parse "paginated"); useTripsList; trips-list UI; Query key ["trips","list"]; app/trips/page.tsx mounts trips barrel; 401 login CTA; empty UI.
  STILL EMPTY: claimTrip; deleteTrip; day-edit; no anonymous list; no new FE API keys / packages.

─── FAILURE MODE ───
- 401 / unauthorized: login CTA (acknowledge OAuth gap). Do NOT spin forever. Do NOT show a fake guest list.
- Guest opens /trips: same login CTA path (list query disabled / not polled anonymously).
- Empty items array: empty UI; never invent trips.
- Network / 5xx: existing Query error toast; list area shows retry, not an infinite spinner.
- Do NOT wrap /trips/[id] in required-auth (detail stays F4 Optional + ownership).

─── LLD / BEST PRACTICE ───
Pattern: Domain module + Server-state cache + Feature folders + Modular layers + Null / empty UI.
Keep getTrip and getTripGeojson. Add listTrips only.
TRIPS_LIST_PATH = "/api/v1/trips" satisfies keyof paths.
listTrips(params?: { page?: number; size?: number }, signal?: AbortSignal) via getJson(..., { signal, parse: "paginated" }).
Type items as TripOut from types/generated/api.d.ts. Do not invent fields. Do not hand-edit api.d.ts.
Query key MUST be ["trips","list"] (include page/size in the key if paginating). enabled when authenticated (useAuthMe — not guest). retry: 1. Pass AbortSignal.
Use useAuthMe from features/auth barrel — MUST NOT import lib/api/auth.
Page: app/trips/page.tsx Server Component mounts trips barrel only. MUST NOT call getJson / useQuery / fetch.
Env: NEXT_PUBLIC_API_URL only. Do NOT add MapTiler/Google/LLM keys to FE env.
No npm install this step.

─── WHAT TO CREATE ───

1. lib/api/trips.ts — keep getTrip + getTripGeojson; add:
   - TRIPS_LIST_PATH = "/api/v1/trips" satisfies keyof paths
   - listTrips(params?, signal?) via getJson with parse: "paginated"
   - Do NOT add claimTrip or deleteTrip yet.

2. features/trips/use-trips-list.ts ("use client"):
   - useQuery({ queryKey: ["trips","list", …], queryFn: ({ signal }) => listTrips(…, signal), enabled: authenticated, retry: 1 })
   - Surface 401 / other errors for CTA / empty / retry UI.

3. features/trips/trips-list.tsx — success: render items (link to /trips/{id}). Empty: empty UI. Unauthenticated / 401: login CTA (reuse existing auth redirect to {API}/api/v1/auth/google if already present).

4. features/trips/index.ts — export page-facing list view. Do not export a kitchen-sink object.

5. app/trips/page.tsx — NEW Server Component. Mount trips barrel only. MUST NOT import getJson, useQuery, fetch, or mutations.

6. Leave session-header, planner, trip detail/map APIs unchanged (except barrel exports for list).

─── RULES FOR THIS STEP ───
- Do NOT jump ahead to step 5.2 or 5.3 (no claim, no delete).
- Do NOT install new packages.
- Do NOT invent an anonymous trip list.
- Do NOT put getJson / useQuery on the page or in session-header.
- Do NOT add day-edit endpoints.
- Do NOT invent FE API keys.

─── VALIDATION ───
  Select-String -Path lib\api\trips.ts -Pattern 'parse: "paginated"'
  Select-String -Path lib\api\trips.ts -Pattern "/api/v1/trips"
  Select-String -Path lib\api\trips.ts -Pattern "claim|deleteTrip"   # Expected: no matches yet
  Select-String -Path features\trips -Pattern 'trips","list"|"trips", "list"' -Recurse
  Select-String -Path app\trips\page.tsx -Pattern "getJson|useQuery|fetch|sendJson"   # Expected: no matches
  Select-String -Path features\auth\session-header.tsx -Pattern "listTrips|getTrip"   # Expected: no matches
  Test-Path app\trips\page.tsx
  Test-Path features\trips\use-trips-list.ts

  npm run dev
  # Browser: logged-in /trips → items or empty UI. Guest /trips → login CTA, no spinning fake list.
  # Network: GET {API}/api/v1/trips?page=&size= with credentials when authenticated. No /claim. No DELETE.
```

---

## Step 5.2 — Claim trip

```
Read AGENTS.md, docs/app/system.md (F4 as-built), docs/steps/StepF5.md (locks + this step), docs/frontendGuide.md §5 cookies + §8 trips, docs/blueprint.md F5.2 + Failure Boundary Summary, and node_modules/next/dist/docs/ before writing any file.

TASK: Add POST /trips/{id}/claim. Primary CTA on trip detail. Distinct failure copy for unauthenticated / session-mismatch / already-claimed. Invalidate list + trip queries. Best-effort until FRONTEND_URL bounce. No delete yet. No new packages.

This is step 5.2. Do NOT add deleteTrip or day-edit. Do NOT jump to 5.3.

─── FEATURE BUILDUP ───
After this step:
  EXISTS: claimTrip; useClaimTrip mutation (no auto-retry); claim CTA on trip detail; invalidate ["trips","list"] + ["trips", id] (+ geojson if present); distinct claim-failure copy.
  STILL EMPTY: deleteTrip; day-edit; no generic single claim toast; claim may be best-effort local cookies.

─── FAILURE MODE ───
- Guest / not logged in: hide or disable claim; if called → 401 login CTA. Do NOT pretend success.
- 401 on claim: login CTA.
- Session mismatch (403 + guest/session context): “This trip belongs to a different session” (or equivalent). Do NOT offer login as the fix.
- Already claimed / ownership conflict (403 or 409 as API returns): distinct already-claimed / cannot-claim copy. Not the session-mismatch sentence. Not a generic “couldn’t claim” only.
- Network / 5xx: toast; allow user retry (manual). No automatic mutation retry.
- Document: until FRONTEND_URL OAuth bounce works, claim is best-effort on local Option A cookies (wandr_token + matching wandr_session).

─── LLD / BEST PRACTICE ───
Pattern: Domain module + Server-state cache (invalidation) + Modular layers.
Keep listTrips / getTrip / getTripGeojson. Add claimTrip only.
CLAIM_PATH = "/api/v1/trips/{trip_id}/claim" satisfies keyof paths.
claimTrip(tripId, signal?) via sendJson POST, parse: "api" → TripOut. Replace {trip_id}. AbortSignal.
useMutation with retry: false (or 0). On success invalidate ["trips","list"] and ["trips", id] and ["trips", id, "geojson"] if used.
Primary CTA on trip detail for unclaimed trips when authenticated. Gate with useAuthMe from auth barrel — MUST NOT import lib/api/auth.
Map failures by HTTP status + ErrorResponse.code + viewer context + trip.user_id when present. Do not invent OpenAPI fields or error codes.
No npm install this step.

─── WHAT TO CREATE ───

1. lib/api/trips.ts — keep existing; add:
   - CLAIM_PATH = "/api/v1/trips/{trip_id}/claim" satisfies keyof paths
   - claimTrip(tripId: string, signal?: AbortSignal): Promise<TripOut> via sendJson(..., { method: "POST", signal, parse: "api" })
   - Do NOT add deleteTrip yet.

2. features/trips/use-claim-trip.ts ("use client"):
   - useMutation; no auto-retry; onSuccess invalidate list + trip (+ geojson)
   - Surface typed errors for distinct copy.

3. features/trips/claim-trip-button.tsx (or equivalent composed into trip detail):
   - Authenticated + unclaimed → Claim CTA
   - Guest → disabled/hidden + login path if needed
   - Distinct toasts/panels for 401 vs session-mismatch vs already-claimed

4. Wire into trip detail barrel / trip-page. app/trips/[id]/page.tsx still MUST NOT call sendJson / useMutation directly.

5. Optional: note in UI or docs comment that OAuth bounce may be incomplete (best-effort local).

─── RULES FOR THIS STEP ───
- Do NOT jump ahead to step 5.3 (no delete).
- Do NOT use one generic claim-failure toast for all cases.
- Do NOT auto-retry the mutation.
- Do NOT claim without login.
- Do NOT add day-edit.
- Do NOT invent FE API keys or FRONTEND_URL FE env.

─── VALIDATION ───
  Select-String -Path lib\api\trips.ts -Pattern "claim"
  Select-String -Path lib\api\trips.ts -Pattern 'parse: "api"'
  Select-String -Path lib\api\trips.ts -Pattern "deleteTrip|parse: \"empty\""   # Expected: no delete yet
  Select-String -Path features\trips -Pattern "useClaimTrip|claimTrip|Claim" -Recurse
  Select-String -Path features\trips -Pattern "different session|already claimed|already-claimed|login" -Recurse
  Select-String -Path app\trips\[id]\page.tsx -Pattern "sendJson|useMutation|claimTrip"   # Expected: no matches
  Select-String -Path features\trips -Pattern "retry:\s*true|retry:\s*[2-9]" -Recurse   # Expected: no unbounded/auto retry on claim mutation

  npm run dev
  # Browser: on trip detail, guest → no successful claim. Logged-in matching session → claim may succeed (best-effort local).
  # Force failures if possible: 401 copy ≠ session-mismatch copy ≠ already-claimed copy.
  # Network: POST {API}/api/v1/trips/{id}/claim with credentials. No DELETE yet.
```

---

## Step 5.3 — Delete trip

```
Read AGENTS.md, docs/app/system.md (F4 as-built), docs/steps/StepF5.md (locks + this step), docs/frontendGuide.md §6 (DELETE 204) + §8 trips, docs/blueprint.md F5.3, and node_modules/next/dist/docs/ before writing any file.

TASK: Add DELETE /trips/{id} (HTTP 204, parse empty). Confirm before delete. No anonymous delete. On 204 drop list + detail (+ geojson) cache. Handle 403/404. No day-edit. No new packages.

This is step 5.3. Last F5 code step. Do NOT start F6 (no reorder/add/remove/reoptimize).

─── FEATURE BUILDUP ───
After this step:
  EXISTS: deleteTrip; useDeleteTrip mutation (no auto-retry); confirm UI; 204 drops ["trips","list"] + ["trips", id] + geojson; 403/404 handling.
  STILL EMPTY: day-edit; places picker; anonymous delete; no F6 routes.

─── FAILURE MODE ───
- Guest: disable/hide delete; never call DELETE expecting success. Login gate if needed.
- 403: ownership/forbidden copy; do not pretend deleted.
- 404 / not_found: already-gone / not-found copy; refresh list.
- 204: remove from list cache; drop trip + geojson queries; if on /trips/{id}, navigate away (e.g. to /trips).
- Network / 5xx: toast; manual retry only. No automatic mutation retry.

─── LLD / BEST PRACTICE ───
Pattern: Domain module + Server-state cache (invalidation) + Modular layers.
Keep listTrips / claimTrip / getTrip / getTripGeojson. Add deleteTrip.
Reuse TRIP_PATH "/api/v1/trips/{trip_id}" satisfies keyof paths.
deleteTrip(tripId, signal?) via sendJson DELETE, parse: "empty" (204 empty body). AbortSignal.
useMutation with retry: false (or 0). On success: invalidate/remove ["trips","list"]; removeQueries ["trips", id] and ["trips", id, "geojson"].
Confirm dialog/control before destructive action (list and/or detail). Gate with useAuthMe — MUST NOT import lib/api/auth.
Pages still mount barrels only — no sendJson on the page.
No npm install this step.

─── WHAT TO CREATE ───

1. lib/api/trips.ts — keep existing; add:
   - deleteTrip(tripId: string, signal?: AbortSignal): Promise<void> via sendJson(..., { method: "DELETE", signal, parse: "empty" })

2. features/trips/use-delete-trip.ts ("use client"):
   - useMutation; no auto-retry; onSuccess drop list + trip + geojson cache; optional navigate

3. features/trips/delete-trip-control.tsx (or equivalent):
   - Confirm before delete
   - Authenticated owner path only; guest disabled/hidden
   - Distinct 403 / 404 handling

4. Wire into list and/or trip detail via barrel. app/trips/page.tsx and app/trips/[id]/page.tsx still MUST NOT call sendJson / useMutation directly.

5. features/trips/index.ts — export delete pieces as needed.

─── RULES FOR THIS STEP ───
- Do NOT implement day-edit (F6).
- Do NOT allow anonymous delete.
- Do NOT auto-retry the mutation.
- Do NOT parse 204 as ApiResponse JSON.
- Do NOT put mutations on the Server Component page.
- Do NOT jump ahead to F6 or F7.

─── VALIDATION ───
  Select-String -Path lib\api\trips.ts -Pattern "deleteTrip|DELETE"
  Select-String -Path lib\api\trips.ts -Pattern 'parse: "empty"'
  Select-String -Path features\trips -Pattern "useDeleteTrip|deleteTrip" -Recurse
  Select-String -Path lib\api\trips.ts -Pattern "reorder|reoptimize|AddStop|days/.*/stops"   # Expected: no matches
  Select-String -Path app\trips\page.tsx -Pattern "sendJson|useMutation|deleteTrip"   # Expected: no matches
  Select-String -Path app\trips\[id]\page.tsx -Pattern "sendJson|useMutation|deleteTrip"   # Expected: no matches
  Select-String -Path features\auth\session-header.tsx -Pattern "deleteTrip|claimTrip|listTrips"   # Expected: no matches

  npm run dev
  # Browser: authenticated delete with confirm → 204 → trip gone from /trips; detail navigates away.
  # Guest: cannot delete. 403/404 show distinct copy, not silent success.
  # Network: DELETE {API}/api/v1/trips/{id} → 204 empty body. No day-edit routes.
```

---

## F5 ship checklist

Do not author full F6 prompts or start F6 code until every item is green:

```
# 5.1
Select-String -Path lib\api\trips.ts -Pattern 'parse: "paginated"'
Test-Path app\trips\page.tsx
Select-String -Path features\trips -Pattern 'trips","list"|"trips", "list"' -Recurse
# Browser: /trips logged-in → list or empty; guest → login CTA

# 5.2
Select-String -Path lib\api\trips.ts -Pattern "claim"
Select-String -Path features\trips -Pattern "different session|already claimed|already-claimed" -Recurse
# Browser: claim failures are distinct; success invalidates list + trip (best-effort local cookies OK)

# 5.3
Select-String -Path lib\api\trips.ts -Pattern 'parse: "empty"'
Select-String -Path features\trips -Pattern "deleteTrip|useDeleteTrip" -Recurse
# Browser: delete confirm → 204 → gone from list

# Guard
Select-String -Path lib\api\trips.ts -Pattern "reorder|reoptimize|AddStop"
# Expected: no matches
Select-String -Path app\trips\page.tsx -Pattern "getJson|useQuery|sendJson|useMutation"
# Expected: no matches
Select-String -Path app\trips\[id]\page.tsx -Pattern "getJson|useQuery|sendJson|useMutation"
# Expected: no matches
Select-String -Path features\auth\session-header.tsx -Pattern "listTrips|claimTrip|deleteTrip"
# Expected: no matches
# Env: only NEXT_PUBLIC_API_URL required for F5 — no new FE API keys
Test-Path AGENT.md   # Expected: False
```

All checks passing → F5 is done. Next: expand [`StepF6.md`](StepF6.md) from outline into full prompts, then run F6 batches. Do not implement F6 until that expansion exists.
