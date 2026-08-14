## Context

See `proposal.md` for why. Product SSOT is `docs/blueprint.md` F5; wire is `docs/frontendGuide.md` §8 trips (Required auth for list/claim/delete), §5 cookies, §6 envelopes (bare paginated + HTTP 204 empty); execution grain is `docs/steps/StepF5.md` (write) and `docs/steps/batches/F5a.md`–`F5b.md` (run). Spec delta: `specs/trips/spec.md`. Built-so-far: `docs/app/system.md` (F4).

F4 left `lib/api/trips.ts` with `getTrip` + `getTripGeojson` only, trip detail + MapLibre on `/trips/[id]`, and no list/claim/delete. Gateway already supports `parse: "paginated"` and `parse: "empty"` — do not change the gateway for F5. Generated types already include list/claim/delete paths. Auth chrome (`useAuthMe`) already exists — trips import it from the auth barrel only.

Playbook sequence wins: 5.1 list only; then 5.2 claim; then 5.3 delete. No new packages. No day-edit in F5.

## Goals / Non-Goals

**Goals:**
- Land F5 in playbook order: 5.1 then 5.2→5.3, hard-stopped batches (F5a then F5b) inside one change.
- Keep trip HTTP, hooks/UI, and page mounts in separate modules so `/trips` and `/trips/[id]` never own fetch or mutations.
- Prove 401→login CTA and empty-list honesty before claim/delete.
- Keep claim failure copy distinct (unauthenticated vs session-mismatch vs already-claimed).

**Non-Goals:**
- Day edit / places picker / reorder / reoptimize (F6).
- Vitest / Playwright (F7).
- Inventing a backend `session_mismatch` / `already_claimed` OpenAPI code.
- Required-auth wrapper on `/trips/[id]`.
- New FE packages or FE API keys.
- Changing the JSON gateway parse modes.
- Rewriting planner SSE or putting list/claim/delete in `session-header`.

## Decisions

### 1. One change, two hard-stopped batches

Execute `docs/steps/batches/F5a.md` (5.1) then `F5b.md` (5.2 → 5.3). Prompt bodies stay in `StepF5.md`. Do not merge 5.1–5.3 into one prompt body. Stop F5a until `/trips` shows list or empty for authenticated viewers, guest/401 → login CTA, and there is still no claim/delete. Inside F5b, hard-stop after 5.2 validation before 5.3. Stop F5b at the F5 ship checklist.

**Alternative considered:** Two OpenSpec changes (`implement-fe-step-f5a` / `f5b`). Rejected — they share one trips HTTP module and one feature folder; F1–F4 used one implement change per phase. Batch files remain the apply-session grain.

**Alternative considered:** One apply session that writes list + claim + delete together. Rejected — playbook forbids jumping ahead; 401→login CTA and empty-list proofs are easy to skip inside a claim rush.

### 2. Extend trips modular layers (principle #16)

```
lib/api/trips.ts                   KEEP getTrip / getTripGeojson
                                   listTrips:  GET  /api/v1/trips              parse "paginated"
                                   claimTrip:  POST /api/v1/trips/{trip_id}/claim  parse "api"
                                   deleteTrip: DELETE /api/v1/trips/{trip_id}  parse "empty" (204)
                                   TRIPS_LIST_PATH / CLAIM_PATH / TRIP_PATH satisfy keyof paths
                                   AbortSignal; credentials via gateway
                                   MUST NOT add day-edit in F5

features/trips/use-trips-list.ts   Query key ["trips","list"] (+ page/size if used)
features/trips/use-claim-trip.ts   useMutation; retry false; invalidate list + trip (+ geojson)
features/trips/use-delete-trip.ts  useMutation; retry false; drop list + trip (+ geojson)
features/trips/trips-list.tsx      items / empty / 401 login CTA
features/trips/claim-trip-button.tsx  primary CTA on detail; distinct failure copy
features/trips/delete-trip-control.tsx confirm; 403/404 handling
features/trips/index.ts            public barrel — export new hooks/UI beside detail/map

app/trips/page.tsx                 NEW Server Component; mounts trips barrel only
app/trips/[id]/page.tsx            unchanged mount pattern; MAY gain claim/delete via barrel
                                   still no getJson / sendJson / useQuery / useMutation

features/auth/*                    list/claim/delete MAY use useAuthMe from auth barrel
                                   MUST NOT import lib/api/auth from trips
features/planner/*                 unchanged
features/auth/session-header.tsx   unchanged — still no trips HTTP
```

- Mirror existing trips HTTP: path `satisfies keyof paths`, replace `{trip_id}`, pass `signal`.
- List Query: `enabled` when authenticated (from `useAuthMe`); `retry: 1` (idempotent GET). Mutations: `retry: false` (or 0).
- Do not put list/claim/delete HTTP on pages or in the header.

**Alternative considered:** Fetch list on the Server Component. Rejected — cookie-scoped client Query with AbortSignal; page mounts barrels only.

**Alternative considered:** New `features/trips-list` package. Rejected — same domain as detail; extend `features/trips`.

### 3. Envelope modes stay as playbook locks

| Call | Method | Parse | Notes |
|------|--------|-------|-------|
| `listTrips` | GET | `paginated` | Bare `PaginatedResponse`; defaults `page=1`, `size=20` (OpenAPI only) |
| `claimTrip` | POST | `api` | → `TripOut` |
| `deleteTrip` | DELETE | `empty` | HTTP 204; no JSON body |

Do not force list through `ApiResponse`. Do not parse 204 as JSON. Do not change `lib/api/client.ts` for F5.

**Alternative considered:** Wrap list in `ApiResponse`. Rejected — `frontendGuide.md` §6 bare paginated exception.

### 4. Distinct claim failures (viewer + status + code)

Map claim failures without inventing OpenAPI codes:

| Case | Typical signal | Copy / CTA |
|------|----------------|------------|
| Not authenticated | 401 / `unauthorized` | Login CTA |
| Session mismatch | 403 + guest/session context | Different-session copy; **no** login-as-fix |
| Already claimed / ownership | 403 or 409 as API returns | Distinct already-claimed / cannot-claim copy |

Use HTTP status + `ErrorResponse.code` + message/details + known trip `user_id` + `useAuthMe` when present. Same spirit as F4 dual 403 panels, applied to the claim mutation path.

**Alternative considered:** One generic claim toast. Rejected — blueprint / playbook hard lock.

**Alternative considered:** Wait for backend `session_mismatch` code. Rejected — FE ships distinct copy now from context + status.

### 5. Claim best-effort until OAuth bounce

Claim needs `wandr_token` + matching `wandr_session` after Google login (`frontendGuide.md` §5 rule 6). Until API `FRONTEND_URL` bounce works, treat claim proofs as **best-effort** on local Option A cookies. Document in UI comment / ship notes; do not block F5 ship on production bounce. FE MUST NOT add a `FRONTEND_URL` env var.

**Alternative considered:** Block F5 until production OAuth bounce. Rejected — playbook explicitly allows local best-effort.

### 6. Env / API keys for F5

| Variable | Required for F5? | Notes |
|----------|------------------|-------|
| `NEXT_PUBLIC_API_URL` | **Yes** | Already in `.env.example` (default `http://localhost:8000`) |
| `NEXT_PUBLIC_MAP_STYLE_URL` | **No** | Map already shipped in F4; list/claim/delete do not use MapLibre |
| MapTiler / Google Maps JS / LLM / OAuth client secrets | **No in FE** | Never in Next env |
| Google login | Redirect only | `{NEXT_PUBLIC_API_URL}/api/v1/auth/google` — backend owns OAuth |
| Cookies | Set by API | `wandr_session` + `wandr_token` (httpOnly) required for authenticated list/claim/delete |

**Alternative considered:** Add FE OAuth client id/secret. Rejected — FastAPI owns auth; FE redirects only.

## Risks / Trade-offs

- [Sibling API down or no auth cookie for list proofs] → Mitigation: F5a needs local API + authenticated path; stop the batch if API is down; do not invent list DTOs or fake trips.
- [Agent collapses claim failures into one toast] → Mitigation: F5b validation greps distinct copy paths; ship checklist requires distinct failures.
- [Agent puts getJson/sendJson on pages] → Mitigation: page grep in validation; modular lock.
- [Agent auto-retries mutations] → Mitigation: playbook `retry: false`; grep for unbounded retry.
- [Agent jumps to day-edit] → Mitigation: hard stop; no reorder/reoptimize/AddStop in `lib/api/trips.ts`.
- [Claim blocked by missing FRONTEND_URL bounce] → Mitigation: Decision 5 — best-effort local; do not block phase.
- [Anonymous list or delete] → Mitigation: `enabled`/gates from `useAuthMe`; guest paths are login CTA / disabled controls.

## Migration Plan

Local FE only. Operators need `.env.local` with `NEXT_PUBLIC_API_URL` (already required) and the sibling API up. For list/delete proofs, authenticate via existing Google redirect or local Option A cookies. Map style URL is irrelevant for F5.

Rollback = revert this change’s commits (list/claim/delete removed; F4 detail/map remain). No production deploy.

After the F5 ship checklist in `StepF5.md` is green, update `docs/app/system.md` to the F5 as-built snapshot. A separate change expands `StepF6.md`.

## Open Questions

None. Claim best-effort vs production bounce is already locked in Decision 5; it does not change specs or task order.
